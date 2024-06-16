"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const simple_tts_mp3_1 = require("simple-tts-mp3");
const fs_1 = require("fs");
const langs = require("../../metadata/tts-languages.json");
exports.default = {
    metadata: {
        category: "Utility",
        description: "Converts text to speech. Available Languages at [GitHub](https://github.com/user-lezi/lezi-bot/tree/main/metadata/tts-languagues.json)",
    },
    data: new discord_js_1.SlashCommandBuilder()
        .setName("tts")
        .setDescription("Converts text to speech.")
        .addStringOption((option) => option
        .setName("text")
        .setDescription("The text to convert to speech.")
        .setRequired(true))
        .addStringOption((option) => option
        .setName("language")
        .setDescription("The language to convert the text to.")
        .setRequired(false)
        .setAutocomplete(true)),
    async execute(ctx) {
        let s = performance.now();
        await ctx.interaction.deferReply();
        let text = ctx.interaction.options.getString("text");
        let lang = ctx.interaction.options.getString("language") ??
            "en";
        if (!langs.find((e) => e.code === lang)) {
            return ctx.interaction.editReply({
                content: `Language ${(0, discord_js_1.bold)(lang)} is not available.`,
            });
        }
        let _path = parseInt(ctx.user.id.slice(0, 4)).toString(16) +
            "-" +
            Math.floor(Math.random() * 2000).toString(16);
        let path = await (0, simple_tts_mp3_1.createAudioFile)(text, _path, lang);
        let attachment = new discord_js_1.AttachmentBuilder(path, {
            name: "tts-" + lang + ".mp3",
            description: text,
        });
        await ctx.interaction.editReply({
            content: `*Generated in ${((performance.now() - s) / 1000).toFixed(2)}s*`,
            files: [attachment],
        });
        setTimeout(() => {
            (0, fs_1.unlinkSync)(path);
        }, 10 * 1000);
    },
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused(true);
        const filtered = langs
            .filter((option) => option.name
            .toLowerCase()
            .includes(focusedValue.value.toLowerCase()) ||
            option.code.toLowerCase().includes(focusedValue.value.toLowerCase()))
            .sort((a, b) => stringSorter(a.name, b.name))
            .slice(0, 25);
        await interaction.respond(filtered.map((option) => ({ name: option.name, value: option.code })));
    },
};
function stringSorter(a, b) {
    let c = [a, b].sort();
    return c[0] === a ? 1 : -1;
}
//# sourceMappingURL=tts.js.map