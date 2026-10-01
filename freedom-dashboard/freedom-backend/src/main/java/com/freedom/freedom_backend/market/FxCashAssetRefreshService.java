package com.freedom.freedom_backend.market;

import com.freedom.freedom_backend.asset.Asset;
import com.freedom.freedom_backend.asset.AssetRepository;
import com.freedom.freedom_backend.asset.AssetResponse;
import com.freedom.freedom_backend.asset.CashCurrency;
import com.freedom.freedom_backend.ledger.MoneyLedgerService;
import com.freedom.freedom_backend.user.User;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional
public class FxCashAssetRefreshService {
    private final AssetRepository assetRepository;
    private final FxPricingService pricingService;
    private final MoneyLedgerService ledger;
    private final JdbcTemplate jdbc;

    public FxCashAssetRefreshService(
            AssetRepository assetRepository,
            FxPricingService pricingService,
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
            if (!asset.isFxPriced()
                    || asset.getCashCurrency() == null
                    || asset.getCashCurrency() == CashCurrency.PLN
                    || asset.getCashQuantity() == null
                    || asset.getCashQuantity().signum() <= 0) {
                continue;
            }

            FxQuoteResponse quote = pricingService.quote(asset.getCashCurrency());
            BigDecimal before = asset.getValue();
            BigDecimal after = pricingService.valuePln(quote, asset.getCashQuantity());

            if (before.compareTo(after) != 0) {
                ledger.recordValuation(asset.getId(), before, after, user);
                jdbc.update(
                        "INSERT INTO asset_valuation_events(user_id,asset_id,asset_name_snapshot,previous_value,new_value,delta,reason) VALUES(?,?,?,?,?,?,'FX_SYNC')",
                        user.getId(), asset.getId(), asset.getName(), before, after, after.subtract(before)
                );
            }

            asset.applyFxValuation(after, quote);
            assetRepository.saveAndFlush(asset);
            ledger.clampReservationsForAsset(asset.getId(), user);
        }

        assetRepository.flush();
        return assetRepository.findAllByUserId(user.getId()).stream().map(AssetResponse::from).toList();
    }
}
