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
  const event = await prisma.event.findUniqueOrThrow({
    where: { id: eventId },
  });
  return new EmbedBuilder().setTitle(event.title).setFields(
    [
      {
        name: "Date",
        value: `${time(event.start)} - ${
          event.end.getTime() - event.start.getTime() > 86400000
            ? time(event.end)
            : time(event.end, "t")
        }`,
        inline: true,
      },
      {
        name: "Channel",
        value: channelMention(event.channel_id),
        inline: true,
      },
      {
        name: "Location",
        value: `${event.location}\n${hyperlink(
          "Google Maps",
          "https://www.google.com/maps/search/?api=1&query=" +
            encodeURIComponent(event.location)
        )} | ${hyperlink(
          "Apple Maps",
          "http://maps.apple.com/?q=" + encodeURIComponent(event.location)
        )}`,
      },
      event.description.trim() != ""
        ? {
            name: "Description",
            value: event.description,
          }
        : null,
    ].filter(notEmpty)
  );
}

export async function presentEventModal(
  title: string,
  interaction: CommandInteraction
): Promise<{
  submission: ModalSubmitInteraction;
  data: {
    shortname: string;
    start: Date;
    end: Date;
    location: string;
    description: string;
  };
} | null> {
  const locationComponent =
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("location")
        .setLabel("Location")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
    );

  const descriptionComponent =
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("description")
        .setLabel("Description")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false)
    );

  const shortnameComponent =
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("shortname")
        .setLabel("Channel Name")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
    );

  const startComponent = new ActionRowBuilder<TextInputBuilder>().addComponents(
    new TextInputBuilder()
      .setCustomId("start")
      .setLabel("Date")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
  );

  const endComponent = new ActionRowBuilder<TextInputBuilder>().addComponents(
    new TextInputBuilder()
      .setCustomId("end")
      .setLabel("End Date")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
  );

  const id = `modal:${interaction.id}`;

  const modal = new ModalBuilder()
    .setCustomId(id)
    .setTitle(title)
    .addComponents(
      shortnameComponent,
      startComponent,
      endComponent,
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

  const location = submission.fields.getTextInputValue("location");
  const description = submission.fields.getTextInputValue("description");
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
      start,
      end,
      location,
      description,
      shortname,
    },
  };
}
