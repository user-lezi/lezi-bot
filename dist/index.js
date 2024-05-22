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
    let stats = await (0, helpers_1.getBotStats)(readyClient);
    console.log(`Guilds: ${stats.guilds}, Users: ${stats.users}`);
});
client.on(discord_js_1.Events.MessageCreate, require("./debug").default);
client.on(discord_js_1.Events.InteractionCreate, async function (interaction) {
    if (interaction.isChatInputCommand()) {
        if (interaction.isCommand()) {
            let command = commands.get(interaction.commandName);
            if (!command)
                return;
            let ctx = new helpers_1.Context(interaction, command, commands);
            await command.execute(ctx);
        }
    }
    else if (interaction.isAutocomplete()) {
        let command = commands.get(interaction.commandName);
        if (!command)
            return;
        await command.autocomplete?.(interaction);
    }
});
client.login(process.env.BotToken);
//# sourceMappingURL=index.js.map