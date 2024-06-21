import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandBuilder,
  AutocompleteInteraction,
  Collection,
  OAuth2Scopes,
  ApplicationCommandOptionType,
  inlineCode,
  bold,
} from "discord.js";
import { Context } from "../helpers";
import { Command, CommandOptions } from "../generateMetadata";

export default {
  metadata: {
    category: "Utility",
    description: JSON.stringify({
      commandlist:
        "Shows a list of all commands, their category and some bot related links.",
      command: "Shows information about a specific command.",
    }),
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
    await ctx.interaction.deferReply().catch(() => {});
    let sub = ctx.subcommand();
    if (sub === "commandlist") {
      await showCommandList(ctx);
    } else if (sub === "command") {
      await showCommandInfo(ctx);
    }
  },

  async autocomplete(interaction: AutocompleteInteraction) {
    let focusedValue = interaction.options.getFocused();
    let choices = require("../../metadata/commands")
      .map((x: any) => x.name as string)
      .sort();
    let filtered = choices
      .filter((choice: string) =>
        choice.toLowerCase().includes(focusedValue.toLowerCase()),
      )
      .slice(0, 25);

    await interaction.respond(
      filtered.map((choice: string) => ({ name: "/" + choice, value: choice })),
    );
  },
};

async function showCommandList(ctx: Context) {
  let commands = require("../../metadata/commands") as Command[];
  let categorys = new Collection<string, Command[]>();
  for (let command of commands) {
    if (!categorys.has(command.category)) {
      categorys.set(command.category, []);
    }
    categorys.get(command.category)?.push(command);
  }

  let embed = new EmbedBuilder()
    .setAuthor({
      name: "Command List",
      iconURL: ctx.client.user.displayAvatarURL(),
    })
    .setTimestamp()
    .setColor(ctx.config.colors.main);

  let descriptionLines: string[] = [];
  for (let [category, commands] of categorys) {
    descriptionLines.push(`## ${category}`);
    for (let command of commands) {
      let cmd = ctx.application.commands.cache.find(
        (x) => x.name === command.mainName,
      )!;
      descriptionLines.push(
        `- </${command.name}:${cmd.id}>`,
        `  - ${command.shortDescription}`,
      );
    }
  }

  descriptionLines.push(
    `## Links`,
    `- **[Invite](${ctx.client.generateInvite({
      scopes: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands],
    })})**`,
    `- **[GitHub](https://github.com/user-lezi/lezi-bot)**`,
    `- **[Developer @leziuwu](https://www.discord.com/users/910837428862984213)**`,
  );

  let someRandomUser = await ctx.randomUser();
  let randomCommand = commands[Math.floor(Math.random() * commands.length)];
  let randomCmd = ctx.application.commands.cache.find(
    (x) => x.name === randomCommand.mainName,
  )!;
  let someFooters = [
    `Use </help command:${ctx.application.commands.cache.find((x) => x.name === "help")!.id}> to get more information about a specific command.`,
    `Here is a random user: **[@${someRandomUser.username}](https://www.discord.com/users/${someRandomUser.id})**`,
    `*Nothing here to see...*`,
    `Why not try to use </${randomCommand.name}:${randomCmd.id}>?`,
  ];

  descriptionLines.push(
    "",
    `> ${someFooters[Math.floor(Math.random() * someFooters.length)]}`,
  );

  embed.setDescription(descriptionLines.join("\n"));

  let row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("author")
      .setLabel(`Requested By @${ctx.user.username}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
  );

  await ctx.reply({
    embeds: [embed],
    components: [row],
  });
}

async function showCommandInfo(ctx: Context) {
  let input = (ctx.interaction.options as any).getString("command") as string;
  let commands = require("../../metadata/commands") as Command[];
  let command = commands.find(
    (x) => x.name === input.replace("/", "").toLowerCase(),
  );
  if (!command) {
    let mostApproxList = findSimilar(
      input.replace("/", ""),
      commands.map((x) => x.name),
      3,
    );
    let didyoumean = mostApproxList.length
      ? [
          `- **Did You Mean:**`,
          ...mostApproxList.map((x) => {
            let cmd = ctx.application.commands.cache.find(
              (y) => y.name === x[0].split(" ")[0],
            )!;
            return `- </${x[0]}:${cmd.id}> / ${inlineCode((x[1] * 100).toFixed(2) + "%")}`;
          }),
        ].join("\n")
      : "";
    await ctx.reply({
      content: `Couldn't find ${inlineCode(input)}\n${didyoumean}`,
    });
    return;
  }

  let cmd = ctx.application.commands.cache.find(
    (x) => x.name === command.mainName,
  )!;

  let embed = new EmbedBuilder()
    .setAuthor({
      name: `Command Info • ${command.category}`,
      iconURL: ctx.client.user.displayAvatarURL(),
    })
    .setColor(ctx.config.colors.main);

  let descriptionLines: string[] = [
    `# </${command.name}:${cmd.id}>`,
    ...command.longDescription.split("\n").map((x) => "> " + x),
  ];
  if (command.options.length) {
    descriptionLines.push(
      `## Options`,
      ...command.options.map((x) => parseOption(x)),
    );
  }

  if (!ctx.commands.get(command.mainName)!.available) {
    descriptionLines.push(
      "> " + bold(`⚠️ This command is currently disabled.`),
    );
  }

  embed.setDescription(descriptionLines.join("\n"));

  let row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setURL(github(command.path.ts))
      .setLabel(`Source Code`)
      .setStyle(ButtonStyle.Link),
  );

  await ctx.reply({
    embeds: [embed],
    components: [row],
  });
}

function findSimilar(input: string, list: string[], n = 3): [string, number][] {
  let newlist = [] as [string, number][];
  for (let i = 0; i < list.length; i++) {
    let similarity = similarityRatio(input, list[i]);
    newlist.push([list[i], similarity]);
  }
  return softmaxList(newlist.sort((a, b) => b[1] - a[1]).slice(0, n));
}

function softmaxList(list: [string, number][]): [string, number][] {
  let sum = 0;
  let e = (n: number) => Math.exp(n);
  for (let i = 0; i < list.length; i++) {
    sum += e(list[i][1]);
  }
  for (let i = 0; i < list.length; i++) {
    list[i][1] = e(list[i][1]) / sum;
  }
  return list;
}

function similarityRatio(a: string, b: string): number {
  let longer = a;
  let shorter = b;
  if (a.length < b.length) {
    longer = b;
    shorter = a;
  }
  let longerLength = longer.length;
  if (longerLength === 0) {
    return 1.0;
  }
  return (longerLength - editDistance(longer, shorter)) / Number(longerLength);
}

function editDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let matrix = [] as number[][];

  // increment along the first column of each row
  let i;
  for (i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  // increment each column in the first row
  let j;
  for (j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (i = 1; i <= b.length; i++) {
    for (j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1,
          ), // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function github(path: string) {
  return "https://github.com/user-lezi/lezi-bot/blob/main/" + path;
}

function parseOption(option: CommandOptions) {
  return `- ${bold(`[${option.name + (option.required ? "" : "?")}](https://youtube.com/watch?v=dQw4w9WgXcQ)`)} [**${
    option.required ? "Required" : "Optional"
  }** • **${ApplicationCommandOptionType[option.type]}**]\n  - ${option.description}`;
}
