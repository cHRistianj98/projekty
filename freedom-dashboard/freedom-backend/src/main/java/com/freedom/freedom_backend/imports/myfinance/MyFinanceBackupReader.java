package com.freedom.freedom_backend.imports.myfinance;

import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Component
public class MyFinanceBackupReader {
    private static final int MAX_UPLOAD_BYTES = 30 * 1024 * 1024;
    private static final long MAX_SQLITE_BYTES = 100L * 1024 * 1024;
    private static final byte[] ZIP_LOCAL_HEADER = new byte[]{0x50, 0x4b, 0x03, 0x04};

    private static final String TRANSACTIONS_SQL = """
            SELECT t.uid,
                   t.created,
                   t.modified,
                   t.type,
                   t.amountInAccountCurrency,
                   t.accountCurrencyCode,
                   t.date,
                   COALESCE(t.comment, '') AS comment,
                   c.uid AS category_uid,
                   c.title AS category_title
              FROM \"transaction\" t
              LEFT JOIN sync_link sl
                ON sl.entityType = 'Transaction'
               AND sl.entityUid = t.uid
               AND sl.otherType = 'Category'
               AND sl.isRemoved = 0
              LEFT JOIN category c
                ON c.uid = sl.otherUid
             WHERE t.isRemoved = 0
               AND t.type IN ('Income', 'Expense')
             ORDER BY t.created ASC, t.uid ASC
            """;

    public List<MyFinanceSourceTransaction> read(MultipartFile file) {
        validateFile(file);
        Path sqlite = null;
        try {
            byte[] bytes = file.getBytes();
            int zipOffset = findZipOffset(bytes);
            if (zipOffset < 0) {
                throw new IllegalArgumentException("Plik nie wygląda jak backup .mmbackup aplikacji Finanse.");
            }

            sqlite = extractDatabase(bytes, zipOffset);
            return readTransactions(sqlite);
        } catch (IOException | SQLException e) {
            throw new IllegalArgumentException("Nie udało się odczytać backupu Finanse: " + e.getMessage(), e);
        } finally {
            if (sqlite != null) {
                try { Files.deleteIfExists(sqlite); } catch (IOException ignored) { }
            }
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Wybierz plik .mmbackup.");
        }
        if (file.getSize() > MAX_UPLOAD_BYTES) {
            throw new IllegalArgumentException("Backup jest za duży. Maksymalny rozmiar to 30 MB.");
        }
        String name = file.getOriginalFilename();
        if (name != null && !name.toLowerCase().endsWith(".mmbackup")) {
            throw new IllegalArgumentException("Obsługiwane są wyłącznie pliki .mmbackup.");
        }
    }

    private int findZipOffset(byte[] bytes) {
        int limit = Math.min(bytes.length - ZIP_LOCAL_HEADER.length, 4096);
        for (int i = 0; i <= limit; i++) {
            boolean matches = true;
            for (int j = 0; j < ZIP_LOCAL_HEADER.length; j++) {
                if (bytes[i + j] != ZIP_LOCAL_HEADER[j]) {
                    matches = false;
                    break;
                }
            }
            if (matches) return i;
        }
        return -1;
    }

    private Path extractDatabase(byte[] backup, int zipOffset) throws IOException {
        Path target = Files.createTempFile("freedom-myfinance-", ".db");
        boolean found = false;
        long total = 0;

        try (InputStream raw = new ByteArrayInputStream(backup, zipOffset, backup.length - zipOffset);
             ZipInputStream zip = new ZipInputStream(raw)) {
            ZipEntry entry;
            while ((entry = zip.getNextEntry()) != null) {
                if (entry.isDirectory() || !"MyFinance.db".equalsIgnoreCase(Path.of(entry.getName()).getFileName().toString())) {
                    continue;
                }
                found = true;
                try (var out = Files.newOutputStream(target)) {
                    byte[] buffer = new byte[8192];
                    int read;
                    while ((read = zip.read(buffer)) != -1) {
                        total += read;
                        if (total > MAX_SQLITE_BYTES) {
                            throw new IllegalArgumentException("Baza SQLite w backupie jest za duża.");
                        }
                        out.write(buffer, 0, read);
                    }
                }
                break;
            }
        } catch (RuntimeException | IOException e) {
            Files.deleteIfExists(target);
            throw e;
        }

        if (!found) {
            Files.deleteIfExists(target);
            throw new IllegalArgumentException("Backup nie zawiera pliku MyFinance.db.");
        }
        return target;
    }

    private List<MyFinanceSourceTransaction> readTransactions(Path sqlite) throws SQLException {
        List<MyFinanceSourceTransaction> result = new ArrayList<>();
        String sqlitePath = sqlite.toAbsolutePath().toString().replace('\\', '/');
        try (Connection connection = DriverManager.getConnection("jdbc:sqlite:" + sqlitePath)) {
            validateNoTransfers(connection);
            try (PreparedStatement statement = connection.prepareStatement(TRANSACTIONS_SQL);
                 ResultSet rs = statement.executeQuery()) {

            while (rs.next()) {
                String currency = rs.getString("accountCurrencyCode");
                if (!"PLN".equalsIgnoreCase(currency)) {
                    throw new IllegalArgumentException("Backup zawiera walutę " + currency + ". Import obsługuje obecnie tylko PLN.");
                }

                long minorUnits = rs.getLong("amountInAccountCurrency");
                if (minorUnits <= 0) continue;

                String rawType = rs.getString("type");
                MyFinanceSourceTransaction.SourceType type = switch (rawType) {
                    case "Income" -> MyFinanceSourceTransaction.SourceType.INCOME;
                    case "Expense" -> MyFinanceSourceTransaction.SourceType.EXPENSE;
                    default -> throw new IllegalArgumentException("Nieobsługiwany typ transakcji w backupie: " + rawType);
                };

                result.add(new MyFinanceSourceTransaction(
                        rs.getString("uid"),
                        parseInstant(rs.getString("created")),
                        parseInstant(rs.getString("modified")),
                        type,
                        BigDecimal.valueOf(minorUnits, 2),
                        LocalDate.parse(rs.getString("date")),
                        normalize(rs.getString("comment")),
                        normalize(rs.getString("category_uid")),
                        normalize(rs.getString("category_title"))
                ));
            }
            }
        }
        return result;
    }

    private void validateNoTransfers(Connection connection) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement(
                "SELECT COUNT(*) FROM transfer WHERE isRemoved=0");
             ResultSet rs = statement.executeQuery()) {
            if (rs.next() && rs.getInt(1) > 0) {
                throw new IllegalArgumentException(
                        "Backup zawiera transfery między kontami. Ten importer obsługuje obecnie przychody i wydatki, więc import został zatrzymany zamiast pominąć dane."
                );
            }
        }
    }

    private Instant parseInstant(String value) {
        if (value == null || value.isBlank()) return null;
        return Instant.parse(value);
    }

    private String normalize(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
