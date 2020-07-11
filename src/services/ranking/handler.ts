import validator from "validator";
import app from "../../core/app";
import md5 from 'md5';
import {
    currencyExchangeRates,
    currencyTypes,
    paginationSizes,
    rankingModeCodes,
    winnerCredits,
} from "../../core/constants";
import ResponseBuilder from "../../core/ResponseBuilder";
import User from "../../models/User";

function validateRankingMode(
    __: (text: string, ...params: string[]) => string,
    response: ResponseBuilder,
    mode: string,
) {
    if (!Object.values(rankingModeCodes).includes(mode)) {
        if (response) {
            response.error(
                "ranking",
                __(
                    "% must be within: %.",
                    __("Ranking mode"),
                    Object.values(rankingModeCodes).join(", "),
                ),
            );
        }
        return false;
    }
    return true;
}

export const indexRanking = app(async ({ __, response, queryParameters }) => {
    const { page = 0, page_size: pageSize = paginationSizes.RANKING, mode } = queryParameters;

    if (page !== undefined && !validator.isInt(page.toString())) {
        response.error("page", __("% must be an integer.", __("Page")));
    }
    if (pageSize !== undefined && !validator.isInt(pageSize.toString())) {
        response.error("page_size", __("% must be an integer.", __("Page size")));
    }
    validateRankingMode(__, response, mode);
    if (response.hasError()) {
        return response.statusCode(422);
    }

    const pageFixed = !page || page < 1 ? 1 : Number.parseInt(page, 10);
    const pageSizeFixed = pageSize < 1 ? paginationSizes.RANKING : parseInt(pageSize, 10);
    const sort = {};
    sort[`scores.${mode}.score`] = -1;
    sort[`scores.${mode}.updated_at`] = 1;
    const query: any = [
        {
            $sort: sort,
        },
        { $skip: pageSizeFixed * (pageFixed - 1) },
        { $limit: pageSizeFixed + 1 }, // + 1 to check if there are more results ;)
        {
            $project: {
                _id: 0,
                score: `$scores.${mode}.score`,
                score_updated_at: `$scores.${mode}.updated_at`,
                username: "$provider_user_id",
            },
        },
    ] as any;

    const results = await User.aggregate(query);
    const hasMore = results.length > pageSizeFixed;
    if (hasMore) {
        results.splice(-1); // remove resource used to check more results ;)
    }
    const pagination = {
        has_more: hasMore,
        page: pageFixed,
        page_size: results.length,
    };

    const data = results;
    const meta = pagination;

    return response
        .data(data)
        .meta(meta)
        .statusCode(200);
});

export const showUserScore = app(async ({ __, response, queryParameters, pathParameters }) => {
    const { mode = rankingModeCodes.ALWAYS } = queryParameters;
    const { username: providerUserId } = pathParameters;

    validateRankingMode(__, response, mode);
    if (response.hasError()) {
        return response.statusCode(422);
    }

    const user = await User.findOne({
        provider_user_id: providerUserId,
    }).lean();
    const score = user ? user.scores[mode].score : 0;

    return response.data(score).statusCode(200);
});

export const updateUserScore = app(async ({ __, response, queryParameters, pathParameters }) => {
    const { mode = rankingModeCodes.ALWAYS } = queryParameters;
    const { username: providerUserId, score = 0 } = pathParameters;

    if (!validator.isInt(score.toString())) {
        response.error("score", __("% must be an integer.", __("Score")));
    } else if (score < 0) {
        response.error("score", __("% must be greater than %.", __("Score"), "0"));
    }
    if (mode !== undefined && !Object.values(rankingModeCodes).includes(mode)) {
        response.error(
            "ranking",
            __(
                "% must be within: %.",
                __("Ranking mode"),
                Object.values(rankingModeCodes).join(", "),
            ),
        );
    }
    if (response.hasError()) {
        return response.statusCode(422);
    }
    let user = await User.findOne({ provider_user_id: providerUserId });
    if (!user) {
        user = await User.create({ provider_user_id: providerUserId });
    }
    Object.keys((user as any).scores).forEach((scoreName: any) => {
        const scoreDoc = (user as any).scores[scoreName];
        if (score > scoreDoc.score) {
            scoreDoc.score = score;
            scoreDoc.score_updated_at = new Date();
        }
    });
    await user.save();

    return response.data(__("Operation successfully completed.")).statusCode(200);
});

export const showUserCredits = app(async ({ __, response, queryParameters, pathParameters }) => {
    const { mode = rankingModeCodes.ALWAYS } = queryParameters;
    const { username: providerUserId } = pathParameters;

    if (mode !== undefined && !Object.values(rankingModeCodes).includes(mode)) {
        response.error(
            "ranking",
            __(
                "% must be within: %.",
                __("Ranking mode"),
                Object.values(rankingModeCodes).join(", "),
            ),
        );
    }
    if (response.hasError()) {
        return response.statusCode(422);
    }
    const user: any = await User.findOne({
        provider_user_id: providerUserId,
    });
    const credits = user ? user.credits : 0;

    return response.data(credits).statusCode(200);
});

export const assignRankingWinner = app(async ({ __, response, queryParameters, event }) => {
    const { mode = event.mode } = queryParameters;
    validateRankingMode(__, response, mode);
    if (response.hasError()) {
        return response.statusCode(422);
    }
    const sort = {};
    sort[`scores.${mode}.score`] = -1;
    sort[`scores.${mode}.updated_at`] = 1;
    const q = {};
    q[`scores.${mode}.score`] = { $gt: 0 };
    const firstWinner: any = await User.findOne(q).sort(sort);
    if (firstWinner) {
        const maxScore = firstWinner.scores[mode].score;
        q[`scores.${mode}.score`] = maxScore;
        const modeCodeKey = Object.keys(rankingModeCodes).find(c => rankingModeCodes[c] === mode);
        await User.update(q, {
            $inc: {
                credits: winnerCredits[modeCodeKey],
            },
        }).exec();
    }
    const v = {};
    v[`scores.${mode}.score`] = 0;
    await User.updateMany({}, v).exec();
    return response.data(__("Operation successfully completed.")).statusCode(200);
});

export const exchange = app(async ({ __, response, fields, pathParameters }) => {
    const { username: providerUserId } = pathParameters;
    const { uid, currency, amount } = fields;

    if (!uid) {
        response.error("uid", __("% is required.", __("uid")));
    }
    if (!currency) {
        response.error("currency", __("% is required.", __("Currency type")));
    }
    if (currency && !Object.values(currencyTypes).includes(currency)) {
        response.error(
            "currency",
            __(
                "% must be within: %.",
                __("Currency type"),
                Object.values(currencyTypes).join(", "),
            ),
        );
    }
    if (!amount || amount < 0 || isNaN(amount)) {
        response.error("amount", __("% is required.", __("Exchange amount")));
    }
    if (isNaN(amount)) {
        response.error("amount", __("% must be numeric.", __("Exchange amount")));
    }
    if (response.hasError()) {
        return response.statusCode(422);
    }
    let currencyKey = null;
    for (const key in currencyTypes) {
        if (currencyTypes[key] === currency) {
            currencyKey = key;
            break;
        }
    }
    const exchangeRate = currencyExchangeRates[currencyKey];
    const exchangeAmount = amount * exchangeRate;
    const user: any = await User.findOne({
        provider_user_id: providerUserId,
    });
    const credits = user ? user.credits : 0;
    if (exchangeAmount > credits) {
        return response.error("amount", __("User hasn't enought credits to exchange."));
    }
    const token = "XsTbmBfKmC576ILgskD5srU8q3bgUsU";
    const signature = md5(`${uid}:${amount}:${token}`);
    const url = `https://services.socialpod.app/api/v3/rewards/game/drops?uid=${uid}&signature=${signature}&quantity=${exchangeAmount}`;
    try {
        const res = await fetch(url);
        if (res.status !== 200) {
            throw res;
        }
        user.credits -= exchangeAmount;
        user.save();
        return response.data(exchangeAmount).statusCode(200);
    } catch (err) {
        console.log(err);
        return response.error("error", __("There was an unexpected response from proxy."));
    }
});
