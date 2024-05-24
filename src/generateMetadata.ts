import { writeFileSync, readdirSync } from "fs";
import { join } from "path";

function write(name: string, json: object) {
  let path = join(__dirname, "..", "metadata", name + ".json");
  writeFileSync(path, JSON.stringify(json, null, 2));
  console.log("- Generated Metadata [" + name + "]");
  return true;
}
interface Command {
  name: string;
  shortDescription: string;
  longDescription: string;
}
(async function () {
  let commandFiles = readdirSync(join(__dirname, "commands")).filter(
    (file: string) => file.endsWith(".js"),
  );
  let commands = [] as Command[];
  for (let file of commandFiles) {
    let cmd = require("./" + join("commands", file)).default;
    let command = cmd.data.toJSON();
    if (command.options[0]?.type == 1) {
      let subcommands = command.options.filter((o: any) => o.type == 1);
      for (let subcommand of subcommands) {
        commands.push({
          name: [command.name, subcommand.name].join(" "),
          shortDescription: subcommand.description,
          longDescription:
            cmd.metadata?.description || "*No Description Has Been Found*",
        });
      }
      continue;
    }
    commands.push({
      name: command.name,
      shortDescription: command.description,
      longDescription:
        cmd.metadata?.description || "*No Description Has Been Found*",
    });
  }

  write("commands", commands);
})();
