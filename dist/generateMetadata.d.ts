import { ApplicationCommandOptionType } from "discord.js";
export interface Command {
    name: string;
    mainName: string;
    shortDescription: string;
    longDescription: string;
    category: string;
    path: {
        ts: string;
        js: string;
    };
    options: CommandOptions[];
}
export interface CommandOptions {
    name: string;
    description: string;
    type: ApplicationCommandOptionType;
    required: boolean;
}
//# sourceMappingURL=generateMetadata.d.ts.map