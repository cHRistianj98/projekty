package com.freedom.freedom_backend.asset;

public record AssetPurchaseTargetRequest(
        String name,
        AssetCategory category,
        String color,
        String iconKey,
        String cryptoCoinId,
        String cryptoSymbol,
        CashCurrency cashCurrency,
        String stockSymbol,
        CashCurrency stockCurrency
) {}
