"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
exports.default = {
    metatag: {
        description: "Shows the bot's information",
    },
    data: new discord_js_1.SlashCommandBuilder()
        .setName("botinfo")
        .setDescription("Shows the bot's information")
        .addUserOption((option) => option
        .setName("bot")
        .setDescription("The bot to get info")
        .setRequired(true)),
    async execute(ctx) {
        let botInfoUrl = "https://discord.com/api/v9/oauth2/authorize?client_id={id}&scope=bot+applications.commands";
        let bot = ctx.interaction.options?.getUser("bot");
        if (!bot.bot) {
            return ctx.interaction.reply({
                content: "Please provide a bot to get info on. Got user " + bot,
            });
        }
        let botInfo = await ctx.fetch(botInfoUrl.replace("{id}", bot.id), {
            headers: {
                authorization: process.env.UserToken,
                "Content-Type": "application/json",
            },
        });
        console.log(botInfo);
        ctx.interaction.reply({
            content: "Bot Info",
        });
    },
};
//# sourceMappingURL=botinfo.js.map