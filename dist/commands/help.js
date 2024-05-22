"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
exports.default = {
    metadata: {
        category: "Bot",
        description: '"/help" command is divided into two subcommands: "/help commandlist" and "help command"\n- "/help commandlist" displays the list of commands that are available.\n- "/help command" displays the information for the specific command that user provides the input for.',
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
        if (ctx.interaction.options.getSubcommand() === "commandlist") {
            const commandNames = ["help"];
            const commands = [];
            for (const command of commandNames) {
                let cmd = ctx.application.commands.cache.find((c) => c.name === command);
                if (!cmd)
                    continue;
                if (cmd.options.some((o) => o.type === 1)) {
                    let subcommands = cmd.options.filter((o) => o.type === 1);
                    for (let subcommand of subcommands) {
                        commands.push({
                            id: cmd.id,
                            name: [cmd.name, subcommand.name].join(" "),
                            shortDescription: subcommand.description,
                            longDescription: ctx.commands.get(cmd.name)?.metadata?.description ||
                                "*No Description Has Been Found*",
                        });
                    }
                    continue;
                }
                commands.push({
                    id: cmd.id,
                    name: cmd.name,
                    shortDescription: cmd.description,
                    longDescription: ctx.commands.get(cmd.name)?.metadata?.description ||
                        "*No Description Has Been Found*",
                });
            }
            const footer = [
                `> Check out ${(0, discord_js_1.bold)((0, discord_js_1.hyperlink)("GitHub", "https://github.com/user-lezi/lezi-bot"))}.`,
                `> ${(0, discord_js_1.bold)((0, discord_js_1.hyperlink)("Invite", "https://discord.com/oauth2/authorize?client_id=1242474432119836683&permissions=0&scope=bot+applications.commands"))} the bot to your server.`,
            ].join("\n");
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle("Here Is The Command List")
                .setColor(ctx.config.colors.main)
                .setDescription(commands
                .map((c) => `- </${c.name}:${c.id}>\n - ${c.shortDescription}`)
                .join("\n") +
                "\n" +
                footer)
                .setFooter({
                text: `Requested by ${ctx.user.username}`,
            });
            ctx.interaction.reply({
                embeds: [embed],
            });
        }
        else if (ctx.interaction.options.getSubcommand() === "command") {
            let input = ctx.interaction.options.getString("command");
            let command = ctx.application.commands.cache.find((c) => c.name === input.split(" ")[0]);
            if (!command) {
                return await ctx.interaction.reply({
                    content: `Couldn't find ${(0, discord_js_1.bold)(input)}`,
                });
            }
            let cmd;
            if (input.includes(" ")) {
                let subcommand = input.split(" ")[1];
                let subcommandData = command.options.find((o) => o.name === subcommand);
                if (!subcommandData) {
                    return await ctx.interaction.reply({
                        content: `Couldn't find ${(0, discord_js_1.bold)(input)}`,
                    });
                }
                cmd = {
                    id: command.id,
                    name: [command.name, subcommandData.name].join(" "),
                    shortDescription: subcommandData.description,
                    longDescription: ctx.commands.get(command.name)?.metadata?.description ||
                        "*No Description Has Been Found*",
                };
            }
            else {
                cmd = {
                    id: command.id,
                    name: command.name,
                    shortDescription: command.description,
                    longDescription: ctx.commands.get(command.name)?.metadata?.description ||
                        "*No Description Has Been Found*",
                };
            }
            let embed = new discord_js_1.EmbedBuilder()
                .setColor(ctx.config.colors.main)
                .setTitle(`Command Info`)
                .setDescription(cmd.longDescription)
                .addFields({ name: "Name:", value: `</${cmd.name}:${cmd.id}>` }, { name: "Description:", value: cmd.shortDescription });
            let githubUrl = `https://github.com/user-lezi/lezi-bot/blob/main/src/commands/${cmd.name.split(" ")[0]}.ts`;
            let components = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                .setLabel("Source Code")
                .setStyle(discord_js_1.ButtonStyle.Link)
                .setURL(githubUrl));
            await ctx.interaction.reply({
                embeds: [embed],
                components: [components],
            });
        }
    },
    async autocomplete(interaction) {
        let focusedValue = interaction.options.getFocused();
        let choices = ["help commandlist", "help command"].sort();
        let filtered = choices
            .filter((choice) => choice.toLowerCase().includes(focusedValue.toLowerCase()))
            .slice(0, 25);
        await interaction.respond(filtered.map((choice) => ({ name: choice, value: choice })));
    },
};
//# sourceMappingURL=help.js.map