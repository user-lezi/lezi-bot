"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const util_1 = require("util");
async function evalCommand(message) {
    let commandTrigger = "--eval";
    if (!message.content.startsWith(commandTrigger))
        return;
    let inputCode = message.content.slice(commandTrigger.length).trim();
    if (0 === inputCode.length)
        return;
    let outputCode;
    try {
        outputCode = await eval(inputCode);
    }
    catch (error) {
        outputCode = error;
    }
    let outputString = ("object" === typeof outputCode ? (0, util_1.inspect)(outputCode) : outputCode) + "";
    let outputChunks = (outputString.match(/[\s\S]{1,4000}/g) || []);
    let currentIndex = 0;
    let embeds = [];
    for (let i = 0; i < outputChunks.length; i++) {
        let chunk = outputChunks[i];
        let embed = new discord_js_1.EmbedBuilder()
            .setColor(0x313336)
            .setTitle("Evaluated")
            .setFooter({
            text: `Page ${i + 1}/${outputChunks.length} • ${outputString.length} • ${typeof outputCode}`,
        })
            .setDescription((0, discord_js_1.codeBlock)("js", chunk));
        embeds.push(embed);
    }
    function addComponents(...available) {
        return [
            new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                .setEmoji("⏪")
                .setCustomId("first")
                .setStyle(discord_js_1.ButtonStyle.Secondary)
                .setDisabled(available[0]), new discord_js_1.ButtonBuilder()
                .setEmoji("◀️")
                .setCustomId("previous")
                .setStyle(discord_js_1.ButtonStyle.Secondary)
                .setDisabled(available[1]), new discord_js_1.ButtonBuilder()
                .setEmoji("🗑️")
                .setCustomId("delete")
                .setStyle(discord_js_1.ButtonStyle.Danger)
                .setDisabled(available[2]), new discord_js_1.ButtonBuilder()
                .setEmoji("▶️")
                .setCustomId("next")
                .setStyle(discord_js_1.ButtonStyle.Secondary)
                .setDisabled(available[3]), new discord_js_1.ButtonBuilder()
                .setEmoji("⏩")
                .setCustomId("last")
                .setStyle(discord_js_1.ButtonStyle.Secondary)
                .setDisabled(available[4])),
        ];
    }
    let evalMessage = await message.reply({
        embeds: [embeds[0]],
        components: addComponents(true, true, false, embeds.length == 1, embeds.length == 1),
    });
    let collector = evalMessage.createMessageComponentCollector({
        componentType: discord_js_1.ComponentType.Button,
        time: 45_000,
    });
    collector.on("collect", async function (interaction) {
        if (interaction.user.id !== message.author.id) {
            return await interaction.reply({
                content: `Only for ${message.author}!`,
                ephemeral: true,
            });
        }
        interaction.deferUpdate().catch(() => { });
        if (interaction.customId == "delete") {
            return await evalMessage.delete().catch(() => { });
        }
        currentIndex =
            interaction.customId === "first"
                ? 0
                : interaction.customId === "previous"
                    ? currentIndex - 1
                    : interaction.customId === "next"
                        ? currentIndex + 1
                        : interaction.customId === "last"
                            ? embeds.length - 1
                            : currentIndex;
        await evalMessage.edit({
            embeds: [embeds[currentIndex]],
            components: addComponents(currentIndex === 0, currentIndex === 0, false, currentIndex === embeds.length - 1, currentIndex === embeds.length - 1),
        });
    });
    collector.on("end", async function () {
        await evalMessage
            .edit({
            components: addComponents(true, true, true, true, true),
        })
            .catch(() => { });
    });
}
async function default_1(message) {
    let whitelistUsers = ["910837428862984213"];
    if (-1 === whitelistUsers.indexOf(message.author.id))
        return;
    await evalCommand(message);
}
exports.default = default_1;
//# sourceMappingURL=debug.js.map