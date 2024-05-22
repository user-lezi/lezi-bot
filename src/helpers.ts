import {
  Client,
  Collection,
  CommandInteraction,
  SlashCommandBuilder,
  REST,
  Routes,
} from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";

export async function getBotStats(client: Client) {
  const guilds = client.guilds.cache.size;
  const users = client.users.cache.size;
  return {
    guilds,
    users,
  };
}

interface SlashData {
  data: SlashCommandBuilder;
  execute: (
    client: Client,
    interaction: CommandInteraction,
    command: SlashData,
  ) => Promise<unknown>;
}
export function handleSlashCommands() {
  const commandFiles = readdirSync(join(__dirname, "commands")).filter(
    (file: string) => file.endsWith(".js"),
  );
  const commands = new Collection<string, SlashData>();
  for (const file of commandFiles) {
    const command = require(join(__dirname, "commands", file)).default;
    commands.set(command.data.name, command);
    console.log(`- Loaded command /${command.data.name}`);
  }
  return commands;
}

export async function registerCommands(
  commands: Collection<string, SlashData>,
  client: Client<true>,
) {
  let clientId = client.user.id;
  const rest = new REST().setToken(client.token);
  const body: any[] = [];
  commands.forEach((command) => {
    body.push(command.data.toJSON());
  });
  let data = (await rest.put(Routes.applicationCommands(clientId), {
    body,
  })) as any;
  console.log(`# Registered ${data.length} commands`);
}
