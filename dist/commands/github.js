"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const helpers_1 = require("../helpers");
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
exports.default = {
    metadata: {
        description: '"/github" command is divided into 2 subcommands: "/github user" & "/github repository"\n- "/github user" gives the user info about the github user.\n- "/github repository" gives info about the github repository',
    },
    data: new discord_js_1.SlashCommandBuilder()
        .setName("github")
        .setDescription("Github related commands")
        .addSubcommand((subcommand) => subcommand
        .setName("user")
        .setDescription("Gives the user info about the github user")
        .addStringOption((option) => option
        .setName("username")
        .setDescription("The username of the github user")
        .setRequired(true)))
        .addSubcommand((subcommand) => subcommand
        .setName("repository")
        .setDescription("Gives the repository info about the github repository")
        .addStringOption((option) => option
        .setName("repository")
        .setDescription("The repository of the github user")
        .setRequired(true))),
    async execute(ctx) {
        let subcommand = ctx.interaction.options.getSubcommand();
        await ctx.interaction.deferReply();
        if (subcommand === "user") {
            await executeUser(ctx);
        }
        if (subcommand === "repository") {
            await executeRepository(ctx);
        }
    },
};
async function executeUser(ctx, _username) {
    let username = (_username ??
        ctx.interaction.options.getString("username"));
    let data = await ctx.fetchJSON(`https://api.github.com/users/${username}`);
    if (data.message == "Not Found") {
        await ctx.interaction.editReply({
            content: `Couldn't find ${(0, discord_js_1.bold)(username)}`,
        });
        return;
    }
    let ui_embed = new discord_js_1.EmbedBuilder()
        .setAuthor({
        name: `@${data.login}`,
        iconURL: data.avatar_url,
    })
        .setThumbnail(data.avatar_url)
        .setColor(ctx.config.colors.main);
    let ui_text = [];
    if (data.name)
        ui_text.push("## " +
            emojis[data.type.toLowerCase()] +
            " " +
            data.name);
    if (data.bio)
        ui_text.push("", data.bio);
    if (ui_text.length)
        ui_embed.setDescription(ui_text.join("\n"));
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
            value: (0, discord_js_1.hyperlink)(data.blog.replace("https://", ""), data.blog.startsWith("https://") ? data.blog : "https://" + data.blog),
            inline: true,
        });
    let createdAt = Date.parse(data.created_at) / 1000;
    ui_embed.addFields({
        name: `${emojis.creation} Created At`,
        value: `<t:${createdAt}:F> (<t:${createdAt}:R>)`,
        inline: false,
    });
    let row = [
        new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setLabel(`Followers (${data.followers})`)
            .setStyle(discord_js_1.ButtonStyle.Primary)
            .setCustomId(`show_followers`), new discord_js_1.ButtonBuilder()
            .setLabel("@" + data.login)
            .setStyle(discord_js_1.ButtonStyle.Link)
            .setURL(data.html_url), new discord_js_1.ButtonBuilder()
            .setLabel(`Followings (${data.following})`)
            .setStyle(discord_js_1.ButtonStyle.Primary)
            .setCustomId(`show_followings`)),
        new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setLabel(`Repositories (${data.public_repos})`)
            .setStyle(discord_js_1.ButtonStyle.Primary)
            .setCustomId(`show_repos`)),
    ];
    let msg = await ctx.interaction.editReply({
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
                    content: `${(0, discord_js_1.bold)("@" + data.login)} has no followers.`,
                    ephemeral: true,
                });
                return;
            }
            i.deferUpdate().catch(() => { });
            if (current_embed !== "followers") {
                let apiUrl = data.followers_url;
                let followers = await ctx.fetchJSON(apiUrl);
                let showOnly = 25;
                let flwers_embed = new discord_js_1.EmbedBuilder()
                    .setAuthor({
                    name: `@${data.login}`,
                    iconURL: data.avatar_url,
                })
                    .setTitle(`Followers (${followers.length})`)
                    .setColor(ctx.config.colors.main);
                let followersText = [];
                for (let i = 0; i < Math.min(followers.length, showOnly); i++) {
                    followersText.push(`- ${emojis[followers[i].type.toLowerCase()] + " " + (0, discord_js_1.bold)((0, discord_js_1.hyperlink)("@" + followers[i].login, followers[i].html_url))}`);
                }
                if (showOnly < followers.length)
                    followersText.push(`- ... and ${(0, discord_js_1.bold)((followers.length - showOnly))} more`);
                flwers_embed.setDescription(followersText.join("\n"));
                current_embed = "followers";
                await msg.edit({
                    embeds: [flwers_embed],
                    components: [
                        ...row,
                        new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                            .setLabel("View All Followers")
                            .setStyle(discord_js_1.ButtonStyle.Link)
                            .setURL(data.html_url + "?tab=followers")),
                    ],
                });
            }
            else {
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
                    content: `${(0, discord_js_1.bold)("@" + data.login)} has no followings.`,
                    ephemeral: true,
                });
                return;
            }
            i.deferUpdate().catch(() => { });
            if (current_embed !== "followings") {
                let apiUrl = data.following_url.split("{")[0];
                let followings = await ctx.fetchJSON(apiUrl);
                let showOnly = 25;
                let flwings_embed = new discord_js_1.EmbedBuilder()
                    .setAuthor({
                    name: `@${data.login}`,
                    iconURL: data.avatar_url,
                })
                    .setTitle(`Followings (${followings.length})`)
                    .setColor(ctx.config.colors.main);
                let followingsText = [];
                for (let i = 0; i < Math.min(followings.length, showOnly); i++) {
                    followingsText.push(`- ${emojis[followings[i].type.toLowerCase()] + " " + (0, discord_js_1.bold)((0, discord_js_1.hyperlink)("@" + followings[i].login, followings[i].html_url))}`);
                }
                if (showOnly < followings.length)
                    followingsText.push(`- ... and ${(0, discord_js_1.bold)((followings.length - showOnly))} more`);
                flwings_embed.setDescription(followingsText.join("\n"));
                current_embed = "followings";
                await msg.edit({
                    embeds: [flwings_embed],
                    components: [
                        ...row,
                        new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                            .setLabel("View All Followings")
                            .setStyle(discord_js_1.ButtonStyle.Link)
                            .setURL(data.html_url + "?tab=following")),
                    ],
                });
            }
            else {
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
                    content: `${(0, discord_js_1.bold)("@" + data.login)} has no public repositories.`,
                    ephemeral: true,
                });
                return;
            }
            if (current_embed !== "repos") {
                let apiUrl = data.repos_url;
                let repos = await ctx.fetchJSON(apiUrl);
                let showOnly = 5;
                let repos_embed = new discord_js_1.EmbedBuilder()
                    .setAuthor({
                    name: `@${data.login}`,
                    iconURL: data.avatar_url,
                })
                    .setTitle(`Repositories (${repos.length})`)
                    .setColor(ctx.config.colors.main);
                repos = repos.sort((a, b) => {
                    return b.stargazers_count - a.stargazers_count;
                });
                let reposText = [];
                for (let i = 0; i < Math.min(repos.length, showOnly); i++) {
                    reposText.push(`- ${(0, discord_js_1.bold)((0, discord_js_1.hyperlink)(repos[i].full_name, repos[i].html_url))}`, `  - **${emojis.star} ${repos[i].stargazers_count}**`);
                }
                if (showOnly < repos.length)
                    reposText.push(`- ... and ${(0, discord_js_1.bold)((repos.length - showOnly))} more`);
                repos_embed.setDescription(reposText.join("\n"));
                current_embed = "repos";
                await msg.edit({
                    embeds: [repos_embed],
                    components: [
                        ...row,
                        new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                            .setLabel("View All Repositories")
                            .setStyle(discord_js_1.ButtonStyle.Link)
                            .setURL(data.html_url + "?tab=repositories")),
                    ],
                });
            }
            else {
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
                ...row.map((e) => (0, helpers_1.disableButtons)(e)),
            ],
        });
    });
}
async function executeRepository(ctx, _repository) {
    let repository = (_repository ??
        ctx.interaction.options.getString("repository"));
    let data = await ctx.fetchJSON(`https://api.github.com/repos/${repository}`);
    if (data.message == "Not Found") {
        await ctx.interaction.editReply({
            content: `Couldn't find ${(0, discord_js_1.bold)(repository)}`,
        });
        return;
    }
    let repo_embed = new discord_js_1.EmbedBuilder()
        .setAuthor({
        name: "@" + data.owner.login,
        iconURL: data.owner.avatar_url,
    })
        .setThumbnail(data.owner.avatar_url)
        .setColor(ctx.config.colors.main);
    let repo_text = [];
    repo_text.push(`## ${emojis[data.owner.type.toLowerCase()]} @${data.full_name}`);
    if (data.description)
        repo_text.push("", data.description);
    repo_embed.setDescription(repo_text.join("\n"));
    let createdAt = Date.parse(data.created_at) / 1000;
    let lastPushAt = Date.parse(data.pushed_at) / 1000;
    repo_embed.addFields({
        name: `${emojis.creation} Created At`,
        value: `<t:${createdAt}:F> (<t:${createdAt}:R>)`,
        inline: false,
    }, {
        name: `${emojis.last_push} Last Push`,
        value: `<t:${lastPushAt}:F> (<t:${lastPushAt}:R>)`,
        inline: true,
    });
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
        new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setLabel(`Stars (${data.stargazers_count})`)
            .setStyle(discord_js_1.ButtonStyle.Primary)
            .setCustomId(`show_stars`), new discord_js_1.ButtonBuilder()
            .setLabel("@" + data.full_name)
            .setStyle(discord_js_1.ButtonStyle.Link)
            .setURL(data.html_url), new discord_js_1.ButtonBuilder()
            .setLabel("@" + data.author.login)
            .setStyle(discord_js_1.ButtonStyle.Link)
            .setURL(data.author.html_url), new discord_js_1.ButtonBuilder()
            .setLabel(`Forks (${data.forks})`)
            .setStyle(discord_js_1.ButtonStyle.Primary)
            .setCustomId(`show_forks`)),
    ];
    let msg = await ctx.interaction.editReply({
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
                    content: `${(0, discord_js_1.bold)("@" + data.full_name)} has no stars.`,
                    ephemeral: true,
                });
                return;
            }
            i.deferUpdate().catch(() => { });
            if (current_embed !== "stars") {
                let apiUrl = data.stargazers_url;
                let stars = await ctx.fetchJSON(apiUrl);
                let showOnly = 25;
                let stars_embed = new discord_js_1.EmbedBuilder()
                    .setAuthor({
                    name: `@${data.full_name}`,
                    iconURL: data.owner.avatar_url,
                })
                    .setColor(ctx.config.colors.main);
                let starsText = [];
                for (let i = 0; i < Math.min(stars.length, showOnly); i++) {
                    starsText.push(`- ${emojis[stars[i].type.toLowerCase()] + " " + (0, discord_js_1.bold)((0, discord_js_1.hyperlink)("@" + stars[i].login, stars[i].html_url))}`);
                }
                if (showOnly < stars.length)
                    starsText.push(`- ... and ${(0, discord_js_1.bold)((stars.length - showOnly))} more`);
                stars_embed.setDescription(starsText.join("\n"));
                current_embed = "stars";
                await msg.edit({
                    embeds: [stars_embed],
                    components: [
                        ...row,
                        new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                            .setLabel("View All Stars")
                            .setStyle(discord_js_1.ButtonStyle.Link)
                            .setURL(data.html_url + "/stargazers")),
                    ],
                });
            }
            else {
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
                    content: `${(0, discord_js_1.bold)("@" + data.full_name)} has no forks.`,
                    ephemeral: true,
                });
                return;
            }
            i.deferUpdate().catch(() => { });
            if (current_embed !== "forks") {
                let apiUrl = data.forks_url;
                let forks = await ctx.fetchJSON(apiUrl);
                let showOnly = 5;
                let forks_embed = new discord_js_1.EmbedBuilder()
                    .setAuthor({
                    name: `@${data.full_name}`,
                    iconURL: data.owner.avatar_url,
                })
                    .setColor(ctx.config.colors.main);
                let forksText = [];
                for (let i = 0; i < Math.min(forks.length, showOnly); i++) {
                    forksText.push(`- ${emojis[forks[i].owner.type.toLowerCase()] + " " + (0, discord_js_1.bold)((0, discord_js_1.hyperlink)("@" + forks[i].full_name, forks[i].html_url))}`, `  - **${emojis.star} ${forks[i].stargazers_count}**`);
                }
                if (showOnly < forks.length)
                    forksText.push(`... and ${(0, discord_js_1.bold)((forks.length - showOnly))} more`);
                forks_embed.setDescription(forksText.join("\n"));
                current_embed = "forks";
                await msg.edit({
                    embeds: [forks_embed],
                    components: [
                        ...row,
                        new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                            .setLabel("View All Forks")
                            .setStyle(discord_js_1.ButtonStyle.Link)
                            .setURL(data.html_url + "/forks")),
                    ],
                });
            }
            else {
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
                ...row.map((e) => (0, helpers_1.disableButtons)(e)),
            ],
        });
    });
}
//# sourceMappingURL=github.js.map