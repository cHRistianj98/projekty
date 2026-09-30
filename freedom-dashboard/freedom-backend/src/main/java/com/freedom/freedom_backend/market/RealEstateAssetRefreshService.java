package com.freedom.freedom_backend.market;

import com.freedom.freedom_backend.asset.Asset;
import com.freedom.freedom_backend.asset.AssetCategory;
import com.freedom.freedom_backend.asset.AssetRepository;
import com.freedom.freedom_backend.asset.AssetResponse;
import com.freedom.freedom_backend.asset.RealEstateMarketSegment;
import com.freedom.freedom_backend.asset.RealEstateValuationMode;
import com.freedom.freedom_backend.ledger.MoneyLedgerService;
import com.freedom.freedom_backend.user.User;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional
public class RealEstateAssetRefreshService {
    private final AssetRepository assetRepository;
    private final RealEstatePricingService pricingService;
    private final MoneyLedgerService ledger;
    private final JdbcTemplate jdbc;

    public RealEstateAssetRefreshService(
            AssetRepository assetRepository,
            RealEstatePricingService pricingService,
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
            if (!asset.isMarketPriced()
                    || asset.getCategory() != AssetCategory.REAL_ESTATE
                    || asset.getRealEstateAreaSqm() == null
                    || asset.getRealEstateCity() == null) {
                continue;
            }

            try {
                RealEstateQuoteResponse quote = pricingService.quoteApartment(
                        asset.getRealEstateCity(),
                        asset.getRealEstateDistrict(),
                        asset.getRealEstateAreaSqm(),
                        asset.getRealEstateMarketSegment() == null
                                ? RealEstateMarketSegment.ALL
                                : asset.getRealEstateMarketSegment(),
                        asset.getRealEstateValuationMode() == null
                                ? RealEstateValuationMode.MARKET_MEDIAN
                                : asset.getRealEstateValuationMode(),
                        asset.getRealEstatePurchasePrice(),
                        asset.getRealEstatePurchaseDate()
                );

                BigDecimal before = asset.getValue();
                BigDecimal after = quote.estimatedValue();

                if (before.compareTo(after) != 0) {
                    ledger.recordValuation(asset.getId(), before, after, user);
                    jdbc.update(
                            "INSERT INTO asset_valuation_events(user_id,asset_id,asset_name_snapshot,previous_value,new_value,delta,reason) VALUES(?,?,?,?,?,?,'REAL_ESTATE_RCN_SYNC')",
                            user.getId(),
                            asset.getId(),
                            asset.getName(),
                            before,
                            after,
                            after.subtract(before)
                    );
                }

                asset.applyRealEstateValuation(quote);
                assetRepository.saveAndFlush(asset);
                ledger.clampReservationsForAsset(asset.getId(), user);

            } catch (RuntimeException ex) {
                // Wycena jest pomocnicza. Awaria lub brak danych zewnętrznego API
                // nie może zablokować całego odświeżenia portfela.
            }
        }

        assetRepository.flush();
        return assetRepository.findAllByUserId(user.getId())
                .stream()
                .map(AssetResponse::from)
                .toList();
    }
}
