"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
function write(name, json) {
    let path = (0, path_1.join)(__dirname, "..", "metadata", name + ".json");
    (0, fs_1.writeFileSync)(path, JSON.stringify(json, null, 2));
    console.log("- Generated Metadata [" + name + "]");
    return true;
}
(async function () {
    let commandFiles = (0, fs_1.readdirSync)((0, path_1.join)(__dirname, "commands")).filter((file) => file.endsWith(".js"));
    let commands = [];
    for (let file of commandFiles) {
        let cmd = require("./" + (0, path_1.join)("commands", file)).default;
        let category = cmd.metadata.category;
        let command = cmd.data.toJSON();
        let options = [];
        if (command.options[0]?.type == 1) {
            let subcommands = command.options.filter((o) => o.type == 1);
            for (let subcommand of subcommands) {
                for (let option of subcommand.options) {
                    options.push({
                        name: option.name,
                        description: option.description,
                        type: option.type,
                        required: option.required,
                    });
                }
                let description = JSON.parse((cmd.metadata.description ?? "{}"));
                commands.push({
                    name: [command.name, subcommand.name].join(" "),
                    mainName: command.name,
                    shortDescription: subcommand.description,
                    longDescription: description[subcommand.name] ||
                        "*No Description Has Been Found*",
                    category,
                    path: {
                        js: (0, path_1.join)("dist", "commands", file),
                        ts: (0, path_1.join)("src", "commands", file.replace(".js", ".ts")),
                    },
                    options,
                });
                options = [];
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
            mainName: command.name,
            shortDescription: command.description,
            longDescription: cmd.metadata?.description || "*No Description Has Been Found*",
            category,
            path: {
                js: (0, path_1.join)("dist", "commands", file),
                ts: (0, path_1.join)("src", "commands", file.replace(".js", ".ts")),
            },
            options,
        });
    }
    write("commands", commands);
})();
(async function () {
    let routeFiles = (0, fs_1.readdirSync)((0, path_1.join)(__dirname, "routes")).filter((file) => file.endsWith(".js"));
    let routes = [];
    for (let file of routeFiles) {
        let route = require("./" + (0, path_1.join)("routes", file)).default;
        let queries = route.queries ?? [];
        routes.push({
            route: route.data.path,
            method: route.data.method,
            path: {
                ts: (0, path_1.join)("dist", "routes", file),
                js: (0, path_1.join)("src", "routes", file.replace(".js", ".ts")),
            },
            queries,
        });
    }
    write("routes", routes);
})();
//# sourceMappingURL=generateMetadata.js.map