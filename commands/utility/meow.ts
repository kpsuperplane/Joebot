import { RepliableInteraction, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("meow")
  .setDescription("Replies with Meow!");

export async function execute(interaction: RepliableInteraction) {
  await interaction.reply("Meow!");
}
