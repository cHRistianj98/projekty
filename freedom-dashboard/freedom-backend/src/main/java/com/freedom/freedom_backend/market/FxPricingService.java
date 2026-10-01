package com.freedom.freedom_backend.market;

import com.freedom.freedom_backend.asset.CashCurrency;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
public class FxPricingService {
    private static final String SOURCE = "Narodowy Bank Polski — tabela A kursów średnich";

    private final RestClient client;
    private final Duration cacheTtl;
    private final Map<CashCurrency, CachedQuote> cache = new EnumMap<>(CashCurrency.class);

    public FxPricingService(
            @Value("${app.market.nbp-api-base-url:https://api.nbp.pl/api}") String baseUrl,
            @Value("${app.market.fx-cash-cache-minutes:60}") long cacheMinutes
    ) {
        this.client = RestClient.create(baseUrl);
        this.cacheTtl = Duration.ofMinutes(Math.max(1, cacheMinutes));
    }

    public synchronized FxQuoteResponse quote(CashCurrency currency) {
        if (currency == null) {
            throw new IllegalArgumentException("Wybierz walutę.");
        }

        if (currency == CashCurrency.PLN) {
            return new FxQuoteResponse(
                    CashCurrency.PLN,
                    "złoty polski",
                    BigDecimal.ONE,
                    LocalDate.now(),
                    "PLN",
                    Instant.now(),
                    SOURCE
            );
        }

        Instant now = Instant.now();
        CachedQuote cached = cache.get(currency);
        if (cached != null && cached.cachedAt().plus(cacheTtl).isAfter(now)) {
            return cached.quote();
        }

        FxQuoteResponse fresh = fetch(currency, cached == null ? null : cached.quote());
        cache.put(currency, new CachedQuote(fresh, now));
        return fresh;
    }

    public List<FxQuoteResponse> supportedQuotes() {
        return List.of(
                quote(CashCurrency.EUR),
                quote(CashCurrency.CHF),
                quote(CashCurrency.USD),
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

    private FxQuoteResponse fetch(CashCurrency currency, FxQuoteResponse fallback) {
        try {
            NbpRateResponse response = client.get()
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
                    response.currency() == null ? currency.name() : response.currency(),
                    rate.mid(),
                    rate.effectiveDate(),
                    rate.no(),
                    Instant.now(),
                    SOURCE
            );
        } catch (RuntimeException ex) {
            if (fallback != null) {
                return new FxQuoteResponse(
                        fallback.currency(),
                        fallback.currencyName(),
                        fallback.ratePln(),
                        fallback.effectiveDate(),
                        fallback.tableNo(),
                        Instant.now(),
                        fallback.source()
                );
            }
            throw new IllegalStateException("Nie udało się pobrać kursu " + currency + "/PLN z NBP.", ex);
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
}
