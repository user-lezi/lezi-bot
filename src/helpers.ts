import { Client } from "discord.js";

export async function getBotStats(client: Client) {
  const guilds = client.guilds.cache.size;
  const users = client.users.cache.size;
  return {
    guilds,
    users
  }
}