"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const helpers_1 = require("../helpers");
const os_1 = __importDefault(require("os"));
exports.default = {
    metadata: {
        category: "Bot",
        description: "Shows the bot's statistics related to general to system information.",
    },
    data: new discord_js_1.SlashCommandBuilder()
        .setName("stats")
        .setDescription("Shows the bot's statistics"),
    async execute(ctx) {
        const sent = await ctx.interaction.reply({
            content: "*Fetching Statistics...*",
            fetchReply: true,
        });
        let roundupTrip = sent.createdTimestamp - ctx.interaction.createdTimestamp;
        let stats = await (0, helpers_1.getBotStats)(ctx.client);
        let totalMem = os_1.default.totalmem();
        let freeMem = os_1.default.freemem();
        let usedMem = totalMem - freeMem;
        let tmGb = totalMem / 1024 ** 3;
        let fmGb = freeMem / 1024 ** 3;
        let umGb = usedMem / 1024 ** 3;
        let usedPercent = (usedMem / totalMem) * 100;
        let embed = new discord_js_1.EmbedBuilder()
            .setTitle("Bot Statistics")
            .setColor(ctx.config.colors.main)
            .addFields({
            name: "General Bot Information",
            value: ">>> " +
                [
                    `${(0, discord_js_1.bold)((0, discord_js_1.hyperlink)("Guilds", ctx.fakelink("Discord Guilds")) + ":")} ${(0, discord_js_1.inlineCode)(stats.guilds.toLocaleString())}`,
                    `${(0, discord_js_1.bold)((0, discord_js_1.hyperlink)("Users", ctx.fakelink("Discord Users")) + ":")} ${(0, discord_js_1.inlineCode)(stats.members.toLocaleString())} *[${stats.users.toLocaleString()} Unique Cached Users]*`,
                    `${(0, discord_js_1.bold)((0, discord_js_1.hyperlink)("Channels", ctx.fakelink("Discord Channels")) + ":")} ${(0, discord_js_1.inlineCode)(stats.channels.toLocaleString())}`,
                    `${(0, discord_js_1.bold)((0, discord_js_1.hyperlink)("Commands", ctx.fakelink("Discord Bot Commands")) + ":")} ${(0, discord_js_1.inlineCode)(stats.commands.toLocaleString())}`,
                ].join("\n"),
        }, {
            name: "Client Information",
            value: ">>> " +
                [
                    `${(0, discord_js_1.bold)((0, discord_js_1.hyperlink)("WebSocket Heartbeat", ctx.fakelink("Websocket")) + ":")} ${(0, discord_js_1.inlineCode)(ctx.client.ws.ping.toLocaleString() + "ms")}`,
                    `${(0, discord_js_1.bold)((0, discord_js_1.hyperlink)("Roundtrip Latency", ctx.fakelink("Roundtrip Latency")) + ":")} ${(0, discord_js_1.inlineCode)(roundupTrip.toLocaleString() + "ms")}`,
                    `${(0, discord_js_1.bold)((0, discord_js_1.hyperlink)("Uptime", ctx.fakelink("Uptime")) + ":")} ${(0, discord_js_1.inlineCode)(msToTime(stats.uptime))} [<t:${Math.floor(Date.now() / 1000 - Math.floor(stats.uptime / 1000))}:R>]`,
                ].join("\n"),
        }, {
            name: "Package Versions",
            value: ">>> " +
                [
                    `${(0, discord_js_1.bold)((0, discord_js_1.hyperlink)("Node.js", ctx.fakelink("Node.js")) + ":")} ${(0, discord_js_1.inlineCode)(process.version)}`,
                    `${(0, discord_js_1.bold)((0, discord_js_1.hyperlink)("Discord.js", ctx.fakelink("Discord.js")) + ":")} ${(0, discord_js_1.inlineCode)("v" + require("discord.js").version)}`,
                    `${(0, discord_js_1.bold)((0, discord_js_1.hyperlink)("TypeScript", ctx.fakelink("TypeScript")) + ":")} ${(0, discord_js_1.inlineCode)("v" + require("typescript").version)}`,
                ].join("\n"),
        }, {
            name: "System Information",
            value: ">>> " +
                [
                    `${(0, discord_js_1.bold)((0, discord_js_1.hyperlink)("OS", ctx.fakelink("Operating System")) + ":")} ${(0, discord_js_1.inlineCode)(os_1.default.type())}`,
                    `${(0, discord_js_1.bold)((0, discord_js_1.hyperlink)("Architecture", ctx.fakelink("Architecture")) + ":")} ${(0, discord_js_1.inlineCode)(os_1.default.arch())}`,
                    `${(0, discord_js_1.bold)((0, discord_js_1.hyperlink)("CPU Model", ctx.fakelink("CPU Model")) + ":")} ${(0, discord_js_1.inlineCode)(os_1.default.cpus()[0].model)}`,
                    `${(0, discord_js_1.bold)((0, discord_js_1.hyperlink)("CPU Cores", ctx.fakelink("CPU Cores")) + ":")} ${(0, discord_js_1.inlineCode)(os_1.default.cpus().length.toLocaleString())}`,
                    `${(0, discord_js_1.bold)((0, discord_js_1.hyperlink)("Memory Usage", ctx.fakelink("Memory Usage")) + ":")} ${(0, discord_js_1.inlineCode)(`${umGb.toFixed(2)} GB / ${tmGb.toFixed(2)} GB (${usedPercent.toFixed(2)}%) [${fmGb.toFixed(2)} GB free]`)}`,
                ].join("\n"),
        });
        ctx.interaction.editReply({
            embeds: [embed],
        });
    },
};
function msToTime(ms) {
    let seconds = Math.floor(ms / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);
    let days = Math.floor(hours / 24);
    seconds %= 60;
    minutes %= 60;
    hours %= 24;
    return ((days > 0 ? `${days}d ` : "") +
        (hours > 0 ? `${hours}h ` : "") +
        (minutes > 0 ? `${minutes}m ` : "") +
        (seconds > 0 ? `${seconds}s` : "")).trim();
}
//# sourceMappingURL=stats.js.map