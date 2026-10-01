package com.freedom.freedom_backend.asset;

import com.freedom.freedom_backend.market.StockQuoteResponse;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class StockTaxValuationService {
    public static final BigDecimal TAX_RATE = new BigDecimal("0.19");

    public StockValuation calculate(
            StockQuoteResponse quote,
            BigDecimal quantity,
            BigDecimal averageBuyPrice,
            BigDecimal buyFxRatePln
    ) {
        if (quote == null || quote.price() == null || quote.price().signum() <= 0) {
            throw new IllegalArgumentException("Brak prawidłowego notowania instrumentu.");
        }
        if (quantity == null || quantity.signum() <= 0) {
            throw new IllegalArgumentException("Ilość jednostek musi być większa od zera.");
        }
        if (averageBuyPrice == null || averageBuyPrice.signum() <= 0) {
            throw new IllegalArgumentException("Średnia cena zakupu musi być większa od zera.");
        }

        BigDecimal currentFx = quote.fxRatePln() == null ? BigDecimal.ONE : quote.fxRatePln();
        BigDecimal purchaseFx = quote.currency() == CashCurrency.PLN
                ? BigDecimal.ONE
                : (buyFxRatePln != null && buyFxRatePln.signum() > 0 ? buyFxRatePln : currentFx);

        BigDecimal grossValue = quote.price().multiply(quantity).multiply(currentFx).setScale(2, RoundingMode.HALF_UP);
        BigDecimal costBasis = averageBuyPrice.multiply(quantity).multiply(purchaseFx).setScale(2, RoundingMode.HALF_UP);
        BigDecimal pnl = grossValue.subtract(costBasis).setScale(2, RoundingMode.HALF_UP);
        BigDecimal taxableGain = pnl.max(BigDecimal.ZERO);
        BigDecimal tax = taxableGain.multiply(TAX_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal netValue = grossValue.subtract(tax).setScale(2, RoundingMode.HALF_UP);

        return new StockValuation(grossValue, costBasis, pnl, TAX_RATE, tax, netValue, purchaseFx);
    }

    public record StockValuation(
            BigDecimal grossValuePln,
            BigDecimal costBasisPln,
            BigDecimal unrealizedGainPln,
            BigDecimal taxRate,
            BigDecimal estimatedTaxPln,
            BigDecimal netValuePln,
            BigDecimal buyFxRatePln
    ) {}
}
