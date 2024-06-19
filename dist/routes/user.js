"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const backendApi_1 = require("../backendApi");
exports.default = new backendApi_1.Route({
    path: "/u/:id",
    method: "get",
    queries: null,
    execute: async function (ctx) {
        try {
            let user = await ctx.client.users.fetch(ctx.getParam("id"), {
                force: true,
            });
            await user.fetchFlags(true);
            let mutualGuilds = [];
            if (ctx.getQuery("mutual") == "true") {
                let guilds = ctx.client.guilds.cache;
                for (let guild of guilds.values()) {
                    await guild.members.fetch();
                    if (guild.members.cache.has(user.id)) {
                        mutualGuilds.push({
                            id: guild.id,
                            name: guild.name,
                            owner: guild.ownerId == user.id,
                        });
                    }
                }
            }
            let toSendUser = {
                accentColor: {
                    int: user.accentColor,
                    hex: user.hexAccentColor,
                },
                avatar: user.avatarURL(),
                avatarDecoration: user.avatarDecorationURL(),
                banner: user.bannerURL(),
                bot: user.bot,
                creation: {
                    timestamp: user.createdTimestamp,
                    unix: Math.floor(user.createdTimestamp / 1000),
                },
                defaultAvatar: user.defaultAvatarURL,
                discriminator: user.discriminator == "0" ? null : user.discriminator,
                displayName: user.displayName,
                flags: user.flags?.toArray() ?? [],
                globalName: user.globalName,
                id: user.id,
                tag: user.tag,
                username: user.username,
                url: `https://discord.com/users/${user.id}`,
                mutualGuilds,
            };
            ctx.send(toSendUser);
        }
        catch (error) {
            ctx.error("User Not Found");
        }
    },
});
//# sourceMappingURL=user.js.map