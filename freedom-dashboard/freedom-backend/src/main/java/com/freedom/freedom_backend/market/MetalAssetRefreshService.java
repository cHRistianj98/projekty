package com.freedom.freedom_backend.market;

import com.freedom.freedom_backend.asset.Asset;
import com.freedom.freedom_backend.asset.AssetRepository;
import com.freedom.freedom_backend.asset.AssetResponse;
import com.freedom.freedom_backend.ledger.MoneyLedgerService;
import com.freedom.freedom_backend.user.User;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional
public class MetalAssetRefreshService {
    private final AssetRepository assetRepository;
    private final MetalPricingService pricingService;
    private final MoneyLedgerService ledger;
    private final JdbcTemplate jdbc;

    public MetalAssetRefreshService(
            AssetRepository assetRepository,
            MetalPricingService pricingService,
            MoneyLedgerService ledger,
            JdbcTemplate jdbc
    ) {
        this.assetRepository = assetRepository;
        this.pricingService = pricingService;
        this.ledger = ledger;
        this.jdbc = jdbc;
    }

    public List<AssetResponse> refresh(User user) {
        List<Asset> assets = assetRepository.findAllByUserId(user.getId());

        for (Asset asset : assets) {
            if (!asset.isMarketPriced() || asset.getMetalSymbol() == null || asset.getMetalQuantity() == null || asset.getMetalUnit() == null) {
                continue;
            }

            MetalQuoteResponse quote = pricingService.quote(asset.getMetalSymbol());
            BigDecimal before = asset.getValue();
            BigDecimal after = pricingService.valuePln(quote, asset.getMetalQuantity(), asset.getMetalUnit());

            if (before.compareTo(after) != 0) {
                ledger.recordValuation(asset.getId(), before, after, user);
                jdbc.update(
                        "INSERT INTO asset_valuation_events(user_id,asset_id,asset_name_snapshot,previous_value,new_value,delta,reason) VALUES(?,?,?,?,?,?,'METAL_SPOT_SYNC')",
                        user.getId(), asset.getId(), asset.getName(), before, after, after.subtract(before)
                );
            }

            asset.applyMarketValuation(
                    after,
                    quote.priceUsdPerTroyOunce(),
                    quote.usdPlnRate(),
                    quote.metalUpdatedAt()
            );
            assetRepository.saveAndFlush(asset);
            ledger.clampReservationsForAsset(asset.getId(), user);
        }

        assetRepository.flush();
        return assetRepository.findAllByUserId(user.getId()).stream().map(AssetResponse::from).toList();
    }
}
