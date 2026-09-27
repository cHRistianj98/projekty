package com.freedom.freedom_backend.asset;

import com.freedom.freedom_backend.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class AssetService {

    private final AssetRepository assetRepository;

    public AssetService(
            AssetRepository assetRepository
    ) {
        this.assetRepository = assetRepository;
    }

    @Transactional(readOnly = true)
    public List<AssetResponse> getAllAssets(
            User currentUser
    ) {
        return assetRepository
                .findAllByUserId(currentUser.getId())
                .stream()
                .map(AssetResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public AssetResponse getAsset(
            Long id,
            User currentUser
    ) {
        return AssetResponse.from(
                findAsset(id, currentUser)
        );
    }

    public AssetResponse createAsset(
            AssetRequest request,
            User currentUser
    ) {
        AssetCategory category =
                request.category() != null
                        ? request.category()
                        : AssetCategory.OTHER;

        Asset asset = new Asset(
                currentUser,
                request.name(),
                request.value(),
                request.color(),
                category
        );

        Asset savedAsset =
                assetRepository.save(asset);

        return AssetResponse.from(savedAsset);
    }

    public AssetResponse updateAsset(
            Long id,
            AssetRequest request,
            User currentUser
    ) {
        Asset asset =
                findAsset(id, currentUser);

        AssetCategory category =
                request.category() != null
                        ? request.category()
                        : AssetCategory.OTHER;

        asset.update(
                request.name(),
                request.value(),
                request.color(),
                category
        );

        return AssetResponse.from(asset);
    }

    public void deleteAsset(
            Long id,
            User currentUser
    ) {
        Asset asset =
                findAsset(id, currentUser);

        assetRepository.delete(asset);
    }

    private Asset findAsset(
            Long id,
            User currentUser
    ) {
        return assetRepository
                .findByIdAndUserId(
                        id,
                        currentUser.getId()
                )
                .orElseThrow(
                        () -> new AssetNotFoundException(id)
                );
    }
}