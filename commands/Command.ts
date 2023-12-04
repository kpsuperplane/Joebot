import {
  CommandInteraction,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord.js";

export type Command = {
  builder: {
    name: string;
    toJSON: () => RESTPostAPIChatInputApplicationCommandsJSONBody;
  };
  execute: (interaction: CommandInteraction) => Promise<void>;
};
