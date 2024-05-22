"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCommands = exports.handleSlashCommands = exports.Context = exports.getBotStats = void 0;
const discord_js_1 = require("discord.js");
const fs_1 = require("fs");
const path_1 = require("path");
async function getBotStats(client) {
    const guilds = client.guilds.cache.size;
    const users = client.users.cache.size;
    return {
        guilds,
        users,
    };
}
exports.getBotStats = getBotStats;
class Context {
    interaction;
    command;
    commands;
    config;
    constructor(interaction, command, commands) {
        this.interaction = interaction;
        this.command = command;
        this.commands = commands;
        this.config = {
            colors: {
                main: 0xff8080,
            },
        };
    }
    get client() {
        return this.interaction.client;
    }
    get application() {
        return this.client.application;
    }
    get guild() {
        return this.interaction.guild;
    }
    get channel() {
        return this.interaction.channel;
    }
    get user() {
        return this.interaction.user;
    }
    get applicationCommand() {
        return this.interaction.command;
    }
}
exports.Context = Context;
function handleSlashCommands() {
    const commandFiles = (0, fs_1.readdirSync)((0, path_1.join)(__dirname, "commands")).filter((file) => file.endsWith(".js"));
    const commands = new discord_js_1.Collection();
    for (const file of commandFiles) {
        const command = require((0, path_1.join)(__dirname, "commands", file)).default;
        commands.set(command.data.name, command);
        console.log(`- Loaded command /${command.data.name}`);
    }
    return commands;
}
exports.handleSlashCommands = handleSlashCommands;
async function registerCommands(commands, client) {
    let clientId = client.user.id;
    const rest = new discord_js_1.REST().setToken(client.token);
    const body = [];
    commands.forEach((command) => {
        body.push(command.data.toJSON());
    });
    let data = (await rest.put(discord_js_1.Routes.applicationCommands(clientId), {
        body,
    }));
    console.log(`# Registered ${data.length} commands`);
}
exports.registerCommands = registerCommands;
//# sourceMappingURL=helpers.js.map