package com.freedom.freedom_backend.asset;

public enum RealEstateMarketSegment {
    ALL("all"),
    PRIMARY("primary"),
    SECONDARY("secondary");

    private final String apiValue;

    RealEstateMarketSegment(String apiValue) {
        this.apiValue = apiValue;
    }

    public String apiValue() {
        return apiValue;
    }
}
