"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disableButtons = exports.registerCommands = exports.handleSlashCommands = exports.Context = exports.getBotStats = void 0;
const discord_js_1 = require("discord.js");
const fs_1 = require("fs");
const path_1 = require("path");
const node_fetch_1 = __importDefault(require("node-fetch"));
async function getBotStats(client) {
    const guilds = client.guilds.cache.size;
    const users = client.users.cache.size;
    const members = client.guilds.cache.reduce((a, g) => a + g.memberCount, 0);
    const channels = client.channels.cache.size;
    const commands = require("../metadata/commands.json").length;
    return {
        guilds,
        users,
        members,
        channels,
        commands,
        uptime: client.uptime,
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
            channels: {
                ready: "1252948790688612454",
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
    async randomGuild() {
        let guilds = this.client.guilds.cache.map((x) => x);
        let random = guilds[Math.floor(Math.random() * guilds.length)];
        return await random.fetch();
    }
    async randomUser() {
        let guild = await this.randomGuild();
        let users = await guild.members.fetch();
        let random = users.filter((x) => !x.user.bot).random();
        return random.user;
    }
    fakelink(text) {
        text = encodeURIComponent(text);
        return `https://www.youtube.com/results?search_query=${text}`;
    }
    async fetch(url, options = {}) {
        return await (0, node_fetch_1.default)(url, options);
    }
    async fetchText(url, options = {}) {
        return await this.fetch(url, options).then((res) => res.text());
    }
    async fetchJSON(url, options = {}) {
        return await this.fetch(url, options).then((res) => res.json());
    }
    bar(current, max, size = 10, blank = "◼️", fill = "⬜") {
        let bar = "";
        let percentage = current / max;
        let progress = Math.round(size * percentage);
        for (let i = 0; i < progress; i++) {
            bar += fill;
        }
        for (let i = progress; i < size; i++) {
            bar += blank;
        }
        return bar;
    }
}
exports.Context = Context;
function handleSlashCommands() {
    const commandFiles = (0, fs_1.readdirSync)((0, path_1.join)(__dirname, "commands")).filter((file) => file.endsWith(".js"));
    const commands = new discord_js_1.Collection();
    for (const file of commandFiles) {
        const command = require((0, path_1.join)(__dirname, "commands", file)).default;
        command.available = true;
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
function disableButtons(row) {
    row.components.forEach((component) => {
        component.setDisabled(true);
    });
    return row;
}
exports.disableButtons = disableButtons;
//# sourceMappingURL=helpers.js.map