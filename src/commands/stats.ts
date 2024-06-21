import {
  EmbedBuilder,
  SlashCommandBuilder,
  bold,
  inlineCode,
  hyperlink,
} from "discord.js";
import { getBotStats, Context } from "../helpers";
import os from "os";

export default {
  metadata: {
    category: "Utility",
    description:
      "Shows the bot's statistics related to general to system information.",
  },
  data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Shows the bot's statistics"),
  async execute(ctx: Context) {
    const sent = await ctx.reply({
      content: "*Fetching Statistics...*",
      fetchReply: true,
    });
    let roundupTrip = sent.createdTimestamp - ctx.interaction.createdTimestamp;
    let stats = await getBotStats(ctx.client);

    let totalMem = os.totalmem();
    let freeMem = os.freemem();
    let usedMem = totalMem - freeMem;
    let tmGb = totalMem / 1024 ** 3;
    let fmGb = freeMem / 1024 ** 3;
    let umGb = usedMem / 1024 ** 3;
    let usedPercent = (usedMem / totalMem) * 100;

    let embed = new EmbedBuilder()
      .setTitle("Bot Statistics")
      .setColor(ctx.config.colors.main)
      .addFields(
        {
          name: "General Bot Information",
          value:
            ">>> " +
            [
              `${bold(hyperlink("Guilds", ctx.fakelink("Discord Guilds")) + ":")} ${inlineCode(stats.guilds.toLocaleString())}`,
              `${bold(hyperlink("Users", ctx.fakelink("Discord Users")) + ":")} ${inlineCode(stats.members.toLocaleString())} *[${stats.users.toLocaleString()} Unique Cached Users]*`,
              `${bold(hyperlink("Channels", ctx.fakelink("Discord Channels")) + ":")} ${inlineCode(stats.channels.toLocaleString())}`,
              `${bold(hyperlink("Commands", ctx.fakelink("Discord Bot Commands")) + ":")} ${inlineCode(stats.commands.toLocaleString())}`,
            ].join("\n"),
        },
        {
          name: "Client Information",
          value:
            ">>> " +
            [
              `${bold(hyperlink("WebSocket Heartbeat", ctx.fakelink("Websocket")) + ":")} ${inlineCode(ctx.client.ws.ping.toLocaleString() + "ms")}`,
              `${bold(hyperlink("Roundtrip Latency", ctx.fakelink("Roundtrip Latency")) + ":")} ${inlineCode(roundupTrip.toLocaleString() + "ms")}`,
              `${bold(hyperlink("Uptime", ctx.fakelink("Uptime")) + ":")} ${inlineCode(msToTime(stats.uptime))} [<t:${Math.floor(Date.now() / 1000 - Math.floor(stats.uptime / 1000))}:R>]`,
            ].join("\n"),
        },
        {
          name: "Package Versions",
          value:
            ">>> " +
            [
              `${bold(hyperlink("Node.js", ctx.fakelink("Node.js")) + ":")} ${inlineCode(process.version)}`,
              `${bold(hyperlink("Discord.js", ctx.fakelink("Discord.js")) + ":")} ${inlineCode("v" + require("discord.js").version)}`,
              `${bold(hyperlink("TypeScript", ctx.fakelink("TypeScript")) + ":")} ${inlineCode(
                "v" + require("typescript").version,
              )}`,
            ].join("\n"),
        },
        {
          name: "System Information",
          value:
            ">>> " +
            [
              `${bold(hyperlink("OS", ctx.fakelink("Operating System")) + ":")} ${inlineCode(os.type())}`,
              `${bold(hyperlink("Architecture", ctx.fakelink("Architecture")) + ":")} ${inlineCode(os.arch())}`,
              `${bold(hyperlink("CPU Model", ctx.fakelink("CPU Model")) + ":")} ${inlineCode(os.cpus()[0].model)}`,
              `${bold(hyperlink("CPU Cores", ctx.fakelink("CPU Cores")) + ":")} ${inlineCode(os.cpus().length.toLocaleString())}`,
              `${bold(hyperlink("Memory Usage", ctx.fakelink("Memory Usage")) + ":")} ${inlineCode(
                `${umGb.toFixed(2)} GiB / ${tmGb.toFixed(2)} GiB (${usedPercent.toFixed(2)}%) [${fmGb.toFixed(2)} GiB free]`,
              )}`,
            ].join("\n"),
        },
      );

    ctx.reply({
      embeds: [embed],
    });
  },
};

function msToTime(ms: number) {
  let seconds = Math.floor(ms / 1000);
  let minutes = Math.floor(seconds / 60);
  let hours = Math.floor(minutes / 60);
  let days = Math.floor(hours / 24);

  seconds %= 60;
  minutes %= 60;
  hours %= 24;

  return (
    (days > 0 ? `${days}d ` : "") +
    (hours > 0 ? `${hours}h ` : "") +
    (minutes > 0 ? `${minutes}m ` : "") +
    (seconds > 0 ? `${seconds}s` : "")
  ).trim();
}
