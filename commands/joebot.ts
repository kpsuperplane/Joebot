import {
  CommandInteraction,
  SlashCommandBuilder,
  SlashCommandSubcommandGroupBuilder,
  SlashCommandSubcommandBuilder,
  SlashCommandChannelOption,
  ChannelType,
  ChatInputCommandInteraction,
  channelMention,
} from "discord.js";
import { Command } from "./Command";
import prisma from "../prisma/client";

const Joebot: Command = {
  builder: new SlashCommandBuilder()
    .setName("joebot")
    .setDescription("Joebot admin things")
    .addSubcommandGroup(
      new SlashCommandSubcommandGroupBuilder()
        .setName("category")
        .setDescription("Default default parent channel for Joebot")
        .addSubcommand(
          new SlashCommandSubcommandBuilder()
            .setName("set")
            .setDescription("Set the default parent channel for an event")
            .addChannelOption(
              new SlashCommandChannelOption()
                .setName("channel")
                .setDescription("Channel name")
                .addChannelTypes(
                  ChannelType.GuildCategory,
                  ChannelType.GuildText
                )
                .setRequired(true)
            )
        )
        .addSubcommand(
          new SlashCommandSubcommandBuilder()
            .setName("get")
            .setDescription("Get the default parent channel for an event")
        )
        .addSubcommand(
          new SlashCommandSubcommandBuilder()
            .setName("clear")
            .setDescription("Clear the default parent channel for an event")
        )
    ),
  execute: async (interaction: ChatInputCommandInteraction) => {
    switch (interaction.options.getSubcommandGroup()) {
      case "category":
        if (interaction.guild == null) {
          interaction.reply({
            content: "This command can only be run within a guild",
            ephemeral: true,
          });
          break;
        }
        const guild = await prisma.guild.findUnique({
          where: { id: interaction.guild.id },
        });
        switch (interaction.options.getSubcommand()) {
          case "get":
            interaction.reply({
              content:
                guild?.category != null
                  ? `The default category for events is currently ${channelMention(
                      guild.category
                    )}`
                  : `There is currently no default category. Events will be created under the server root.`,
            });
            break;
          case "clear":
            await prisma.guild.upsert({
              where: { id: interaction.guild.id },
              create: { id: interaction.guild.id, category: null },
              update: { category: null },
            });
            interaction.reply(
              "Default category cleared. Events will be created under the server root."
            );
            break;
          case "set":
            const category = interaction.options.getChannel("channel", true).id;
            await prisma.guild.upsert({
              where: { id: interaction.guild.id },
              create: { id: interaction.guild.id, category },
              update: { category },
            });
            interaction.reply({
              content: `The default category for events is now ${channelMention(
                category
              )}`,
            });
            break;
        }
        break;
      default:
        interaction.reply({ content: "Unknown command", ephemeral: true });
    }
  },
};

export default Joebot;
