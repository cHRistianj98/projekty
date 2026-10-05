package com.freedom.freedom_backend.market;

import com.freedom.freedom_backend.asset.CashCurrency;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import tools.jackson.databind.JsonNode;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class StockPricingService {

    private static final String SOURCE =
            "Yahoo Finance — delayed market quote (unofficial chart endpoint); FX: intraday Yahoo, NBP fallback";

    /*
     * Bare GPW symbols that were used by the previous Stooq implementation.
     * Yahoo uses .WA for Warsaw Stock Exchange.
     */
    private static final Set<String> GPW_ALIASES = Set.of(
            "DNP",
            "XTB",
            "ETFBM40TR",
            "ETFBS80TR",
            "ETFBW20TR"
    );

    private final RestClient client;
    private final FxPricingService fxPricing;
    private final Duration cacheTtl;
    private final Map<String, CachedQuote> cache = new ConcurrentHashMap<>();

    public StockPricingService(
            @Value("${app.market.yahoo-finance-base-url:https://query1.finance.yahoo.com}") String baseUrl,
            @Value("${app.market.stock-cache-minutes:10}") long cacheMinutes,
            FxPricingService fxPricing
    ) {
        this.client = RestClient.builder()
                .baseUrl(baseUrl)
                /*
                 * Yahoo's chart endpoint is keyless, but requests without a
                 * normal browser-like User-Agent are frequently rejected.
                 */
                .defaultHeader(
                        "User-Agent",
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
                                "AppleWebKit/537.36 (KHTML, like Gecko) " +
                                "Chrome/154.0.0.0 Safari/537.36"
                )
                .defaultHeader("Accept", "application/json")
                .build();

        this.fxPricing = fxPricing;
        this.cacheTtl = Duration.ofMinutes(Math.max(1, cacheMinutes));
    }

    public StockQuoteResponse quote(String symbol, CashCurrency currency) {
        String cleanSymbol = canonicalSymbol(requireSymbol(symbol));
        CashCurrency cleanCurrency =
                currency == null ? inferCurrency(cleanSymbol) : currency;

        String key =
                cleanSymbol.toUpperCase(Locale.ROOT) + "|" + cleanCurrency.name();

        Instant now = Instant.now();
        CachedQuote cached = cache.get(key);

        if (cached != null
                && cached.cachedAt().plus(cacheTtl).isAfter(now)) {
            return cached.quote();
        }

        StockQuoteResponse fresh = fetch(cleanSymbol, cleanCurrency);
        cache.put(key, new CachedQuote(fresh, now));
        return fresh;
    }

    private StockQuoteResponse fetch(
            String symbol,
            CashCurrency currency
    ) {
        try {
            JsonNode root = client.get()
                    .uri(builder -> builder
                            .path("/v8/finance/chart/")
                            .pathSegment(symbol)
                            .queryParam("range", "5d")
                            .queryParam("interval", "5m")
                            .queryParam("includePrePost", "false")
                            .queryParam("events", "div,splits")
                            .build())
                    .retrieve()
                    .body(JsonNode.class);

            JsonNode result = root == null
                    ? null
                    : root.path("chart").path("result");

            if (result == null
                    || !result.isArray()
                    || result.size() == 0
                    || result.get(0) == null) {
                String error = yahooError(root);

                throw new IllegalStateException(
                        error == null
                                ? "Yahoo Finance nie zwrócił notowania dla " + symbol + "."
                                : "Yahoo Finance: " + error
                );
            }

            JsonNode chart = result.get(0);
            JsonNode meta = chart.path("meta");

            BigDecimal price = decimal(
                    meta.get("regularMarketPrice")
            );

            if (price == null || price.signum() <= 0) {
                price = lastClose(chart);
            }

            if (price == null || price.signum() <= 0) {
                throw new IllegalStateException(
                        "Yahoo Finance nie zwrócił prawidłowej ceny dla "
                                + symbol + "."
                );
            }

            BigDecimal previous = firstDecimal(
                    meta,
                    "chartPreviousClose",
                    "previousClose",
                    "regularMarketPreviousClose"
            );

            BigDecimal changePercent = null;

            if (previous != null && previous.signum() > 0) {
                changePercent = price
                        .subtract(previous)
                        .divide(previous, 8, RoundingMode.HALF_UP)
                        .multiply(new BigDecimal("100"))
                        .setScale(4, RoundingMode.HALF_UP);
            }

            BigDecimal fx = currency == CashCurrency.PLN
                    ? BigDecimal.ONE
                    : fxPricing.quote(currency).ratePln();

            BigDecimal pricePln = price
                    .multiply(fx)
                    .setScale(8, RoundingMode.HALF_UP);

            String resolvedSymbol =
                    text(meta, "symbol");

            if (resolvedSymbol == null || resolvedSymbol.isBlank()) {
                resolvedSymbol = symbol;
            }

            String name = firstText(
                    meta,
                    "shortName",
                    "longName",
                    "displayName"
            );

            if (name == null || name.isBlank()) {
                name = resolvedSymbol;
            }

            MarketTimestamp marketTimestamp =
                    marketTimestamp(meta);

            return new StockQuoteResponse(
                    resolvedSymbol.toUpperCase(Locale.ROOT),
                    name,
                    price,
                    currency,
                    fx,
                    pricePln,
                    previous,
                    changePercent,
                    marketTimestamp.date(),
                    marketTimestamp.time(),
                    Instant.now(),
                    SOURCE
            );

        } catch (RestClientResponseException ex) {
            int status = ex.getStatusCode().value();

            if (status == 404) {
                throw new IllegalStateException(
                        "Yahoo Finance nie zna symbolu "
                                + symbol
                                + ". Sprawdź ticker (np. MMM, DNP.WA, SXR8.DE)."
                );
            }

            if (status == 429) {
                throw new IllegalStateException(
                        "Yahoo Finance chwilowo ograniczył liczbę zapytań. "
                                + "Freedom użyje ostatniej zapisanej ceny przy automatycznym odświeżaniu."
                );
            }

            throw new IllegalStateException(
                    "Yahoo Finance zwrócił HTTP "
                            + status
                            + " dla "
                            + symbol
                            + "."
            );
        }
    }

    /**
     * Compatibility with symbols already saved by the previous Stooq provider.
     *
     * Stooq -> Yahoo:
     * MMM.US       -> MMM
     * DNP / DNP.PL -> DNP.WA
     * DTLA.UK      -> DTLA.L
     * SXR8.DE      -> SXR8.DE
     */
    public String canonicalSymbol(String symbol) {
        String clean = symbol
                .trim()
                .toUpperCase(Locale.ROOT);

        if (clean.endsWith(".US")) {
            clean = clean.substring(0, clean.length() - 3);
        } else if (clean.endsWith(".PL")) {
            clean = clean.substring(0, clean.length() - 3) + ".WA";
        } else if (clean.endsWith(".UK")) {
            clean = clean.substring(0, clean.length() - 3) + ".L";
        }

        /*
         * Medical Properties Trust changed its NYSE ticker
         * from MPW to MPT effective 2026-02-02.
         * Keep old Freedom records and old UI versions compatible.
         */
        if ("MPW".equals(clean)) {
            return "MPT";
        }

        if (GPW_ALIASES.contains(clean)) {
            return clean + ".WA";
        }

        return clean;
    }

    private CashCurrency inferCurrency(String symbol) {
        String s = symbol.toUpperCase(Locale.ROOT);

        if (s.endsWith(".WA")) {
            return CashCurrency.PLN;
        }

        if (s.endsWith(".DE")) {
            return CashCurrency.EUR;
        }

        if (s.endsWith(".L")) {
            /*
             * Some LSE ETFs trade in USD/EUR instead of GBP.
             * Frontend presets explicitly supply the currency.
             * GBP is only a fallback for manually entered LSE symbols.
             */
            return CashCurrency.GBP;
        }

        return CashCurrency.USD;
    }

    private String requireSymbol(String symbol) {
        if (symbol == null || symbol.trim().isEmpty()) {
            throw new IllegalArgumentException(
                    "Podaj symbol Yahoo Finance."
            );
        }

        return symbol.trim();
    }

    private BigDecimal firstDecimal(
            JsonNode node,
            String... names
    ) {
        for (String name : names) {
            BigDecimal value = decimal(node.get(name));

            if (value != null) {
                return value;
            }
        }

        return null;
    }

    private BigDecimal decimal(JsonNode node) {
        if (node == null || node.isNull()) {
            return null;
        }

        if (node.isNumber()) {
            return node.decimalValue();
        }

        if (node.isString()) {
            try {
                return new BigDecimal(node.asString());
            } catch (RuntimeException ignored) {
                return null;
            }
        }

        return null;
    }

    private String firstText(
            JsonNode node,
            String... names
    ) {
        for (String name : names) {
            String value = text(node, name);

            if (value != null && !value.isBlank()) {
                return value;
            }
        }

        return null;
    }

    private String text(
            JsonNode node,
            String name
    ) {
        if (node == null) {
            return null;
        }

        JsonNode value = node.get(name);

        if (value == null
                || value.isNull()
                || value.isObject()
                || value.isArray()) {
            return null;
        }

        try {
            return value.asString(null);
        } catch (RuntimeException ignored) {
            return null;
        }
    }

    private BigDecimal lastClose(JsonNode chart) {
        JsonNode quotes = chart
                .path("indicators")
                .path("quote");

        if (!quotes.isArray()
                || quotes.size() == 0
                || quotes.get(0) == null) {
            return null;
        }

        JsonNode closes = quotes
                .get(0)
                .path("close");

        if (!closes.isArray()) {
            return null;
        }

        for (int i = closes.size() - 1; i >= 0; i--) {
            BigDecimal value = decimal(closes.get(i));

            if (value != null && value.signum() > 0) {
                return value;
            }
        }

        return null;
    }

    private MarketTimestamp marketTimestamp(JsonNode meta) {
        JsonNode timeNode =
                meta.get("regularMarketTime");

        if (timeNode == null
                || !timeNode.isNumber()) {
            return new MarketTimestamp(null, null);
        }

        long epoch = timeNode.longValue();

        String timezoneName =
                text(meta, "exchangeTimezoneName");

        ZoneId zone;

        try {
            zone = timezoneName == null
                    ? ZoneOffset.UTC
                    : ZoneId.of(timezoneName);
        } catch (RuntimeException ignored) {
            zone = ZoneOffset.UTC;
        }

        ZonedDateTime value =
                Instant.ofEpochSecond(epoch).atZone(zone);

        return new MarketTimestamp(
                value.toLocalDate(),
                value.toLocalTime()
                        .withNano(0)
                        .format(DateTimeFormatter.ISO_LOCAL_TIME)
        );
    }

    private String yahooError(JsonNode root) {
        if (root == null) {
            return null;
        }

        JsonNode error = root
                .path("chart")
                .path("error");

        if (error == null || error.isNull()) {
            return null;
        }

        String description =
                text(error, "description");

        if (description != null
                && !description.isBlank()) {
            return description;
        }

        return text(error, "code");
    }

    private record CachedQuote(
            StockQuoteResponse quote,
            Instant cachedAt
    ) {}

    private record MarketTimestamp(
            LocalDate date,
            String time
    ) {}
}
