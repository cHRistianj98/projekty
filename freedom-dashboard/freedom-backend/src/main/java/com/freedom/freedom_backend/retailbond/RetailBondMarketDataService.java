package com.freedom.freedom_backend.retailbond;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class RetailBondMarketDataService {
    private static final String BASE = "https://www.obligacjeskarbowe.pl";
    private static final Duration CACHE_TTL = Duration.ofHours(12);
    private static final Pattern TABLE_LINK = Pattern.compile("href=\\\"([^\\\"]*tabela-odsetkowa/\\?table_id=\\d+[^\\\"]*)\\\"", Pattern.CASE_INSENSITIVE);
    private static final Pattern PDF_LINK = Pattern.compile("href=\\\"([^\\\"]*media_files/[^\\\"]+\\.pdf)\\\"", Pattern.CASE_INSENSITIVE);
    private static final Pattern RATE = Pattern.compile("Oprocentowanie\\s+w\\s+bieżącym\\s+okresie\\s*:\\s*([0-9]+(?:[,.][0-9]+)?)\\s*%", Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);
    private static final Pattern PERIOD = Pattern.compile("Okres\\s+odsetkowy\\s*:\\s*(\\d+)", Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);
    private static final Pattern FALLBACK_RATE = Pattern.compile("Oprocentowanie\\s*:\\s*([0-9]+(?:[,.][0-9]+)?)\\s*%", Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();
    private final ConcurrentHashMap<String, CacheEntry> cache = new ConcurrentHashMap<>();

    public CurrentTerms currentTerms(String emissionCode) {
        String code = emissionCode.trim().toUpperCase(Locale.ROOT);
        Instant now = Instant.now();
        CacheEntry cached = cache.get(code);
        if (cached != null && cached.validAt(now)) return cached.terms();

        // compute() serializuje wyłącznie odświeżenie tej samej emisji. Różne emisje
        // nadal mogą być pobierane równolegle przez virtual threads w RetailBondService.
        return cache.compute(code, (key, current) -> {
            Instant checkTime = Instant.now();
            if (current != null && current.validAt(checkTime)) return current;
            CurrentTerms terms = fetchCurrentTerms(key);
            return new CacheEntry(terms, checkTime.plus(CACHE_TTL));
        }).terms();
    }

    private CurrentTerms fetchCurrentTerms(String code) {
        RetailBondProduct product = RetailBondProduct.fromEmission(code);
        String emissionUrl = BASE + "/oferta-obligacji/" + product.slug() + "/" + code.toLowerCase(Locale.ROOT) + "/";

        try {
            String emissionHtml = getText(emissionUrl);
            Matcher tableMatcher = TABLE_LINK.matcher(emissionHtml);
            if (!tableMatcher.find()) {
                Matcher fallback = FALLBACK_RATE.matcher(stripTags(emissionHtml));
                if (fallback.find()) {
                    return new CurrentTerms(decimal(fallback.group(1)), 1);
                }
                throw new IllegalStateException("Brak tabeli odsetkowej dla emisji " + code + ".");
            }

            String tableUrl = resolve(tableMatcher.group(1));
            String tableHtml = getText(tableUrl);
            Matcher pdfMatcher = PDF_LINK.matcher(tableHtml);
            if (!pdfMatcher.find()) {
                throw new IllegalStateException("Nie znaleziono PDF tabeli odsetkowej dla " + code + ".");
            }

            byte[] pdf = getBytes(resolve(pdfMatcher.group(1)));
            String text;
            try (PDDocument document = Loader.loadPDF(pdf)) {
                PDFTextStripper stripper = new PDFTextStripper();
                stripper.setSortByPosition(true);
                text = stripper.getText(document);
            }

            Matcher rate = RATE.matcher(text);
            Matcher period = PERIOD.matcher(text);
            if (!rate.find() || !period.find()) {
                throw new IllegalStateException("Nie udało się odczytać oprocentowania emisji " + code + ".");
            }
            return new CurrentTerms(decimal(rate.group(1)), Integer.parseInt(period.group(1)));
        } catch (IOException | InterruptedException ex) {
            if (ex instanceof InterruptedException) Thread.currentThread().interrupt();
            throw new IllegalStateException("Nie udało się pobrać tabeli odsetkowej dla " + code + ".", ex);
        }
    }

    private String getText(String url) throws IOException, InterruptedException {
        HttpResponse<String> response = http.send(request(url), HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IOException("HTTP " + response.statusCode() + " dla " + url);
        }
        return response.body();
    }

    private byte[] getBytes(String url) throws IOException, InterruptedException {
        HttpResponse<byte[]> response = http.send(request(url), HttpResponse.BodyHandlers.ofByteArray());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IOException("HTTP " + response.statusCode() + " dla " + url);
        }
        return response.body();
    }

    private HttpRequest request(String url) {
        return HttpRequest.newBuilder(URI.create(url))
                .timeout(Duration.ofSeconds(12))
                .header("User-Agent", "FreedomEngine/1.0 (+local personal finance app)")
                .GET()
                .build();
    }

    private static String resolve(String href) {
        if (href.startsWith("http://") || href.startsWith("https://")) return href;
        if (!href.startsWith("/")) href = "/" + href;
        return BASE + href.replace("&amp;", "&");
    }

    private static BigDecimal decimal(String value) {
        return new BigDecimal(value.replace(',', '.'));
    }

    private static String stripTags(String html) {
        return html.replaceAll("<[^>]+>", " ").replace("&nbsp;", " ");
    }

    private record CacheEntry(CurrentTerms terms, Instant expiresAt) {
        boolean validAt(Instant now) {
            return now.isBefore(expiresAt);
        }
    }

    public record CurrentTerms(BigDecimal annualRatePercent, int periodNumber) {}
}
