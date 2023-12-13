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
): Promise<
  | {
      submission: ModalSubmitInteraction;
      data: Omit<Event, "id" | "channel_id" | "guild_id"> & {
        shortname: string;
      };
    }
  | { submission: ModalSubmitInteraction; error: string }
> {
  const titleComponent = new ActionRowBuilder<TextInputBuilder>().addComponents(
    new TextInputBuilder()
      .setCustomId("title")
      .setLabel("Title")
      .setStyle(TextInputStyle.Short)
      .setValue(defaults.title ?? "")
      .setRequired(true)
  );

  const shortnameComponent =
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("shortname")
        .setLabel("Channel Name")
        .setStyle(TextInputStyle.Short)
        .setValue(defaults.shortname ?? "")
        .setRequired(true)
    );

  const dateComponent = new ActionRowBuilder<TextInputBuilder>().addComponents(
    new TextInputBuilder()
      .setCustomId("date")
      .setLabel("Date")
      .setStyle(TextInputStyle.Short)
      .setValue(defaults.start != null ? formatDate(defaults.start) : "")
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

  const id = `modal:${interaction.id}`;

  const modal = new ModalBuilder()
    .setCustomId(id)
    .setTitle("Create Event")
    .addComponents(
      titleComponent,
      shortnameComponent,
      dateComponent,
      locationComponent,
      descriptionComponent
    );

  await interaction.showModal(modal);

  // Get the Modal Submit Interaction that is emitted once the User submits the Modal
  const submission = await interaction.awaitModalSubmit({
    // Timeout after a minute of not receiving any valid Modals
    time: 600000,
    // Make sure we only accept Modals from the User who sent the original Interaction we're responding to
    filter: (i) => i.customId === id,
  });

  const shortname = submission.fields.getTextInputValue("shortname");
  const start = parseDate(submission.fields.getTextInputValue("date"));
  if (start == null) {
    return {
      submission,
      error: "Could not parse start date",
    };
  }
  if (shortname.match(/[^a-z\-0-9]/) != null) {
    return {
      submission,
      error:
        "Shortname must only contain lowercase characters, numbers, and dashes",
    };
  }
  return {
    submission,
    data: {
      title: submission.fields.getTextInputValue("title"),
      start,
      location: submission.fields.getTextInputValue("location"),
      description: submission.fields.getTextInputValue("description"),
      shortname,
    },
  };
}
