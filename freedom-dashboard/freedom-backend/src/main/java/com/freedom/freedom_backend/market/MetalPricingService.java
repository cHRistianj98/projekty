package com.freedom.freedom_backend.market;

import com.freedom.freedom_backend.asset.MetalSymbol;
import com.freedom.freedom_backend.asset.MetalUnit;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
public class MetalPricingService {
    private static final BigDecimal GRAMS_PER_TROY_OUNCE = new BigDecimal("31.1034768");

    private final RestClient goldClient;
    private final RestClient fxClient;
    private final Duration cacheTtl;

    private final Map<MetalSymbol, CachedMetal> metals = new EnumMap<>(MetalSymbol.class);
    private CachedFx fx;

    public MetalPricingService(
            @Value("${app.market.gold-api-base-url:https://api.gold-api.com}") String goldApiBaseUrl,
            @Value("${app.market.fx-api-base-url:https://api.frankfurter.dev}") String fxApiBaseUrl,
            @Value("${app.market.cache-minutes:10}") long cacheMinutes
    ) {
        this.goldClient = RestClient.create(goldApiBaseUrl);
        this.fxClient = RestClient.create(fxApiBaseUrl);
        this.cacheTtl = Duration.ofMinutes(Math.max(1, cacheMinutes));
    }

    public synchronized MetalQuoteResponse quote(MetalSymbol symbol) {
        Instant now = Instant.now();
        CachedMetal metal = metals.get(symbol);
        if (metal == null || metal.cachedAt().plus(cacheTtl).isBefore(now)) {
            metal = fetchMetal(symbol, metal);
            metals.put(symbol, metal);
        }

        if (fx == null || fx.cachedAt().plus(cacheTtl).isBefore(now)) {
            fx = fetchFx(fx);
        }

        BigDecimal pln = metal.priceUsd()
                .multiply(fx.rate())
                .setScale(2, RoundingMode.HALF_UP);

        return new MetalQuoteResponse(
                symbol,
                symbol == MetalSymbol.XAU ? "Złoto" : "Srebro",
                metal.priceUsd(),
                fx.rate(),
                pln,
                metal.updatedAt(),
                fx.date()
        );
    }

    public List<MetalQuoteResponse> quoteAll() {
        return List.of(quote(MetalSymbol.XAU), quote(MetalSymbol.XAG));
    }

    public BigDecimal valuePln(MetalQuoteResponse quote, BigDecimal quantity, MetalUnit unit) {
        if (quantity == null || quantity.signum() <= 0) {
            throw new IllegalArgumentException("Ilość metalu musi być większa od zera.");
        }
        BigDecimal ounces = unit == MetalUnit.GRAM
                ? quantity.divide(GRAMS_PER_TROY_OUNCE, 12, RoundingMode.HALF_UP)
                : quantity;
        return quote.pricePlnPerTroyOunce()
                .multiply(ounces)
                .setScale(2, RoundingMode.HALF_UP);
    }

    private CachedMetal fetchMetal(MetalSymbol symbol, CachedMetal fallback) {
        try {
            GoldApiResponse response = goldClient.get()
                    .uri("/price/{symbol}", symbol.name())
                    .retrieve()
                    .body(GoldApiResponse.class);
            if (response == null || response.price() == null || response.price().signum() <= 0) {
                throw new IllegalStateException("Gold API zwróciło pustą cenę.");
            }
            return new CachedMetal(
                    response.price(),
                    response.updatedAt() == null ? Instant.now() : response.updatedAt(),
                    Instant.now()
            );
        } catch (RuntimeException ex) {
            if (fallback != null) return new CachedMetal(fallback.priceUsd(), fallback.updatedAt(), Instant.now());
            throw new IllegalStateException("Nie udało się pobrać ceny " + symbol + " z Gold API.", ex);
        }
    }

    private CachedFx fetchFx(CachedFx fallback) {
        try {
            FxResponse response = fxClient.get()
                    .uri("/v2/rate/usd/pln")
                    .retrieve()
                    .body(FxResponse.class);
            if (response == null || response.rate() == null || response.rate().signum() <= 0) {
                throw new IllegalStateException("Frankfurter zwrócił pusty kurs USD/PLN.");
            }
            return new CachedFx(response.rate(), response.date(), Instant.now());
        } catch (RuntimeException ex) {
            if (fallback != null) return new CachedFx(fallback.rate(), fallback.date(), Instant.now());
            throw new IllegalStateException("Nie udało się pobrać kursu USD/PLN z Frankfurter.", ex);
        }
    }

    private record GoldApiResponse(BigDecimal price, Instant updatedAt) {}
    private record FxResponse(String date, String base, String quote, BigDecimal rate) {}
    private record CachedMetal(BigDecimal priceUsd, Instant updatedAt, Instant cachedAt) {}
    private record CachedFx(BigDecimal rate, String date, Instant cachedAt) {}
}
