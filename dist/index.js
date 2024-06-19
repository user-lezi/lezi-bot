"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const helpers_1 = require("./helpers");
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.GuildMembers,
        discord_js_1.GatewayIntentBits.MessageContent,
        discord_js_1.GatewayIntentBits.DirectMessages,
    ],
    presence: {
        status: "online",
        afk: true,
    },
});
Reflect.set(discord_js_1.DefaultWebSocketManagerOptions.identifyProperties, "browser", "Discord iOS");
const commands = (0, helpers_1.handleSlashCommands)();
client.on(discord_js_1.Events.ClientReady, async function (readyClient) {
    await (0, helpers_1.registerCommands)(commands, readyClient);
    console.log(`${readyClient.user.tag} is ready!!`);
    await client.application?.fetch();
    await client.application?.commands?.fetch();
    require("./ready").default(client);
    require("./backendApi").default(readyClient);
});
client.on(discord_js_1.Events.MessageCreate, require("./debug").default);
client.on(discord_js_1.Events.InteractionCreate, async function (interaction) {
    try {
        if (interaction.isChatInputCommand()) {
            if (interaction.isCommand()) {
                let command = commands.get(interaction.commandName);
                if (!command)
                    return;
                if (!command.available) {
                    return await interaction.reply({
                        content: `This command is not available at the moment!`,
                        ephemeral: true,
                    });
                }
                let ctx = new helpers_1.Context(interaction, command, commands);
                try {
                    await command.execute(ctx);
                }
                catch (err) {
                    let obj = {
                        content: "😅 An Error Occurred!!\nThis error is reported to the developer and hope it will be fixed soon!",
                    };
                    let msg;
                    if (ctx.interaction.deferred || ctx.interaction.replied) {
                        if (ctx.interaction.replied)
                            msg = await ctx.interaction.followUp(obj);
                        else
                            msg = await ctx.interaction.editReply(obj);
                    }
                    else {
                        msg = (await ctx.interaction.reply(obj));
                    }
                    let dev = await client.users.fetch("910837428862984213");
                    commands.get(interaction.commandName).available = false;
                    let embed_1 = new discord_js_1.EmbedBuilder()
                        .setColor(ctx.config.colors.main)
                        .setTitle("Error Report!")
                        .setDescription((0, discord_js_1.codeBlock)("js", err.stack))
                        .setAuthor({
                        name: ctx.client.user.username,
                        iconURL: ctx.client.user.displayAvatarURL(),
                    });
                    let embed_2 = new discord_js_1.EmbedBuilder()
                        .setColor(ctx.config.colors.main)
                        .setTitle("Information")
                        .setTimestamp()
                        .addFields({
                        name: "User",
                        value: `**[@${ctx.user.username}](https://www.discord.com/users/${ctx.user.id})** | <@${ctx.user.id}>`,
                    }, {
                        name: "Command",
                        value: `**${ctx.command.data.name}** | </${ctx.command.data.name}:${ctx.interaction.commandId}>`,
                    }, {
                        name: "Message",
                        value: `**[#${ctx.interaction.channel?.name}](https://www.discord.com/channels/${ctx.guild.id}/${ctx.channel.id}/${msg.id})** | <#${ctx.interaction.channelId}>`,
                    });
                    dev.send({
                        embeds: [embed_1, embed_2],
                    });
                }
            }
        }
        else if (interaction.isAutocomplete()) {
            let command = commands.get(interaction.commandName);
            if (!command)
                return;
            await command.autocomplete?.(interaction);
        }
    }
    catch { }
});
client.login(process.env.BotToken);
//# sourceMappingURL=index.js.map