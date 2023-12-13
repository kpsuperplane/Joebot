import Event from "./event";
import { Command } from "./Command";
import Meow from "./meow";
import Ree from "./ree";
import Joebot from "./joebot";

const COMMANDS = [Event, Meow, Ree, Joebot];

const toExport: { [name: string]: Command } = COMMANDS.reduce(
  (acc, command) => ({ ...acc, [command.builder.name]: command }),
  {}
);

export default toExport;