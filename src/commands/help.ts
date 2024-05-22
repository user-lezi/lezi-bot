import { Client, CommandInteraction, SlashCommandBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Shows the list of available commands"),

  async execute(client: Client, interaction: CommandInteraction) {
    await interaction.reply({
      content: "This is a help command",
    });
  },
};
