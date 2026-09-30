package com.freedom.freedom_backend.market;

import com.freedom.freedom_backend.asset.RealEstateMarketSegment;
import com.freedom.freedom_backend.asset.RealEstateValuationMode;
import tools.jackson.databind.JsonNode;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.Iterator;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RealEstatePricingService {

    private static final Logger log = LoggerFactory.getLogger(RealEstatePricingService.class);

    private static final String SOURCE =
            "mScanner — dane z Rejestru Cen Nieruchomości (RCN)";

    private static final String DEFAULT_CITATION =
            "mScanner (dane: Rejestr Cen Nieruchomości), https://mscanner.pl";

    private final RestClient client;
    private final Duration cacheTtl;

    /**
     * Cache bazowych agregatów rynkowych.
     * Klucz zawiera miasto, obszar, segment i opcjonalny okres.
     */
    private final Map<String, CachedQuote> cache = new ConcurrentHashMap<>();

    /**
     * Cache resolvera nazw miast -> kod mScanner.
     */
    private final Map<String, CachedCity> cityCache = new ConcurrentHashMap<>();

    public RealEstatePricingService(
            @Value("${app.market.real-estate-api-base-url:https://api.mscanner.pl/api}")
            String baseUrl,
            @Value("${app.market.real-estate-cache-minutes:60}")
            long cacheMinutes
    ) {
        this.client = RestClient.create(baseUrl);
        this.cacheTtl = Duration.ofMinutes(Math.max(1, cacheMinutes));
    }

    /**
     * Zachowany dla kompatybilności z wcześniejszym kodem.
     */
    public RealEstateQuoteResponse quoteApartment(
            String city,
            String district,
            BigDecimal areaSqm
    ) {
        return quoteApartment(
                city,
                district,
                areaSqm,
                RealEstateMarketSegment.ALL,
                RealEstateValuationMode.MARKET_MEDIAN,
                null,
                null
        );
    }

    public RealEstateQuoteResponse quoteApartment(
            String city,
            String district,
            BigDecimal areaSqm,
            RealEstateMarketSegment marketSegment,
            RealEstateValuationMode valuationMode,
            BigDecimal purchasePrice,
            LocalDate purchaseDate
    ) {
        String cleanCity = requireText(city, "Podaj miasto nieruchomości.");

        if (areaSqm == null || areaSqm.signum() <= 0) {
            throw new IllegalArgumentException(
                    "Powierzchnia mieszkania musi być większa od zera."
            );
        }

        String cleanDistrict = district == null ? "" : district.trim();
        RealEstateMarketSegment requestedSegment =
                marketSegment == null ? RealEstateMarketSegment.ALL : marketSegment;
        RealEstateValuationMode mode =
                valuationMode == null ? RealEstateValuationMode.MARKET_MEDIAN : valuationMode;

        CityRef resolvedCity = resolveCity(cleanCity);

        BaseQuote current = currentQuote(
                resolvedCity,
                cleanDistrict,
                requestedSegment
        );

        BigDecimal factor = null;
        BigDecimal anchorMedian = null;
        BigDecimal estimatedPricePerSqm = current.medianPricePerSqm();
        BaseQuote anchor = null;

        if (mode == RealEstateValuationMode.MARKET_ANCHORED) {
            if (purchasePrice == null || purchasePrice.signum() <= 0) {
                throw new IllegalArgumentException(
                        "Dla wyceny zakotwiczonej podaj cenę zakupu mieszkania."
                );
            }
            if (purchaseDate == null) {
                throw new IllegalArgumentException(
                        "Dla wyceny zakotwiczonej podaj datę zakupu mieszkania."
                );
            }
            if (purchaseDate.isAfter(LocalDate.now())) {
                throw new IllegalArgumentException(
                        "Data zakupu nie może być z przyszłości."
                );
            }

            anchor = historicalQuote(
                    resolvedCity,
                    cleanDistrict,
                    requestedSegment,
                    purchaseDate
            );

            anchorMedian = anchor.medianPricePerSqm();

            BigDecimal purchasePricePerSqm = purchasePrice
                    .divide(areaSqm, 8, RoundingMode.HALF_UP);

            factor = purchasePricePerSqm
                    .divide(anchorMedian, 8, RoundingMode.HALF_UP);

            if (factor.signum() <= 0) {
                throw new IllegalStateException(
                        "Nie udało się policzyć współczynnika historycznej wyceny."
                );
            }

            estimatedPricePerSqm = current.medianPricePerSqm()
                    .multiply(factor)
                    .setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal estimated = estimatedPricePerSqm
                .multiply(areaSqm)
                .setScale(2, RoundingMode.HALF_UP);

        return new RealEstateQuoteResponse(
                cleanCity,
                cleanDistrict.isBlank() ? null : cleanDistrict,
                current.resolvedArea(),
                current.scope(),
                current.medianPricePerSqm(),
                areaSqm.setScale(2, RoundingMode.HALF_UP),
                estimated,
                estimatedPricePerSqm,
                current.recordCount(),
                current.periodFrom(),
                current.periodTo(),
                mode,
                requestedSegment,
                current.marketSegment(),
                mode == RealEstateValuationMode.MARKET_ANCHORED ? purchasePrice : null,
                mode == RealEstateValuationMode.MARKET_ANCHORED ? purchaseDate : null,
                anchorMedian,
                factor,
                anchor == null ? null : anchor.resolvedArea(),
                anchor == null ? null : anchor.scope(),
                anchor == null ? null : anchor.marketSegment(),
                anchor == null ? null : anchor.recordCount(),
                anchor == null ? null : anchor.periodFrom(),
                anchor == null ? null : anchor.periodTo(),
                SOURCE,
                current.citation(),
                Instant.now()
        );
    }

    private BaseQuote currentQuote(
            CityRef city,
            String district,
            RealEstateMarketSegment requestedSegment
    ) {
        String key = "NOW|" + city.code() + "|" + normalize(district) + "|" + requestedSegment;
        return cached(key, () -> fetchCurrentQuote(city, district, requestedSegment));
    }

    private BaseQuote historicalQuote(
            CityRef city,
            String district,
            RealEstateMarketSegment requestedSegment,
            LocalDate purchaseDate
    ) {
        /*
         * Kotwica: 12 pełnych miesięcy kończących się w dniu zakupu.
         * Dzięki temu porównujemy cenę zakupu z lokalnym rynkiem z tego samego okresu,
         * a nie z pojedynczym miesiącem o małej próbie.
         */
        LocalDate periodFrom = purchaseDate.minusMonths(12);
        LocalDate periodTo = purchaseDate;

        String key = "ANCHOR|" + city.code()
                + "|" + normalize(district)
                + "|" + requestedSegment
                + "|" + periodFrom
                + "|" + periodTo;

        return cached(key, () ->
                fetchHistoricalQuote(
                        city,
                        district,
                        requestedSegment,
                        periodFrom,
                        periodTo,
                        purchaseDate
                )
        );
    }

    private BaseQuote cached(String key, QuoteSupplier supplier) {
        CachedQuote existing = cache.get(key);
        Instant now = Instant.now();

        if (existing != null
                && existing.cachedAt().plus(cacheTtl).isAfter(now)) {
            return existing.quote();
        }

        BaseQuote quote = supplier.get();
        cache.put(key, new CachedQuote(quote, now));
        return quote;
    }

    private BaseQuote fetchCurrentQuote(
            CityRef city,
            String district,
            RealEstateMarketSegment requestedSegment
    ) {
        if (!district.isBlank()) {
            BaseQuote estate = fetchDistrict(
                    city.code(),
                    district,
                    "osiedle",
                    requestedSegment,
                    null,
                    null
            );
            if (estate != null) {
                return estate;
            }

            BaseQuote borough = fetchDistrict(
                    city.code(),
                    district,
                    "dzielnica",
                    requestedSegment,
                    null,
                    null
            );
            if (borough != null) {
                return borough;
            }
        }

        /*
         * city-trend nie ma parametru segment. Jeżeli schodzimy do miasta,
         * jasno oznaczamy, że źródło jest ALL, nawet jeśli user prosił
         * o PRIMARY/SECONDARY.
         */
        BaseQuote cityQuote = fetchCity(city.code(), city.label());
        if (cityQuote != null) {
            return cityQuote;
        }

        throw new IllegalStateException(
                district.isBlank()
                        ? "mScanner nie zwrócił danych cenowych dla miasta " + city.label() + "."
                        : "mScanner nie zwrócił danych dla „"
                            + district
                            + "” ani dla miasta "
                            + city.label()
                            + "."
        );
    }

    private BaseQuote fetchHistoricalQuote(
            CityRef city,
            String district,
            RealEstateMarketSegment requestedSegment,
            LocalDate periodFrom,
            LocalDate periodTo,
            LocalDate purchaseDate
    ) {
        if (!district.isBlank()) {
            BaseQuote estate = fetchDistrict(
                    city.code(),
                    district,
                    "osiedle",
                    requestedSegment,
                    periodFrom,
                    periodTo
            );
            if (estate != null) {
                return estate;
            }

            BaseQuote borough = fetchDistrict(
                    city.code(),
                    district,
                    "dzielnica",
                    requestedSegment,
                    periodFrom,
                    periodTo
            );
            if (borough != null) {
                return borough;
            }
        }

        /*
         * Historyczny fallback dla całego miasta:
         * city-trend daje points[] miesiąc po miesiącu.
         * Endpoint nie rozdziela ich po PRIMARY/SECONDARY, więc oznaczamy ALL.
         */
        BaseQuote point = fetchHistoricalCityPoint(
                city.code(),
                city.label(),
                purchaseDate
        );

        if (point != null) {
            return point;
        }

        throw new IllegalStateException(
                "Nie udało się znaleźć historycznej mediany rynku dla "
                        + (district.isBlank() ? city.label() : district)
                        + " w okolicy daty " + purchaseDate + "."
        );
    }

    private CityRef resolveCity(String requestedCity) {
        String normalizedCity = normalize(requestedCity);

        CachedCity cached = cityCache.get(normalizedCity);
        Instant now = Instant.now();

        if (cached != null
                && cached.cachedAt().plus(cacheTtl).isAfter(now)) {
            return cached.city();
        }

        try {
            JsonNode root = client.get()
                    .uri(uri -> uri
                            .path("/property-prices/available-cities")
                            .queryParam("mode", "transactional")
                            .build())
                    .retrieve()
                    .body(JsonNode.class);

            if (root != null) {
                JsonNode match = findCityNode(root, requestedCity);

                if (match != null) {
                    String code = text(
                            match,
                            "code",
                            "cityCode",
                            "pricingCode"
                    );

                    if (code == null || code.isBlank()) {
                        String teryt = text(
                                match,
                                "teryt",
                                "terytCode",
                                "gminaCode"
                        );

                        if (teryt != null && teryt.matches("\\d{6}")) {
                            code = "gmina-" + teryt;
                        }
                    }

                    if (code == null || code.isBlank()) {
                        code = text(match, "slug");
                    }

                    String label = text(
                            match,
                            "label",
                            "name",
                            "cityName",
                            "municipalityName",
                            "displayName"
                    );

                    if (code != null && !code.isBlank()) {
                        CityRef result = new CityRef(
                                code.trim(),
                                label == null || label.isBlank()
                                        ? requestedCity
                                        : label.trim()
                        );

                        cityCache.put(
                                normalizedCity,
                                new CachedCity(result, now)
                        );

                        return result;
                    }
                }
            }
        } catch (RestClientResponseException ex) {
            log.warn(
                    "mScanner /available-cities returned HTTP {} for '{}': {}",
                    ex.getStatusCode(),
                    requestedCity,
                    safeBody(ex)
            );
        } catch (RuntimeException ex) {
            log.warn(
                    "Nie udało się rozwiązać miasta '{}' przez mScanner: {}",
                    requestedCity,
                    ex.getMessage()
            );
        }

        CityRef fallback = new CityRef(
                slug(requestedCity),
                requestedCity
        );

        cityCache.put(
                normalizedCity,
                new CachedCity(fallback, now)
        );

        return fallback;
    }

    private BaseQuote fetchDistrict(
            String cityCode,
            String requestedDistrict,
            String level,
            RealEstateMarketSegment segment,
            LocalDate periodFrom,
            LocalDate periodTo
    ) {
        try {
            JsonNode root = client.get()
                    .uri(uri -> {
                        var builder = uri
                                .path("/property-prices/district-breakdown")
                                .queryParam("city", cityCode)
                                .queryParam("mode", "transactional")
                                .queryParam("propertyType", "apartment")
                                .queryParam("segment", segment.apiValue())
                                .queryParam("level", level);

                        if (periodFrom != null) {
                            builder.queryParam("periodFrom", periodFrom);
                        }
                        if (periodTo != null) {
                            builder.queryParam("periodTo", periodTo);
                        }

                        return builder.build();
                    })
                    .retrieve()
                    .body(JsonNode.class);

            if (root == null) {
                return null;
            }

            JsonNode match = findAreaNode(root, requestedDistrict);

            if (match == null) {
                log.debug(
                        "mScanner: area '{}' not found for city={} level={} segment={}",
                        requestedDistrict,
                        cityCode,
                        level,
                        segment
                );
                return null;
            }

            BigDecimal median = firstPositiveDecimal(
                    match,
                    "recentMedianPricePerSqm",
                    "medianPricePerSqm",
                    "median_price_per_sqm",
                    "medianPriceSqm",
                    "pricePerSqm",
                    "medianPsm",
                    "median",
                    "mediana_zl_m2"
            );

            if (median == null) {
                return null;
            }

            String resolved = text(
                    match,
                    "name",
                    "label",
                    "areaName",
                    "district",
                    "districtName",
                    "districtLabel",
                    "area",
                    "osiedle",
                    "dzielnica"
            );

            Integer count = firstInteger(
                    match,
                    "recentRecordCount",
                    "recordCount",
                    "transactionCount",
                    "transactionsCount",
                    "count",
                    "records",
                    "transactions",
                    "transakcji"
            );

            PeriodInfo period = resolvePeriod(match, root);

            /*
             * Przy zapytaniu historycznym API zna dokładne periodFrom/periodTo
             * z query, nawet jeśli nie powtórzy ich w payloadzie.
             */
            LocalDate effectiveFrom = period.from() != null ? period.from() : periodFrom;
            LocalDate effectiveTo = period.to() != null ? period.to() : periodTo;

            return new BaseQuote(
                    median,
                    resolved == null || resolved.isBlank()
                            ? requestedDistrict
                            : resolved,
                    level,
                    segment,
                    positiveOrNull(count),
                    effectiveFrom,
                    effectiveTo,
                    attribution(root),
                    Instant.now()
            );

        } catch (RestClientResponseException ex) {
            log.warn(
                    "mScanner district-breakdown failed: city={}, area='{}', level={}, segment={}, HTTP {}, body={}",
                    cityCode,
                    requestedDistrict,
                    level,
                    segment,
                    ex.getStatusCode(),
                    safeBody(ex)
            );
            return null;

        } catch (RuntimeException ex) {
            log.warn(
                    "mScanner district-breakdown failed: city={}, area='{}', level={}, segment={}, error={}",
                    cityCode,
                    requestedDistrict,
                    level,
                    segment,
                    ex.getMessage()
            );
            return null;
        }
    }

    private BaseQuote fetchCity(
            String cityCode,
            String cityLabel
    ) {
        try {
            JsonNode root = client.get()
                    .uri(uri -> uri
                            .path("/property-prices/city-trend")
                            .queryParam("city", cityCode)
                            .queryParam("mode", "transactional")
                            .queryParam("propertyType", "apartment")
                            .build())
                    .retrieve()
                    .body(JsonNode.class);

            if (root == null) {
                return null;
            }

            BigDecimal median = positiveDecimalDirectOrDeep(
                    root,
                    "recentMedianPricePerSqm"
            );

            if (median == null) {
                median = positiveDecimalDirectOrDeep(
                        root,
                        "medianPricePerSqm",
                        "median_price_per_sqm",
                        "mediana_zl_m2"
                );
            }

            if (median == null) {
                return null;
            }

            Integer count = integerDirectOrDeep(
                    root,
                    "recentRecordCount",
                    "recordCount",
                    "transactionCount",
                    "transactionsCount",
                    "count"
            );

            PeriodInfo period = resolvePeriod(root, null);

            return new BaseQuote(
                    median,
                    cityLabel,
                    "miasto",
                    RealEstateMarketSegment.ALL,
                    positiveOrNull(count),
                    period.from(),
                    period.to(),
                    attribution(root),
                    Instant.now()
            );

        } catch (RestClientResponseException ex) {
            log.warn(
                    "mScanner city-trend failed: city={}, HTTP {}, body={}",
                    cityCode,
                    ex.getStatusCode(),
                    safeBody(ex)
            );
            return null;

        } catch (RuntimeException ex) {
            log.warn(
                    "mScanner city-trend failed: city={}, error={}",
                    cityCode,
                    ex.getMessage()
            );
            return null;
        }
    }

    private BaseQuote fetchHistoricalCityPoint(
            String cityCode,
            String cityLabel,
            LocalDate purchaseDate
    ) {
        try {
            JsonNode root = client.get()
                    .uri(uri -> uri
                            .path("/property-prices/city-trend")
                            .queryParam("city", cityCode)
                            .queryParam("mode", "transactional")
                            .queryParam("propertyType", "apartment")
                            .build())
                    .retrieve()
                    .body(JsonNode.class);

            if (root == null) {
                return null;
            }

            HistoricalPoint point = nearestHistoricalPoint(root, purchaseDate);

            if (point == null || point.median() == null || point.median().signum() <= 0) {
                return null;
            }

            LocalDate from = point.date().withDayOfMonth(1);
            LocalDate to = YearMonth.from(point.date()).atEndOfMonth();

            return new BaseQuote(
                    point.median(),
                    cityLabel,
                    "miasto-history",
                    RealEstateMarketSegment.ALL,
                    positiveOrNull(point.count()),
                    from,
                    to,
                    attribution(root),
                    Instant.now()
            );

        } catch (RuntimeException ex) {
            log.warn(
                    "mScanner historical city point failed: city={}, date={}, error={}",
                    cityCode,
                    purchaseDate,
                    ex.getMessage()
            );
            return null;
        }
    }

    private HistoricalPoint nearestHistoricalPoint(
            JsonNode root,
            LocalDate target
    ) {
        HistoricalPointHolder holder = new HistoricalPointHolder();
        collectHistoricalPoints(root, target, holder);
        return holder.best;
    }

    private void collectHistoricalPoints(
            JsonNode node,
            LocalDate target,
            HistoricalPointHolder holder
    ) {
        if (node == null) {
            return;
        }

        if (node.isObject()) {
            LocalDate date = date(
                    node,
                    "month",
                    "date",
                    "period",
                    "periodFrom",
                    "from"
            );

            BigDecimal median = decimal(
                    node,
                    "medianPricePerSqm",
                    "recentMedianPricePerSqm",
                    "median_price_per_sqm",
                    "median"
            );

            if (date != null && median != null && median.signum() > 0) {
                Integer count = integer(
                        node,
                        "recordCount",
                        "count",
                        "transactions",
                        "transactionCount"
                );

                long distance = Math.abs(ChronoUnit.DAYS.between(date, target));

                /*
                 * Preferujemy punkt nie późniejszy niż zakup.
                 * Jeżeli takich nie ma, bierzemy najbliższy.
                 */
                boolean beforeOrEqual = !date.isAfter(target);

                if (holder.best == null
                        || (beforeOrEqual && !holder.bestBeforeOrEqual)
                        || (beforeOrEqual == holder.bestBeforeOrEqual
                            && distance < holder.bestDistance)) {
                    holder.best = new HistoricalPoint(date, median, count);
                    holder.bestDistance = distance;
                    holder.bestBeforeOrEqual = beforeOrEqual;
                }
            }

            Iterator<JsonNode> children = node.values().iterator();
            while (children.hasNext()) {
                collectHistoricalPoints(children.next(), target, holder);
            }

        } else if (node.isArray()) {
            for (JsonNode child : node) {
                collectHistoricalPoints(child, target, holder);
            }
        }
    }

    private JsonNode findCityNode(
            JsonNode node,
            String requestedCity
    ) {
        if (node == null) {
            return null;
        }

        if (node.isObject()) {
            String candidate = text(
                    node,
                    "label",
                    "name",
                    "cityName",
                    "municipalityName",
                    "displayName"
            );

            /*
             * Exact match po normalizacji. "Wrocław" nie może dopasować
             * "Kąty Wrocławskie".
             */
            if (candidate != null
                    && sameCity(candidate, requestedCity)) {
                return node;
            }

            Iterator<JsonNode> children = node.values().iterator();

            while (children.hasNext()) {
                JsonNode found = findCityNode(children.next(), requestedCity);

                if (found != null) {
                    return found;
                }
            }

        } else if (node.isArray()) {
            for (JsonNode child : node) {
                JsonNode found = findCityNode(child, requestedCity);

                if (found != null) {
                    return found;
                }
            }
        }

        return null;
    }

    private JsonNode findAreaNode(
            JsonNode node,
            String target
    ) {
        if (node == null) {
            return null;
        }

        if (node.isObject()) {
            String candidate = text(
                    node,
                    "name",
                    "label",
                    "areaName",
                    "district",
                    "districtName",
                    "districtLabel",
                    "area",
                    "osiedle",
                    "dzielnica"
            );

            if (candidate != null
                    && sameArea(candidate, target)
                    && firstPositiveDecimal(
                            node,
                            "recentMedianPricePerSqm",
                            "medianPricePerSqm",
                            "median_price_per_sqm",
                            "medianPriceSqm",
                            "pricePerSqm",
                            "medianPsm",
                            "median",
                            "mediana_zl_m2"
                    ) != null) {
                return node;
            }

            Iterator<JsonNode> children = node.values().iterator();

            while (children.hasNext()) {
                JsonNode found = findAreaNode(children.next(), target);

                if (found != null) {
                    return found;
                }
            }

        } else if (node.isArray()) {
            for (JsonNode child : node) {
                JsonNode found = findAreaNode(child, target);

                if (found != null) {
                    return found;
                }
            }
        }

        return null;
    }

    private PeriodInfo resolvePeriod(
            JsonNode primary,
            JsonNode fallback
    ) {
        LocalDate from = firstDate(
                primary,
                "recentPeriodFrom",
                "periodFrom",
                "dateFrom",
                "from",
                "od"
        );

        LocalDate to = firstDate(
                primary,
                "recentPeriodTo",
                "periodTo",
                "dateTo",
                "to",
                "do"
        );

        if (fallback != null) {
            if (from == null) {
                from = firstDate(
                        fallback,
                        "recentPeriodFrom",
                        "periodFrom",
                        "dateFrom",
                        "from",
                        "od"
                );
            }

            if (to == null) {
                to = firstDate(
                        fallback,
                        "recentPeriodTo",
                        "periodTo",
                        "dateTo",
                        "to",
                        "do"
                );
            }
        }

        Integer windowMonths = firstInteger(
                primary,
                "recentWindowMonths",
                "windowMonths",
                "periodMonths",
                "months"
        );

        if (windowMonths == null && fallback != null) {
            windowMonths = firstInteger(
                    fallback,
                    "recentWindowMonths",
                    "windowMonths",
                    "periodMonths",
                    "months"
            );
        }

        if (windowMonths != null && windowMonths > 0) {
            LocalDate today = LocalDate.now();

            if (to == null) {
                to = today;
            }

            if (from == null) {
                from = to.minusMonths(windowMonths);
            }
        }

        return new PeriodInfo(from, to);
    }

    private BigDecimal positiveDecimalDirectOrDeep(
            JsonNode node,
            String... names
    ) {
        BigDecimal direct = decimal(node, names);

        if (direct != null && direct.signum() > 0) {
            return direct;
        }

        BigDecimal deep = decimalDeep(node, names);

        return deep != null && deep.signum() > 0
                ? deep
                : null;
    }

    private BigDecimal firstPositiveDecimal(
            JsonNode node,
            String... names
    ) {
        return positiveDecimalDirectOrDeep(node, names);
    }

    private Integer integerDirectOrDeep(
            JsonNode node,
            String... names
    ) {
        Integer direct = integer(node, names);

        if (direct != null) {
            return direct;
        }

        return integerDeep(node, names);
    }

    private Integer firstInteger(
            JsonNode node,
            String... names
    ) {
        return integerDirectOrDeep(node, names);
    }

    private LocalDate firstDate(
            JsonNode node,
            String... names
    ) {
        LocalDate direct = date(node, names);

        if (direct != null) {
            return direct;
        }

        return dateDeep(node, names);
    }

    private Integer positiveOrNull(Integer value) {
        return value != null && value > 0
                ? value
                : null;
    }

    private boolean sameCity(
            String left,
            String right
    ) {
        return normalize(left).equals(normalize(right));
    }

    private boolean sameArea(
            String left,
            String right
    ) {
        /*
         * Tak samo jak przy mieście nie używamy contains().
         * Przy cenach lepiej zwrócić "brak dokładnego obszaru" i spaść
         * do szerszego agregatu niż przypadkiem wycenić inne osiedle.
         */
        return normalize(left).equals(normalize(right));
    }

    private String attribution(JsonNode root) {
        if (root == null) {
            return DEFAULT_CITATION;
        }

        JsonNode attribution = root.path("attribution");

        if (attribution.isObject()) {
            String cite = text(
                    attribution,
                    "citeAs",
                    "citation",
                    "source"
            );

            if (cite != null && !cite.isBlank()) {
                return cite;
            }
        }

        return DEFAULT_CITATION;
    }

    private BigDecimal decimalDeep(
            JsonNode node,
            String... names
    ) {
        JsonNode value = firstDeep(node, names);
        return decimalValue(value);
    }

    private Integer integerDeep(
            JsonNode node,
            String... names
    ) {
        JsonNode value = firstDeep(node, names);
        return integerValue(value);
    }

    private LocalDate dateDeep(
            JsonNode node,
            String... names
    ) {
        JsonNode value = firstDeep(node, names);
        return dateValue(value);
    }

    private JsonNode firstDeep(
            JsonNode node,
            String... names
    ) {
        if (node == null) {
            return null;
        }

        if (node.isObject()) {
            JsonNode direct = first(node, names);

            if (direct != null) {
                return direct;
            }

            Iterator<JsonNode> children = node.values().iterator();

            while (children.hasNext()) {
                JsonNode found = firstDeep(children.next(), names);

                if (found != null) {
                    return found;
                }
            }

        } else if (node.isArray()) {
            for (JsonNode child : node) {
                JsonNode found = firstDeep(child, names);

                if (found != null) {
                    return found;
                }
            }
        }

        return null;
    }

    private BigDecimal decimalValue(JsonNode value) {
        if (value == null || value.isNull()) {
            return null;
        }

        if (value.isNumber()) {
            return value.decimalValue();
        }

        if (value.isString()) {
            try {
                String clean = value.asString()
                        .replace("\u00A0", "")
                        .replace(" ", "")
                        .replace("zł", "")
                        .replace("PLN", "")
                        .replace(',', '.')
                        .trim();

                return new BigDecimal(clean);

            } catch (RuntimeException ignored) {
                return null;
            }
        }

        return null;
    }

    private Integer integerValue(JsonNode value) {
        if (value == null || value.isNull()) {
            return null;
        }

        if (value.canConvertToInt()) {
            return value.asInt();
        }

        if (value.isString()) {
            try {
                String digits = value.asString()
                        .replaceAll("\\D", "");

                if (digits.isBlank()) {
                    return null;
                }

                return Integer.parseInt(digits);

            } catch (RuntimeException ignored) {
                return null;
            }
        }

        return null;
    }

    private LocalDate dateValue(JsonNode value) {
        if (value == null || !value.isString()) {
            return null;
        }

        try {
            String raw = value.asString();

            if (raw == null || raw.isBlank()) {
                return null;
            }

            if (raw.length() >= 10) {
                return LocalDate.parse(raw.substring(0, 10));
            }

            if (raw.matches("\\d{4}-\\d{2}")) {
                return YearMonth.parse(raw).atDay(1);
            }

            return null;

        } catch (RuntimeException ignored) {
            return null;
        }
    }

    private BigDecimal decimal(
            JsonNode node,
            String... names
    ) {
        return decimalValue(first(node, names));
    }

    private Integer integer(
            JsonNode node,
            String... names
    ) {
        return integerValue(first(node, names));
    }

    private LocalDate date(
            JsonNode node,
            String... names
    ) {
        return dateValue(first(node, names));
    }

    private String text(
            JsonNode node,
            String... names
    ) {
        JsonNode value = first(node, names);

        if (value == null || value.isNull()) {
            return null;
        }

        if (value.isObject() || value.isArray()) {
            return null;
        }

        try {
            return value.asString(null);
        } catch (RuntimeException ignored) {
            return null;
        }
    }

    private JsonNode first(
            JsonNode node,
            String... names
    ) {
        if (node == null || !node.isObject()) {
            return null;
        }

        for (String name : names) {
            JsonNode value = node.get(name);

            if (value != null && !value.isNull()) {
                return value;
            }
        }

        return null;
    }

    private String requireText(
            String value,
            String message
    ) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException(message);
        }

        return value.trim();
    }

    private String slug(String text) {
        return normalize(text)
                .replace(' ', '-');
    }

    private String normalize(String text) {
        if (text == null) {
            return "";
        }

        return Normalizer.normalize(text, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replace('ł', 'l')
                .replaceAll("[^a-z0-9]+", " ")
                .trim()
                .replaceAll("\\s+", " ");
    }

    private String safeBody(RestClientResponseException ex) {
        try {
            String body = ex.getResponseBodyAsString();

            if (body == null) {
                return "";
            }

            return body.length() <= 500
                    ? body
                    : body.substring(0, 500) + "...";

        } catch (RuntimeException ignored) {
            return "";
        }
    }

    @FunctionalInterface
    private interface QuoteSupplier {
        BaseQuote get();
    }

    private record BaseQuote(
            BigDecimal medianPricePerSqm,
            String resolvedArea,
            String scope,
            RealEstateMarketSegment marketSegment,
            Integer recordCount,
            LocalDate periodFrom,
            LocalDate periodTo,
            String citation,
            Instant fetchedAt
    ) {}

    private record CachedQuote(
            BaseQuote quote,
            Instant cachedAt
    ) {}

    private record CityRef(
            String code,
            String label
    ) {}

    private record CachedCity(
            CityRef city,
            Instant cachedAt
    ) {}

    private record PeriodInfo(
            LocalDate from,
            LocalDate to
    ) {}

    private record HistoricalPoint(
            LocalDate date,
            BigDecimal median,
            Integer count
    ) {}

    private static final class HistoricalPointHolder {
        private HistoricalPoint best;
        private long bestDistance = Long.MAX_VALUE;
        private boolean bestBeforeOrEqual = false;
    }
}
