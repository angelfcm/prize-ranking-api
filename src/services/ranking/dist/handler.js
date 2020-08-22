"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.exchange = exports.assignRankingWinner = exports.showUserCredits = exports.updateUserScore = exports.showUserScore = exports.indexRanking = void 0;
var md5_1 = require("md5");
var validator_1 = require("validator");
var app_1 = require("../../core/app");
var constants_1 = require("../../core/constants");
var User_1 = require("../../models/User");
function validateRankingMode(__, response, mode) {
    if (!Object.values(constants_1.rankingModeCodes).includes(mode)) {
        if (response) {
            response.error("ranking", __("% must be within: %.", __("Ranking mode"), Object.values(constants_1.rankingModeCodes).join(", ")));
        }
        return false;
    }
    return true;
}
exports.indexRanking = app_1["default"](function (_a) {
    var __ = _a.__, response = _a.response, queryParameters = _a.queryParameters;
    return __awaiter(void 0, void 0, void 0, function () {
        var _b, page, _c, pageSize, mode, pageFixed, pageSizeFixed, sort, query, results, hasMore, pagination, data, meta;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _b = queryParameters.page, page = _b === void 0 ? 0 : _b, _c = queryParameters.page_size, pageSize = _c === void 0 ? constants_1.paginationSizes.RANKING : _c, mode = queryParameters.mode;
                    if (page !== undefined && !validator_1["default"].isInt(page.toString())) {
                        response.error("page", __("% must be an integer.", __("Page")));
                    }
                    if (pageSize !== undefined && !validator_1["default"].isInt(pageSize.toString())) {
                        response.error("page_size", __("% must be an integer.", __("Page size")));
                    }
                    validateRankingMode(__, response, mode);
                    if (response.hasError()) {
                        return [2 /*return*/, response.statusCode(422)];
                    }
                    pageFixed = !page || page < 1 ? 1 : Number.parseInt(page, 10);
                    pageSizeFixed = pageSize < 1 ? constants_1.paginationSizes.RANKING : parseInt(pageSize, 10);
                    sort = {};
                    sort["scores." + mode + ".score"] = -1;
                    sort["scores." + mode + ".updated_at"] = 1;
                    query = [
                        {
                            $sort: sort
                        },
                        { $skip: pageSizeFixed * (pageFixed - 1) },
                        { $limit: pageSizeFixed + 1 },
                        {
                            $project: {
                                _id: 0,
                                score: "$scores." + mode + ".score",
                                score_updated_at: "$scores." + mode + ".updated_at",
                                username: "$provider_user_id"
                            }
                        },
                    ];
                    return [4 /*yield*/, User_1["default"].aggregate(query)];
                case 1:
                    results = _d.sent();
                    hasMore = results.length > pageSizeFixed;
                    if (hasMore) {
                        results.splice(-1); // remove resource used to check more results ;)
                    }
                    pagination = {
                        has_more: hasMore,
                        page: pageFixed,
                        page_size: results.length
                    };
                    data = results;
                    meta = pagination;
                    return [2 /*return*/, response
                            .data(data)
                            .meta(meta)
                            .statusCode(200)];
            }
        });
    });
});
exports.showUserScore = app_1["default"](function (_a) {
    var __ = _a.__, response = _a.response, queryParameters = _a.queryParameters, pathParameters = _a.pathParameters;
    return __awaiter(void 0, void 0, void 0, function () {
        var _b, mode, providerUserId, user, score;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _b = queryParameters.mode, mode = _b === void 0 ? constants_1.rankingModeCodes.ALWAYS : _b;
                    providerUserId = pathParameters.username;
                    validateRankingMode(__, response, mode);
                    if (response.hasError()) {
                        return [2 /*return*/, response.statusCode(422)];
                    }
                    return [4 /*yield*/, User_1["default"].findOne({
                            provider_user_id: providerUserId
                        }).lean()];
                case 1:
                    user = _c.sent();
                    score = user ? user.scores[mode].score : 0;
                    return [2 /*return*/, response.data(score).statusCode(200)];
            }
        });
    });
});
exports.updateUserScore = app_1["default"](function (_a) {
    var __ = _a.__, response = _a.response, queryParameters = _a.queryParameters, pathParameters = _a.pathParameters;
    return __awaiter(void 0, void 0, void 0, function () {
        var _b, mode, providerUserId, _c, score, user;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _b = queryParameters.mode, mode = _b === void 0 ? constants_1.rankingModeCodes.ALWAYS : _b;
                    providerUserId = pathParameters.username, _c = pathParameters.score, score = _c === void 0 ? 0 : _c;
                    if (!validator_1["default"].isInt(score.toString())) {
                        response.error("score", __("% must be an integer.", __("Score")));
                    }
                    else if (score < 0) {
                        response.error("score", __("% must be greater than %.", __("Score"), "0"));
                    }
                    if (mode !== undefined && !Object.values(constants_1.rankingModeCodes).includes(mode)) {
                        response.error("ranking", __("% must be within: %.", __("Ranking mode"), Object.values(constants_1.rankingModeCodes).join(", ")));
                    }
                    if (response.hasError()) {
                        return [2 /*return*/, response.statusCode(422)];
                    }
                    return [4 /*yield*/, User_1["default"].findOne({ provider_user_id: providerUserId })];
                case 1:
                    user = _d.sent();
                    if (!!user) return [3 /*break*/, 3];
                    return [4 /*yield*/, User_1["default"].create({ provider_user_id: providerUserId })];
                case 2:
                    user = _d.sent();
                    _d.label = 3;
                case 3:
                    Object.values(constants_1.rankingModeCodes).forEach(function (scoreName) {
                        var scoreDoc = user.scores[scoreName];
                        if (score > scoreDoc.score) {
                            scoreDoc.score = score;
                            scoreDoc.score_updated_at = new Date();
                        }
                    });
                    return [4 /*yield*/, user.save()];
                case 4:
                    _d.sent();
                    return [2 /*return*/, response.data(__("Operation successfully completed.")).statusCode(200)];
            }
        });
    });
});
exports.showUserCredits = app_1["default"](function (_a) {
    var __ = _a.__, response = _a.response, queryParameters = _a.queryParameters, pathParameters = _a.pathParameters;
    return __awaiter(void 0, void 0, void 0, function () {
        var _b, mode, providerUserId, user, credits;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _b = queryParameters.mode, mode = _b === void 0 ? constants_1.rankingModeCodes.ALWAYS : _b;
                    providerUserId = pathParameters.username;
                    if (mode !== undefined && !Object.values(constants_1.rankingModeCodes).includes(mode)) {
                        response.error("ranking", __("% must be within: %.", __("Ranking mode"), Object.values(constants_1.rankingModeCodes).join(", ")));
                    }
                    if (response.hasError()) {
                        return [2 /*return*/, response.statusCode(422)];
                    }
                    return [4 /*yield*/, User_1["default"].findOne({
                            provider_user_id: providerUserId
                        })];
                case 1:
                    user = _c.sent();
                    credits = user ? user.credits : 0;
                    return [2 /*return*/, response.data(credits).statusCode(200)];
            }
        });
    });
});
exports.assignRankingWinner = app_1["default"](function (_a) {
    var __ = _a.__, response = _a.response, queryParameters = _a.queryParameters, event = _a.event;
    return __awaiter(void 0, void 0, void 0, function () {
        var _b, mode, sort, q, firstWinner, maxScore, modeCodeKey, v;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _b = queryParameters.mode, mode = _b === void 0 ? event.mode : _b;
                    validateRankingMode(__, response, mode);
                    if (response.hasError()) {
                        return [2 /*return*/, response.statusCode(422)];
                    }
                    sort = {};
                    sort["scores." + mode + ".score"] = -1;
                    sort["scores." + mode + ".updated_at"] = 1;
                    q = {};
                    q["scores." + mode + ".score"] = { $gt: 0 };
                    return [4 /*yield*/, User_1["default"].findOne(q).sort(sort)];
                case 1:
                    firstWinner = _c.sent();
                    if (!firstWinner) return [3 /*break*/, 3];
                    maxScore = firstWinner.scores[mode].score;
                    q["scores." + mode + ".score"] = maxScore;
                    modeCodeKey = Object.keys(constants_1.rankingModeCodes).find(function (c) { return constants_1.rankingModeCodes[c] === mode; });
                    return [4 /*yield*/, User_1["default"].update(q, {
                            $inc: {
                                credits: constants_1.winnerCredits[modeCodeKey]
                            }
                        }).exec()];
                case 2:
                    _c.sent();
                    _c.label = 3;
                case 3:
                    v = {};
                    v["scores." + mode + ".score"] = 0;
                    return [4 /*yield*/, User_1["default"].updateMany({}, v).exec()];
                case 4:
                    _c.sent();
                    return [2 /*return*/, response.data(__("Operation successfully completed.")).statusCode(200)];
            }
        });
    });
});
exports.exchange = app_1["default"](function (_a) {
    var __ = _a.__, response = _a.response, fields = _a.fields, pathParameters = _a.pathParameters;
    return __awaiter(void 0, void 0, void 0, function () {
        var providerUserId, uid, currency, amount, currencyKey, key, exchangeRate, currencyEndpoint, exchangeAmount, user, credits, signature, url, res, err_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    providerUserId = pathParameters.username;
                    uid = fields.uid, currency = fields.currency, amount = fields.amount;
                    if (!uid) {
                        response.error("uid", __("% is required.", __("uid")));
                    }
                    if (!currency) {
                        response.error("currency", __("% is required.", __("Currency type")));
                    }
                    if (currency && !Object.values(constants_1.currencyTypes).includes(currency)) {
                        response.error("currency", __("% must be within: %.", __("Currency type"), Object.values(constants_1.currencyTypes).join(", ")));
                    }
                    if (!amount || amount < 0 || isNaN(amount)) {
                        response.error("amount", __("% is required.", __("Exchange amount")));
                    }
                    if (isNaN(amount)) {
                        response.error("amount", __("% must be numeric.", __("Exchange amount")));
                    }
                    if (Math.ceil(amount) !== parseFloat(amount)) {
                        response.error("amount", __("% must be an integer.", __("Exchange amount")));
                    }
                    if (response.hasError()) {
                        return [2 /*return*/, response.statusCode(422)];
                    }
                    currencyKey = null;
                    for (key in constants_1.currencyTypes) {
                        if (constants_1.currencyTypes[key] === currency) {
                            currencyKey = key;
                            break;
                        }
                    }
                    exchangeRate = constants_1.currencyExchangeRates[currencyKey];
                    currencyEndpoint = constants_1.currencyEndpoints[currencyKey];
                    exchangeAmount = amount * exchangeRate;
                    return [4 /*yield*/, User_1["default"].findOne({
                            provider_user_id: providerUserId
                        })];
                case 1:
                    user = _b.sent();
                    credits = user ? user.credits : 0;
                    if (exchangeAmount > credits) {
                        return [2 /*return*/, response
                                .error("amount", __("User hasn't enought credits to exchange."))
                                .statusCode(422)];
                    }
                    signature = md5_1["default"](uid + ":" + amount + ":" + constants_1.exchangeToken);
                    url = constants_1.exchangeUrl + "/" + currencyEndpoint + "?uid=" + uid + "&signature=" + signature + "&quantity=" + amount;
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, fetch(url)];
                case 3:
                    res = _b.sent();
                    if (res.status !== 200) {
                        throw res;
                    }
                    user.credits -= exchangeAmount;
                    user.save();
                    return [2 /*return*/, response.data(exchangeAmount).statusCode(200)];
                case 4:
                    err_1 = _b.sent();
                    console.log(err_1, url);
                    return [2 /*return*/, response.error("error", __("There was an unexpected response from proxy."))];
                case 5: return [2 /*return*/];
            }
        });
    });
});
