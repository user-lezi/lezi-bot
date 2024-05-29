"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const backendApi_1 = require("../backendApi");
const helpers_1 = require("../helpers");
exports.default = new backendApi_1.Route({
    path: "/stats",
    method: "get",
    queries: null,
    execute: async function (ctx) {
        let stats = await (0, helpers_1.getBotStats)(ctx.client);
        ctx.send(stats);
    },
});
//# sourceMappingURL=stats.js.map