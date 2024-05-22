import { AutocompleteInteraction, Client, Collection, CommandInteraction, SlashCommandBuilder, User } from "discord.js";
export declare function getBotStats(client: Client): Promise<{
    guilds: number;
    users: number;
}>;
export declare class Context {
    interaction: CommandInteraction;
    command: SlashData;
    commands: Collection<string, SlashData>;
    config: any;
    constructor(interaction: CommandInteraction, command: SlashData, commands: Collection<string, SlashData>);
    get client(): Client<true>;
    get application(): import("discord.js").ClientApplication;
    get guild(): import("discord.js").Guild | null;
    get channel(): import("discord.js").TextBasedChannel | null;
    get user(): User;
    get applicationCommand(): import("discord.js").ApplicationCommand<{}> | import("discord.js").ApplicationCommand<{
        guild: import("discord.js").GuildResolvable;
    }> | null;
}
export interface SlashData {
    data: SlashCommandBuilder;
    execute: (ctx: Context) => Promise<unknown>;
    autocomplete?: (interaction: AutocompleteInteraction) => Promise<unknown>;
}
export declare function handleSlashCommands(): Collection<string, SlashData>;
export declare function registerCommands(commands: Collection<string, SlashData>, client: Client<true>): Promise<void>;
//# sourceMappingURL=helpers.d.ts.map