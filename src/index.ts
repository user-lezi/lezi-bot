import {
  BaseInteraction,
  Client,
  DefaultWebSocketManagerOptions,
  Events,
  GatewayIntentBits,
  EmbedBuilder,
  codeBlock,
  Message,
  TextChannel,
} from "discord.js";
import {
  getBotStats,
  handleSlashCommands,
  registerCommands,
  Context,
} from "./helpers";
import fetch from "node-fetch";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
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
  /* Remove the below comment to register a new slash command if neeeded */
  await registerCommands(commands, readyClient);
  console.log(`${readyClient.user.tag} is ready!!`);

  await client.application?.fetch();
  await client.application?.commands?.fetch();

  require("./ready").default(client);

  require("./backendApi").default(readyClient);
});

/* Developer Only Command (for debug purpose) */
client.on(Events.MessageCreate, require("./debug").default);

/* Handler for slash commands */
client.on(
  Events.InteractionCreate,
  async function (interaction: BaseInteraction) {
    try {
      if (interaction.isChatInputCommand()) {
        if (interaction.isCommand()) {
          let command = commands.get(interaction.commandName);
          if (!command) return;
          if (!command.available) {
            return await interaction.reply({
              content: `This command is not available at the moment!`,
              ephemeral: true,
            });
          }
          let ctx = new Context(interaction, command, commands);
          try {
            await command.execute(ctx);
          } catch (err: any) {
            let obj = {
              content:
                "😅 An Error Occurred!!\nThis error is reported to the developer and hope it will be fixed soon!",
            };
            let msg: Message;
            if (ctx.interaction.deferred || ctx.interaction.replied) {
              if (ctx.interaction.replied)
                msg = await ctx.interaction.followUp(obj);
              else msg = await ctx.interaction.editReply(obj);
            } else {
              msg = (await ctx.interaction.reply(obj)) as unknown as Message;
            }
            let dev = await client.users.fetch("910837428862984213");
            commands.get(interaction.commandName)!.available = false;

            let embed_1 = new EmbedBuilder()
              .setColor(ctx.config.colors.main)
              .setTitle("Error Report!")
              .setDescription(codeBlock("js", err.stack))
              .setAuthor({
                name: ctx.client.user.username,
                iconURL: ctx.client.user.displayAvatarURL(),
              });
            let embed_2 = new EmbedBuilder()
              .setColor(ctx.config.colors.main)
              .setTitle("Information")
              .setTimestamp()
              .addFields(
                {
                  name: "User",
                  value: `**[@${ctx.user.username}](https://www.discord.com/users/${ctx.user.id})** | <@${ctx.user.id}>`,
                },
                {
                  name: "Command",
                  value: `**${ctx.command.data.name}** | </${ctx.command.data.name}:${ctx.interaction.commandId}>`,
                },
                {
                  name: "Message",
                  value: `**[#${(ctx.interaction.channel as TextChannel)?.name}](https://www.discord.com/channels/${ctx.guild.id}/${ctx.channel.id}/${msg.id})** | <#${ctx.interaction.channelId}>`,
                },
              );

            dev.send({
              embeds: [embed_1, embed_2],
            });
          }
        }
      } else if (interaction.isAutocomplete()) {
        let command = commands.get(interaction.commandName);
        if (!command) return;
        await command.autocomplete?.(interaction);
      }
    } catch {}
  },
);

client.login(process.env.BotToken);
