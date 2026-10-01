package com.freedom.freedom_backend.market;

import com.freedom.freedom_backend.asset.*;
import com.freedom.freedom_backend.ledger.MoneyLedgerService;
import com.freedom.freedom_backend.user.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional
public class StockAssetRefreshService {
    private static final Logger log = LoggerFactory.getLogger(StockAssetRefreshService.class);

    private final AssetRepository assetRepository;
    private final StockPricingService pricingService;
    private final StockTaxValuationService valuationService;
    private final MoneyLedgerService ledger;
    private final JdbcTemplate jdbc;

    public StockAssetRefreshService(
            AssetRepository assetRepository,
            StockPricingService pricingService,
            StockTaxValuationService valuationService,
            MoneyLedgerService ledger,
            JdbcTemplate jdbc
    ) {
        this.assetRepository = assetRepository;
        this.pricingService = pricingService;
        this.valuationService = valuationService;
        this.ledger = ledger;
        this.jdbc = jdbc;
    }

    public List<AssetResponse> refresh(User user) {
        List<Asset> assets = assetRepository.findAllByUserId(user.getId());

        for (Asset asset : assets) {
            if (!asset.isStockPriced()
                    || asset.getStockSymbol() == null
                    || asset.getStockCurrency() == null
                    || asset.getStockQuantity() == null
                    || asset.getStockAverageBuyPrice() == null) continue;

            try {
                StockQuoteResponse quote = pricingService.quote(asset.getStockSymbol(), asset.getStockCurrency());
                StockTaxValuationService.StockValuation valuation = valuationService.calculate(
                        quote, asset.getStockQuantity(), asset.getStockAverageBuyPrice(), asset.getStockBuyFxRatePln()
                );

                BigDecimal before = asset.getValue();
                BigDecimal after = valuation.netValuePln();

                if (before.compareTo(after) != 0) {
                    ledger.recordValuation(asset.getId(), before, after, user);
                    jdbc.update(
                            "INSERT INTO asset_valuation_events(user_id,asset_id,asset_name_snapshot,previous_value,new_value,delta,reason) VALUES(?,?,?,?,?,?,'STOCK_SYNC')",
                            user.getId(), asset.getId(), asset.getName(), before, after, after.subtract(before)
                    );
                }

                asset.applyStockValuation(after, quote, valuation);
                assetRepository.saveAndFlush(asset);
                ledger.clampReservationsForAsset(asset.getId(), user);
            } catch (RuntimeException ex) {
                log.warn("Nie udało się odświeżyć {} ({}): {}", asset.getName(), asset.getStockSymbol(), ex.getMessage());
            }
        }

        assetRepository.flush();
        return assetRepository.findAllByUserId(user.getId()).stream().map(AssetResponse::from).toList();
    }
}
