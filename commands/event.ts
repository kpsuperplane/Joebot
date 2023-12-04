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
        .setLabel("Name")
        .setStyle(TextInputStyle.Short)
        .setValue(defaultName)
        .setRequired(true)
    );

    const date = new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("date")
        .setLabel("Date")
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
        .setRequired(true)
    );

    const location = new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("location")
        .setLabel("Location")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
    );

    const details = new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("details")
        .setLabel("Details")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false)
    );

    const modal = new ModalBuilder()
      .setCustomId("createEventModal")
      .setTitle("Create Event")
      .addComponents(name, date, location, details);

    await interaction.showModal(modal);

    // Get the Modal Submit Interaction that is emitted once the User submits the Modal
    const submitted = await interaction
      .awaitModalSubmit({
        // Timeout after a minute of not receiving any valid Modals
        time: 60000,
        // Make sure we only accept Modals from the User who sent the original Interaction we're responding to
        filter: (i) => i.user.id === interaction.user.id,
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
      const parsedDate = parser.parseDate(submitted.fields.getTextInputValue('date'));
      if (parsedDate != null) {
        const data = {
          name: submitted.fields.getTextInputValue('name'),
          date: parsedDate,
          location: submitted.fields.getTextInputValue('location'),
          details: submitted.fields.getTextInputValue('details'),
        };
        await submitted.reply({
          content: `Received input: ${JSON.stringify(data)}`,
        });
      } else {
        submitted.reply({content: "Unable to parse date for " + submitted.fields.getTextInputValue('date')})
      }
    }
  },
};

export default Event;