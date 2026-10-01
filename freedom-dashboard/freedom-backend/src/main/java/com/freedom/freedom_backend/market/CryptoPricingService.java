package com.freedom.freedom_backend.market;

import tools.jackson.databind.JsonNode;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class CryptoPricingService {
    private static final String SOURCE = "CoinGecko";

    private final RestClient client;
    private final Duration cacheTtl;
    private final String demoApiKey;

    private final Map<String, CachedQuote> cache = new ConcurrentHashMap<>();

    public CryptoPricingService(
            @Value("${app.market.coingecko-api-base-url:https://api.coingecko.com/api/v3}") String baseUrl,
            @Value("${app.market.crypto-cache-minutes:10}") long cacheMinutes,
            @Value("${app.market.coingecko-demo-api-key:}") String demoApiKey
    ) {
        this.client = RestClient.create(baseUrl);
        this.cacheTtl = Duration.ofMinutes(Math.max(1, cacheMinutes));
        this.demoApiKey = demoApiKey == null ? "" : demoApiKey.trim();
    }

    public CryptoQuoteResponse quote(String coinId, String symbolHint, String nameHint) {
        Map<String, CryptoQuoteResponse> result = quoteAll(List.of(coinId), Map.of(
                cleanId(coinId), new CoinMeta(symbolHint, nameHint)
        ));
        CryptoQuoteResponse quote = result.get(cleanId(coinId));
        if (quote == null) {
            throw new IllegalStateException("CoinGecko nie zwróciło notowania dla " + coinId + ".");
        }
        return quote;
    }

    public Map<String, CryptoQuoteResponse> quoteAll(Collection<String> rawIds) {
        return quoteAll(rawIds, Map.of());
    }

    public Map<String, CryptoQuoteResponse> quoteAll(
            Collection<String> rawIds,
            Map<String, CoinMeta> metadata
    ) {
        Set<String> ids = new LinkedHashSet<>();
        for (String raw : rawIds) {
            if (raw != null && !raw.isBlank()) ids.add(cleanId(raw));
        }
        if (ids.isEmpty()) return Map.of();

        Instant now = Instant.now();
        Map<String, CryptoQuoteResponse> result = new LinkedHashMap<>();
        List<String> missing = new ArrayList<>();

        for (String id : ids) {
            CachedQuote cached = cache.get(id);
            if (cached != null && cached.cachedAt().plus(cacheTtl).isAfter(now)) {
                result.put(id, cached.quote());
            } else {
                missing.add(id);
            }
        }

        if (!missing.isEmpty()) {
            try {
                JsonNode root = requestSimplePrice(missing);
                for (String id : missing) {
                    CoinMeta meta = metadata.get(id);
                    CryptoQuoteResponse quote = parseQuote(root, id, meta, now);
                    if (quote != null) {
                        cache.put(id, new CachedQuote(quote, now));
                        result.put(id, quote);
                    } else {
                        CachedQuote stale = cache.get(id);
                        if (stale != null) result.put(id, stale.quote());
                    }
                }
            } catch (RuntimeException ex) {
                boolean recovered = false;
                for (String id : missing) {
                    CachedQuote stale = cache.get(id);
                    if (stale != null) {
                        result.put(id, stale.quote());
                        recovered = true;
                    }
                }
                if (!recovered) {
                    throw new IllegalStateException(
                            "Nie udało się pobrać cen krypto z CoinGecko. " +
                            "Jeżeli publiczny endpoint jest limitowany, ustaw darmowy app.market.coingecko-demo-api-key.",
                            ex
                    );
                }
            }
        }

        return result;
    }

    public List<CryptoSearchResult> search(String rawQuery) {
        String query = rawQuery == null ? "" : rawQuery.trim();
        if (query.length() < 2) return List.of();

        JsonNode root = client.get()
                .uri(uri -> uri.path("/search").queryParam("query", query).build())
                .headers(this::addAuthHeader)
                .retrieve()
                .body(JsonNode.class);

        if (root == null || !root.path("coins").isArray()) return List.of();

        List<CryptoSearchResult> result = new ArrayList<>();
        for (JsonNode coin : root.path("coins")) {
            String id = text(coin, "id");
            String symbol = text(coin, "symbol");
            String name = text(coin, "name");
            if (id == null || symbol == null || name == null) continue;

            Integer rank = null;
            JsonNode rankNode = coin.get("market_cap_rank");
            if (rankNode != null && rankNode.canConvertToInt()) rank = rankNode.asInt();

            result.add(new CryptoSearchResult(
                    id,
                    symbol.toUpperCase(Locale.ROOT),
                    name,
                    rank,
                    text(coin, "thumb")
            ));
            if (result.size() >= 12) break;
        }
        return result;
    }

    public BigDecimal valuePln(CryptoQuoteResponse quote, BigDecimal quantity) {
        if (quantity == null || quantity.signum() <= 0) {
            throw new IllegalArgumentException("Ilość krypto musi być większa od zera.");
        }
        return quote.pricePln()
                .multiply(quantity)
                .setScale(2, RoundingMode.HALF_UP);
    }

    private JsonNode requestSimplePrice(List<String> ids) {
        return client.get()
                .uri(uri -> uri.path("/simple/price")
                        .queryParam("ids", String.join(",", ids))
                        .queryParam("vs_currencies", "pln,usd")
                        .queryParam("include_24hr_change", "true")
                        .queryParam("include_last_updated_at", "true")
                        .queryParam("precision", "full")
                        .build())
                .headers(this::addAuthHeader)
                .retrieve()
                .body(JsonNode.class);
    }

    private CryptoQuoteResponse parseQuote(
            JsonNode root,
            String id,
            CoinMeta meta,
            Instant fallbackTime
    ) {
        if (root == null) return null;
        JsonNode node = root.get(id);
        if (node == null || !node.isObject()) return null;

        BigDecimal pln = decimal(node.get("pln"));
        BigDecimal usd = decimal(node.get("usd"));
        if (pln == null || pln.signum() <= 0) return null;

        BigDecimal change24h = decimal(node.get("pln_24h_change"));
        long epoch = 0L;
        JsonNode updated = node.get("last_updated_at");
        if (updated != null && updated.canConvertToLong()) epoch = updated.asLong();
        Instant updatedAt = epoch > 0 ? Instant.ofEpochSecond(epoch) : fallbackTime;

        String symbol = meta != null && meta.symbol() != null && !meta.symbol().isBlank()
                ? meta.symbol().trim().toUpperCase(Locale.ROOT)
                : id.toUpperCase(Locale.ROOT);
        String name = meta != null && meta.name() != null && !meta.name().isBlank()
                ? meta.name().trim()
                : id;

        return new CryptoQuoteResponse(id, symbol, name, pln, usd, change24h, updatedAt, SOURCE);
    }

    private void addAuthHeader(org.springframework.http.HttpHeaders headers) {
        if (!demoApiKey.isBlank()) headers.set("x-cg-demo-api-key", demoApiKey);
        headers.set("Accept", "application/json");
        headers.set("User-Agent", "freedom-dashboard/1.0");
    }

    private BigDecimal decimal(JsonNode node) {
        if (node == null || node.isNull()) return null;
        if (node.isNumber()) return node.decimalValue();
        if (node.isString()) {
            try { return new BigDecimal(node.asString()); }
            catch (RuntimeException ignored) { return null; }
        }
        return null;
    }

    private String text(JsonNode node, String field) {
        if (node == null) return null;
        JsonNode value = node.get(field);
        if (value == null || value.isNull() || value.isObject() || value.isArray()) return null;
        return value.asString(null);
    }

    public String canonicalId(String id) {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("Wybierz kryptowalutę.");
        }

        String clean = id.trim().toLowerCase(Locale.ROOT);

        // Backward-compatible aliases for CoinGecko IDs that are not equal
        // to the project's ticker/name. This also protects older frontend
        // versions and already persisted assets.
        return switch (clean) {
            case "peaq" -> "peaq-2";
            default -> clean;
        };
    }

    private String cleanId(String id) {
        return canonicalId(id);
    }

    public record CoinMeta(String symbol, String name) {}
    private record CachedQuote(CryptoQuoteResponse quote, Instant cachedAt) {}
}
