import {
  codeBlock,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  Message,
} from "discord.js";
import { inspect } from "util";

async function evalCommand(message: Message) {
  let commandTrigger = "--eval";
  if (!message.content.startsWith(commandTrigger)) return;
  let inputCode = message.content.slice(commandTrigger.length).trim();
  if (0 === inputCode.length) return;

  const { client, channel, guild, author, member } = message;

  let outputCode: unknown;
  try {
    outputCode = await eval(inputCode);
  } catch (error: any) {
    outputCode = error;
  }
  let outputString =
    ("object" === typeof outputCode ? inspect(outputCode) : outputCode) + "";
  let outputChunks = (outputString.match(/[\s\S]{1,4000}/g) || []) as string[];
  let currentIndex = 0;
  let embeds = [] as EmbedBuilder[];
  for (let i = 0; i < outputChunks.length; i++) {
    let chunk = outputChunks[i];
    let embed = new EmbedBuilder()
      .setColor(0x313336)
      .setTitle("Evaluated")
      .setFooter({
        text: `Page ${i + 1}/${outputChunks.length} • ${outputString.length} • ${typeof outputCode}`,
      })
      .setDescription(codeBlock("js", chunk));
    embeds.push(embed);
  }

  function addComponents(...available: boolean[]) {
    return [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setEmoji("⏪")
          .setCustomId("first")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(available[0]),
        new ButtonBuilder()
          .setEmoji("◀️")
          .setCustomId("previous")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(available[1]),
        new ButtonBuilder()
          .setEmoji("🗑️")
          .setCustomId("delete")
          .setStyle(ButtonStyle.Danger)
          .setDisabled(available[2]),
        new ButtonBuilder()
          .setEmoji("▶️")
          .setCustomId("next")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(available[3]),
        new ButtonBuilder()
          .setEmoji("⏩")
          .setCustomId("last")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(available[4]),
      ),
    ];
  }

  let evalMessage = await message.reply({
    embeds: [embeds[0]],
    components: addComponents(
      true,
      true,
      false,
      embeds.length == 1,
      embeds.length == 1,
    ),
  });

  /* Interacting with buttons */
  let collector = evalMessage.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 45_000,
  });
  collector.on("collect", async function (interaction: ButtonInteraction) {
    if (interaction.user.id !== message.author.id) {
      return await interaction.reply({
        content: `Only for ${message.author}!`,
        ephemeral: true,
      });
    }
    interaction.deferUpdate().catch(() => {});
    if (interaction.customId == "delete") {
      return await evalMessage.delete().catch(() => {});
    }
    currentIndex =
      interaction.customId === "first"
        ? 0
        : interaction.customId === "previous"
          ? currentIndex - 1
          : interaction.customId === "next"
            ? currentIndex + 1
            : interaction.customId === "last"
              ? embeds.length - 1
              : currentIndex;

    await evalMessage.edit({
      embeds: [embeds[currentIndex]],
      components: addComponents(
        currentIndex === 0,
        currentIndex === 0,
        false,
        currentIndex === embeds.length - 1,
        currentIndex === embeds.length - 1,
      ),
    });
  });
  collector.on("end", async function () {
    await evalMessage
      .edit({
        components: addComponents(true, true, true, true, true),
      })
      .catch(() => {});
  });
}

export default async function (message: Message) {
  let whitelistUsers = ["910837428862984213"];
  if (-1 === whitelistUsers.indexOf(message.author.id)) return;
  await evalCommand(message);
}
