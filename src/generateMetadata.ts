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
  path: {
    ts: string;
    js: string;
  };
  options: CommandOptions[];
}
interface CommandOptions {
  name: string;
  description: string;
  type: number;
  required: boolean;
}
(async function () {
  let commandFiles = readdirSync(join(__dirname, "commands")).filter(
    (file: string) => file.endsWith(".js"),
  );
  let commands = [] as Command[];
  for (let file of commandFiles) {
    let cmd = require("./" + join("commands", file)).default;
    let command = cmd.data.toJSON();
    let options: CommandOptions[] = [];

    if (command.options[0]?.type == 1) {
      let subcommands = command.options.filter((o: any) => o.type == 1);
      for (let subcommand of subcommands) {
        for (let option of subcommand.options) {
          options.push({
            name: option.name,
            description: option.description,
            type: option.type,
            required: option.required,
          });
        }
        commands.push({
          name: [command.name, subcommand.name].join(" "),
          shortDescription: subcommand.description,
          longDescription:
            cmd.metadata?.description || "*No Description Has Been Found*",
          path: {
            js: join("dist", "commands", file),
            ts: join("src", "commands", file.replace(".js", ".ts")),
          },
          options,
        });
        options = [] as CommandOptions[];
      }
      continue;
    }
    for (let option of command.options) {
      options.push({
        name: option.name,
        description: option.description,
        type: option.type,
        required: option.required,
      });
    }
    commands.push({
      name: command.name,
      shortDescription: command.description,
      longDescription:
        cmd.metadata?.description || "*No Description Has Been Found*",
      path: {
        js: join("dist", "commands", file),
        ts: join("src", "commands", file.replace(".js", ".ts")),
      },
      options,
    });
  }

  write("commands", commands);
})();

import { Query } from "./backendApi";

interface Route {
  route: string;
  method: string;
  path: {
    ts: string;
    js: string;
  };
  queries: Query[];
}
(async function () {
  let routeFiles = readdirSync(join(__dirname, "routes")).filter(
    (file: string) => file.endsWith(".js"),
  );
  let routes = [] as Route[];
  for (let file of routeFiles) {
    let route = require("./" + join("routes", file)).default;
    let queries: Query[] = route.queries ?? [];
    routes.push({
      route: route.data.path,
      method: route.data.method,
      path: {
        ts: join("dist", "routes", file),
        js: join("src", "routes", file.replace(".js", ".ts")),
      },
      queries,
    });
  }
  write("routes", routes);
})();
