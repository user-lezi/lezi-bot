"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const util_1 = require("util");
const Sandbox = require("sandbox");
exports.default = {
    metadata: {
        category: "Utility",
        description: "Runs the javascript code that user provides",
    },
    data: new discord_js_1.SlashCommandBuilder()
        .setName("run")
        .setDescription("Runs the javascript code that user provides")
        .addStringOption((option) => option
        .setName("code")
        .setDescription("The code that user provides")
        .setRequired(true))
        .addBooleanOption((option) => option
        .setName("console")
        .setDescription("Whether to show the output in console or not (default: true)")
        .setRequired(false))
        .addBooleanOption((option) => option
        .setName("showcode")
        .setDescription("Show the input code or not (default: true)")
        .setRequired(false)),
    async execute(ctx) {
        let code = ctx.interaction.options.getString("code");
        let showConsole = ctx.interaction.options.getBoolean("console") ?? true;
        let showCode = ctx.interaction.options.getBoolean("showcode") ?? true;
        if (!code && code.length < 1) {
            return await ctx.reply({
                content: "Please provide the code that you want to run",
                ephemeral: true,
            });
        }
        await ctx.interaction.deferReply();
        let environment = new Sandbox();
        let start = Date.now();
        environment.run(code, async function (op) {
            let outputType = getTypeof(op.result);
            let embed = new discord_js_1.EmbedBuilder()
                .setColor(ctx.config.colors.main)
                .setTitle("Results")
                .setDescription((0, discord_js_1.codeBlock)("js", op.result).trim())
                .setFooter({
                text: `Took ${Date.now() - start}ms • ${outputType} • ${op.result.length}`,
            });
            let consoleEmbed;
            let embeds = [embed];
            if (op.console.length > 0 && showConsole) {
                consoleEmbed = new discord_js_1.EmbedBuilder()
                    .setColor(ctx.config.colors.main)
                    .setTitle("Console")
                    .toJSON();
                consoleEmbed.description = "";
                let maxColorCount = 4000;
                let currentCount = 0;
                for (let message of op.console) {
                    let consoleMessage = (0, discord_js_1.codeBlock)("js", makeLines(("object" === typeof message ? (0, util_1.inspect)(message) : message) +
                        "")) + " ";
                    if (currentCount &&
                        currentCount + consoleMessage.length > maxColorCount)
                        break;
                    consoleEmbed.description += consoleMessage;
                    currentCount += consoleMessage.length;
                }
                if (consoleEmbed.description?.length == 0)
                    consoleEmbed.description = "Console output too big to fit.";
                embeds.push(discord_js_1.EmbedBuilder.from(consoleEmbed));
            }
            if (showCode) {
                embeds.push(new discord_js_1.EmbedBuilder()
                    .setColor(ctx.config.colors.main)
                    .setTitle("Input")
                    .setDescription((0, discord_js_1.codeBlock)("js", makeLines(code))));
            }
            await ctx.reply({
                embeds,
            });
        });
    },
};
function makeLines(text) {
    let lines = text.split("\n");
    let m = lines.length.toString().length;
    let n = 1;
    let results = "";
    for (let line of lines) {
        results += " " + n.toString().padStart(m, " ") + " | " + line + "\n";
        n++;
    }
    return results;
}
function getTypeof(value) {
    if (value === "null" || value == "undefined")
        return value;
    if (value.startsWith("'") || value.startsWith('"'))
        return "string";
    if (value.startsWith("["))
        return "array";
    if (value.startsWith("{"))
        return "object";
    if (value.startsWith("(") || value.startsWith("function"))
        return "function";
    if (!isNaN(Number(value)) || /$\d/.test(value))
        return "number";
    return "unknown";
}
//# sourceMappingURL=run.js.map