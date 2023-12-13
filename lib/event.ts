import {
  ActionRowBuilder,
  CommandInteraction,
  EmbedBuilder,
  ModalBuilder,
  ModalSubmitInteraction,
  TextInputBuilder,
  TextInputStyle,
  channelMention,
  hyperlink,
  time,
} from "discord.js";
import prisma from "../prisma/client";
import { Event } from "@prisma/client";
import { formatDate, parseDate } from "./date";

function notEmpty<TValue>(value: TValue): value is NonNullable<TValue> {
  return value !== null && value !== undefined;
}

export async function getEventEmbed(eventId: number): Promise<EmbedBuilder> {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  return new EmbedBuilder().setTitle(event!.title).setFields(
    [
      {
        name: "Date",
        value: time(event!.start),
        inline: true,
      },
      {
        name: "Channel",
        value: channelMention(event!.channel_id),
        inline: true,
      },
      {
        name: "Location",
        value: `${event!.location}\n${hyperlink(
          "Google Maps",
          "https://www.google.com/maps/search/?api=1&query=" +
            encodeURIComponent(event!.location)
        )} | ${hyperlink(
          "Apple Maps",
          "http://maps.apple.com/?q=" + encodeURIComponent(event!.location)
        )}`,
      },
      event!.description.trim() != ""
        ? {
            name: "Description",
            value: event!.description,
          }
        : null,
    ].filter(notEmpty)
  );
}

export async function presentEventModal(
  interaction: CommandInteraction,
  defaults: Partial<
    Omit<Event, "id" | "channel_id" | "guild_id"> & { shortname: string }
  >
): Promise<{
  submission: ModalSubmitInteraction;
  data: Omit<Event, "id" | "channel_id" | "guild_id"> & {
    shortname: string;
  };
} | null> {
  const titleComponent = new ActionRowBuilder<TextInputBuilder>().addComponents(
    new TextInputBuilder()
      .setCustomId("title")
      .setLabel("Title")
      .setStyle(TextInputStyle.Short)
      .setValue(defaults.title ?? "")
      .setRequired(true)
  );

  const locationComponent =
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("location")
        .setLabel("Location")
        .setValue(defaults.location ?? "")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
    );

  const descriptionComponent =
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("description")
        .setLabel("Description")
        .setValue(defaults.description ?? "")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false)
    );

  const page1Id = `modal:${interaction.id}:1`;

  const page1Modal = new ModalBuilder()
    .setCustomId(page1Id)
    .setTitle("Create Event")
    .addComponents(titleComponent, locationComponent, descriptionComponent);

  await interaction.showModal(page1Modal);

  // Get the Modal Submit Interaction that is emitted once the User submits the Modal
  const page1Submission = await interaction.awaitModalSubmit({
    // Timeout after a minute of not receiving any valid Modals
    time: 600000,
    // Make sure we only accept Modals from the User who sent the original Interaction we're responding to
    filter: (i) => i.customId === page1Id,
  });

  const title = page1Submission.fields.getTextInputValue("title");
  const location = page1Submission.fields.getTextInputValue("location");
  const description = page1Submission.fields.getTextInputValue("description");

  const shortnameComponent =
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("shortname")
        .setLabel("Channel Name")
        .setStyle(TextInputStyle.Short)
        .setValue(defaults.shortname ?? "")
        .setRequired(true)
    );

  const startComponent = new ActionRowBuilder<TextInputBuilder>().addComponents(
    new TextInputBuilder()
      .setCustomId("start")
      .setLabel("Date")
      .setStyle(TextInputStyle.Short)
      .setValue(defaults.start != null ? formatDate(defaults.start) : "")
      .setRequired(true)
  );

  const endComponent = new ActionRowBuilder<TextInputBuilder>().addComponents(
    new TextInputBuilder()
      .setCustomId("end")
      .setLabel("End Date")
      .setStyle(TextInputStyle.Short)
      .setValue(defaults.end != null ? formatDate(defaults.end) : "")
      .setRequired(true)
  );

  const page2Id = `modal:${interaction.id}:2`;

  const page2Modal = new ModalBuilder()
    .setCustomId(page2Id)
    .setTitle(title)
    .addComponents(shortnameComponent, startComponent, endComponent);

  await interaction.showModal(page2Modal);

  // Get the Modal Submit Interaction that is emitted once the User submits the Modal
  const submission = await interaction.awaitModalSubmit({
    // Timeout after a minute of not receiving any valid Modals
    time: 600000,
    // Make sure we only accept Modals from the User who sent the original Interaction we're responding to
    filter: (i) => i.customId === page2Id,
  });

  const shortname = submission.fields.getTextInputValue("shortname");
  const start = parseDate(submission.fields.getTextInputValue("start"));
  const end = parseDate(submission.fields.getTextInputValue("end"));
  if (start == null) {
    submission.reply({
      content: "Could not parse start date",
      ephemeral: true,
    });
    return null;
  }
  if (end == null) {
    submission.reply({ content: "Could not parse end date", ephemeral: true });
    return null;
  }
  if (shortname.match(/[^a-z\-0-9]/) != null) {
    submission.reply({
      content:
        "Shortname must only contain lowercase characters, numbers, and dashes",
      ephemeral: true,
    });
    return null;
  }
  return {
    submission,
    data: {
      title,
      start,
      end,
      location,
      description,
      shortname,
    },
  };
}
