package com.freedom.freedom_backend.imports.myfinance;

import com.freedom.freedom_backend.category.Category;
import com.freedom.freedom_backend.category.CategoryService;
import com.freedom.freedom_backend.category.CategoryType;
import com.freedom.freedom_backend.transaction.TransactionRequest;
import com.freedom.freedom_backend.transaction.TransactionResponse;
import com.freedom.freedom_backend.transaction.TransactionService;
import com.freedom.freedom_backend.transaction.TransactionType;
import com.freedom.freedom_backend.user.User;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class MyFinanceImportService {
    private static final String SOURCE = "MYFINANCE";

    private final MyFinanceBackupReader reader;
    private final TransactionService transactionService;
    private final CategoryService categoryService;
    private final JdbcTemplate jdbc;

    public MyFinanceImportService(MyFinanceBackupReader reader,
                                  TransactionService transactionService,
                                  CategoryService categoryService,
                                  JdbcTemplate jdbc) {
        this.reader = reader;
        this.transactionService = transactionService;
        this.categoryService = categoryService;
        this.jdbc = jdbc;
    }

    @Transactional
    public MyFinanceImportPreview preview(MultipartFile file, User user) {
        List<MyFinanceSourceTransaction> source = reader.read(file);
        Set<String> imported = importedExternalIds(user.getId());
        List<MyFinanceSourceTransaction> fresh = source.stream()
                .filter(tx -> !imported.contains(tx.uid()))
                .toList();

        BigDecimal incomes = sum(fresh, MyFinanceSourceTransaction.SourceType.INCOME);
        BigDecimal expenses = sum(fresh, MyFinanceSourceTransaction.SourceType.EXPENSE);
        int incomeCount = count(fresh, MyFinanceSourceTransaction.SourceType.INCOME);
        int expenseCount = count(fresh, MyFinanceSourceTransaction.SourceType.EXPENSE);

        LocalDate earliest = source.stream().map(MyFinanceSourceTransaction::date).min(LocalDate::compareTo).orElse(null);
        LocalDate latest = source.stream().map(MyFinanceSourceTransaction::date).max(LocalDate::compareTo).orElse(null);

        return new MyFinanceImportPreview(
                file.getOriginalFilename(),
                source.size(),
                source.size() - fresh.size(),
                fresh.size(),
                incomeCount,
                expenseCount,
                incomes,
                expenses,
                incomes.subtract(expenses),
                countMissingCategories(fresh, user),
                earliest,
                latest
        );
    }

    @Transactional
    public MyFinanceImportResult importBackup(MultipartFile file, User user) {
        List<MyFinanceSourceTransaction> source = reader.read(file);
        Set<String> imported = importedExternalIds(user.getId());
        List<MyFinanceSourceTransaction> fresh = source.stream()
                .filter(tx -> !imported.contains(tx.uid()))
                .toList();

        if (fresh.isEmpty()) {
            return new MyFinanceImportResult(0, 0, 0, source.size(), 0,
                    BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);
        }

        // Create/reuse categories before transactions. Default Freedom categories
        // are reused by case-insensitive name; custom MyFinance categories are created once.
        int beforeCategoryCount = categoryCount(user.getId());
        for (MyFinanceSourceTransaction tx : fresh) {
            if (tx.categoryName() != null) {
                categoryService.findOrCreateImported(user, toCategoryType(tx.type()), tx.categoryName());
            }
        }
        int categoriesCreated = categoryCount(user.getId()) - beforeCategoryCount;

        // Important for the ledger: all new income is booked first, then expenses.
        // This reconstructs the source account's final balance without depending on
        // historical moments where MyFinance temporarily allowed a negative balance.
        List<MyFinanceSourceTransaction> ordered = fresh.stream()
                .sorted((a, b) -> {
                    int typeOrder = a.type().compareTo(b.type()); // INCOME before EXPENSE
                    if (typeOrder != 0) return typeOrder;
                    if (a.createdAt() == null && b.createdAt() == null) return a.uid().compareTo(b.uid());
                    if (a.createdAt() == null) return 1;
                    if (b.createdAt() == null) return -1;
                    int date = a.createdAt().compareTo(b.createdAt());
                    return date != 0 ? date : a.uid().compareTo(b.uid());
                })
                .toList();

        int incomes = 0;
        int expenses = 0;
        BigDecimal incomeAmount = BigDecimal.ZERO;
        BigDecimal expenseAmount = BigDecimal.ZERO;

        for (MyFinanceSourceTransaction tx : ordered) {
            Category category = tx.categoryName() == null
                    ? null
                    : categoryService.findOrCreateImported(user, toCategoryType(tx.type()), tx.categoryName());

            TransactionRequest request = new TransactionRequest(
                    tx.type() == MyFinanceSourceTransaction.SourceType.INCOME ? TransactionType.INCOME : TransactionType.EXPENSE,
                    displayName(tx),
                    tx.amount(),
                    null,
                    category == null ? null : category.getId(),
                    false,
                    tx.date(),
                    null,
                    null
            );

            TransactionResponse created = transactionService.createImported(request, user, SOURCE);
            jdbc.update("""
                    INSERT INTO transaction_import_links(
                        user_id, source, external_id, transaction_id,
                        source_created_at, source_modified_at
                    ) VALUES (?,?,?,?,?,?)
                    """,
                    user.getId(), SOURCE, tx.uid(), created.id(),
                    tx.createdAt() == null ? null : Timestamp.from(tx.createdAt()),
                    tx.modifiedAt() == null ? null : Timestamp.from(tx.modifiedAt())
            );

            if (tx.type() == MyFinanceSourceTransaction.SourceType.INCOME) {
                incomes++;
                incomeAmount = incomeAmount.add(tx.amount());
            } else {
                expenses++;
                expenseAmount = expenseAmount.add(tx.amount());
            }
        }

        return new MyFinanceImportResult(
                fresh.size(),
                incomes,
                expenses,
                source.size() - fresh.size(),
                categoriesCreated,
                incomeAmount,
                expenseAmount,
                incomeAmount.subtract(expenseAmount)
        );
    }

    private Set<String> importedExternalIds(Long userId) {
        return new HashSet<>(jdbc.query(
                "SELECT external_id FROM transaction_import_links WHERE user_id=? AND source=?",
                (rs, rowNum) -> rs.getString(1), userId, SOURCE));
    }

    private int categoryCount(Long userId) {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM categories WHERE user_id=?", Integer.class, userId);
        return count == null ? 0 : count;
    }

    private int countMissingCategories(List<MyFinanceSourceTransaction> fresh, User user) {
        Set<String> existing = new HashSet<>();
        categoryService.getAll(user).forEach(category ->
                existing.add(category.type().name() + "|" + normalize(category.name())));

        Set<String> missing = new LinkedHashSet<>();
        for (MyFinanceSourceTransaction tx : fresh) {
            if (tx.categoryName() == null) continue;
            String key = toCategoryType(tx.type()).name() + "|" + normalize(tx.categoryName());
            if (!existing.contains(key)) missing.add(key);
        }
        return missing.size();
    }

    private String displayName(MyFinanceSourceTransaction tx) {
        if (tx.comment() != null) return tx.comment();
        if (tx.categoryName() != null) return tx.categoryName();
        return tx.type() == MyFinanceSourceTransaction.SourceType.INCOME
                ? "Przychód z Finanse"
                : "Wydatek z Finanse";
    }

    private CategoryType toCategoryType(MyFinanceSourceTransaction.SourceType type) {
        return type == MyFinanceSourceTransaction.SourceType.INCOME ? CategoryType.INCOME : CategoryType.EXPENSE;
    }

    private BigDecimal sum(List<MyFinanceSourceTransaction> rows, MyFinanceSourceTransaction.SourceType type) {
        return rows.stream().filter(tx -> tx.type() == type)
                .map(MyFinanceSourceTransaction::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private int count(List<MyFinanceSourceTransaction> rows, MyFinanceSourceTransaction.SourceType type) {
        return (int) rows.stream().filter(tx -> tx.type() == type).count();
    }

    private String normalize(String value) {
        return value.trim().toLowerCase(Locale.ROOT);
    }
}
