"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const API = "https://api.kastg.xyz/api/ai/chatgptV4?prompt=";
const discord_js_1 = require("discord.js");
exports.default = {
    metadata: {
        category: "AI",
        description: JSON.stringify({
            chat: "Chat with ChatGPT through discord.",
        }),
    },
    data: new discord_js_1.SlashCommandBuilder()
        .setName("gpt")
        .setDescription("Interact with ChatGPT")
        .addSubcommand((subcommand) => subcommand
        .setName("chat")
        .setDescription("Chat with ChatGPT")
        .addStringOption((option) => option
        .setName("prompt")
        .setDescription("The prompt to send to")
        .setRequired(true))),
    async execute(ctx) {
        let subcommand = ctx.interaction.options.getSubcommand();
        await ctx.interaction.deferReply();
        if (subcommand == "chat") {
            await chat(ctx);
        }
    },
};
async function chat(ctx) {
    let prompt = ctx.interaction.options
        .getString("prompt")
        ?.trim();
    if (!prompt) {
        return await ctx.interaction.editReply({
            content: "Please provide a prompt to send to ChatGPT",
        });
    }
    let time = performance.now();
    let uriEncoded = encodeURIComponent(prompt);
    let json = await ctx.fetchJSON(API + uriEncoded);
    time = performance.now() - time;
    if (json.status !== "true") {
        return await ctx.interaction.editReply({
            content: "An error occurred while processing your request. Please try again later.",
        });
    }
    let user_color = ctx.interaction.member.displayColor;
    let user_prompt_embed = new discord_js_1.EmbedBuilder()
        .setColor(user_color)
        .setAuthor({
        name: "@" + ctx.user.username,
        iconURL: ctx.user.displayAvatarURL(),
    })
        .setDescription(prompt);
    let btn = new discord_js_1.ButtonBuilder()
        .setCustomId("a")
        .setDisabled(true)
        .setLabel(`Took ${(time / 1000).toFixed(2)}s`)
        .setStyle(discord_js_1.ButtonStyle.Secondary);
    let res = json.result[0].response;
    let chunks = res.match(/[\s\S]{1,4000}/g);
    let embeds = [];
    for (let i = 0; i < chunks.length; i++) {
        let chunk = chunks[i];
        let embed = new discord_js_1.EmbedBuilder()
            .setColor(ctx.config.colors.main)
            .setAuthor({
            name: ctx.client.user.username,
            iconURL: ctx.client.user.displayAvatarURL(),
        })
            .setTimestamp()
            .setDescription(chunk);
        if (chunks.length > 1)
            embed.setFooter({
                text: `Page ${i + 1}/${chunks.length}`,
            });
        embeds.push(embed);
    }
    if (chunks.length == 1) {
        return await ctx.interaction.editReply({
            embeds: [user_prompt_embed, embeds[0]],
            components: [new discord_js_1.ActionRowBuilder().addComponents(btn)],
        });
    }
    function buttons(a = true, b = true) {
        return [
            new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                .setEmoji("◀️")
                .setCustomId("b")
                .setStyle(discord_js_1.ButtonStyle.Secondary)
                .setDisabled(a), btn, new discord_js_1.ButtonBuilder()
                .setEmoji("▶️")
                .setCustomId("f")
                .setStyle(discord_js_1.ButtonStyle.Secondary)
                .setDisabled(b)),
        ];
    }
    let index = 0;
    let message = await ctx.interaction.editReply({
        embeds: [embeds[index]],
        components: buttons(true, embeds.length == 1),
    });
    let collector = message.createMessageComponentCollector({
        componentType: discord_js_1.ComponentType.Button,
        time: 45_000,
    });
    collector.on("collect", async function (i) {
        if (i.user.id !== ctx.user.id) {
            return await i.reply({
                content: "This button is not for you",
                ephemeral: true,
            });
        }
        i.deferUpdate().catch(() => { });
        index += i.customId == "f" ? 1 : -1;
        await ctx.interaction.editReply({
            embeds: [user_prompt_embed, embeds[index]],
            components: buttons(index == 0, index == embeds.length - 1),
        });
    });
    collector.on("end", async function () {
        await ctx.interaction.editReply({
            components: buttons(),
        });
    });
}
//# sourceMappingURL=gpt4.js.map