"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
exports.default = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("help")
        .setDescription("Shows the list of available commands"),
    async execute(client, interaction) {
        await interaction.reply({
            content: "This is a help command",
        });
    },
};
//# sourceMappingURL=help.js.map