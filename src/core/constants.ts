export const defaultLocale = "es";

export const paginationSizes = {
    RANKING: 12,
};

export const rankingModeCodes = {
    ALWAYS: "always",
    DAILY: "daily",
    MONTHLY: "monthly",
    WEEKLY: "weekly",
};

export const winnerCredits = {
    ALWAYS: 0,
    DAILY: 1,
    MONTHLY: 30,
    WEEKLY: 7,
};

export const currencyTypes = {
    DROP: "drop",
    SEED: "seed",
};

export const currencyEndpoints = {
    DROP: "drops",
    SEED: "seeds",
};

export const currencyExchangeRates = {
    DROP: 1,
    SEED: 5,
};

export const exchangeUrl = process.env.exchange_url;

export const exchangeToken = process.env.exchange_token;
