import {
  AutocompleteInteraction,
  BaseChannel,
  Client,
  Collection,
  CommandInteraction,
  SlashCommandBuilder,
  REST,
  Routes,
  User,
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
export class Context {
  config: any;
  constructor(
    public interaction: CommandInteraction,
    public command: SlashData,
    public commands: Collection<string, SlashData>,
  ) {
    this.config = {
      colors: {
        main: 0xff8080,
      },
    };
  }

  get client(): Client<true> {
    return this.interaction.client;
  }
  get application() {
    return this.client.application;
  }
  get guild() {
    return this.interaction.guild;
  }
  get channel() {
    return this.interaction.channel;
  }
  get user() {
    return this.interaction.user;
  }
  get applicationCommand() {
    return this.interaction.command;
  }
}
export interface SlashData {
  data: SlashCommandBuilder;
  execute: (ctx: Context) => Promise<unknown>;
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<unknown>;
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
