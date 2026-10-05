package com.freedom.freedom_backend.market;

import com.freedom.freedom_backend.asset.CashCurrency;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
public class FxPricingService {
    private static final String YAHOO_SOURCE =
            "Yahoo Finance — intraday/delayed market quote (unofficial chart endpoint)";
    private static final String NBP_SOURCE =
            "Narodowy Bank Polski — tabela A kursów średnich (fallback)";
    private static final ZoneId DISPLAY_ZONE = ZoneId.of("Europe/Warsaw");

    private final RestClient yahooClient;
    private final RestClient nbpClient;
    private final Duration cacheTtl;
    private final Map<CashCurrency, CachedQuote> cache = new EnumMap<>(CashCurrency.class);

    public FxPricingService(
            @Value("${app.market.yahoo-finance-base-url:https://query1.finance.yahoo.com}") String yahooBaseUrl,
            @Value("${app.market.nbp-api-base-url:https://api.nbp.pl/api}") String nbpBaseUrl,
            @Value("${app.market.fx-live-cache-seconds:30}") long cacheSeconds
    ) {
        this.yahooClient = RestClient.builder()
                .baseUrl(yahooBaseUrl)
                .defaultHeader(
                        "User-Agent",
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
                                "AppleWebKit/537.36 (KHTML, like Gecko) " +
                                "Chrome/154.0.0.0 Safari/537.36"
                )
                .defaultHeader("Accept", "application/json")
                .build();
        this.nbpClient = RestClient.create(nbpBaseUrl);
        this.cacheTtl = Duration.ofSeconds(Math.max(5, cacheSeconds));
    }

    public synchronized FxQuoteResponse quote(CashCurrency currency) {
        validateCurrency(currency);

        if (currency == CashCurrency.PLN) {
            return plnQuote();
        }

        Instant now = Instant.now();
        CachedQuote cached = cache.get(currency);
        if (cached != null && cached.cachedAt().plus(cacheTtl).isAfter(now)) {
            return cached.quote();
        }

        FxQuoteResponse fresh = fetchIntradayWithFallback(currency);
        cache.put(currency, new CachedQuote(fresh, now));
        return fresh;
    }

    /**
     * Bypasses the short UI cache. Use this at the exact moment of an FX purchase,
     * so the persisted spread benchmark is as close to execution time as the
     * public quote provider can supply.
     */
    public synchronized FxQuoteResponse quoteFresh(CashCurrency currency) {
        validateCurrency(currency);
        if (currency == CashCurrency.PLN) {
            return plnQuote();
        }

        FxQuoteResponse fresh = fetchIntradayWithFallback(currency);
        cache.put(currency, new CachedQuote(fresh, Instant.now()));
        return fresh;
    }

    public List<FxQuoteResponse> supportedQuotes() {
        return List.of(
                quote(CashCurrency.EUR),
                quote(CashCurrency.CHF),
                quote(CashCurrency.USD),
                quote(CashCurrency.GBP),
                quote(CashCurrency.CZK)
        );
    }

    public BigDecimal valuePln(FxQuoteResponse quote, BigDecimal quantity) {
        if (quote == null || quote.ratePln() == null || quote.ratePln().signum() <= 0) {
            throw new IllegalArgumentException("Brak prawidłowego kursu waluty.");
        }
        if (quantity == null || quantity.signum() <= 0) {
            throw new IllegalArgumentException("Ilość waluty musi być większa od zera.");
        }
        return quote.ratePln()
                .multiply(quantity)
                .setScale(2, RoundingMode.HALF_UP);
    }

    private FxQuoteResponse fetchIntradayWithFallback(CashCurrency currency) {
        try {
            return fetchYahoo(currency);
        } catch (RuntimeException yahooFailure) {
            try {
                return fetchNbpFallback(currency);
            } catch (RuntimeException nbpFailure) {
                nbpFailure.addSuppressed(yahooFailure);
                throw new IllegalStateException(
                        "Nie udało się pobrać bieżącego kursu " + currency + "/PLN ani fallbacku NBP.",
                        nbpFailure
                );
            }
        }
    }

    private FxQuoteResponse fetchYahoo(CashCurrency currency) {
        String symbol = currency.name() + "PLN=X";

        JsonNode root = yahooClient.get()
                .uri(builder -> builder
                        .path("/v8/finance/chart/")
                        .pathSegment(symbol)
                        .queryParam("range", "1d")
                        .queryParam("interval", "1m")
                        .queryParam("includePrePost", "true")
                        .build())
                .retrieve()
                .body(JsonNode.class);

        JsonNode result = root == null ? null : root.path("chart").path("result");
        if (result == null || !result.isArray() || result.size() == 0 || result.get(0) == null) {
            throw new IllegalStateException("Yahoo Finance nie zwrócił notowania dla " + symbol + ".");
        }

        JsonNode chart = result.get(0);
        JsonNode meta = chart.path("meta");

        BigDecimal rate = decimal(meta.get("regularMarketPrice"));
        Instant quotedAt = epochInstant(meta.get("regularMarketTime"));

        if (rate == null || rate.signum() <= 0) {
            PricePoint point = lastPricePoint(chart);
            rate = point.price();
            quotedAt = point.quotedAt();
        }

        if (rate == null || rate.signum() <= 0) {
            throw new IllegalStateException("Yahoo Finance nie zwrócił prawidłowego kursu dla " + symbol + ".");
        }

        if (quotedAt == null) {
            quotedAt = Instant.now();
        }

        ZonedDateTime localQuote = quotedAt.atZone(DISPLAY_ZONE);
        String marketTime = localQuote.toLocalTime().withNano(0).format(DateTimeFormatter.ISO_LOCAL_TIME);
        String resolvedSymbol = text(meta, "symbol");
        if (resolvedSymbol == null || resolvedSymbol.isBlank()) resolvedSymbol = symbol;

        return new FxQuoteResponse(
                currency,
                currencyName(currency),
                rate,
                localQuote.toLocalDate(),
                "Yahoo · " + marketTime,
                Instant.now(),
                YAHOO_SOURCE,
                "YAHOO",
                resolvedSymbol,
                quotedAt,
                true,
                false
        );
    }

    private FxQuoteResponse fetchNbpFallback(CashCurrency currency) {
        NbpRateResponse response = nbpClient.get()
                .uri(uri -> uri
                        .path("/exchangerates/rates/a/{currency}/")
                        .queryParam("format", "json")
                        .build(currency.name().toLowerCase()))
                .retrieve()
                .body(NbpRateResponse.class);

        if (response == null || response.rates() == null || response.rates().isEmpty()) {
            throw new IllegalStateException("NBP zwrócił pustą odpowiedź dla " + currency + ".");
        }

        NbpRate rate = response.rates().get(response.rates().size() - 1);
        if (rate.mid() == null || rate.mid().signum() <= 0) {
            throw new IllegalStateException("NBP zwrócił nieprawidłowy kurs dla " + currency + ".");
        }

        return new FxQuoteResponse(
                currency,
                response.currency() == null ? currencyName(currency) : response.currency(),
                rate.mid(),
                rate.effectiveDate(),
                rate.no(),
                Instant.now(),
                NBP_SOURCE,
                "NBP",
                currency.name() + "PLN",
                null,
                false,
                true
        );
    }

    private FxQuoteResponse plnQuote() {
        Instant now = Instant.now();
        return new FxQuoteResponse(
                CashCurrency.PLN,
                "złoty polski",
                BigDecimal.ONE,
                LocalDate.now(DISPLAY_ZONE),
                "PLN",
                now,
                "Freedom Engine",
                "SYSTEM",
                "PLN",
                now,
                true,
                false
        );
    }

    private void validateCurrency(CashCurrency currency) {
        if (currency == null) {
            throw new IllegalArgumentException("Wybierz walutę.");
        }
    }

    private String currencyName(CashCurrency currency) {
        return switch (currency) {
            case PLN -> "złoty polski";
            case EUR -> "euro";
            case USD -> "dolar amerykański";
            case CHF -> "frank szwajcarski";
            case GBP -> "funt szterling";
            case CZK -> "korona czeska";
        };
    }

    private PricePoint lastPricePoint(JsonNode chart) {
        JsonNode quotes = chart.path("indicators").path("quote");
        JsonNode timestamps = chart.path("timestamp");
        if (!quotes.isArray() || quotes.size() == 0 || quotes.get(0) == null) {
            return new PricePoint(null, null);
        }
        JsonNode closes = quotes.get(0).path("close");
        if (!closes.isArray()) return new PricePoint(null, null);

        for (int i = closes.size() - 1; i >= 0; i--) {
            BigDecimal value = decimal(closes.get(i));
            if (value != null && value.signum() > 0) {
                Instant timestamp = timestamps.isArray() && i < timestamps.size()
                        ? epochInstant(timestamps.get(i))
                        : null;
                return new PricePoint(value, timestamp);
            }
        }
        return new PricePoint(null, null);
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

    private Instant epochInstant(JsonNode node) {
        if (node == null || !node.isNumber()) return null;
        try {
            return Instant.ofEpochSecond(node.longValue());
        } catch (RuntimeException ignored) {
            return null;
        }
    }

    private String text(JsonNode node, String name) {
        if (node == null) return null;
        JsonNode value = node.get(name);
        if (value == null || value.isNull() || value.isObject() || value.isArray()) return null;
        try {
            return value.asString(null);
        } catch (RuntimeException ignored) {
            return null;
        }
    }

    private record NbpRateResponse(
            String table,
            String currency,
            String code,
            List<NbpRate> rates
    ) {}

    private record NbpRate(
            String no,
            LocalDate effectiveDate,
            BigDecimal mid
    ) {}

    private record CachedQuote(FxQuoteResponse quote, Instant cachedAt) {}
    private record PricePoint(BigDecimal price, Instant quotedAt) {}
}
