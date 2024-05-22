import { Client, Collection, CommandInteraction, SlashCommandBuilder } from "discord.js";
export declare function getBotStats(client: Client): Promise<{
    guilds: number;
    users: number;
}>;
interface SlashData {
    data: SlashCommandBuilder;
    execute: (client: Client, interaction: CommandInteraction, command: SlashData) => Promise<unknown>;
}
export declare function handleSlashCommands(): Collection<string, SlashData>;
export declare function registerCommands(commands: Collection<string, SlashData>, client: Client<true>): Promise<void>;
export {};
//# sourceMappingURL=helpers.d.ts.map