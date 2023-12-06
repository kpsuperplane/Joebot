import {
  CommandInteraction,
  AttachmentBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { Command } from "./Command";
import { TheCatAPI } from "@thatapicompany/thecatapi";

const theCatAPI = new TheCatAPI(process.env.CAT_API_KEY!);

const Meow: Command = {
  builder: new SlashCommandBuilder().setName("meow").setDescription("Meow!"),
  execute: async (interaction: CommandInteraction) => {
    const image = await theCatAPI.images.getRandomImage();
    await interaction.reply({ files: [new AttachmentBuilder(image!.url)] });
  },
};

export default Meow;
