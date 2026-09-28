package com.freedom.freedom_backend.asset;

import com.freedom.freedom_backend.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@Transactional
public class AssetService {

    private static final Set<String> ALLOWED_ICON_KEYS = Set.of(
            "landmark", "wallet", "banknote", "coins", "trendingUp", "chart",
            "bitcoin", "circleDollar", "building", "house", "briefcase", "car",
            "shield", "piggyBank", "gem", "vault"
    );

    private final AssetRepository assetRepository;

    public AssetService(AssetRepository assetRepository) {
        this.assetRepository = assetRepository;
    }

    @Transactional(readOnly = true)
    public List<AssetResponse> getAllAssets(User currentUser) {
        return assetRepository.findAllByUserId(currentUser.getId())
                .stream()
                .map(AssetResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public AssetResponse getAsset(Long id, User currentUser) {
        return AssetResponse.from(findAsset(id, currentUser));
    }

    public AssetResponse createAsset(AssetRequest request, User currentUser) {
        AssetCategory category = request.category() != null
                ? request.category()
                : AssetCategory.OTHER;

        Asset asset = new Asset(
                currentUser,
                request.name(),
                request.value(),
                request.color(),
                category,
                resolveIconKey(request.iconKey(), category)
        );

        return AssetResponse.from(assetRepository.save(asset));
    }

    public AssetResponse updateAsset(Long id, AssetRequest request, User currentUser) {
        Asset asset = findAsset(id, currentUser);
        AssetCategory category = request.category() != null
                ? request.category()
                : AssetCategory.OTHER;

        asset.update(
                request.name(),
                request.value(),
                request.color(),
                category,
                resolveIconKey(request.iconKey(), category)
        );

        return AssetResponse.from(asset);
    }

    public void deleteAsset(Long id, User currentUser) {
        assetRepository.delete(findAsset(id, currentUser));
    }

    private Asset findAsset(Long id, User currentUser) {
        return assetRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new AssetNotFoundException(id));
    }

    private String resolveIconKey(String requestedIconKey, AssetCategory category) {
        if (requestedIconKey != null && ALLOWED_ICON_KEYS.contains(requestedIconKey)) {
            return requestedIconKey;
        }

        return switch (category) {
            case CASH -> "landmark";
            case STOCKS -> "chart";
            case CRYPTO -> "bitcoin";
            case REAL_ESTATE -> "building";
            case BUSINESS -> "briefcase";
            case VEHICLE -> "car";
            case OTHER -> "circleDollar";
        };
    }
}
