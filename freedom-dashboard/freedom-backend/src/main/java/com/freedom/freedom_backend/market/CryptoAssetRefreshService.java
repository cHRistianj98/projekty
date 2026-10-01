package com.freedom.freedom_backend.market;

import com.freedom.freedom_backend.asset.Asset;
import com.freedom.freedom_backend.asset.AssetCategory;
import com.freedom.freedom_backend.asset.AssetRepository;
import com.freedom.freedom_backend.asset.AssetResponse;
import com.freedom.freedom_backend.ledger.MoneyLedgerService;
import com.freedom.freedom_backend.user.User;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class CryptoAssetRefreshService {
    private final AssetRepository assetRepository;
    private final CryptoPricingService pricingService;
    private final MoneyLedgerService ledger;
    private final JdbcTemplate jdbc;

    public CryptoAssetRefreshService(
            AssetRepository assetRepository,
            CryptoPricingService pricingService,
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
        List<Asset> liveCrypto = assets.stream()
                .filter(asset -> asset.isMarketPriced()
                        && asset.getCategory() == AssetCategory.CRYPTO
                        && asset.getCryptoCoinId() != null
                        && asset.getCryptoQuantity() != null
                        && asset.getCryptoQuantity().signum() > 0)
                .toList();

        if (liveCrypto.isEmpty()) {
            return assets.stream().map(AssetResponse::from).toList();
        }

        Map<String, CryptoPricingService.CoinMeta> metadata = new LinkedHashMap<>();
        for (Asset asset : liveCrypto) {
            metadata.put(
                    pricingService.canonicalId(asset.getCryptoCoinId()),
                    new CryptoPricingService.CoinMeta(asset.getCryptoSymbol(), asset.getName())
            );
        }

        Map<String, CryptoQuoteResponse> quotes;
        try {
            quotes = pricingService.quoteAll(metadata.keySet(), metadata);
        } catch (RuntimeException ex) {
            return assets.stream().map(AssetResponse::from).toList();
        }

        for (Asset asset : liveCrypto) {
            CryptoQuoteResponse quote = quotes.get(
                    pricingService.canonicalId(asset.getCryptoCoinId())
            );
            if (quote == null) continue;

            BigDecimal before = asset.getValue();
            BigDecimal after = pricingService.valuePln(quote, asset.getCryptoQuantity());

            if (before.compareTo(after) != 0) {
                ledger.recordValuation(asset.getId(), before, after, user);
                jdbc.update(
                        "INSERT INTO asset_valuation_events(user_id,asset_id,asset_name_snapshot,previous_value,new_value,delta,reason) VALUES(?,?,?,?,?,?,'CRYPTO_MARKET_SYNC')",
                        user.getId(), asset.getId(), asset.getName(), before, after, after.subtract(before)
                );
            }

            asset.applyCryptoValuation(after, quote);
            assetRepository.saveAndFlush(asset);
            ledger.clampReservationsForAsset(asset.getId(), user);
        }

        assetRepository.flush();
        return assetRepository.findAllByUserId(user.getId()).stream()
                .map(AssetResponse::from)
                .toList();
    }
}
