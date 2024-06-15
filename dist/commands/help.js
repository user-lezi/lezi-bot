"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
exports.default = {
    metadata: {
        category: "Utility",
        description: JSON.stringify({
            commandlist: "Shows a list of all commands, their category and some bot related links.",
            command: "Shows information about a specific command.",
        }),
    },
    data: new discord_js_1.SlashCommandBuilder()
        .setName("help")
        .setDescription("Need help?")
        .addSubcommand((subcommand) => subcommand
        .setName("commandlist")
        .setDescription("Shows the list of available commands"))
        .addSubcommand((subcommand) => subcommand
        .setName("command")
        .setDescription("Shows information about a specific command")
        .addStringOption((option) => option
        .setName("command")
        .setDescription("The command you want to get information about")
        .setRequired(true)
        .setAutocomplete(true))),
    async execute(ctx) {
        await ctx.interaction.deferReply().catch(() => { });
        let sub = ctx.interaction.options.getSubcommand();
        if (sub === "commandlist") {
            await showCommandList(ctx);
        }
        else if (sub === "command") {
            await showCommandInfo(ctx);
        }
    },
    async autocomplete(interaction) {
        let focusedValue = interaction.options.getFocused();
        let choices = require("../../metadata/commands")
            .map((x) => x.name)
            .sort();
        let filtered = choices
            .filter((choice) => choice.toLowerCase().includes(focusedValue.toLowerCase()))
            .slice(0, 25);
        await interaction.respond(filtered.map((choice) => ({ name: "/" + choice, value: choice })));
    },
};
async function showCommandList(ctx) {
    let commands = require("../../metadata/commands");
    let categorys = new discord_js_1.Collection();
    for (let command of commands) {
        if (!categorys.has(command.category)) {
            categorys.set(command.category, []);
        }
        categorys.get(command.category)?.push(command);
    }
    let embed = new discord_js_1.EmbedBuilder()
        .setAuthor({
        name: "Command List",
        iconURL: ctx.client.user.displayAvatarURL(),
    })
        .setTimestamp()
        .setColor(ctx.config.colors.main);
    let descriptionLines = [];
    for (let [category, commands] of categorys) {
        descriptionLines.push(`## ${category}`);
        for (let command of commands) {
            let cmd = ctx.application.commands.cache.find((x) => x.name === command.mainName);
            descriptionLines.push(`- </${command.name}:${cmd.id}>`, `  - ${command.shortDescription}`);
        }
    }
    descriptionLines.push(`## Links`, `- **[Invite](${ctx.client.generateInvite({
        scopes: [discord_js_1.OAuth2Scopes.Bot, discord_js_1.OAuth2Scopes.ApplicationsCommands],
    })})**`, `- **[GitHub](https://github.com/user-lezi/lezi-bot)**`, `- **[Developer @leziuwu](https://www.discord.com/users/910837428862984213)**`);
    let someRandomUser = await ctx.randomUser();
    let randomCommand = commands[Math.floor(Math.random() * commands.length)];
    let randomCmd = ctx.application.commands.cache.find((x) => x.name === randomCommand.mainName);
    let someFooters = [
        `Use </help command:${ctx.application.commands.cache.find((x) => x.name === "help").id}> to get more information about a specific command.`,
        `Here is a random user: **[@${someRandomUser.username}](https://www.discord.com/users/${someRandomUser.id})**`,
        `*Nothing here to see...*`,
        `Why not try to use </${randomCommand.name}:${randomCmd.id}>?`,
    ];
    descriptionLines.push("", `> ${someFooters[Math.floor(Math.random() * someFooters.length)]}`);
    embed.setDescription(descriptionLines.join("\n"));
    let row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId("author")
        .setLabel(`Requested By @${ctx.user.username}`)
        .setStyle(discord_js_1.ButtonStyle.Secondary)
        .setDisabled(true));
    await ctx.interaction.editReply({
        embeds: [embed],
        components: [row],
    });
}
async function showCommandInfo(ctx) {
    let input = ctx.interaction.options.getString("command");
    let commands = require("../../metadata/commands");
    let command = commands.find((x) => x.name === input.replace("/", "").toLowerCase());
    if (!command) {
        let mostApproxList = findSimilar(input.replace("/", ""), commands.map((x) => x.name), 3);
        let didyoumean = mostApproxList.length
            ? [
                `- **Did You Mean:**`,
                ...mostApproxList.map((x) => {
                    let cmd = ctx.application.commands.cache.find((y) => y.name === x[0].split(" ")[0]);
                    return `- </${x[0]}:${cmd.id}> / ${(0, discord_js_1.inlineCode)((x[1] * 100).toFixed(2) + "%")}`;
                }),
            ].join("\n")
            : "";
        await ctx.interaction.editReply({
            content: `Couldn't find ${(0, discord_js_1.inlineCode)(input)}\n${didyoumean}`,
        });
        return;
    }
    let cmd = ctx.application.commands.cache.find((x) => x.name === command.mainName);
    let embed = new discord_js_1.EmbedBuilder()
        .setAuthor({
        name: `Command Info • ${command.category}`,
        iconURL: ctx.client.user.displayAvatarURL(),
    })
        .setColor(ctx.config.colors.main);
    let descriptionLines = [
        `# </${command.name}:${cmd.id}>`,
        ...command.longDescription.split("\n").map((x) => "> " + x),
    ];
    if (command.options.length) {
        descriptionLines.push(`## Options`, ...command.options.map((x) => parseOption(x)));
    }
    if (!ctx.commands.get(command.mainName).available) {
        descriptionLines.push("> " + (0, discord_js_1.bold)(`⚠️ This command is currently disabled.`));
    }
    embed.setDescription(descriptionLines.join("\n"));
    let row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setURL(github(command.path.ts))
        .setLabel(`Source Code`)
        .setStyle(discord_js_1.ButtonStyle.Link));
    await ctx.interaction.editReply({
        embeds: [embed],
        components: [row],
    });
}
function findSimilar(input, list, n = 3) {
    let newlist = [];
    for (let i = 0; i < list.length; i++) {
        let similarity = similarityRatio(input, list[i]);
        newlist.push([list[i], similarity]);
    }
    return softmaxList(newlist.sort((a, b) => b[1] - a[1]).slice(0, n));
}
function softmaxList(list) {
    let sum = 0;
    let e = (n) => Math.exp(n);
    for (let i = 0; i < list.length; i++) {
        sum += e(list[i][1]);
    }
    for (let i = 0; i < list.length; i++) {
        list[i][1] = e(list[i][1]) / sum;
    }
    return list;
}
function similarityRatio(a, b) {
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
function editDistance(a, b) {
    if (a.length === 0)
        return b.length;
    if (b.length === 0)
        return a.length;
    let matrix = [];
    let i;
    for (i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    let j;
    for (j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    for (i = 1; i <= b.length; i++) {
        for (j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            }
            else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
            }
        }
    }
    return matrix[b.length][a.length];
}
function github(path) {
    return "https://github.com/user-lezi/lezi-bot/blob/main/" + path;
}
function parseOption(option) {
    return `- ${(0, discord_js_1.bold)(`[${option.name + (option.required ? "" : "?")}](https://youtube.com/watch?v=dQw4w9WgXcQ)`)} [**${option.required ? "Required" : "Optional"}** • **${discord_js_1.ApplicationCommandOptionType[option.type]}**]\n  - ${option.description}`;
}
//# sourceMappingURL=help.js.map