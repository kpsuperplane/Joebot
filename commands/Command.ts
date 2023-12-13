import {
  ChatInputCommandInteraction,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord.js";

export type Command = {
  builder: {
    name: string;
    toJSON: () => RESTPostAPIChatInputApplicationCommandsJSONBody;
  };
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
};
