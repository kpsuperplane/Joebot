import {
  ActionRowBuilder,
  ChannelType,
  CommandInteraction,
  ModalBuilder,
  SlashCommandBuilder,
  TextChannel,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { Command } from "./Command";
import * as chrono from "chrono-node";
import prisma from "../prisma/client";
import { getEventEmbed } from "../lib/event";

const parser = chrono.casual.clone();
parser.refiners.push({
  refine: (_, results) => {
    // If there is no AM/PM (meridiem) specified,
    //  let all time between 1:00 - 4:00 be PM (13.00 - 16.00)
    results.forEach((result) => {
      const hour = result.start.get("hour");
      if (!result.start.isCertain("meridiem") && hour != null && hour < 9) {
        result.start.assign("meridiem", 1);
        result.start.assign("hour", hour + 12);
      }
    });
    return results;
  },
});

function parseDate(dateString: string | null | undefined): Date | null {
  if (typeof dateString === "string") {
    return parser.parseDate(
      dateString,
      { instant: new Date(), timezone: "America/Los_Angeles" },
      { forwardDate: true }
    );
  }
  return null;
}

function formatDate(date: Date | null): string {
  return (
    date?.toLocaleString("en-us", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "numeric",
      timeZone: "America/Los_Angeles",
    }) ?? ""
  );
}

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
      option.setName("date").setDescription("Date and Time")
    )
    .addStringOption((option) =>
      option.setName("location").setDescription("Location")
    )
    .addStringOption((option) =>
      option.setName("shortname").setDescription("Channel Name")
    ),
  execute: async (interaction: CommandInteraction) => {
    const title = new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("title")
        .setLabel("Title")
        .setStyle(TextInputStyle.Short)
        .setValue(interaction.options.get("title")?.value?.toString() ?? "")
        .setRequired(true)
    );

    const shortname = new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("shortname")
        .setLabel("Channel Name")
        .setStyle(TextInputStyle.Short)
        .setValue(interaction.options.get("shortname")?.value?.toString() ?? "")
        .setRequired(true)
    );

    const date = new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("date")
        .setLabel("Date")
        .setStyle(TextInputStyle.Short)
        .setValue(
          formatDate(
            parseDate(interaction.options.get("date")?.value?.toString())
          )
        )
        .setRequired(true)
    );

    const location = new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("location")
        .setLabel("Location")
        .setValue(interaction.options.get("location")?.value?.toString() ?? "")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
    );

    const description = new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("description")
        .setLabel("Description")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false)
    );

    const id = `modal:${interaction.id}`;

    const modal = new ModalBuilder()
      .setCustomId(id)
      .setTitle("Create Event")
      .addComponents(title, shortname, date, location, description);

    await interaction.showModal(modal);

    // Get the Modal Submit Interaction that is emitted once the User submits the Modal
    const submitted = await interaction
      .awaitModalSubmit({
        // Timeout after a minute of not receiving any valid Modals
        time: 600000,
        // Make sure we only accept Modals from the User who sent the original Interaction we're responding to
        filter: (i) => i.customId === id,
      })
      .catch((error) => {
        // Catch any Errors that are thrown (e.g. if the awaitModalSubmit times out after 60000 ms)
        console.error(error);
        return null;
      });

    // If we got our Modal, we can do whatever we want with it down here. Remember that the Modal
    // can have multiple Action Rows, but each Action Row can have only one TextInputComponent. You
    // can use the ModalSubmitInteraction.fields helper property to get the value of an input field
    // from it's Custom ID. See https://old.discordjs.dev/#/docs/discord.js/stable/class/ModalSubmitFieldsResolver for more info.
    if (submitted) {
      const start = parseDate(submitted.fields.getTextInputValue("date"));
      if (start != null) {
        const shortname = submitted.fields.getTextInputValue("shortname");
        const data = {
          title: submitted.fields.getTextInputValue("title"),
          start,
          location: submitted.fields.getTextInputValue("location"),
          description: submitted.fields.getTextInputValue("description"),
        };
        if (shortname.match(/[^a-z\-0-9]/) != null) {
          await submitted.reply(
            "Shortname must only contain lowercase characters, numbers, and dashes"
          );
          return;
        }
        if (interaction.guild == null) {
          await submitted.reply("Error: Not in a guild");
          return;
        }
        let parent = interaction.options.get("category")?.channel;
        let channel;
        if (parent != null && parent.type === ChannelType.GuildText) {
          parent = (await interaction.guild.channels.fetch(
            parent.id
          )) as TextChannel;
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
          await submitted.reply("Error: Unable to create channel");
          return;
        }
        const { id } = await prisma.event.create({
          data: {
            ...data,
            guild_id: interaction.guild.id,
            channel_id: channel.id,
          },
        });
        await submitted.reply({
          embeds: [await getEventEmbed(id)],
        });
      } else {
        await submitted.reply(
          "Unable to parse date for " +
            submitted.fields.getTextInputValue("date")
        );
      }
    }
  },
};

export default Event;
