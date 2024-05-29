"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const backendApi_1 = require("../backendApi");
exports.default = new backendApi_1.Route({
    path: "/guildIds",
    method: "get",
    execute: async function (ctx) {
        let guilds = await ctx.client.guilds.fetch();
        let guildIds = guilds.map((guild) => guild.id);
        ctx.send(guildIds);
    },
});
//# sourceMappingURL=guildIds.js.map