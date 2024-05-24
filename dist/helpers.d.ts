import { AutocompleteInteraction, TextBasedChannel, Client, Collection, CommandInteraction, Guild, SlashCommandBuilder, User } from "discord.js";
export declare function getBotStats(client: Client): Promise<{
    guilds: number;
    users: number;
    members: number;
    channels: number;
    commands: any;
    uptime: number;
}>;
export declare class Context {
    interaction: CommandInteraction;
    command: SlashData;
    commands: Collection<string, SlashData>;
    config: any;
    constructor(interaction: CommandInteraction, command: SlashData, commands: Collection<string, SlashData>);
    get client(): Client<true>;
    get application(): import("discord.js").ClientApplication;
    get guild(): Guild;
    get channel(): TextBasedChannel;
    get user(): User;
    get applicationCommand(): import("discord.js").ApplicationCommand<{}> | import("discord.js").ApplicationCommand<{
        guild: import("discord.js").GuildResolvable;
    }> | null;
    fakelink(text: string): string;
}
export interface SlashData {
    data: SlashCommandBuilder;
    execute: (ctx: Context) => Promise<unknown>;
    autocomplete?: (interaction: AutocompleteInteraction) => Promise<unknown>;
    metadata?: {
        [key: string]: any;
    };
}
export declare function handleSlashCommands(): Collection<string, SlashData>;
export declare function registerCommands(commands: Collection<string, SlashData>, client: Client<true>): Promise<void>;
//# sourceMappingURL=helpers.d.ts.map