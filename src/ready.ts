import { Client, EmbedBuilder, TextChannel, Message } from "discord.js";
import fetch from "node-fetch";

let ready_channel = "1252948790688612454";

export default async function (client: Client<true>) {
  let channel = client.channels.cache.get(ready_channel) as TextChannel;
  let hostedOnRender = process.cwd().includes("render");
  let base_embed = new EmbedBuilder()
    .setColor(hostedOnRender ? 0xff8080 : 0xed430e)
    .setTitle("Bot Ready " + (hostedOnRender ? "At Render" : "(Not at Render)"))
    .setTimestamp()
    .setDescription(await description(client));

  let message = await channel.send({ embeds: [base_embed] });

  setInterval(async function () {
    let embed = new EmbedBuilder(base_embed.toJSON());
    embed.setDescription(await description(client));
    await message.edit({ embeds: [embed] });
  }, 15 * 1000);
}

function uptime(ms: number) {
  let days = Math.floor(ms / (24 * 60 * 60 * 1000));
  let daysms = ms % (24 * 60 * 60 * 1000);
  let hours = Math.floor(daysms / (60 * 60 * 1000));
  let hoursms = ms % (60 * 60 * 1000);
  let minutes = Math.floor(hoursms / (60 * 1000));
  let minutesms = ms % (60 * 1000);
  let sec = Math.floor(minutesms / 1000);
  return (
    (days > 0 ? `${days}d ` : "") +
    (hours > 0 ? `${hours}h ` : "") +
    (minutes > 0 ? `${minutes}m ` : "") +
    (sec > 0 ? `${sec}s` : "")
  );
}

async function description(client: Client<true>) {
  let ping = client.ws.ping;

  let onrenderStats = "";

  try {
    let stats = await fetch("https://lezi-bot.onrender.com/backend/stats")
      .then((x) => x.json())
      .then((x) => x.data.uptime);
    let renderUptime = uptime(stats);
    onrenderStats = `🟢 Render Service is up [**${renderUptime}**]`;
  } catch (error: any) {
    onrenderStats = "🔴 " + error.message;
  }

  return [
    `**${client.user.username}** is ready at **${new Date().toLocaleString()}**!`,
    `- Uptime: **${uptime(client.uptime)}**`,
    `- Ping: **${ping}ms**`,
    `> ${onrenderStats}`,
  ].join("\n");
}
