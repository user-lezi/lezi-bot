"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBotStats = void 0;
async function getBotStats(client) {
    const guilds = client.guilds.cache.size;
    const users = client.users.cache.size;
    return {
        guilds,
        users
    };
}
exports.getBotStats = getBotStats;
//# sourceMappingURL=helpers.js.map