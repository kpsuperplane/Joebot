import { EmbedBuilder, hyperlink, time } from "discord.js";
import prisma from "../prisma/client";

function notEmpty<TValue>(value: TValue): value is NonNullable<TValue> {
  return value !== null && value !== undefined;
}

export async function getEventEmbed(eventId: number): Promise<EmbedBuilder> {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  return new EmbedBuilder()
    .setTitle(event!.title)
    .setFields(
      [
        {
          name: "Date",
          value: time(event!.start),
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
