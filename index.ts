// import discord.js
import { Client, Events, GatewayIntentBits } from "discord.js";

import commands from "./commands";

// create a new Client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// listen for the client to be ready
client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

// login with the token from .env.local
client.login(process.env.DISCORD_TOKEN);

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  try {
    if (interaction.isCommand() && interaction.commandName in commands) {
      await commands[interaction.commandName].execute(interaction);
    }
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  }
});
