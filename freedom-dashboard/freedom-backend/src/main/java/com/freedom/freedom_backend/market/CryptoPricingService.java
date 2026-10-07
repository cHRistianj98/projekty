package com.freedom.freedom_backend.market;

import tools.jackson.databind.JsonNode;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Date;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
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

    private final RestClient client;
    private final JdbcTemplate jdbc;
    private final Duration liveCacheTtl;
    private final Duration historicalCacheTtl;
    private final Duration historicalFailureCooldown;
    private final Duration liveFailureCooldown;
    private final long historicalRequestGapMillis;
    private final String demoApiKey;

    /**
     * One shared monitor deliberately serializes CoinGecko refresh work.
     * Several HTTP requests can hit /refresh at the same time (React dev mode,
     * multiple tabs, dashboard + modal). The second caller re-checks the cache
     * after entering the monitor, so it reuses the first caller's result instead
     * of issuing the same CoinGecko request again.
     */
    private final Object refreshMonitor = new Object();

    private final Map<String, CachedQuote> quoteCache = new ConcurrentHashMap<>();
    private final Map<HistoricalKey, CachedHistoricalPrice> historicalMemoryCache = new ConcurrentHashMap<>();
    private final Map<HistoricalKey, Instant> historicalRetryAfter = new ConcurrentHashMap<>();
    private volatile Instant liveRetryAfter = Instant.EPOCH;
    private volatile Instant lastHistoricalNetworkCallAt = Instant.EPOCH;

    public CryptoPricingService(
            JdbcTemplate jdbc,
            @Value("${app.market.coingecko-api-base-url:https://api.coingecko.com/api/v3}") String baseUrl,
            @Value("${app.market.crypto-cache-minutes:10}") long cacheMinutes,
            @Value("${app.market.crypto-history-cache-hours:26}") long historyCacheHours,
            @Value("${app.market.crypto-history-failure-cooldown-minutes:30}") long historyFailureCooldownMinutes,
            @Value("${app.market.crypto-live-failure-cooldown-seconds:60}") long liveFailureCooldownSeconds,
            @Value("${app.market.crypto-history-request-gap-ms:750}") long historicalRequestGapMillis,
            @Value("${app.market.coingecko-demo-api-key:}") String demoApiKey
    ) {
        this.jdbc = jdbc;
        this.client = RestClient.create(baseUrl);
        this.liveCacheTtl = Duration.ofMinutes(Math.max(1, cacheMinutes));
        this.historicalCacheTtl = Duration.ofHours(Math.max(1, historyCacheHours));
        this.historicalFailureCooldown = Duration.ofMinutes(Math.max(1, historyFailureCooldownMinutes));
        this.liveFailureCooldown = Duration.ofSeconds(Math.max(10, liveFailureCooldownSeconds));
        this.historicalRequestGapMillis = Math.max(0L, historicalRequestGapMillis);
        this.demoApiKey = demoApiKey == null ? "" : demoApiKey.trim();
    }

    public CryptoQuoteResponse quote(String coinId, String symbolHint, String nameHint) {
        String id = cleanId(coinId);
        Map<String, CryptoQuoteResponse> result = quoteAll(
                List.of(id),
                Map.of(id, new CoinMeta(symbolHint, nameHint))
        );
        CryptoQuoteResponse quote = result.get(id);
        if (quote == null) {
            throw new IllegalStateException("CoinGecko nie zwróciło notowania dla " + coinId + ".");
        }
        return quote;
    }

    public Map<String, CryptoQuoteResponse> quoteAll(Collection<String> rawIds) {
        return quoteAll(rawIds, Map.of());
    }

    /**
     * Batch entry point used by portfolio refresh.
     *
     * Current prices + 24h changes for every missing coin are fetched in ONE
     * /simple/price request. The 1M base price is inherently per-coin in the
     * CoinGecko API, so Freedom stores it in PostgreSQL and only refreshes it
     * once per UTC base date (~once a day). Concurrent calls are deduplicated.
     */
    public Map<String, CryptoQuoteResponse> quoteAll(
            Collection<String> rawIds,
            Map<String, CoinMeta> metadata
    ) {
        Set<String> ids = canonicalIds(rawIds);
        if (ids.isEmpty()) return Map.of();

        Instant now = Instant.now();
        LocalDate baseDate = monthBaseDate(now);

        if (!allSatisfied(ids, now, baseDate)) {
            synchronized (refreshMonitor) {
                now = Instant.now();
                baseDate = monthBaseDate(now);

                refreshLiveQuotesIfNeeded(ids, metadata, now);
                refreshOneMonthChangesIfNeeded(ids, now, baseDate);
            }
        }

        Map<String, CryptoQuoteResponse> result = new LinkedHashMap<>();
        for (String id : ids) {
            CachedQuote cached = quoteCache.get(id);
            if (cached != null) result.put(id, cached.quote());
        }

        if (result.isEmpty()) {
            throw new IllegalStateException(
                    "Nie udało się pobrać cen krypto z CoinGecko. " +
                    "Jeżeli publiczny endpoint jest limitowany, ustaw darmowy app.market.coingecko-demo-api-key."
            );
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

    private Set<String> canonicalIds(Collection<String> rawIds) {
        Set<String> ids = new LinkedHashSet<>();
        if (rawIds == null) return ids;
        for (String raw : rawIds) {
            if (raw != null && !raw.isBlank()) ids.add(cleanId(raw));
        }
        return ids;
    }

    private boolean allSatisfied(Set<String> ids, Instant now, LocalDate baseDate) {
        for (String id : ids) {
            CachedQuote cached = quoteCache.get(id);
            if (!isLiveFresh(cached, now)) return false;

            if (baseDate.equals(cached.monthBaseDate())) continue;

            HistoricalKey key = new HistoricalKey(id, baseDate);
            if (!isHistoricalCooldownActive(key, now)) return false;
        }
        return true;
    }

    private void refreshLiveQuotesIfNeeded(
            Set<String> ids,
            Map<String, CoinMeta> metadata,
            Instant now
    ) {
        List<String> missing = new ArrayList<>();
        for (String id : ids) {
            if (!isLiveFresh(quoteCache.get(id), now)) missing.add(id);
        }
        if (missing.isEmpty()) return;

        if (liveRetryAfter.isAfter(now)) {
            // During a known rate-limit window do not hammer CoinGecko again.
            // Existing DB asset values remain visible because refreshService
            // falls back to persisted assets when no live quote can be produced.
            return;
        }

        try {
            JsonNode root = requestSimplePrice(missing);
            for (String id : missing) {
                CoinMeta meta = metadata.get(id);
                CryptoQuoteResponse fresh = parseLiveQuote(root, id, meta, now);
                if (fresh == null) continue;

                CachedQuote previous = quoteCache.get(id);
                if (previous != null && previous.quote().change1m() != null) {
                    fresh = withChange1m(fresh, previous.quote().change1m());
                }

                quoteCache.put(id, new CachedQuote(
                        fresh,
                        now,
                        previous == null ? null : previous.monthBaseDate()
                ));
            }
            liveRetryAfter = Instant.EPOCH;
        } catch (RuntimeException ex) {
            if (isRateLimited(ex)) {
                liveRetryAfter = now.plus(liveFailureCooldown);
                log.warn(
                        "CoinGecko 429 dla batcha {} krypto. Wstrzymuję live requesty do {}.",
                        missing.size(), liveRetryAfter
                );
            } else {
                log.warn("Nie udało się pobrać batcha cen krypto z CoinGecko: {}", ex.getMessage());
            }
        }
    }

    private void refreshOneMonthChangesIfNeeded(
            Set<String> ids,
            Instant now,
            LocalDate baseDate
    ) {
        Instant target = now.minus(Duration.ofDays(30));

        for (String id : ids) {
            CachedQuote cachedQuote = quoteCache.get(id);
            if (cachedQuote == null) continue;
            if (baseDate.equals(cachedQuote.monthBaseDate())) continue;

            HistoricalKey key = new HistoricalKey(id, baseDate);
            if (isHistoricalCooldownActive(key, now)) continue;

            BigDecimal basePrice = resolveMonthBasePrice(key, target, now);
            if (basePrice == null || basePrice.signum() <= 0) continue;

            BigDecimal change1m = percentageChange(cachedQuote.quote().pricePln(), basePrice);
            CryptoQuoteResponse enriched = withChange1m(cachedQuote.quote(), change1m);
            quoteCache.put(id, new CachedQuote(enriched, cachedQuote.cachedAt(), baseDate));
        }
    }

    private BigDecimal resolveMonthBasePrice(
            HistoricalKey key,
            Instant target,
            Instant now
    ) {
        CachedHistoricalPrice memory = historicalMemoryCache.get(key);
        if (memory != null && memory.cachedAt().plus(historicalCacheTtl).isAfter(now)) {
            return memory.pricePln();
        }

        BigDecimal persisted = loadPersistedHistoricalPrice(key);
        if (persisted != null && persisted.signum() > 0) {
            historicalMemoryCache.put(key, new CachedHistoricalPrice(persisted, now));
            historicalRetryAfter.remove(key);
            return persisted;
        }

        try {
            throttleHistoricalRequest();
            BigDecimal fetched = fetchHistoricalPricePlnWithFallback(key.coinId(), target);
            if (fetched != null && fetched.signum() > 0) {
                savePersistedHistoricalPrice(key, fetched, now);
                historicalMemoryCache.put(key, new CachedHistoricalPrice(fetched, now));
                historicalRetryAfter.remove(key);
                return fetched;
            }

            historicalRetryAfter.put(key, now.plus(historicalFailureCooldown));
            log.warn(
                    "CoinGecko nie zwróciło historycznej ceny PLN dla {} na {}. Kolejna próba po {}.",
                    key.coinId(), key.baseDate(), historicalRetryAfter.get(key)
            );
            return null;
        } catch (RuntimeException ex) {
            Instant retryAt = now.plus(historicalFailureCooldown);
            historicalRetryAfter.put(key, retryAt);

            if (isRateLimited(ex)) {
                log.warn(
                        "CoinGecko 429 dla historycznej ceny 1M {}. Bez retry-bursta; kolejna próba po {}.",
                        key.coinId(), retryAt
                );
            } else {
                log.warn(
                        "Nie udało się pobrać historycznej ceny 1M dla {}: {}. Kolejna próba po {}.",
                        key.coinId(), ex.getMessage(), retryAt
                );
            }
            return null;
        }
    }

    private BigDecimal loadPersistedHistoricalPrice(HistoricalKey key) {
        List<BigDecimal> rows = jdbc.query(
                """
                SELECT price_pln
                FROM crypto_month_base_prices
                WHERE coin_id=? AND base_date=?
                """,
                (rs, rowNum) -> rs.getBigDecimal("price_pln"),
                key.coinId(), Date.valueOf(key.baseDate())
        );
        return rows.isEmpty() ? null : rows.get(0);
    }

    private void savePersistedHistoricalPrice(HistoricalKey key, BigDecimal pricePln, Instant fetchedAt) {
        jdbc.update(
                """
                INSERT INTO crypto_month_base_prices(coin_id, base_date, price_pln, fetched_at)
                VALUES(?,?,?,?)
                ON CONFLICT (coin_id, base_date)
                DO UPDATE SET price_pln=EXCLUDED.price_pln, fetched_at=EXCLUDED.fetched_at
                """,
                key.coinId(),
                Date.valueOf(key.baseDate()),
                pricePln,
                java.time.OffsetDateTime.ofInstant(fetchedAt, ZoneOffset.UTC)
        );
    }


    private void throttleHistoricalRequest() {
        if (historicalRequestGapMillis <= 0L) return;

        Instant now = Instant.now();
        long elapsedMillis = Duration.between(lastHistoricalNetworkCallAt, now).toMillis();
        long waitMillis = historicalRequestGapMillis - Math.max(0L, elapsedMillis);
        if (waitMillis > 0L) {
            try {
                Thread.sleep(waitMillis);
            } catch (InterruptedException interrupted) {
                Thread.currentThread().interrupt();
                return;
            }
        }
        lastHistoricalNetworkCallAt = Instant.now();
    }

    private boolean isHistoricalCooldownActive(HistoricalKey key, Instant now) {
        Instant retryAt = historicalRetryAfter.get(key);
        if (retryAt == null) return false;
        if (retryAt.isAfter(now)) return true;
        historicalRetryAfter.remove(key, retryAt);
        return false;
    }

    private boolean isLiveFresh(CachedQuote cached, Instant now) {
        return cached != null && cached.cachedAt().plus(liveCacheTtl).isAfter(now);
    }

    private LocalDate monthBaseDate(Instant now) {
        return now.minus(Duration.ofDays(30)).atZone(ZoneOffset.UTC).toLocalDate();
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

    /**
     * History is intentionally NOT retried in a tight loop. A 429 from the free
     * CoinGecko tier used to cause up to 9 calls per coin (3 endpoints x 3
     * attempts). Now we make one primary call and only use fallbacks for a
     * non-rate-limit failure or an empty response.
     */
    private BigDecimal fetchHistoricalPricePlnWithFallback(String id, Instant target) {
        RuntimeException rangeFailure = null;
        try {
            BigDecimal price = fetchHistoricalRangePricePln(id, target);
            if (price != null && price.signum() > 0) return price;
        } catch (RuntimeException ex) {
            if (isRateLimited(ex)) throw ex;
            rangeFailure = ex;
        }

        RuntimeException chartFailure = null;
        try {
            BigDecimal price = fetchHistoricalChartPricePln(id, target);
            if (price != null && price.signum() > 0) return price;
        } catch (RuntimeException ex) {
            if (isRateLimited(ex)) throw ex;
            chartFailure = ex;
        }

        try {
            BigDecimal price = fetchHistoricalDailyPricePln(id, target);
            if (price != null && price.signum() > 0) return price;
        } catch (RuntimeException ex) {
            if (isRateLimited(ex)) throw ex;
            throw ex;
        }

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

        return nearestPrice(root, target);
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

        return nearestPrice(root, target);
    }

    private BigDecimal nearestPrice(JsonNode root, Instant target) {
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

    private CryptoQuoteResponse parseLiveQuote(
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

        return new CryptoQuoteResponse(id, symbol, name, pln, usd, change24h, null, updatedAt, SOURCE);
    }

    private CryptoQuoteResponse withChange1m(CryptoQuoteResponse quote, BigDecimal change1m) {
        return new CryptoQuoteResponse(
                quote.coinId(),
                quote.symbol(),
                quote.name(),
                quote.pricePln(),
                quote.priceUsd(),
                quote.change24h(),
                change1m,
                quote.updatedAt(),
                quote.source()
        );
    }

    private BigDecimal percentageChange(BigDecimal current, BigDecimal base) {
        if (current == null || base == null || base.signum() <= 0) return null;
        return current
                .subtract(base)
                .divide(base, 10, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"))
                .setScale(4, RoundingMode.HALF_UP);
    }

    private boolean isRateLimited(Throwable throwable) {
        Throwable current = throwable;
        while (current != null) {
            if (current instanceof RestClientResponseException response
                    && response.getStatusCode().value() == 429) {
                return true;
            }
            current = current.getCause();
        }
        return false;
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
            try {
                return new BigDecimal(node.asString());
            } catch (RuntimeException ignored) {
                return null;
            }
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

        return switch (clean) {
            case "peaq" -> "peaq-2";
            default -> clean;
        };
    }

    private String cleanId(String id) {
        return canonicalId(id);
    }

    public record CoinMeta(String symbol, String name) {}

    private record CachedQuote(
            CryptoQuoteResponse quote,
            Instant cachedAt,
            LocalDate monthBaseDate
    ) {}

    private record HistoricalKey(String coinId, LocalDate baseDate) {}

    private record CachedHistoricalPrice(BigDecimal pricePln, Instant cachedAt) {}
}
