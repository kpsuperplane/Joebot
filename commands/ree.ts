import {
  CommandInteraction,
  AttachmentBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { Command } from "./Command";

const Ree: Command = {
  builder: new SlashCommandBuilder().setName("ree").setDescription("Reeeeeeeee"),
  execute: async (interaction: CommandInteraction) => {
    await interaction.reply("Reeeeeeeee");
  },
};

export default Ree;
