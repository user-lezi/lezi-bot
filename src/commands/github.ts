import {
  bold,
  hyperlink,
  EmbedBuilder,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { Context, disableButtons } from "../helpers";

let emojis = {
  user: "👤",
  organization: "🏢",
  location: "📌",
  email: "📧",
  creation: "📆",
  last_push: "📤",
  blog: "🔗",
  star: "⭐",
  size: "📦",
  language: "🌐",
};

export default {
  metadata: {
    category: "Github",
    description: JSON.stringify({
      user: "Finds and shows the information about the provided github user. The information is fetched from the GitHub API.",
      repository:
        "Finds and shows the information about the provided github repository. The information is fetched from the GitHub API.",
    }),
  },

  data: new SlashCommandBuilder()
    .setName("github")
    .setDescription("Github related commands")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("user")
        .setDescription("Gives the user info about the github user")
        .addStringOption((option) =>
          option
            .setName("username")
            .setDescription("The username of the github user")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("repository")
        .setDescription("Gives the repository info about the github repository")
        .addStringOption((option) =>
          option
            .setName("repository")
            .setDescription("The repository of the github user")
            .setRequired(true),
        ),
    ),

  async execute(ctx: Context) {
    let subcommand = ctx.subcommand();
    await ctx.interaction.deferReply();
    if (subcommand === "user") {
      await executeUser(ctx);
    }
    if (subcommand === "repository") {
      await executeRepository(ctx);
    }
  },
};

async function executeUser(ctx: Context, _username?: string) {
  let username = (_username ??
    ctx.interaction.options.getString("username")) as string;
  let data = await ctx.fetchJSON(`https://api.github.com/users/${username}`);

  if (data.message == "Not Found") {
    await ctx.reply({
      content: `Couldn't find ${bold(username)}`,
    });
    return;
  }

  let ui_embed = new EmbedBuilder()
    .setAuthor({
      name: `@${data.login}`,
      iconURL: data.avatar_url,
    })
    .setThumbnail(data.avatar_url)
    .setColor(ctx.config.colors.main);

  let ui_text: string[] = [];
  if (data.name)
    ui_text.push(
      "## " +
        emojis[data.type.toLowerCase() as keyof typeof emojis] +
        " " +
        data.name,
    );
  if (data.bio) ui_text.push("", data.bio);
  if (ui_text.length) ui_embed.setDescription(ui_text.join("\n"));

  if (data.location)
    ui_embed.addFields({
      name: `${emojis.location} Location`,
      value: data.location,
      inline: true,
    });
  if (data.email)
    ui_embed.addFields({
      name: `${emojis.email} Email`,
      value: data.email,
      inline: true,
    });
  if (data.blog)
    ui_embed.addFields({
      name: `${emojis.blog} Blog`,
      value: hyperlink(
        data.blog.replace("https://", ""),
        data.blog.startsWith("https://") ? data.blog : "https://" + data.blog,
      ),
      inline: true,
    });

  let createdAt = Date.parse(data.created_at) / 1000;
  ui_embed.addFields({
    name: `${emojis.creation} Created At`,
    value: `<t:${createdAt}:F> (<t:${createdAt}:R>)`,
    inline: false,
  });

  let row = [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel(`Followers (${data.followers})`)
        .setStyle(ButtonStyle.Primary)
        .setCustomId(`show_followers`),
      new ButtonBuilder()
        .setLabel("@" + data.login)
        .setStyle(ButtonStyle.Link)
        .setURL(data.html_url),
      new ButtonBuilder()
        .setLabel(`Followings (${data.following})`)
        .setStyle(ButtonStyle.Primary)
        .setCustomId(`show_followings`),
    ),
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel(`Repositories (${data.public_repos})`)
        .setStyle(ButtonStyle.Primary)
        .setCustomId(`show_repos`),
    ),
  ];

  let msg = await ctx.reply({
    embeds: [ui_embed],
    components: [...row],
  });

  let collector = msg.createMessageComponentCollector({
    filter: (i) => i.user.id === ctx.user.id,
    time: 30000,
  });

  let current_embed = "ui";

  collector.on("collect", async (i) => {
    collector.resetTimer();
    let customId = i.customId;

    if (customId === "show_followers") {
      if (data.followers == 0) {
        await i.reply({
          content: `${bold("@" + data.login)} has no followers.`,
          ephemeral: true,
        });
        return;
      }
      i.deferUpdate().catch(() => {});
      if (current_embed !== "followers") {
        let apiUrl = data.followers_url;
        let followers = await ctx.fetchJSON(apiUrl);
        let showOnly = 25;
        let flwers_embed = new EmbedBuilder()
          .setAuthor({
            name: `@${data.login}`,
            iconURL: data.avatar_url,
          })
          .setTitle(`Followers (${followers.length})`)
          .setColor(ctx.config.colors.main);

        let followersText: string[] = [];
        for (let i = 0; i < Math.min(followers.length, showOnly); i++) {
          followersText.push(
            `- ${emojis[followers[i].type.toLowerCase() as keyof typeof emojis] + " " + bold(hyperlink("@" + followers[i].login, followers[i].html_url))}`,
          );
        }

        if (showOnly < followers.length)
          followersText.push(
            `- ... and ${bold((followers.length - showOnly) as unknown as string)} more`,
          );

        flwers_embed.setDescription(followersText.join("\n"));

        current_embed = "followers";
        await msg.edit({
          embeds: [flwers_embed],
          components: [
            ...row,
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setLabel("View All Followers")
                .setStyle(ButtonStyle.Link)
                .setURL(data.html_url + "?tab=followers"),
            ),
          ],
        });
      } else {
        current_embed = "ui";
        await msg.edit({
          embeds: [ui_embed],
          components: [...row],
        });
      }
    }
    if (customId == "show_followings") {
      if (data.following == 0) {
        await i.reply({
          content: `${bold("@" + data.login)} has no followings.`,
          ephemeral: true,
        });
        return;
      }
      i.deferUpdate().catch(() => {});
      if (current_embed !== "followings") {
        let apiUrl = data.following_url.split("{")[0];
        let followings = await ctx.fetchJSON(apiUrl);
        let showOnly = 25;
        let flwings_embed = new EmbedBuilder()
          .setAuthor({
            name: `@${data.login}`,
            iconURL: data.avatar_url,
          })
          .setTitle(`Followings (${followings.length})`)
          .setColor(ctx.config.colors.main);

        let followingsText: string[] = [];
        for (let i = 0; i < Math.min(followings.length, showOnly); i++) {
          followingsText.push(
            `- ${emojis[followings[i].type.toLowerCase() as keyof typeof emojis] + " " + bold(hyperlink("@" + followings[i].login, followings[i].html_url))}`,
          );
        }

        if (showOnly < followings.length)
          followingsText.push(
            `- ... and ${bold((followings.length - showOnly) as unknown as string)} more`,
          );

        flwings_embed.setDescription(followingsText.join("\n"));
        current_embed = "followings";
        await msg.edit({
          embeds: [flwings_embed],
          components: [
            ...row,
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setLabel("View All Followings")
                .setStyle(ButtonStyle.Link)
                .setURL(data.html_url + "?tab=following"),
            ),
          ],
        });
      } else {
        current_embed = "ui";
        await msg.edit({
          embeds: [ui_embed],
          components: [...row],
        });
      }
    }
    if (customId == "show_repos") {
      if (data.public_repos == 0) {
        await i.reply({
          content: `${bold("@" + data.login)} has no public repositories.`,
          ephemeral: true,
        });
        return;
      }
      if (current_embed !== "repos") {
        let apiUrl = data.repos_url;
        let repos = await ctx.fetchJSON(apiUrl);
        let showOnly = 5;
        let repos_embed = new EmbedBuilder()
          .setAuthor({
            name: `@${data.login}`,
            iconURL: data.avatar_url,
          })
          .setTitle(`Repositories (${repos.length})`)
          .setColor(ctx.config.colors.main);

        repos = repos.sort((a: any, b: any) => {
          return b.stargazers_count - a.stargazers_count;
        });

        let reposText: string[] = [];
        for (let i = 0; i < Math.min(repos.length, showOnly); i++) {
          reposText.push(
            `- ${bold(hyperlink(repos[i].full_name, repos[i].html_url))}`,
            `  - **${emojis.star} ${repos[i].stargazers_count}**`,
          );
        }
        if (showOnly < repos.length)
          reposText.push(
            `- ... and ${bold((repos.length - showOnly) as unknown as string)} more`,
          );
        repos_embed.setDescription(reposText.join("\n"));
        current_embed = "repos";
        await msg.edit({
          embeds: [repos_embed],
          components: [
            ...row,
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setLabel("View All Repositories")
                .setStyle(ButtonStyle.Link)
                .setURL(data.html_url + "?tab=repositories"),
            ),
          ],
        });
      } else {
        current_embed = "ui";
        await msg.edit({
          embeds: [ui_embed],
          components: [...row],
        });
      }
    }
  });

  collector.on("end", async () => {
    await msg.edit({
      components: [
        ...row.map((e: ActionRowBuilder<ButtonBuilder>) => disableButtons(e)),
      ],
    });
  });
}

async function executeRepository(ctx: Context, _repository?: string) {
  let repository = (_repository ??
    ctx.interaction.options.getString("repository")) as string;
  let data = await ctx.fetchJSON(`https://api.github.com/repos/${repository}`);

  if (data.message == "Not Found") {
    await ctx.reply({
      content: `Couldn't find ${bold(repository)}`,
    });
    return;
  }

  let repo_embed = new EmbedBuilder()
    .setAuthor({
      name: "@" + data.owner.login,
      iconURL: data.owner.avatar_url,
    })
    .setThumbnail(data.owner.avatar_url)
    .setColor(ctx.config.colors.main);

  let repo_text: string[] = [];

  repo_text.push(
    `## ${emojis[data.owner.type.toLowerCase() as keyof typeof emojis]} @${data.full_name}`,
  );

  if (data.description) repo_text.push("", data.description);

  repo_embed.setDescription(repo_text.join("\n"));

  let createdAt = Date.parse(data.created_at) / 1000;
  let lastPushAt = Date.parse(data.pushed_at) / 1000;
  repo_embed.addFields(
    {
      name: `${emojis.creation} Created At`,
      value: `<t:${createdAt}:F> (<t:${createdAt}:R>)`,
      inline: false,
    },
    {
      name: `${emojis.last_push} Last Push`,
      value: `<t:${lastPushAt}:F> (<t:${lastPushAt}:R>)`,
      inline: true,
    },
  );

  let sizeInKB = data.size;
  let sizeInMB = sizeInKB / 1024;
  repo_embed.addFields({
    name: `${emojis.size} Size`,
    value: sizeInMB < 1 ? sizeInKB + " KB" : sizeInMB.toFixed(2) + " MB",
    inline: false,
  });
  repo_embed.addFields({
    name: `${emojis.language} Language`,
    value: data.language,
  });

  let row = [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel(`Stars (${data.stargazers_count})`)
        .setStyle(ButtonStyle.Primary)
        .setCustomId(`show_stars`),
      new ButtonBuilder()
        .setLabel("@" + data.full_name)
        .setStyle(ButtonStyle.Link)
        .setURL(data.html_url),
      new ButtonBuilder()
        .setLabel("@" + data.owner.login)
        .setStyle(ButtonStyle.Link)
        .setURL(data.owner.html_url),
      new ButtonBuilder()
        .setLabel(`Forks (${data.forks})`)
        .setStyle(ButtonStyle.Primary)
        .setCustomId(`show_forks`),
    ),
  ];

  let msg = await ctx.reply({
    embeds: [repo_embed],
    components: [...row],
  });

  let collector = msg.createMessageComponentCollector({
    filter: (i) => i.user.id === ctx.user.id,
    time: 30000,
  });

  let current_embed = "repo";

  collector.on("collect", async (i) => {
    collector.resetTimer();
    let customId = i.customId;

    if (customId === "show_stars") {
      if (data.stargazers_count == 0) {
        await i.reply({
          content: `${bold("@" + data.full_name)} has no stars.`,
          ephemeral: true,
        });
        return;
      }
      i.deferUpdate().catch(() => {});
      if (current_embed !== "stars") {
        let apiUrl = data.stargazers_url;
        let stars = await ctx.fetchJSON(apiUrl);
        let showOnly = 25;
        let stars_embed = new EmbedBuilder()
          .setAuthor({
            name: `@${data.full_name}`,
            iconURL: data.owner.avatar_url,
          })
          .setColor(ctx.config.colors.main);

        let starsText: string[] = [];
        for (let i = 0; i < Math.min(stars.length, showOnly); i++) {
          starsText.push(
            `- ${emojis[stars[i].type.toLowerCase() as keyof typeof emojis] + " " + bold(hyperlink("@" + stars[i].login, stars[i].html_url))}`,
          );
        }
        if (showOnly < stars.length)
          starsText.push(
            `- ... and ${bold((stars.length - showOnly) as unknown as string)} more`,
          );
        stars_embed.setDescription(starsText.join("\n"));
        current_embed = "stars";
        await msg.edit({
          embeds: [stars_embed],
          components: [
            ...row,
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setLabel("View All Stars")
                .setStyle(ButtonStyle.Link)
                .setURL(data.html_url + "/stargazers"),
            ),
          ],
        });
      } else {
        current_embed = "repo";
        await msg.edit({
          embeds: [repo_embed],
          components: [...row],
        });
      }
    }
    if (customId === "show_forks") {
      if (data.forks == 0) {
        await i.reply({
          content: `${bold("@" + data.full_name)} has no forks.`,
          ephemeral: true,
        });
        return;
      }
      i.deferUpdate().catch(() => {});
      if (current_embed !== "forks") {
        let apiUrl = data.forks_url;
        let forks = await ctx.fetchJSON(apiUrl);
        let showOnly = 5;
        let forks_embed = new EmbedBuilder()
          .setAuthor({
            name: `@${data.full_name}`,
            iconURL: data.owner.avatar_url,
          })
          .setColor(ctx.config.colors.main);

        let forksText: string[] = [];
        for (let i = 0; i < Math.min(forks.length, showOnly); i++) {
          forksText.push(
            `- ${emojis[forks[i].owner.type.toLowerCase() as keyof typeof emojis] + " " + bold(hyperlink("@" + forks[i].full_name, forks[i].html_url))}`,
            `  - **${emojis.star} ${forks[i].stargazers_count}**`,
          );
        }
        if (showOnly < forks.length)
          forksText.push(
            `... and ${bold((forks.length - showOnly) as unknown as string)} more`,
          );

        forks_embed.setDescription(forksText.join("\n"));
        current_embed = "forks";
        await msg.edit({
          embeds: [forks_embed],
          components: [
            ...row,
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setLabel("View All Forks")
                .setStyle(ButtonStyle.Link)
                .setURL(data.html_url + "/forks"),
            ),
          ],
        });
      } else {
        current_embed = "repo";
        await msg.edit({
          embeds: [repo_embed],
          components: [...row],
        });
      }
    }
  });

  collector.on("end", async () => {
    await msg.edit({
      components: [
        ...row.map((e: ActionRowBuilder<ButtonBuilder>) => disableButtons(e)),
      ],
    });
  });
}
