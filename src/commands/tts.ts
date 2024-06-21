import {
  AttachmentBuilder,
  SlashCommandBuilder,
  AutocompleteInteraction,
  bold,
} from "discord.js";
import { createAudioFile } from "simple-tts-mp3";
import { unlinkSync } from "fs";
import { Context } from "../helpers";

interface Lang {
  code: string;
  name: string;
}

const langs: Lang[] = require("../../metadata/tts-languages.json");

export default {
  metadata: {
    category: "Utility",
    description:
      "Converts text to speech. Available Languages at [GitHub](https://github.com/user-lezi/lezi-bot/tree/main/metadata/tts-languagues.json)",
  },
  data: new SlashCommandBuilder()
    .setName("tts")
    .setDescription("Converts text to speech.")
    .addStringOption((option) =>
      option
        .setName("text")
        .setDescription("The text to convert to speech.")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("language")
        .setDescription("The language to convert the text to.")
        .setRequired(false)
        .setAutocomplete(true),
    ),
  async execute(ctx: Context) {
    let s = performance.now();
    await ctx.interaction.deferReply();
    let text = ctx.interaction.options.getString("text") as string;
    let lang = ctx.interaction.options.getString("language") ?? "en";

    if (!langs.find((e) => e.code === lang)) {
      return ctx.reply({
        content: `Language ${bold(lang)} is not available.`,
      });
    }

    let _path =
      parseInt(ctx.user.id.slice(0, 4)).toString(16) +
      "-" +
      Math.floor(Math.random() * 2000).toString(16);

    let path = await createAudioFile(text, _path, lang);

    let attachment = new AttachmentBuilder(path, {
      name: "tts-" + lang + ".mp3",
      description: text,
    });
    await ctx.reply({
      content: `*Generated in ${((performance.now() - s) / 1000).toFixed(2)}s*`,
      files: [attachment],
    });
    setTimeout(() => {
      unlinkSync(path);
    }, 10 * 1000);
  },
  async autocomplete(interaction: AutocompleteInteraction) {
    const focusedValue = interaction.options.getFocused(true);
    const filtered = langs
      .filter(
        (option) =>
          option.name
            .toLowerCase()
            .includes(focusedValue.value.toLowerCase()) ||
          option.code.toLowerCase().includes(focusedValue.value.toLowerCase()),
      )
      .sort((a, b) => stringSorter(a.name, b.name))
      .slice(0, 25);
    await interaction.respond(
      filtered.map((option) => ({ name: option.name, value: option.code })),
    );
  },
};

function stringSorter(a: string, b: string): 1 | -1 {
  let c = [a, b].sort();
  return c[0] === a ? 1 : -1;
}
