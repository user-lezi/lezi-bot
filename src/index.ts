import {
  codeBlock,
  ActionRowBuilder,
  BaseInteraction,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  Client,
  ComponentType,
  DefaultWebSocketManagerOptions,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  Message,
} from "discord.js";
import {
  getBotStats,
  handleSlashCommands,
  registerCommands,
  Context,
} from "./helpers";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
  presence: {
    status: "online",
    afk: true,
  },
});

Reflect.set(
  DefaultWebSocketManagerOptions.identifyProperties,
  "browser",
  "Discord iOS",
);

/* Handling Slash Commands */
const commands = handleSlashCommands();

client.on(Events.ClientReady, async function (readyClient: Client<true>) {
  await registerCommands(commands, readyClient);
  console.log(`${readyClient.user.tag} is ready!!`);

  await client.application?.fetch();
  await client.application?.commands?.fetch();
  let stats = await getBotStats(readyClient);
  console.log(`Guilds: ${stats.guilds}, Users: ${stats.users}`);
});

/* Developer Only Command (for debug purpose) */
client.on(Events.MessageCreate, require("./debug").default);

/* Handler for slash commands */
client.on(
  Events.InteractionCreate,
  async function (interaction: BaseInteraction) {
    if (interaction.isChatInputCommand()) {
      if (interaction.isCommand()) {
        let command = commands.get(interaction.commandName);
        if (!command) return;
        let ctx = new Context(interaction, command, commands);
        await command.execute(ctx);
      }
    } else if (interaction.isAutocomplete()) {
      let command = commands.get(interaction.commandName);
      if (!command) return;
      await command.autocomplete?.(interaction);
    }
  },
);

client.login(process.env.BotToken);
