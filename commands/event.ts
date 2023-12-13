import {
  ChannelType,
  CommandInteraction,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";
import { Command } from "./Command";
import prisma from "../prisma/client";
import { getEventEmbed, presentEventModal } from "../lib/event";
import { parseDate } from "../lib/date";
import { connectOrCreateGuild, findOrCreateGuild } from "../lib/guild";

const Event: Command = {
  builder: new SlashCommandBuilder()
    .setName("event")
    .setDescription("Create an event")
    .addStringOption((option) =>
      option.setName("title").setDescription("Event title")
    )
    .addChannelOption((option) =>
      option
        .setName("category")
        .setDescription("Category")
        .addChannelTypes(ChannelType.GuildCategory, ChannelType.GuildText)
    )
    .addStringOption((option) =>
      option.setName("start").setDescription("Start Date and Time")
    )
    .addStringOption((option) =>
      option.setName("end").setDescription("End Date and Time")
    )
    .addStringOption((option) =>
      option.setName("location").setDescription("Location")
    )
    .addStringOption((option) =>
      option.setName("shortname").setDescription("Channel Name")
    ),
  execute: async (interaction: CommandInteraction) => {
    if (interaction.guild == null) {
      await interaction.reply({
        content: "Error: Not in a guild",
        ephemeral: true,
      });
      return;
    }

    const result = await presentEventModal(interaction, {
      title: interaction.options.get("title")?.value?.toString(),
      shortname: interaction.options.get("shortname")?.value?.toString(),
      start:
        parseDate(interaction.options.get("date")?.value?.toString()) ??
        undefined,
      location: interaction.options.get("location")?.value?.toString(),
    });
    
    if (result == null) {
      return;
    }

    const {
      data: { shortname, ...event },
      submission,
    } = result;

    const guild = await findOrCreateGuild(interaction.guild.id);
    const parentId =
      interaction.options.get("category")?.channel?.id ?? guild.category;
    const parent =
      parentId != null
        ? await interaction.guild.channels.fetch(parentId)
        : null;
    let channel;
    if (parent != null && parent.type === ChannelType.GuildText) {
      channel = await parent.threads.create({
        name: shortname,
        type: ChannelType.PublicThread,
      });
    } else {
      channel = await interaction.guild.channels.create({
        name: shortname,
        parent: parent?.id,
        type: ChannelType.GuildText,
      });
    }
    if (channel == null) {
      submission.reply({
        content: "Error: Unable to create channel",
        ephemeral: true,
      });
      return;
    }
    const { id } = await prisma.event.create({
      data: {
        ...event,
        guild: connectOrCreateGuild(interaction.guild.id),
        channel_id: channel.id,
      },
    });
    await submission.reply({
      embeds: [await getEventEmbed(id)],
    });
  },
};

export default Event;
