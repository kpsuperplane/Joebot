import Event from "./event";
import { Command } from "./Command";

const COMMANDS = [Event];

const toExport: { [name: string]: Command } = COMMANDS.reduce(
  (acc, command) => ({ ...acc, [command.builder.name]: command }),
  {}
);

export default toExport;