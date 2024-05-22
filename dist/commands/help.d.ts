import { AutocompleteInteraction } from "discord.js";
import { Context } from "../helpers";
declare const _default: {
    metadata: {
        category: string;
        description: string;
    };
    data: import("discord.js").SlashCommandSubcommandsOnlyBuilder;
    execute(ctx: Context): Promise<import("discord.js").InteractionResponse<boolean> | undefined>;
    autocomplete(interaction: AutocompleteInteraction): Promise<void>;
};
export default _default;
//# sourceMappingURL=help.d.ts.map