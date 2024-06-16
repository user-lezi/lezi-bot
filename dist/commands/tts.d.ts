import { AutocompleteInteraction } from "discord.js";
import { Context } from "../helpers";
declare const _default: {
    metadata: {
        category: string;
        description: string;
    };
    data: import("discord.js").SlashCommandOptionsOnlyBuilder;
    execute(ctx: Context): Promise<import("discord.js").Message<boolean> | undefined>;
    autocomplete(interaction: AutocompleteInteraction): Promise<void>;
};
export default _default;
//# sourceMappingURL=tts.d.ts.map