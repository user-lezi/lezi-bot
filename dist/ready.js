"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const node_fetch_1 = __importDefault(require("node-fetch"));
let ready_channel = "1252948790688612454";
async function default_1(client) {
    let channel = client.channels.cache.get(ready_channel);
    let hostedOnRender = process.cwd().includes("render");
    let base_embed = new discord_js_1.EmbedBuilder()
        .setColor(hostedOnRender ? 0xff8080 : 0xed430e)
        .setTitle("Bot Ready " + (hostedOnRender ? "At Render" : "(Not at Render)"))
        .setTimestamp()
        .setDescription(await description(client));
    let previous_messages = await channel.messages.fetch({ limit: 100 });
    let previous_message = previous_messages.find((x) => x.author.id == client.user.id);
    if (previous_message) {
        let previous_uptime = previous_message.embeds[0]
            .description.split("\n")[1]
            .split("**")[1];
        let parsed = parseUptime(previous_uptime);
        if (parsed <= parseUptime("1h")) {
            await previous_message.delete();
        }
    }
    let message = await channel.send({ embeds: [base_embed] });
    setInterval(async function () {
        let embed = new discord_js_1.EmbedBuilder(base_embed.toJSON());
        embed.setDescription(await description(client));
        await message.edit({ embeds: [embed] });
    }, 15 * 1000);
}
exports.default = default_1;
function uptime(ms) {
    let days = Math.floor(ms / (24 * 60 * 60 * 1000));
    let daysms = ms % (24 * 60 * 60 * 1000);
    let hours = Math.floor(daysms / (60 * 60 * 1000));
    let hoursms = ms % (60 * 60 * 1000);
    let minutes = Math.floor(hoursms / (60 * 1000));
    let minutesms = ms % (60 * 1000);
    let sec = Math.floor(minutesms / 1000);
    return ((days > 0 ? `${days}d ` : "") +
        (hours > 0 ? `${hours}h ` : "") +
        (minutes > 0 ? `${minutes}m ` : "") +
        (sec > 0 ? `${sec}s` : ""));
}
function parseUptime(uptime) {
    let s = uptime.includes("s") ? Number(uptime.split("s")[0]) : 0;
    let m = uptime.includes("m") ? Number(uptime.split("m")[0]) : 0;
    let h = uptime.includes("h") ? Number(uptime.split("h")[0]) : 0;
    let d = uptime.includes("d") ? Number(uptime.split("d")[0]) : 0;
    return s + m * 60 + h * 60 * 60 + d * 24 * 60 * 60;
}
async function description(client) {
    let ping = client.ws.ping;
    let onrenderStats = "";
    try {
        let stats = await (0, node_fetch_1.default)("https://lezi-bot.onrender.com/backend/stats")
            .then((x) => x.json())
            .then((x) => x.data.uptime);
        let renderUptime = uptime(stats);
        onrenderStats = `🟢 Render Service is up [**${renderUptime}**]`;
    }
    catch (error) {
        onrenderStats = "🔴 " + error.message;
    }
    return [
        `**${client.user.username}** is ready at **${new Date().toLocaleString()}**!`,
        `- Uptime: **${uptime(client.uptime)}**`,
        `- Ping: **${ping}ms**`,
        `> ${onrenderStats}`,
    ].join("\n");
}
//# sourceMappingURL=ready.js.map