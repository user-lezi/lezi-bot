import {
  SlashCommandBuilder,
  AutocompleteInteraction,
  EmbedBuilder,
  Guild,
  inlineCode,
  Collection,
  User,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { Context } from "../helpers";

export default {
  metadata: {
    category: "Cache",
    description: JSON.stringify({
      guild: `Fetches information from the guild found through the provided query. The list of guilds are the guilds where the bot is in.`,
      user: `Fetches information from the user found through the provided query. The list of users are the users that are in the guilds where the bot is in.`,
    }),
  },

  data: new SlashCommandBuilder()
    .setName("cache")
    .setDescription("Search through bot's cache")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("guild")
        .setDescription("Search through guilds")
        .addStringOption((option) =>
          option
            .setName("query")
            .setDescription(
              "The query to search for or just drop the guild id.",
            )
            .setRequired(false)
            .setAutocomplete(true),
        )
        .addBooleanOption((option) =>
          option
            .setName("show-channels")
            .setDescription("Show channel information")
            .setRequired(false),
        )
        .addBooleanOption((option) =>
          option
            .setName("show-members")
            .setDescription("Show members information")
            .setRequired(false),
        )
        .addBooleanOption((option) =>
          option
            .setName("show-roles")
            .setDescription("Show roles information")
            .setRequired(false),
        )
        .addBooleanOption((option) =>
          option
            .setName("show-emojis")
            .setDescription("Show emojis information")
            .setRequired(false),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("user")
        .setDescription("Search through users")
        .addStringOption((option) =>
          option
            .setName("query")
            .setDescription("The query to search for or just drop the user id.")
            .setRequired(false)
            .setAutocomplete(true),
        )
        .addBooleanOption((option) =>
          option
            .setName("show-mutual")
            .setDescription("Show mutual guilds")
            .setRequired(false),
        ),
    ),
  async execute(ctx: Context) {
    let sub = ctx.subcommand();
    await ctx.interaction.deferReply();
    if (sub == "guild") {
      await searchGuild(ctx);
    } else if (sub == "user") {
      await searchUser(ctx);
    }
  },

  async autocomplete(interaction: AutocompleteInteraction) {
    let focus = interaction.options.getFocused(true);
    let value = focus.value as string;
    let sub = interaction.options.getSubcommand();

    if (sub == "guild") {
      let choices = interaction.client.guilds.cache.map((g) => [
        `${g.name} [${g.id}]`,
        g.id,
      ]);
      let filtered = choices
        .filter((choice) =>
          choice[0].toLowerCase().includes(value.toLowerCase()),
        )
        .slice(0, 25);
      await interaction.respond(
        filtered.map((choice) => ({ name: choice[0], value: choice[1] })),
      );
    } else if (sub == "user") {
      let choices = interaction.client.users.cache.map((u) => [
        `${u.tag} [${u.id}]`,
        u.id,
      ]);
      let filtered = choices
        .filter((choice) =>
          choice[0].toLowerCase().includes(value.toLowerCase()),
        )
        .slice(0, 25);
      await interaction.respond(
        filtered.map((choice) => ({ name: choice[0], value: choice[1] })),
      );
    }
  },
};

async function searchGuild(ctx: Context) {
  let time = performance.now();
  let q = ctx.interaction.options.getString("query") ?? ctx.guild.id;
  if (isNaN(Number(q)))
    return await ctx.reply({
      content: "Please provide a valid guild id (Got " + q + ")",
    });
  let guild = await ctx.client.guilds.fetch(q);
  if (!guild)
    return await ctx.reply({
      content: "Couldn't find guild with id " + q,
    });

  let showMemInfo = ctx.interaction.options.getBoolean("show-members") ?? true;
  let showChanInfo =
    ctx.interaction.options.getBoolean("show-channels") ?? true;
  let showRoleInfo = ctx.interaction.options.getBoolean("show-roles") ?? true;
  let showEmojiInfo = ctx.interaction.options.getBoolean("show-emojis") ?? true;

  let embed = new EmbedBuilder()
    .setAuthor({
      name: guild.name,
      iconURL: guild.iconURL() || undefined,
    })
    .setColor(ctx.config.colors.main);

  if (guild.iconURL()) embed.setThumbnail(guild.iconURL());
  if (guild.description) embed.setDescription(guild.description);
  if (guild.bannerURL()) embed.setImage(guild.bannerURL());

  let owner = await guild.fetchOwner();
  embed.addFields({
    name: "Server Information",
    value: [
      `**Name:** ${inlineCode(guild.name)}`,
      `**ID:** ${inlineCode(guild.id)}`,
      `**Owner:** **[@${owner.user.username}](https://discord.com/users/${owner.user.id})**`,
      `**Creation:** <t:${Math.floor(
        guild.createdTimestamp / 1000,
      )}:F> [<t:${Math.floor(guild.createdTimestamp / 1000)}:R>]`,
      `**Bot Joined:** <t:${Math.floor(
        guild.joinedTimestamp / 1000,
      )}:F> [<t:${Math.floor(guild.joinedTimestamp / 1000)}:R>]`,
      `**Boosts**: ${guild.premiumSubscriptionCount} boosts (Level ${guild.premiumTier})`,
    ]
      .map((x) => "- " + x)
      .join("\n"),
  });

  let fields = {} as { [key: string]: any };
  async function loadMemberInfo() {
    if (showMemInfo == true) {
      let members = await guild.members.fetch();
      let humans = members.filter((m) => !m.user.bot).size;

      let admins = members.filter((m) =>
        m.permissions.has(PermissionFlagsBits.Administrator),
      );
      let sortedTime1 = members.sort(
        (a, b) => a.joinedTimestamp! - b.joinedTimestamp!,
      );
      let oldestmember = sortedTime1.first()!;
      let lastestmember = sortedTime1.last()!;

      fields.members = {
        name: "Members Information",
        value: [
          `**Count:** ${inlineCode(guild.memberCount + "")}\n  - **Humans:** ${inlineCode(humans + "")}\n  - **Bots:** ${inlineCode(guild.memberCount - humans + "")}`,
          `**Admins [${inlineCode(admins.size + "")}]:** ${mention(5, admins)}`,
          `**Oldest Member:** **[@${oldestmember.user.username}](https://discord.com/users/${oldestmember.user.id})**\n  - <t:${Math.floor(oldestmember.joinedTimestamp! / 1000)}:F> [<t:${Math.floor(oldestmember.joinedTimestamp! / 1000)}:R>]`,
          `**Newest Member:** **[@${lastestmember.user.username}](https://discord.com/users/${lastestmember.user.id})**\n  - <t:${Math.floor(lastestmember.joinedTimestamp! / 1000)}:F> [<t:${Math.floor(lastestmember.joinedTimestamp! / 1000)}:R>]`,
        ]
          .map((x) => "- " + x)
          .join("\n"),
      };
    }
  }
  async function loadChannelInfo() {
    if (showChanInfo == true) {
      let channels = await guild.channels.fetch();

      let sortedTime2 = channels.sort(
        (a, b) => a!.createdTimestamp - b!.createdTimestamp,
      );
      let oldestchannel = sortedTime2.first()!;
      let lastestchannel = sortedTime2.last()!;

      fields.channels = {
        name: "Channels Information",
        value: [
          `**Count:** ${inlineCode(channels.size + "")}`,
          `**Oldest Channel:** <#${oldestchannel.id}>\n  - <t:${Math.floor(oldestchannel.createdTimestamp / 1000)}:F> [<t:${Math.floor(oldestchannel.createdTimestamp / 1000)}:R>]`,
          `**Newest Channel:** <#${lastestchannel.id}>\n  - <t:${Math.floor(lastestchannel.createdTimestamp / 1000)}:F> [<t:${Math.floor(lastestchannel.createdTimestamp / 1000)}:R>]`,
          `**Special Channels:**\n  - **AFK:** ${guild.afkChannelId ? `<#${guild.afkChannelId}>` : "None"}\n  - **System:** ${guild.systemChannelId ? `<#${guild.systemChannelId}>` : "None"}\n  - **Widget:** ${guild.widgetChannelId ? `<#${guild.widgetChannelId}>` : "None"}\n  - **Rules:** ${guild.rulesChannelId ? `<#${guild.rulesChannelId}>` : "None"}\n  - **Public Updates:** ${guild.publicUpdatesChannelId ? `<#${guild.publicUpdatesChannelId}>` : "None"}`,
        ]
          .map((x) => "- " + x)
          .join("\n"),
      };
    }
  }
  async function loadRoleInfo() {
    if (showRoleInfo == true) {
      let roles = (await guild.roles.fetch()).filter((r) => r.id != guild.id);

      let sortedTime3 = roles.sort(
        (a, b) => a!.createdTimestamp - b!.createdTimestamp,
      );

      let oldestrole = sortedTime3.first()!;
      let lastestrole = sortedTime3.last()!;

      let sortedPosition = roles.sort((a, b) => b!.position - a!.position);
      let highestrole = sortedPosition.first()!;
      let lowestrole = sortedPosition.last()!;

      let adminRoles = roles.filter((r) =>
        r.permissions.has(PermissionFlagsBits.Administrator),
      );

      let sortPopular = roles.sort((a, b) => b!.members.size - a!.members.size);
      let mostPopular = sortPopular.first()!;
      let leastPopular = sortPopular.last()!;

      fields.roles = {
        name: "Roles Information",
        value: [
          `**Count:** ${inlineCode(roles.size + "")}`,
          `**Admins [${inlineCode(adminRoles.size + "")}]:** ${mention(5, adminRoles)}`,
          `**Oldest Role:** <@&${oldestrole.id}>\n  - <t:${Math.floor(oldestrole.createdTimestamp / 1000)}:F> [<t:${Math.floor(oldestrole.createdTimestamp / 1000)}:R>]`,
          `**Lastest Role:** <@&${lastestrole.id}>\n  - <t:${Math.floor(lastestrole.createdTimestamp / 1000)}:F> [<t:${Math.floor(lastestrole.createdTimestamp / 1000)}:R>]`,
          `**Highest Role:** <@&${highestrole.id}>`,
          `**Lowest Role:** <@&${lowestrole.id}>`,
          `**Most Popular Role:** <@&${mostPopular.id}>\n  - ${inlineCode(mostPopular.members.size + "")} members\n  - ${mention(5, mostPopular.members)}`,
          `**Least Popular Role:** <@&${leastPopular.id}>\n  - ${inlineCode(leastPopular.members.size + "")} members\n  - ${mention(5, leastPopular.members)}`,
        ]
          .map((x) => "- " + x)
          .join("\n"),
      };
    }
  }
  async function loadEmojiInfo() {
    if (showEmojiInfo == true) {
      let emojis = await guild.emojis.fetch();
      let staticEmojisCount = emojis.filter((e) => !e.animated).size;

      let sortedTime4 = emojis.sort(
        (a, b) => a!.createdTimestamp - b!.createdTimestamp,
      );
      let oldestemoji = sortedTime4.first()!;
      let lastestemoji = sortedTime4.last()!;

      fields.emojis = {
        name: "Emojis Information",
        value: [
          `**Count:** ${inlineCode(emojis.size + "")}\n  - **Static:** ${inlineCode(staticEmojisCount + "")}\n  - **Animated:** ${inlineCode(emojis.size - staticEmojisCount + "")}\n  - ${mention(10, emojis)}`,
          `**Oldest Emoji:** ${oldestemoji.toString()}\n  - <t:${Math.floor(oldestemoji.createdTimestamp / 1000)}:F> [<t:${Math.floor(oldestemoji.createdTimestamp / 1000)}:R>]`,
          `**Lastest Emoji:** ${lastestemoji.toString()}\n  - <t:${Math.floor(lastestemoji.createdTimestamp / 1000)}:F> [<t:${Math.floor(lastestemoji.createdTimestamp / 1000)}:R>]`,
        ]
          .map((x) => "- " + x)
          .join("\n"),
      };
    }
  }

  let promises = [
    loadMemberInfo(),
    loadChannelInfo(),
    loadRoleInfo(),
    loadEmojiInfo(),
  ];
  await Promise.all(promises);

  if (fields.members) embed.addFields(fields.members);
  if (fields.channels) embed.addFields(fields.channels);
  if (fields.roles) embed.addFields(fields.roles);
  if (fields.emojis) embed.addFields(fields.emojis);

  let row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel(`Fetched in ${((performance.now() - time) / 1000).toFixed(2)}s`)
      .setCustomId("fetch")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
  );

  await ctx.reply({
    embeds: [embed],
    components: [row],
  });
}

async function searchUser(ctx: Context) {
  let time = performance.now();
  let q = ctx.interaction.options.getString("query") ?? ctx.user.id;
  if (isNaN(Number(q)))
    return await ctx.reply({
      content: "Please provide a valid user id (Got " + q + ")",
    });
  let user: User;
  try {
    user = await ctx.client.users.fetch(q, { force: true });
  } catch {
    await ctx.reply({
      content: "Couldn't find user with id " + q,
    });
    return;
  }

  let showMutualGuilds =
    ctx.interaction.options.getBoolean("mutual-guilds") ?? true;

  let embed = new EmbedBuilder()
    .setAuthor({
      name: "@" + user.username,
      iconURL: user.displayAvatarURL(),
    })
    .setThumbnail(user.displayAvatarURL())
    .setColor(ctx.config.colors.main);

  if (user.bannerURL()) embed.setImage(user.bannerURL()!);

  embed.addFields({
    name: "User Information",
    value: [
      `**Name:** **[${user.discriminator == "0" ? "@" + user.username : user.tag}](https://discord.com/users/${user.id})**`,
      `**ID:** ${inlineCode(user.id)}`,
      `**Bot:** ${user.bot ? "Yes" : "No"}`,
      `**Created:** <t:${Math.floor(user.createdTimestamp / 1000)}:F> [<t:${Math.floor(user.createdTimestamp / 1000)}:R>]`,
    ]
      .map((x) => "- " + x)
      .join("\n"),
  });

  if (showMutualGuilds) {
    let guilds = await ctx.userMutualGuilds(user);
    embed.addFields({
      name: "Mutual Guilds",
      value: [
        `**Count:** ${inlineCode(guilds.size + "")}\n  - ${mention(Infinity, guilds)}`,
      ]
        .map((x) => "- " + x)
        .join("\n"),
    });
  }

  let row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel(`Fetched in ${((performance.now() - time) / 1000).toFixed(2)}s`)
      .setCustomId("fetch")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
  );

  await ctx.reply({
    embeds: [embed],
    components: [row],
  });
}

function mention(n: number, col: Collection<string, any>): string {
  if (n == Infinity) n = col.size;
  if (col.size == 0) return "*Nothing To Show*";
  if (col.size <= n) {
    return col
      .map((x) => s(x))
      .map(
        (x, i) =>
          x + (i == col.size - 2 ? " and" : i == col.size - 1 ? "" : ","),
      )
      .join(" ");
  } else {
    let prefix = col
      .map((x) => s(x))
      .slice(0, n - 1)
      .join(", ");
    return prefix + " and " + (col.size - n) + " more";
  }

  function s(x: any) {
    if (x instanceof User) {
      return `**[@${x.username}](https://discord.com/users/${x.id})**`;
    }
    if (x.user instanceof User) return s(x.user);
    if (x instanceof Guild) return `**${x.name}**`;
    return x.toString();
  }
}
