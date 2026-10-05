package com.freedom.freedom_backend.market;

import tools.jackson.databind.JsonNode;

import org.springframework.beans.factory.annotation.Value;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
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
    private static final Logger log = LoggerFactory.getLogger(CryptoPricingService.class);
    private static final String SOURCE = "CoinGecko";
    private static final int HISTORICAL_RETRY_ATTEMPTS = 3;
    private static final long HISTORICAL_RETRY_BASE_DELAY_MS = 900L;
    private static final long HISTORICAL_REQUEST_GAP_MS = 250L;

    private final RestClient client;
    private final Duration cacheTtl;
    private final String demoApiKey;

    private final Map<String, CachedQuote> cache = new ConcurrentHashMap<>();
    private final Map<String, CachedHistoricalPrice> monthBaseCache = new ConcurrentHashMap<>();
    private static final Duration MONTH_BASE_CACHE_TTL = Duration.ofHours(6);

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
            boolean fresh = cached != null && cached.cachedAt().plus(cacheTtl).isAfter(now);

            // A live quote without 1M is intentionally treated as incomplete.
            // This makes the next refresh retry the historical lookup instead of
            // hiding the badge for the whole cache TTL after a transient 429/5xx.
            if (fresh && cached.quote().change1m() != null) {
                result.put(id, cached.quote());
            } else {
                missing.add(id);
            }
        }

        if (!missing.isEmpty()) {
            try {
                JsonNode root = requestSimplePrice(missing);
                Map<String, BigDecimal> monthBasePrices = requestOneMonthBasePrices(missing, now);
                for (String id : missing) {
                    CoinMeta meta = metadata.get(id);
                    CryptoQuoteResponse quote = parseQuote(root, id, meta, now, monthBasePrices.get(id));
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


    private Map<String, BigDecimal> requestOneMonthBasePrices(List<String> ids, Instant now) {
        Map<String, BigDecimal> result = new LinkedHashMap<>();
        Instant target = now.minus(Duration.ofDays(30));
        boolean firstNetworkLookup = true;

        for (String id : ids) {
            CachedHistoricalPrice cached = monthBaseCache.get(id);
            if (cached != null && cached.cachedAt().plus(MONTH_BASE_CACHE_TTL).isAfter(now)) {
                result.put(id, cached.pricePln());
                continue;
            }

            // CoinGecko's historical endpoints are per coin. Avoid firing a tight
            // burst for portfolios with several coins, which can otherwise make
            // only some 1M badges survive the public/demo API rate limit.
            if (!firstNetworkLookup) sleepQuietly(HISTORICAL_REQUEST_GAP_MS);
            firstNetworkLookup = false;

            try {
                BigDecimal price = fetchHistoricalPricePlnWithFallback(id, target);
                if (price != null && price.signum() > 0) {
                    monthBaseCache.put(id, new CachedHistoricalPrice(price, now));
                    result.put(id, price);
                } else {
                    log.warn("CoinGecko nie zwróciło historycznej ceny PLN dla {} około {}.", id, target);
                }
            } catch (RuntimeException ex) {
                // Live pricing must remain usable even when history is temporarily
                // unavailable. Asset.applyCryptoValuation preserves the last good
                // 1M value instead of replacing it with null.
                log.warn("Nie udało się pobrać historycznej ceny 1M dla {}: {}", id, ex.getMessage());
            }
        }

        return result;
    }

    /**
     * Primary source: raw market_chart/range data around the exact instant from
     * 30 days ago. CoinGecko documents this endpoint as [timestamp, price] pairs.
     * We select the point nearest the target, so Freedom compares one coin today
     * with one coin ~30 days ago and never uses position value/quantity.
     *
     * If the range endpoint is temporarily unavailable, fall back to CoinGecko's
     * daily /history snapshot for the same UTC date. Both paths return a raw PLN
     * unit price; the percentage is always calculated locally by Freedom.
     */
    private BigDecimal fetchHistoricalPricePlnWithFallback(String id, Instant target) {
        RuntimeException rangeFailure = null;

        for (int attempt = 1; attempt <= HISTORICAL_RETRY_ATTEMPTS; attempt++) {
            try {
                BigDecimal price = fetchHistoricalRangePricePln(id, target);
                if (price != null && price.signum() > 0) return price;
                break;
            } catch (RuntimeException ex) {
                rangeFailure = ex;
                if (attempt < HISTORICAL_RETRY_ATTEMPTS) {
                    sleepQuietly(HISTORICAL_RETRY_BASE_DELAY_MS * attempt);
                }
            }
        }

        // Some smaller coins (for example Nosana) can sporadically return an
        // empty/limited range response even though CoinGecko has 30d chart data.
        // Try the regular market_chart endpoint as a second raw-price source.
        RuntimeException chartFailure = null;
        for (int attempt = 1; attempt <= HISTORICAL_RETRY_ATTEMPTS; attempt++) {
            try {
                BigDecimal price = fetchHistoricalChartPricePln(id, target);
                if (price != null && price.signum() > 0) return price;
                break;
            } catch (RuntimeException ex) {
                chartFailure = ex;
                if (attempt < HISTORICAL_RETRY_ATTEMPTS) {
                    sleepQuietly(HISTORICAL_RETRY_BASE_DELAY_MS * attempt);
                }
            }
        }

        RuntimeException historyFailure = null;
        for (int attempt = 1; attempt <= HISTORICAL_RETRY_ATTEMPTS; attempt++) {
            try {
                BigDecimal price = fetchHistoricalDailyPricePln(id, target);
                if (price != null && price.signum() > 0) return price;
                break;
            } catch (RuntimeException ex) {
                historyFailure = ex;
                if (attempt < HISTORICAL_RETRY_ATTEMPTS) {
                    sleepQuietly(HISTORICAL_RETRY_BASE_DELAY_MS * attempt);
                }
            }
        }

        if (historyFailure != null) throw historyFailure;
        if (chartFailure != null) throw chartFailure;
        if (rangeFailure != null) throw rangeFailure;
        return null;
    }

    private BigDecimal fetchHistoricalRangePricePln(String id, Instant target) {
        long from = target.minus(Duration.ofDays(2)).getEpochSecond();
        long to = target.plus(Duration.ofDays(2)).getEpochSecond();

        JsonNode root = client.get()
                .uri(uri -> uri.path("/coins/{id}/market_chart/range")
                        .queryParam("vs_currency", "pln")
                        .queryParam("from", from)
                        .queryParam("to", to)
                        .queryParam("precision", "full")
                        .build(id))
                .headers(this::addAuthHeader)
                .retrieve()
                .body(JsonNode.class);

        JsonNode prices = root == null ? null : root.path("prices");
        if (prices == null || !prices.isArray() || prices.size() == 0) return null;

        BigDecimal bestPrice = null;
        long bestDistance = Long.MAX_VALUE;
        long targetMillis = target.toEpochMilli();

        for (JsonNode point : prices) {
            if (!point.isArray() || point.size() < 2) continue;
            JsonNode tsNode = point.get(0);
            BigDecimal price = decimal(point.get(1));
            if (tsNode == null || !tsNode.isNumber() || price == null || price.signum() <= 0) continue;

            long distance = Math.abs(tsNode.longValue() - targetMillis);
            if (distance < bestDistance) {
                bestDistance = distance;
                bestPrice = price;
            }
        }

        return bestPrice;
    }

    private BigDecimal fetchHistoricalChartPricePln(String id, Instant target) {
        JsonNode root = client.get()
                .uri(uri -> uri.path("/coins/{id}/market_chart")
                        .queryParam("vs_currency", "pln")
                        .queryParam("days", "31")
                        .queryParam("interval", "hourly")
                        .queryParam("precision", "full")
                        .build(id))
                .headers(this::addAuthHeader)
                .retrieve()
                .body(JsonNode.class);

        JsonNode prices = root == null ? null : root.path("prices");
        if (prices == null || !prices.isArray() || prices.size() == 0) return null;

        BigDecimal bestPrice = null;
        long bestDistance = Long.MAX_VALUE;
        long targetMillis = target.toEpochMilli();

        for (JsonNode point : prices) {
            if (!point.isArray() || point.size() < 2) continue;
            JsonNode tsNode = point.get(0);
            BigDecimal price = decimal(point.get(1));
            if (tsNode == null || !tsNode.isNumber() || price == null || price.signum() <= 0) continue;

            long distance = Math.abs(tsNode.longValue() - targetMillis);
            if (distance < bestDistance) {
                bestDistance = distance;
                bestPrice = price;
            }
        }

        return bestPrice;
    }

    private BigDecimal fetchHistoricalDailyPricePln(String id, Instant target) {
        // CoinGecko /history expects DD-MM-YYYY. The previous ISO YYYY-MM-DD
        // fallback was invalid, so once range failed there was no working safety net.
        String date = target.atZone(ZoneOffset.UTC).toLocalDate()
                .format(DateTimeFormatter.ofPattern("dd-MM-yyyy"));

        JsonNode root = client.get()
                .uri(uri -> uri.path("/coins/{id}/history")
                        .queryParam("date", date)
                        .queryParam("localization", "false")
                        .build(id))
                .headers(this::addAuthHeader)
                .retrieve()
                .body(JsonNode.class);

        if (root == null) return null;
        return decimal(root.path("market_data").path("current_price").get("pln"));
    }

    private void sleepQuietly(long millis) {
        try {
            Thread.sleep(Math.max(0L, millis));
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
        }
    }

    private CryptoQuoteResponse parseQuote(
            JsonNode root,
            String id,
            CoinMeta meta,
            Instant fallbackTime,
            BigDecimal monthBasePricePln
    ) {
        if (root == null) return null;
        JsonNode node = root.get(id);
        if (node == null || !node.isObject()) return null;

        BigDecimal pln = decimal(node.get("pln"));
        BigDecimal usd = decimal(node.get("usd"));
        if (pln == null || pln.signum() <= 0) return null;

        BigDecimal change24h = decimal(node.get("pln_24h_change"));
        BigDecimal change1m = percentageChange(pln, monthBasePricePln);
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

        return new CryptoQuoteResponse(id, symbol, name, pln, usd, change24h, change1m, updatedAt, SOURCE);
    }


    private BigDecimal percentageChange(BigDecimal current, BigDecimal base) {
        if (current == null || base == null || base.signum() <= 0) return null;
        return current
                .subtract(base)
                .divide(base, 10, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"))
                .setScale(4, RoundingMode.HALF_UP);
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
    private record CachedHistoricalPrice(BigDecimal pricePln, Instant cachedAt) {}
}
