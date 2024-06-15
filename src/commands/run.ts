import {
  codeBlock,
  APIEmbed,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { Context } from "../helpers";
import { inspect } from "util";
const Sandbox: any = require("sandbox");

export default {
  metadata: {
    category: "Utility",
    description: "Runs the javascript code that user provides",
  },
  data: new SlashCommandBuilder()
    .setName("run")
    .setDescription("Runs the javascript code that user provides")
    .addStringOption((option) =>
      option
        .setName("code")
        .setDescription("The code that user provides")
        .setRequired(true),
    )
    .addBooleanOption((option) =>
      option
        .setName("console")
        .setDescription(
          "Whether to show the output in console or not (default: true)",
        )
        .setRequired(false),
    )
    .addBooleanOption((option) =>
      option
        .setName("showcode")
        .setDescription("Show the input code or not (default: true)")
        .setRequired(false),
    ),
  async execute(ctx: Context) {
    let code = (ctx.interaction.options as any).getString("code") as string;
    let showConsole =
      ((ctx.interaction.options as any).getBoolean("console") as boolean) ??
      true;
    let showCode =
      ((ctx.interaction.options as any).getBoolean("showcode") as boolean) ??
      true;

    if (!code && code.length < 1) {
      return await ctx.interaction.reply({
        content: "Please provide the code that you want to run",
        ephemeral: true,
      });
    }
    await ctx.interaction.deferReply();

    let environment = new Sandbox();
    let start = Date.now();
    environment.run(
      code,
      async function (op: { result: string; console: unknown[] }) {
        let outputType = getTypeof(op.result);
        let embed = new EmbedBuilder()
          .setColor(ctx.config.colors.main)
          .setTitle("Results")
          .setDescription(codeBlock("js", op.result).trim())
          .setFooter({
            text: `Took ${Date.now() - start}ms • ${outputType} • ${op.result.length}`,
          });

        let consoleEmbed: APIEmbed;
        let embeds = [embed];
        if (op.console.length > 0 && showConsole) {
          consoleEmbed = new EmbedBuilder()
            .setColor(ctx.config.colors.main)
            .setTitle("Console")
            .toJSON();
          consoleEmbed.description = "";
          let maxColorCount = 4000;
          let currentCount = 0;
          for (let message of op.console) {
            let consoleMessage =
              codeBlock(
                "js",
                makeLines(
                  ("object" === typeof message ? inspect(message) : message) +
                    "",
                ),
              ) + " ";
            if (
              currentCount &&
              currentCount + consoleMessage.length > maxColorCount
            )
              break;
            consoleEmbed.description += consoleMessage;
            currentCount += consoleMessage.length;
          }
          if (consoleEmbed.description?.length == 0)
            consoleEmbed.description = "Console output too big to fit.";
          embeds.push(EmbedBuilder.from(consoleEmbed));
        }

        if (showCode) {
          embeds.push(
            new EmbedBuilder()
              .setColor(ctx.config.colors.main)
              .setTitle("Input")
              .setDescription(codeBlock("js", makeLines(code))),
          );
        }

        await ctx.interaction.editReply({
          embeds,
        });
      },
    );
  },
};

function makeLines(text: string) {
  let lines = text.split("\n");
  let m = lines.length.toString().length;
  let n = 1;
  let results = "";
  for (let line of lines) {
    results += " " + n.toString().padStart(m, " ") + " | " + line + "\n";
    n++;
  }
  return results;
}
function getTypeof(value: string): string {
  if (value === "null" || value == "undefined") return value;
  if (value.startsWith("'") || value.startsWith('"')) return "string";
  if (value.startsWith("[")) return "array";
  if (value.startsWith("{")) return "object";
  if (value.startsWith("(") || value.startsWith("function")) return "function";
  if (!isNaN(Number(value)) || /$\d/.test(value)) return "number";
  return "unknown";
}
