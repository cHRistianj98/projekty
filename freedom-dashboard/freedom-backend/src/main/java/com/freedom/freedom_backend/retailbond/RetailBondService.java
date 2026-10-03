package com.freedom.freedom_backend.retailbond;

import com.freedom.freedom_backend.asset.Asset;
import com.freedom.freedom_backend.asset.AssetCategory;
import com.freedom.freedom_backend.asset.AssetRepository;
import com.freedom.freedom_backend.ledger.MoneyLedgerService;
import com.freedom.freedom_backend.user.User;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.springframework.jdbc.core.BatchPreparedStatementSetter;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.SqlParameterValue;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.sql.Types;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Transactional
public class RetailBondService {
    private static final BigDecimal BELKA = new BigDecimal("0.19");
    private static final Pattern EMISSION = Pattern.compile("^[A-Z]{3}\\d{4}$");
    private static final Pattern FILE_DATE = Pattern.compile("(20\\d{2}-\\d{2}-\\d{2})");
    private static final String POSITION_UPSERT_SQL = """
            INSERT INTO retail_bond_positions(
                user_id,asset_id,emission_code,quantity,available_quantity,blocked_quantity,
                nominal_value,current_gross_value,current_net_value,taxable_gain,tax_amount,
                purchase_date,maturity_date,valuation_date,current_rate,current_period,period_base_per_bond,
                source,market_checked_at,updated_at
            ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())
            ON CONFLICT(asset_id,emission_code,purchase_date) DO UPDATE SET
                quantity=EXCLUDED.quantity,
                available_quantity=EXCLUDED.available_quantity,
                blocked_quantity=EXCLUDED.blocked_quantity,
                nominal_value=EXCLUDED.nominal_value,
                current_gross_value=EXCLUDED.current_gross_value,
                current_net_value=EXCLUDED.current_net_value,
                taxable_gain=EXCLUDED.taxable_gain,
                tax_amount=EXCLUDED.tax_amount,
                maturity_date=EXCLUDED.maturity_date,
                valuation_date=EXCLUDED.valuation_date,
                current_rate=COALESCE(EXCLUDED.current_rate,retail_bond_positions.current_rate),
                current_period=COALESCE(EXCLUDED.current_period,retail_bond_positions.current_period),
                period_base_per_bond=COALESCE(EXCLUDED.period_base_per_bond,retail_bond_positions.period_base_per_bond),
                source=EXCLUDED.source,
                market_checked_at=EXCLUDED.market_checked_at,
                updated_at=NOW()
            """;

    private static final String POSITION_TRANSFER_UPSERT_SQL = """
            INSERT INTO retail_bond_positions(
                user_id,asset_id,emission_code,quantity,available_quantity,blocked_quantity,
                nominal_value,current_gross_value,current_net_value,taxable_gain,tax_amount,
                purchase_date,maturity_date,valuation_date,current_rate,current_period,period_base_per_bond,
                source,market_checked_at,updated_at
            ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())
            ON CONFLICT(asset_id,emission_code,purchase_date) DO UPDATE SET
                quantity=retail_bond_positions.quantity + EXCLUDED.quantity,
                available_quantity=retail_bond_positions.available_quantity + EXCLUDED.available_quantity,
                blocked_quantity=retail_bond_positions.blocked_quantity + EXCLUDED.blocked_quantity,
                nominal_value=retail_bond_positions.nominal_value + EXCLUDED.nominal_value,
                current_gross_value=retail_bond_positions.current_gross_value + EXCLUDED.current_gross_value,
                current_net_value=retail_bond_positions.current_net_value + EXCLUDED.current_net_value,
                taxable_gain=retail_bond_positions.taxable_gain + EXCLUDED.taxable_gain,
                tax_amount=retail_bond_positions.tax_amount + EXCLUDED.tax_amount,
                maturity_date=EXCLUDED.maturity_date,
                valuation_date=GREATEST(retail_bond_positions.valuation_date, EXCLUDED.valuation_date),
                current_rate=COALESCE(EXCLUDED.current_rate, retail_bond_positions.current_rate),
                current_period=COALESCE(EXCLUDED.current_period, retail_bond_positions.current_period),
                period_base_per_bond=COALESCE(EXCLUDED.period_base_per_bond, retail_bond_positions.period_base_per_bond),
                source='TRANSFER',
                market_checked_at=EXCLUDED.market_checked_at,
                updated_at=NOW()
            """;

    private final JdbcTemplate jdbc;
    private final AssetRepository assetRepo;
    private final MoneyLedgerService ledger;
    private final RetailBondMarketDataService marketData;

    public RetailBondService(JdbcTemplate jdbc, AssetRepository assetRepo, MoneyLedgerService ledger, RetailBondMarketDataService marketData) {
        this.jdbc = jdbc;
        this.assetRepo = assetRepo;
        this.ledger = ledger;
        this.marketData = marketData;
    }

    public RetailBondPortfolioResponse importRegister(Long portfolioId, MultipartFile file, User user) {
        validatePortfolio(portfolioId, user.getId());
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("Wybierz plik XLS ze stanem rachunku rejestrowego.");
        String filename = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
        if (!filename.toLowerCase(Locale.ROOT).endsWith(".xls")) {
            throw new IllegalArgumentException("Import obsługuje pliki .xls generowane przez serwis Obligacje Skarbowe.");
        }

        LocalDate reportDate = reportDate(filename);
        List<ImportedRow> rows;
        try {
            rows = parseXls(file);
        } catch (IOException ex) {
            throw new IllegalArgumentException("Nie udało się odczytać pliku XLS.", ex);
        }
        if (rows.isEmpty()) throw new IllegalArgumentException("W pliku nie znaleziono żadnych emisji obligacji.");

        Asset asset = findOrCreateBondAsset(portfolioId, user);
        BigDecimal before = asset.getValue();
        boolean newAsset = before.signum() == 0 && countPositions(asset.getId()) == 0;

        // Najwolniejsza część importu to pobieranie tabel odsetkowych (HTML -> HTML -> PDF).
        // Pobieramy dane dla unikalnych emisji równolegle na virtual threads. MarketDataService
        // dodatkowo trzyma 12h cache, więc kolejny import zwykle nie wykonuje już żadnego HTTP.
        Map<String, RetailBondMarketDataService.CurrentTerms> termsByEmission = loadTermsInParallel(rows);
        List<PositionValuation> valuations = new ArrayList<>(rows.size());

        for (ImportedRow row : rows) {
            RetailBondProduct product = RetailBondProduct.fromEmission(row.emissionCode());
            LocalDate purchaseDate = row.maturityDate().minusMonths(product.termMonths());
            int quantity = row.availableQuantity() + row.blockedQuantity();
            if (quantity <= 0 && row.nominalValue().signum() > 0) {
                quantity = row.nominalValue().divide(new BigDecimal("100"), 0, RoundingMode.HALF_UP).intValue();
            }
            if (quantity <= 0) continue;

            valuations.add(fromSnapshot(
                    row.emissionCode(), quantity, row.availableQuantity(), row.blockedQuantity(),
                    row.nominalValue(), row.currentGrossValue(), purchaseDate, row.maturityDate(), reportDate,
                    termsByEmission.get(row.emissionCode())
            ));
        }

        // Jeden round-trip batch do PostgreSQL zamiast osobnego INSERT/UPSERT dla każdej emisji.
        batchUpsert(asset.getId(), user.getId(), valuations, "XLS");

        applyAggregate(asset, before, user, newAsset);
        return summary(asset.getId(), user);
    }

    public RetailBondPortfolioResponse addPositionToPortfolio(Long portfolioId, RetailBondPositionRequest request, User user) {
        validatePortfolio(portfolioId, user.getId());
        Asset asset = findOrCreateBondAsset(portfolioId, user);
        return addPosition(asset.getId(), request, user);
    }

    public RetailBondPortfolioResponse addPosition(Long assetId, RetailBondPositionRequest request, User user) {
        Asset asset = bondAsset(assetId, user);
        String code = normalizeCode(request.emissionCode());
        RetailBondProduct product = RetailBondProduct.fromEmission(code);
        int quantity = request.quantity();
        int blocked = request.blockedQuantity() == null ? 0 : request.blockedQuantity();
        if (blocked > quantity) throw new IllegalArgumentException("Liczba zablokowanych obligacji nie może przekraczać całej pozycji.");
        int available = quantity - blocked;
        BigDecimal nominal = new BigDecimal("100").multiply(BigDecimal.valueOf(quantity));
        LocalDate maturity = request.purchaseDate().plusMonths(product.termMonths());
        LocalDate today = LocalDate.now();

        PositionValuation valuation;
        RetailBondMarketDataService.CurrentTerms terms = safeTerms(code);
        int expectedPeriod = periodForDate(request.purchaseDate(), today, product);
        if (request.currentGrossValue() != null) {
            valuation = fromSnapshot(code, quantity, available, blocked, nominal, request.currentGrossValue(), request.purchaseDate(), maturity, today);
        } else if (terms != null && terms.periodNumber() == expectedPeriod && (!product.capitalizes() || expectedPeriod == 1)) {
            valuation = calculate(code, quantity, available, blocked, nominal, request.purchaseDate(), maturity, today,
                    terms.annualRatePercent(), expectedPeriod, new BigDecimal("100"));
        } else {
            throw new IllegalArgumentException(
                    "Dla tej emisji podaj bieżącą wartość brutto z serwisu Obligacje Skarbowe. Jest potrzebna do odtworzenia skapitalizowanej bazy odsetek."
            );
        }

        BigDecimal before = asset.getValue();
        boolean newAsset = before.signum() == 0 && countPositions(assetId) == 0;
        upsert(assetId, user.getId(), valuation, "MANUAL");
        applyAggregate(asset, before, user, newAsset);
        return summary(assetId, user);
    }

    public RetailBondPortfolioResponse getPortfolio(Long assetId, User user) {
        Asset asset = bondAsset(assetId, user);
        refreshAsset(asset, user);
        return summary(assetId, user);
    }

    public RetailBondPortfolioResponse refresh(Long assetId, User user) {
        Asset asset = bondAsset(assetId, user);
        refreshAsset(asset, user, true);
        return summary(assetId, user);
    }

    public void deletePosition(Long assetId, Long positionId, User user) {
        Asset asset = bondAsset(assetId, user);
        BigDecimal before = asset.getValue();
        int deleted = jdbc.update("DELETE FROM retail_bond_positions WHERE id=? AND asset_id=? AND user_id=?", positionId, assetId, user.getId());
        if (deleted == 0) throw new IllegalArgumentException("Nie znaleziono emisji obligacji.");
        applyAggregate(asset, before, user, false);
    }

    public RetailBondPortfolioResponse removeQuantity(Long assetId, Long positionId, int quantity, User user) {
        Asset asset = bondAsset(assetId, user);
        refreshAsset(asset, user);
        PositionRow row = position(assetId, positionId, user.getId());
        validateTradableQuantity(row, quantity);

        PositionSlice removed = slice(row, quantity);
        BigDecimal free = ledger.available(assetId, user);
        if (removed.netValue().compareTo(free) > 0) {
            throw new IllegalArgumentException("Nie można usunąć tej liczby obligacji, ponieważ część wartości aktywa jest zarezerwowana na cele lub zobowiązania.");
        }

        ledger.consumeAssetValue(assetId, removed.netValue(), user, "BOND_POSITION_REMOVAL");
        reducePosition(row, removed, quantity, user.getId());
        syncAggregateWithoutLedger(assetId, user.getId());
        return summary(assetId, user);
    }

    public RetailBondPortfolioResponse transferQuantity(
            Long assetId,
            Long positionId,
            Long targetPortfolioId,
            int quantity,
            User user
    ) {
        Asset sourceAsset = bondAsset(assetId, user);
        validatePortfolio(targetPortfolioId, user.getId());
        if (targetPortfolioId.equals(sourceAsset.getPortfolioId())) {
            throw new IllegalArgumentException("Wybierz inny portfel docelowy.");
        }

        refreshAsset(sourceAsset, user);
        Asset targetAsset = findOrCreateBondAsset(targetPortfolioId, user);
        refreshAsset(targetAsset, user);

        PositionRow row = position(assetId, positionId, user.getId());
        validateTradableQuantity(row, quantity);
        PositionSlice moved = slice(row, quantity);

        // Ledger pilnuje rezerwacji i przenosi pochodzenie kapitału bez zmiany łącznego majątku.
        ledger.transfer(assetId, targetAsset.getId(), moved.netValue(), user);

        reducePosition(row, moved, quantity, user.getId());
        addTransferredPosition(targetAsset.getId(), user.getId(), row, moved, quantity);
        syncAggregateWithoutLedger(assetId, user.getId());
        syncAggregateWithoutLedger(targetAsset.getId(), user.getId());

        jdbc.update(
                "INSERT INTO portfolio_transfers(user_id,source_asset_id,target_asset_id,source_name_snapshot,target_name_snapshot,amount) VALUES(?,?,?,?,?,?)",
                user.getId(), assetId, targetAsset.getId(), sourceAsset.getName(), targetAsset.getName(), moved.netValue()
        );
        return summary(assetId, user);
    }

    public void moveWholeAssetToPortfolio(Long assetId, Long targetPortfolioId, User user) {
        Asset sourceAsset = bondAsset(assetId, user);
        validatePortfolio(targetPortfolioId, user.getId());
        if (targetPortfolioId.equals(sourceAsset.getPortfolioId())) {
            throw new IllegalArgumentException("Aktywo znajduje się już w tym portfelu.");
        }

        Optional<Asset> targetExisting = assetRepo.findAllByUserId(user.getId()).stream()
                .filter(asset -> asset.getCategory() == AssetCategory.BONDS)
                .filter(asset -> targetPortfolioId.equals(asset.getPortfolioId()))
                .filter(asset -> "Obligacje skarbowe".equalsIgnoreCase(asset.getName()))
                .findFirst();

        // Jeżeli w portfelu docelowym nie ma jeszcze zbiorczego aktywa obligacyjnego,
        // najbezpieczniej zachować to samo asset_id. Dzięki temu wszystkie istniejące
        // rezerwacje i historia pozostają przypięte do tego samego aktywa.
        if (targetExisting.isEmpty()) {
            jdbc.update(
                    "UPDATE assets SET portfolio_id=? WHERE id=? AND user_id=?",
                    targetPortfolioId, assetId, user.getId()
            );
            return;
        }

        refreshAsset(sourceAsset, user);
        List<PositionRow> rows = positions(assetId, user.getId());
        if (rows.stream().anyMatch(row -> row.blockedQuantity() > 0)) {
            throw new IllegalArgumentException(
                    "Nie można scalić całego aktywa obligacyjnego, ponieważ część emisji ma zablokowane sztuki. Przenieś dostępne emisje ręcznie albo poczekaj na ich odblokowanie."
            );
        }
        if (ledger.reserved(assetId, user).signum() > 0) {
            throw new IllegalArgumentException(
                    "Nie można scalić całego aktywa obligacyjnego, gdy jego środki są zarezerwowane na cel lub zobowiązanie. Najpierw zwolnij rezerwację."
            );
        }

        // Używamy tej samej ścieżki co transfer części emisji. Każda emisja jest
        // UPSERT-owana po (asset_id, emission_code, purchase_date), więc identyczne
        // emisje w portfelu docelowym automatycznie się sumują.
        for (PositionRow row : rows) {
            transferQuantity(assetId, row.id(), targetPortfolioId, row.availableQuantity(), user);
        }

        Asset emptySource = bondAsset(assetId, user);
        if (countPositions(assetId) == 0 && emptySource.getValue().signum() == 0) {
            Long targetAssetId = targetExisting.get().getId();
            // target_asset_id w goal_contributions ma ON DELETE RESTRICT. Po scaleniu
            // źródłowy asset przestaje istnieć, więc zachowujemy referencję historyczną
            // wskazując na ten sam instrument w portfelu docelowym.
            jdbc.update("UPDATE goal_contributions SET target_asset_id=? WHERE user_id=? AND target_asset_id=?",
                    targetAssetId, user.getId(), assetId);
            jdbc.update("UPDATE goal_contributions SET source_asset_id=? WHERE user_id=? AND source_asset_id=?",
                    targetAssetId, user.getId(), assetId);
            assetRepo.delete(emptySource);
        }
    }

    public DailyChange dailyChange(Long assetId, User user) {
        bondAsset(assetId, user);
        List<PositionRow> rows = positions(assetId, user.getId());
        if (rows.isEmpty()) return null;

        LocalDate valuationDate = rows.getFirst().valuationDate();
        if (valuationDate == null || rows.stream().anyMatch(row -> !valuationDate.equals(row.valuationDate()))) {
            return null;
        }

        BigDecimal currentNet = BigDecimal.ZERO;
        BigDecimal previousNet = BigDecimal.ZERO;
        for (PositionRow row : rows) {
            BigDecimal previous = previousDayNetValue(row);
            if (previous == null) return null;
            currentNet = currentNet.add(row.currentNetValue());
            previousNet = previousNet.add(previous);
        }

        if (previousNet.signum() <= 0) return null;
        BigDecimal amount = currentNet.subtract(previousNet).setScale(2, RoundingMode.HALF_UP);
        BigDecimal percent = amount
                .multiply(new BigDecimal("100"))
                .divide(previousNet, 4, RoundingMode.HALF_UP);
        return new DailyChange(amount, percent);
    }

    private BigDecimal previousDayNetValue(PositionRow row) {
        LocalDate previousDate = row.valuationDate().minusDays(1);
        if (previousDate.isBefore(row.purchaseDate())) return null;
        if (row.currentRate() == null || row.currentPeriod() == null || row.periodBasePerBond() == null) return null;

        RetailBondProduct product = RetailBondProduct.fromEmission(row.emissionCode());
        int previousPeriod = periodForDate(row.purchaseDate(), previousDate, product);
        if (previousPeriod != row.currentPeriod()) {
            // Na granicy okresu potrzebowalibyśmy historycznej stopy/bazy poprzedniego okresu.
            // Zamiast zgadywać, nie pokazujemy zmiany przez ten jeden dzień.
            return null;
        }

        return calculate(
                row.emissionCode(),
                row.quantity(),
                row.availableQuantity(),
                row.blockedQuantity(),
                row.nominalValue(),
                row.purchaseDate(),
                row.maturityDate(),
                previousDate,
                row.currentRate(),
                row.currentPeriod(),
                row.periodBasePerBond()
        ).netValue();
    }

    public record DailyChange(BigDecimal amount, BigDecimal percent) {}

    private void validateTradableQuantity(PositionRow row, int quantity) {
        if (quantity <= 0) throw new IllegalArgumentException("Liczba obligacji musi być większa od zera.");
        if (quantity > row.availableQuantity()) {
            if (row.blockedQuantity() > 0) {
                throw new IllegalArgumentException("Możesz operować maksymalnie " + row.availableQuantity() + " dostępnymi sztukami. " + row.blockedQuantity() + " szt. jest zablokowanych.");
            }
            throw new IllegalArgumentException("Pozycja zawiera tylko " + row.availableQuantity() + " dostępnych sztuk.");
        }
    }

    private PositionRow position(Long assetId, Long positionId, Long userId) {
        List<PositionRow> rows = jdbc.query("""
                SELECT id,emission_code,quantity,available_quantity,blocked_quantity,nominal_value,current_gross_value,
                       current_net_value,taxable_gain,tax_amount,purchase_date,maturity_date,valuation_date,current_rate,
                       current_period,period_base_per_bond,source
                FROM retail_bond_positions WHERE id=? AND asset_id=? AND user_id=?
                """, (rs, n) -> new PositionRow(
                rs.getLong("id"), rs.getString("emission_code"), rs.getInt("quantity"), rs.getInt("available_quantity"), rs.getInt("blocked_quantity"),
                rs.getBigDecimal("nominal_value"), rs.getBigDecimal("current_gross_value"), rs.getBigDecimal("current_net_value"),
                rs.getBigDecimal("taxable_gain"), rs.getBigDecimal("tax_amount"), rs.getObject("purchase_date", LocalDate.class),
                rs.getObject("maturity_date", LocalDate.class), rs.getObject("valuation_date", LocalDate.class), rs.getBigDecimal("current_rate"),
                (Integer) rs.getObject("current_period"), rs.getBigDecimal("period_base_per_bond"), rs.getString("source")
        ), positionId, assetId, userId);
        if (rows.isEmpty()) throw new IllegalArgumentException("Nie znaleziono emisji obligacji.");
        return rows.getFirst();
    }

    private PositionSlice slice(PositionRow row, int quantity) {
        BigDecimal qty = BigDecimal.valueOf(quantity);
        BigDecimal total = BigDecimal.valueOf(row.quantity());
        return new PositionSlice(
                prorate(row.nominalValue(), qty, total),
                prorate(row.currentGrossValue(), qty, total),
                prorate(row.taxableGain(), qty, total),
                prorate(row.taxAmount(), qty, total)
        );
    }

    private BigDecimal prorate(BigDecimal value, BigDecimal quantity, BigDecimal totalQuantity) {
        return value.multiply(quantity).divide(totalQuantity, 2, RoundingMode.HALF_UP);
    }

    private void reducePosition(PositionRow row, PositionSlice removed, int quantity, Long userId) {
        int remainingQuantity = row.quantity() - quantity;
        int remainingAvailable = row.availableQuantity() - quantity;
        if (remainingQuantity == 0) {
            jdbc.update("DELETE FROM retail_bond_positions WHERE id=? AND user_id=?", row.id(), userId);
            return;
        }

        BigDecimal gross = row.currentGrossValue().subtract(removed.grossValue()).setScale(2, RoundingMode.HALF_UP);
        BigDecimal tax = row.taxAmount().subtract(removed.taxAmount()).setScale(2, RoundingMode.HALF_UP);
        jdbc.update("""
                UPDATE retail_bond_positions SET
                    quantity=?,available_quantity=?,nominal_value=?,current_gross_value=?,current_net_value=?,
                    taxable_gain=?,tax_amount=?,updated_at=NOW()
                WHERE id=? AND user_id=?
                """,
                remainingQuantity, remainingAvailable,
                row.nominalValue().subtract(removed.nominalValue()).setScale(2, RoundingMode.HALF_UP),
                gross, gross.subtract(tax).setScale(2, RoundingMode.HALF_UP),
                row.taxableGain().subtract(removed.taxableGain()).setScale(2, RoundingMode.HALF_UP),
                tax, row.id(), userId
        );
    }

    private void addTransferredPosition(Long targetAssetId, Long userId, PositionRow source, PositionSlice moved, int quantity) {
        BigDecimal net = moved.grossValue().subtract(moved.taxAmount()).setScale(2, RoundingMode.HALF_UP);
        jdbc.update(
                POSITION_TRANSFER_UPSERT_SQL,
                userId, targetAssetId, source.emissionCode(), quantity, quantity, 0,
                moved.nominalValue(), moved.grossValue(), net, moved.taxableGain(), moved.taxAmount(),
                source.purchaseDate(), source.maturityDate(), source.valuationDate(), source.currentRate(),
                source.currentPeriod(), source.periodBasePerBond(), "TRANSFER", timestampWithTimezone(Instant.now())
        );
    }

    private void syncAggregateWithoutLedger(Long assetId, Long userId) {
        Aggregate a = aggregate(assetId, userId);
        jdbc.update("""
                UPDATE assets SET value=?,bond_purchase_value=?,bond_gross_value=?,bond_taxable_gain=?,bond_tax_rate=?,bond_tax_amount=?
                WHERE id=? AND user_id=?
                """,
                a.netValue(), a.nominalValue(), a.grossValue(), a.taxableGain(), BELKA, a.taxAmount(), assetId, userId
        );
    }

    public void refreshAllForUser(User user) {
        List<Asset> bonds = assetRepo.findAllByUserId(user.getId()).stream()
                .filter(asset -> asset.getCategory() == AssetCategory.BONDS)
                .filter(asset -> countPositions(asset.getId()) > 0)
                .toList();
        for (Asset asset : bonds) {
            try { refreshAsset(asset, user); } catch (RuntimeException ignored) { }
        }
    }

    private void refreshAsset(Asset asset, User user) { refreshAsset(asset, user, false); }

    private void refreshAsset(Asset asset, User user, boolean force) {
        LocalDate today = LocalDate.now();
        List<PositionRow> rows = positions(asset.getId(), user.getId());
        boolean changed = false;
        for (PositionRow row : rows) {
            if (!force && !row.valuationDate().isBefore(today)) continue;

            RetailBondProduct product = RetailBondProduct.fromEmission(row.emissionCode());
            int expectedPeriod = periodForDate(row.purchaseDate(), today, product);
            BigDecimal base = row.periodBasePerBond();
            BigDecimal rate = row.currentRate();
            Integer storedPeriod = row.currentPeriod();

            // Most days no HTTP call is needed: the rate is fixed for the whole
            // current interest period, so only accrued days change.
            if (rate != null && storedPeriod != null && storedPeriod == expectedPeriod && base != null) {
                PositionValuation value = calculate(
                        row.emissionCode(), row.quantity(), row.availableQuantity(), row.blockedQuantity(), row.nominalValue(),
                        row.purchaseDate(), row.maturityDate(), today, rate, expectedPeriod, base
                );
                updatePosition(row.id(), value, "AUTO");
                changed = true;
                continue;
            }

            RetailBondMarketDataService.CurrentTerms terms = safeTerms(row.emissionCode());
            if (terms == null || terms.periodNumber() != expectedPeriod) continue;

            if (base == null) {
                if (!product.capitalizes() || expectedPeriod == 1) base = new BigDecimal("100");
                else continue;
            }

            if (storedPeriod != null && expectedPeriod > storedPeriod) {
                int jump = expectedPeriod - storedPeriod;
                if (product.capitalizes()) {
                    if (jump != 1 || row.currentRate() == null) continue;
                    BigDecimal fullInterest = base.multiply(row.currentRate())
                            .divide(new BigDecimal("100"), 12, RoundingMode.HALF_UP)
                            .setScale(2, RoundingMode.HALF_UP);
                    base = base.add(fullInterest);
                } else {
                    base = new BigDecimal("100");
                }
            } else if (storedPeriod != null && storedPeriod > expectedPeriod) {
                continue;
            }

            PositionValuation value = calculate(
                    row.emissionCode(), row.quantity(), row.availableQuantity(), row.blockedQuantity(), row.nominalValue(),
                    row.purchaseDate(), row.maturityDate(), today, terms.annualRatePercent(), expectedPeriod, base
            );
            updatePosition(row.id(), value, "AUTO");
            changed = true;
        }
        if (changed) {
            BigDecimal before = asset.getValue();
            applyAggregate(asset, before, user, false);
        }
    }

    private PositionValuation fromSnapshot(
            String emissionCode,
            int quantity,
            int available,
            int blocked,
            BigDecimal nominal,
            BigDecimal gross,
            LocalDate purchaseDate,
            LocalDate maturityDate,
            LocalDate valuationDate
    ) {
        String code = normalizeCode(emissionCode);
        return fromSnapshot(code, quantity, available, blocked, nominal, gross, purchaseDate, maturityDate, valuationDate, safeTerms(code));
    }

    private PositionValuation fromSnapshot(
            String emissionCode,
            int quantity,
            int available,
            int blocked,
            BigDecimal nominal,
            BigDecimal gross,
            LocalDate purchaseDate,
            LocalDate maturityDate,
            LocalDate valuationDate,
            RetailBondMarketDataService.CurrentTerms terms
    ) {
        String code = normalizeCode(emissionCode);
        RetailBondProduct product = RetailBondProduct.fromEmission(code);
        BigDecimal perBondNominal = nominal.divide(BigDecimal.valueOf(quantity), 8, RoundingMode.HALF_UP);
        BigDecimal base = perBondNominal;
        BigDecimal rate = null;
        Integer period = null;

        int expectedPeriod = periodForDate(purchaseDate, valuationDate, product);
        if (terms != null && terms.periodNumber() == expectedPeriod) {
            rate = terms.annualRatePercent();
            period = expectedPeriod;
            if (product.capitalizes() && period > 1) {
                BigDecimal grossPerBond = gross.divide(BigDecimal.valueOf(quantity), 8, RoundingMode.HALF_UP);
                base = solvePeriodBase(grossPerBond, purchaseDate, product, valuationDate, rate, period);
            }
        }

        TaxValuation tax = tax(gross, nominal);
        return new PositionValuation(code, quantity, available, blocked, nominal.setScale(2, RoundingMode.HALF_UP),
                gross.setScale(2, RoundingMode.HALF_UP), tax.net(), tax.gain(), tax.tax(), purchaseDate, maturityDate,
                valuationDate, rate, period, base, Instant.now());
    }

    private PositionValuation calculate(
            String emissionCode,
            int quantity,
            int available,
            int blocked,
            BigDecimal nominal,
            LocalDate purchaseDate,
            LocalDate maturityDate,
            LocalDate valuationDate,
            BigDecimal ratePercent,
            int period,
            BigDecimal periodBasePerBond
    ) {
        RetailBondProduct product = RetailBondProduct.fromEmission(emissionCode);
        LocalDate periodStart = purchaseDate.plusMonths((long) (period - 1) * product.periodMonths());
        LocalDate periodEnd = periodStart.plusMonths(product.periodMonths());
        long periodDays = Math.max(1, ChronoUnit.DAYS.between(periodStart, periodEnd));
        long elapsedDays = Math.max(0, Math.min(periodDays, ChronoUnit.DAYS.between(periodStart, valuationDate)));

        BigDecimal interestPerBond = periodBasePerBond
                .multiply(ratePercent)
                .divide(new BigDecimal("100"), 12, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(elapsedDays))
                .divide(BigDecimal.valueOf(periodDays), 12, RoundingMode.HALF_UP)
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal grossPerBond = periodBasePerBond.add(interestPerBond);
        BigDecimal gross = grossPerBond.multiply(BigDecimal.valueOf(quantity)).setScale(2, RoundingMode.HALF_UP);
        TaxValuation tax = tax(gross, nominal);

        return new PositionValuation(normalizeCode(emissionCode), quantity, available, blocked, nominal.setScale(2, RoundingMode.HALF_UP),
                gross, tax.net(), tax.gain(), tax.tax(), purchaseDate, maturityDate, valuationDate,
                ratePercent, period, periodBasePerBond, Instant.now());
    }

    private static int periodForDate(LocalDate purchaseDate, LocalDate valuationDate, RetailBondProduct product) {
        int totalPeriods = Math.max(1, product.termMonths() / product.periodMonths());
        int period = 1;
        while (period < totalPeriods && !valuationDate.isBefore(purchaseDate.plusMonths((long) period * product.periodMonths()))) {
            period++;
        }
        return period;
    }

    private BigDecimal solvePeriodBase(
            BigDecimal grossPerBond,
            LocalDate purchaseDate,
            RetailBondProduct product,
            LocalDate valuationDate,
            BigDecimal ratePercent,
            int period
    ) {
        LocalDate start = purchaseDate.plusMonths((long) (period - 1) * product.periodMonths());
        LocalDate end = start.plusMonths(product.periodMonths());
        long total = Math.max(1, ChronoUnit.DAYS.between(start, end));
        long elapsed = Math.max(0, Math.min(total, ChronoUnit.DAYS.between(start, valuationDate)));
        if (elapsed == 0) return grossPerBond.setScale(2, RoundingMode.HALF_UP);

        BigDecimal factor = BigDecimal.ONE.add(
                ratePercent.divide(new BigDecimal("100"), 12, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(elapsed))
                        .divide(BigDecimal.valueOf(total), 12, RoundingMode.HALF_UP)
        );
        BigDecimal approx = grossPerBond.divide(factor, 2, RoundingMode.HALF_UP);

        for (int cents = -5; cents <= 5; cents++) {
            BigDecimal candidate = approx.add(BigDecimal.valueOf(cents, 2));
            BigDecimal interest = candidate.multiply(ratePercent)
                    .divide(new BigDecimal("100"), 12, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(elapsed))
                    .divide(BigDecimal.valueOf(total), 12, RoundingMode.HALF_UP)
                    .setScale(2, RoundingMode.HALF_UP);
            if (candidate.add(interest).setScale(2, RoundingMode.HALF_UP)
                    .compareTo(grossPerBond.setScale(2, RoundingMode.HALF_UP)) == 0) return candidate;
        }
        return approx;
    }

    private TaxValuation tax(BigDecimal gross, BigDecimal nominal) {
        BigDecimal gain = gross.subtract(nominal).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
        BigDecimal tax = gain.multiply(BELKA).setScale(2, RoundingMode.HALF_UP);
        return new TaxValuation(gain, tax, gross.subtract(tax).setScale(2, RoundingMode.HALF_UP));
    }

    private void upsert(Long assetId, Long userId, PositionValuation v, String source) {
        batchUpsert(assetId, userId, List.of(v), source);
    }

    private void batchUpsert(Long assetId, Long userId, List<PositionValuation> valuations, String source) {
        if (valuations.isEmpty()) return;

        jdbc.batchUpdate(POSITION_UPSERT_SQL, new BatchPreparedStatementSetter() {
            @Override
            public void setValues(PreparedStatement ps, int i) throws SQLException {
                PositionValuation v = valuations.get(i);
                ps.setLong(1, userId);
                ps.setLong(2, assetId);
                ps.setString(3, v.emissionCode());
                ps.setInt(4, v.quantity());
                ps.setInt(5, v.availableQuantity());
                ps.setInt(6, v.blockedQuantity());
                ps.setBigDecimal(7, v.nominalValue());
                ps.setBigDecimal(8, v.grossValue());
                ps.setBigDecimal(9, v.netValue());
                ps.setBigDecimal(10, v.taxableGain());
                ps.setBigDecimal(11, v.taxAmount());
                ps.setObject(12, v.purchaseDate());
                ps.setObject(13, v.maturityDate());
                ps.setObject(14, v.valuationDate());
                if (v.currentRate() == null) ps.setNull(15, Types.NUMERIC);
                else ps.setBigDecimal(15, v.currentRate());
                if (v.currentPeriod() == null) ps.setNull(16, Types.INTEGER);
                else ps.setInt(16, v.currentPeriod());
                if (v.periodBasePerBond() == null) ps.setNull(17, Types.NUMERIC);
                else ps.setBigDecimal(17, v.periodBasePerBond());
                ps.setString(18, source);
                ps.setObject(19, OffsetDateTime.ofInstant(v.marketCheckedAt(), ZoneOffset.UTC), Types.TIMESTAMP_WITH_TIMEZONE);
            }

            @Override
            public int getBatchSize() {
                return valuations.size();
            }
        });
    }

    private void updatePosition(Long id, PositionValuation v, String source) {
        jdbc.update("""
                UPDATE retail_bond_positions SET
                    current_gross_value=?,current_net_value=?,taxable_gain=?,tax_amount=?,valuation_date=?,
                    current_rate=?,current_period=?,period_base_per_bond=?,source=?,market_checked_at=?,updated_at=NOW()
                WHERE id=?
                """,
                v.grossValue(), v.netValue(), v.taxableGain(), v.taxAmount(), v.valuationDate(),
                v.currentRate(), v.currentPeriod(), v.periodBasePerBond(), source, timestampWithTimezone(v.marketCheckedAt()), id
        );
    }

    private static SqlParameterValue timestampWithTimezone(Instant instant) {
        return new SqlParameterValue(Types.TIMESTAMP_WITH_TIMEZONE, OffsetDateTime.ofInstant(instant, ZoneOffset.UTC));
    }

    private void applyAggregate(Asset asset, BigDecimal before, User user, boolean newAsset) {
        Aggregate a = aggregate(asset.getId(), user.getId());
        asset.update(asset.getName(), a.netValue(), asset.getColor(), AssetCategory.BONDS, asset.getIconKey(), asset.getPortfolioId());
        asset.configureRetailBondValuation(true, a.nominalValue(), a.grossValue(), a.taxableGain(), BELKA, a.taxAmount());
        assetRepo.saveAndFlush(asset);

        if (newAsset) {
            ledger.recordAssetCreation(asset.getId(), a.netValue(), user);
        } else if (before.compareTo(a.netValue()) != 0) {
            jdbc.update(
                    "INSERT INTO asset_valuation_events(user_id,asset_id,asset_name_snapshot,previous_value,new_value,delta,reason) VALUES(?,?,?,?,?,?,'MARKET_REVALUATION')",
                    user.getId(), asset.getId(), asset.getName(), before, a.netValue(), a.netValue().subtract(before)
            );
            ledger.recordValuation(asset.getId(), before, a.netValue(), user);
            ledger.clampReservationsForAsset(asset.getId(), user);
        }
    }

    private Asset findOrCreateBondAsset(Long portfolioId, User user) {
        Optional<Asset> existing = assetRepo.findAllByUserId(user.getId()).stream()
                .filter(asset -> asset.getCategory() == AssetCategory.BONDS)
                .filter(asset -> portfolioId.equals(asset.getPortfolioId()))
                .filter(asset -> "Obligacje skarbowe".equalsIgnoreCase(asset.getName()))
                .findFirst();
        if (existing.isPresent()) return existing.get();
        Asset asset = new Asset(user, "Obligacje skarbowe", BigDecimal.ZERO, "#d5a72f", AssetCategory.BONDS, "scrollText", portfolioId);
        asset.configureRetailBondValuation(true, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BELKA, BigDecimal.ZERO);
        return assetRepo.saveAndFlush(asset);
    }

    private Asset bondAsset(Long assetId, User user) {
        Asset asset = assetRepo.findByIdAndUserId(assetId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Aktywo nie istnieje."));
        if (asset.getCategory() != AssetCategory.BONDS) throw new IllegalArgumentException("To aktywo nie jest portfelem obligacji skarbowych.");
        return asset;
    }

    private void validatePortfolio(Long portfolioId, Long userId) {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM portfolios WHERE id=? AND user_id=? AND type<>'GOALS'", Integer.class, portfolioId, userId);
        if (count == null || count == 0) throw new IllegalArgumentException("Wybrany portfel nie istnieje.");
    }

    private int countPositions(Long assetId) {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM retail_bond_positions WHERE asset_id=?", Integer.class, assetId);
        return count == null ? 0 : count;
    }

    private Aggregate aggregate(Long assetId, Long userId) {
        return jdbc.queryForObject("""
                SELECT COALESCE(SUM(nominal_value),0) nominal,
                       COALESCE(SUM(current_gross_value),0) gross,
                       COALESCE(SUM(taxable_gain),0) gain,
                       COALESCE(SUM(tax_amount),0) tax,
                       COALESCE(SUM(current_net_value),0) net
                FROM retail_bond_positions WHERE asset_id=? AND user_id=?
                """, (rs, n) -> new Aggregate(
                rs.getBigDecimal("nominal"), rs.getBigDecimal("gross"), rs.getBigDecimal("gain"), rs.getBigDecimal("tax"), rs.getBigDecimal("net")
        ), assetId, userId);
    }

    private RetailBondPortfolioResponse summary(Long assetId, User user) {
        Asset asset = bondAsset(assetId, user);
        List<PositionRow> rows = positions(assetId, user.getId());
        Aggregate a = aggregate(assetId, user.getId());
        LocalDate date = rows.stream().map(PositionRow::valuationDate).max(LocalDate::compareTo).orElse(LocalDate.now());
        return new RetailBondPortfolioResponse(
                assetId, asset.getName(), a.nominalValue(), a.grossValue(), a.taxableGain(), a.taxAmount(), a.netValue(), date,
                rows.stream().map(row -> {
                    EarlyRedemptionValuation redemption = earlyRedemption(row);
                    return new RetailBondPositionResponse(
                            row.id(), row.emissionCode(), row.quantity(), row.availableQuantity(), row.blockedQuantity(), row.nominalValue(),
                            row.currentGrossValue(), row.taxableGain(), row.taxAmount(), row.currentNetValue(),
                            redemption.feePerBond(), redemption.fee(), redemption.tax(), redemption.value(), redemption.pricePerBond(),
                            row.purchaseDate(), row.maturityDate(), row.valuationDate(), row.currentRate(), row.currentPeriod(), row.source()
                    );
                }).toList()
        );
    }

    private EarlyRedemptionValuation earlyRedemption(PositionRow row) {
        RetailBondProduct product = RetailBondProduct.fromEmission(row.emissionCode());

        if (product == RetailBondProduct.OTS) {
            BigDecimal value = row.nominalValue().setScale(2, RoundingMode.HALF_UP);
            BigDecimal perBond = row.quantity() > 0
                    ? value.divide(BigDecimal.valueOf(row.quantity()), 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
            return new EarlyRedemptionValuation(
                    BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP),
                    BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP),
                    BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP),
                    value, perBond
            );
        }

        BigDecimal feePerBond = product.earlyRedemptionFeePerBond(row.purchaseDate())
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal fullFee = feePerBond.multiply(BigDecimal.valueOf(row.quantity()))
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal gain = row.currentGrossValue().subtract(row.nominalValue())
                .max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
        int currentPeriod = row.currentPeriod() == null ? 1 : row.currentPeriod();
        BigDecimal appliedFee = product.earlyRedemptionFeeMayReducePrincipal(currentPeriod)
                ? fullFee
                : fullFee.min(gain);
        BigDecimal taxableAfterFee = gain.subtract(appliedFee).max(BigDecimal.ZERO)
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal tax = taxableAfterFee.multiply(BELKA).setScale(2, RoundingMode.HALF_UP);
        BigDecimal value = row.currentGrossValue().subtract(appliedFee).subtract(tax)
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal pricePerBond = row.quantity() > 0
                ? value.divide(BigDecimal.valueOf(row.quantity()), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

        return new EarlyRedemptionValuation(feePerBond, appliedFee, tax, value, pricePerBond);
    }

    private List<PositionRow> positions(Long assetId, Long userId) {
        return jdbc.query("""
                SELECT id,emission_code,quantity,available_quantity,blocked_quantity,nominal_value,current_gross_value,
                       current_net_value,taxable_gain,tax_amount,purchase_date,maturity_date,valuation_date,current_rate,
                       current_period,period_base_per_bond,source
                FROM retail_bond_positions WHERE asset_id=? AND user_id=? ORDER BY current_net_value DESC,id
                """, (rs, n) -> new PositionRow(
                rs.getLong("id"), rs.getString("emission_code"), rs.getInt("quantity"), rs.getInt("available_quantity"), rs.getInt("blocked_quantity"),
                rs.getBigDecimal("nominal_value"), rs.getBigDecimal("current_gross_value"), rs.getBigDecimal("current_net_value"),
                rs.getBigDecimal("taxable_gain"), rs.getBigDecimal("tax_amount"), rs.getObject("purchase_date", LocalDate.class),
                rs.getObject("maturity_date", LocalDate.class), rs.getObject("valuation_date", LocalDate.class), rs.getBigDecimal("current_rate"),
                (Integer) rs.getObject("current_period"), rs.getBigDecimal("period_base_per_bond"), rs.getString("source")
        ), assetId, userId);
    }

    private Map<String, RetailBondMarketDataService.CurrentTerms> loadTermsInParallel(List<ImportedRow> rows) {
        Set<String> emissions = new LinkedHashSet<>();
        for (ImportedRow row : rows) emissions.add(normalizeCode(row.emissionCode()));
        if (emissions.isEmpty()) return Map.of();

        Map<String, RetailBondMarketDataService.CurrentTerms> result = new LinkedHashMap<>();
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            Map<String, Future<RetailBondMarketDataService.CurrentTerms>> futures = new LinkedHashMap<>();
            for (String code : emissions) {
                futures.put(code, executor.submit(() -> safeTerms(code)));
            }

            for (Map.Entry<String, Future<RetailBondMarketDataService.CurrentTerms>> entry : futures.entrySet()) {
                try {
                    RetailBondMarketDataService.CurrentTerms terms = entry.getValue().get();
                    if (terms != null) result.put(entry.getKey(), terms);
                } catch (InterruptedException ex) {
                    Thread.currentThread().interrupt();
                    break;
                } catch (ExecutionException ignored) {
                    // Brak danych rynkowych nie blokuje importu snapshotu z XLS.
                }
            }
        }
        return result;
    }

    private RetailBondMarketDataService.CurrentTerms safeTerms(String code) {
        try { return marketData.currentTerms(code); } catch (RuntimeException ignored) { return null; }
    }

    private static LocalDate reportDate(String filename) {
        Matcher matcher = FILE_DATE.matcher(filename);
        return matcher.find() ? LocalDate.parse(matcher.group(1)) : LocalDate.now();
    }

    private List<ImportedRow> parseXls(MultipartFile file) throws IOException {
        try (HSSFWorkbook workbook = new HSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            DataFormatter formatter = new DataFormatter(new Locale("pl", "PL"));
            HeaderColumns headers = findHeaders(sheet, formatter);
            List<ImportedRow> result = new ArrayList<>();

            for (Row row : sheet) {
                String code = text(row.getCell(headers.emission()), formatter).trim().toUpperCase(Locale.ROOT);
                if (!EMISSION.matcher(code).matches()) continue;
                int available = integer(row.getCell(headers.available()), formatter);
                int blocked = integer(row.getCell(headers.blocked()), formatter);
                BigDecimal nominal = decimal(row.getCell(headers.nominal()), formatter);
                BigDecimal gross = decimal(row.getCell(headers.current()), formatter);
                LocalDate maturity = date(row.getCell(headers.maturity()), formatter);
                if (nominal == null || gross == null || maturity == null) continue;
                result.add(new ImportedRow(code, available, blocked, nominal, gross, maturity));
            }
            return result;
        }
    }

    private HeaderColumns findHeaders(Sheet sheet, DataFormatter formatter) {
        int maxColumn = 0;
        for (int r = 0; r <= Math.min(sheet.getLastRowNum(), 12); r++) {
            Row row = sheet.getRow(r);
            if (row != null) maxColumn = Math.max(maxColumn, row.getLastCellNum());
        }
        int emission = -1, available = -1, blocked = -1, nominal = -1, current = -1, maturity = -1;
        for (int c = 0; c < maxColumn; c++) {
            StringBuilder joined = new StringBuilder();
            for (int r = 0; r <= Math.min(sheet.getLastRowNum(), 12); r++) {
                Row row = sheet.getRow(r);
                if (row == null) continue;
                String value = text(row.getCell(c), formatter);
                if (!value.isBlank()) joined.append(' ').append(value);
            }
            String h = normalize(joined.toString());
            if (h.contains("EMISJA")) emission = c;
            if (h.contains("DOSTEPN")) available = c;
            if (h.contains("ZABLOKOW")) blocked = c;
            if (h.contains("NOMINAL")) nominal = c;
            if (h.contains("AKTUAL")) current = c;
            if (h.contains("DATA WYKUPU")) maturity = c;
        }
        if (emission < 0 || available < 0 || blocked < 0 || nominal < 0 || current < 0 || maturity < 0) {
            throw new IllegalArgumentException("Nie rozpoznano kolumn pliku stanu rachunku rejestrowego.");
        }
        return new HeaderColumns(emission, available, blocked, nominal, current, maturity);
    }

    private static String text(Cell cell, DataFormatter formatter) {
        return cell == null ? "" : formatter.formatCellValue(cell);
    }

    private static int integer(Cell cell, DataFormatter formatter) {
        BigDecimal value = decimal(cell, formatter);
        return value == null ? 0 : value.setScale(0, RoundingMode.HALF_UP).intValue();
    }

    private static BigDecimal decimal(Cell cell, DataFormatter formatter) {
        if (cell == null) return null;
        if (cell.getCellType() == CellType.NUMERIC) return BigDecimal.valueOf(cell.getNumericCellValue());
        String value = formatter.formatCellValue(cell)
                .replace("PLN", "")
                .replace("zł", "")
                .replace("\u00a0", "")
                .replace(" ", "")
                .replace(',', '.')
                .trim();
        if (value.isBlank()) return null;
        try { return new BigDecimal(value); } catch (NumberFormatException ex) { return null; }
    }

    private static LocalDate date(Cell cell, DataFormatter formatter) {
        if (cell == null) return null;
        if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
            return cell.getDateCellValue().toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
        }
        String value = formatter.formatCellValue(cell).trim();
        for (String pattern : List.of("yyyy-MM-dd", "dd.MM.yyyy", "yyyy/MM/dd")) {
            try { return LocalDate.parse(value, java.time.format.DateTimeFormatter.ofPattern(pattern)); }
            catch (Exception ignored) { }
        }
        return null;
    }

    private static String normalize(String value) {
        return java.text.Normalizer.normalize(value.toUpperCase(Locale.ROOT), java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private static String normalizeCode(String code) {
        String normalized = code == null ? "" : code.trim().toUpperCase(Locale.ROOT);
        if (!EMISSION.matcher(normalized).matches()) throw new IllegalArgumentException("Niepoprawny kod emisji, np. COI0829.");
        return normalized;
    }

    private record HeaderColumns(int emission, int available, int blocked, int nominal, int current, int maturity) {}
    private record ImportedRow(String emissionCode, int availableQuantity, int blockedQuantity, BigDecimal nominalValue, BigDecimal currentGrossValue, LocalDate maturityDate) {}
    private record EarlyRedemptionValuation(BigDecimal feePerBond, BigDecimal fee, BigDecimal tax, BigDecimal value, BigDecimal pricePerBond) {}

    private record PositionSlice(BigDecimal nominalValue, BigDecimal grossValue, BigDecimal taxableGain, BigDecimal taxAmount) {
        BigDecimal netValue() { return grossValue.subtract(taxAmount).setScale(2, RoundingMode.HALF_UP); }
    }

    private record TaxValuation(BigDecimal gain, BigDecimal tax, BigDecimal net) {}
    private record Aggregate(BigDecimal nominalValue, BigDecimal grossValue, BigDecimal taxableGain, BigDecimal taxAmount, BigDecimal netValue) {}
    private record PositionValuation(String emissionCode, int quantity, int availableQuantity, int blockedQuantity, BigDecimal nominalValue,
                                     BigDecimal grossValue, BigDecimal netValue, BigDecimal taxableGain, BigDecimal taxAmount,
                                     LocalDate purchaseDate, LocalDate maturityDate, LocalDate valuationDate, BigDecimal currentRate,
                                     Integer currentPeriod, BigDecimal periodBasePerBond, Instant marketCheckedAt) {}
    private record PositionRow(Long id, String emissionCode, int quantity, int availableQuantity, int blockedQuantity, BigDecimal nominalValue,
                               BigDecimal currentGrossValue, BigDecimal currentNetValue, BigDecimal taxableGain, BigDecimal taxAmount,
                               LocalDate purchaseDate, LocalDate maturityDate, LocalDate valuationDate, BigDecimal currentRate,
                               Integer currentPeriod, BigDecimal periodBasePerBond, String source) {}
}
