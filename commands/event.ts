import {
  ActionRowBuilder,
  CommandInteraction,
  ModalBuilder,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { Command } from "./Command";
import * as chrono from "chrono-node";

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

const Event: Command = {
  builder: new SlashCommandBuilder()
    .setName("event")
    .setDescription("Create an event")
    .addStringOption((option) =>
      option
        .setName("input")
        .setDescription("Tell me about this event")
        .setRequired(true)
    ),
  execute: async (interaction: CommandInteraction) => {
    const input = interaction.options.get("input")?.value;

    let defaultName = "";
    let defaultDate: Date | null = null;
    if (typeof input === "string") {
      const parsed = parser.parse(
        input,
        { instant: new Date(), timezone: "America/Los_Angeles" },
        { forwardDate: true }
      );
      if (parsed.length > 0) {
        defaultName = input.replace(parsed[0].text, "");
        defaultDate = parsed[0].date();
      }
    }

    const name = new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("name")
        .setLabel("Event Name")
        .setStyle(TextInputStyle.Short)
        .setValue(defaultName)
    );

    const date = new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("date")
        .setLabel("Event Date")
        .setStyle(TextInputStyle.Short)
        .setValue(
          defaultDate?.toLocaleString("en-us", {
            weekday: "short",
            day: "numeric",
            month: "short",
            hour: "numeric",
            minute: "numeric",
            timeZone: "America/Los_Angeles",
          }) ?? ""
        )
    );

    const modal = new ModalBuilder()
      .setCustomId("createEventModal")
      .setTitle("Create Event")
      .addComponents(name, date);

    await interaction.showModal(modal);
  },
};

export default Event;
