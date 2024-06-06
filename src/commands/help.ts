import {
  bold,
  hyperlink,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandBuilder,
  AutocompleteInteraction,
} from "discord.js";
import { Context } from "../helpers";
interface Command {
  id: string;
  name: string;
  shortDescription: string;
  longDescription: string;
}

export default {
  metadata: {
    description:
      '"/help" command is divided into two subcommands: "/help commandlist" and "help command"\n- "/help commandlist" displays the list of commands that are available.\n- "/help command" displays the information for the specific command that user provides the input for.',
  },
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Need help?")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("commandlist")
        .setDescription("Shows the list of available commands"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("command")
        .setDescription("Shows information about a specific command")
        .addStringOption((option) =>
          option
            .setName("command")
            .setDescription("The command you want to get information about")
            .setRequired(true)
            .setAutocomplete(true),
        ),
    ),
  async execute(ctx: Context) {
    if ((ctx.interaction.options as any).getSubcommand() === "commandlist") {
      const commandNames = require("../../metadata/commands.json")
        .map((command: any) => command.name.split(" ")[0])
        .filter(
          (name: string, index: number, This: string[]) =>
            index === This.indexOf(name),
        );
      const commands: Command[] = [];
      for (const command of commandNames) {
        let cmd = ctx.application.commands.cache.find(
          (c) => c.name === command,
        );
        if (!cmd) continue;
        if (cmd.options.some((o) => o.type === 1)) {
          let subcommands = cmd.options.filter((o) => o.type === 1);
          for (let subcommand of subcommands) {
            commands.push({
              id: cmd.id,
              name: [cmd.name, subcommand.name].join(" "),
              shortDescription: subcommand.description,
              longDescription:
                ctx.commands.get(cmd.name)?.metadata?.description ||
                "*No Description Has Been Found*",
            });
          }
          continue;
        }
        commands.push({
          id: cmd.id,
          name: cmd.name,
          shortDescription: cmd.description,
          longDescription:
            ctx.commands.get(cmd.name)?.metadata?.description ||
            "*No Description Has Been Found*",
        });
      }
      const footer = [
        `## **Links**`,
        `- Check out ${bold(hyperlink("GitHub", "https://github.com/user-lezi/lezi-bot"))}.`,
        `- ${bold(hyperlink("Invite", "https://discord.com/oauth2/authorize?client_id=1242474432119836683&permissions=0&scope=bot+applications.commands"))} the bot to your server.`,
      ].join("\n");
      const embed = new EmbedBuilder()
        .setTitle("Here Is The Command List")
        .setColor(ctx.config.colors.main)
        .setDescription(
          commands
            .map(
              (c: Command) =>
                `- </${c.name}:${c.id}>\n - ${c.shortDescription}`,
            )
            .join("\n") +
            "\n" +
            footer,
        )
        .setFooter({
          text: `Requested by ${ctx.user.username}`,
        });

      ctx.interaction.reply({
        embeds: [embed],
      });
    } else if ((ctx.interaction.options as any).getSubcommand() === "command") {
      let input = (ctx.interaction.options as any).getString(
        "command",
      ) as string;
      let command = ctx.application.commands.cache.find(
        (c) => c.name === input.split(" ")[0],
      );

      if (!command) {
        return await ctx.interaction.reply({
          content: `Couldn't find ${bold(input)}`,
        });
      }

      let cmd: Command;
      if (input.includes(" ")) {
        let subcommand = input.split(" ")[1];
        let subcommandData = command.options.find((o) => o.name === subcommand);

        if (!subcommandData) {
          return await ctx.interaction.reply({
            content: `Couldn't find ${bold(input)}`,
          });
        }
        cmd = {
          id: command.id,
          name: [command.name, subcommandData.name].join(" "),
          shortDescription: subcommandData.description,
          longDescription:
            ctx.commands.get(command.name)?.metadata?.description ||
            "*No Description Has Been Found*",
        } as Command;
      } else {
        cmd = {
          id: command.id,
          name: command.name,
          shortDescription: command.description,
          longDescription:
            ctx.commands.get(command.name)?.metadata?.description ||
            "*No Description Has Been Found*",
        } as Command;
      }

      let embed = new EmbedBuilder()
        .setColor(ctx.config.colors.main)
        .setTitle(`Command Info`)
        .setDescription(cmd.longDescription)
        .addFields(
          { name: "Name:", value: `</${cmd.name}:${cmd.id}>` },
          { name: "Description:", value: cmd.shortDescription },
        );

      let githubUrl = `https://github.com/user-lezi/lezi-bot/blob/main/src/commands/${cmd.name.split(" ")[0]}.ts`;

      let components = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel("Source Code")
          .setStyle(ButtonStyle.Link)
          .setURL(githubUrl),
      );

      await ctx.interaction.reply({
        embeds: [embed],
        components: [components],
      });
    }
  },

  async autocomplete(interaction: AutocompleteInteraction) {
    let focusedValue = interaction.options.getFocused();
    let choices = ["help commandlist", "help command", "stats", "run"].sort();
    let filtered = choices
      .filter((choice: string) =>
        choice.toLowerCase().includes(focusedValue.toLowerCase()),
      )
      .slice(0, 25);

    await interaction.respond(
      filtered.map((choice: string) => ({ name: choice, value: choice })),
    );
  },
};
