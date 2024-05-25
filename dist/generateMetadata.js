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
                commands.push({
                    name: [command.name, subcommand.name].join(" "),
                    shortDescription: subcommand.description,
                    longDescription: cmd.metadata?.description || "*No Description Has Been Found*",
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
            shortDescription: command.description,
            longDescription: cmd.metadata?.description || "*No Description Has Been Found*",
            path: {
                js: (0, path_1.join)("dist", "commands", file),
                ts: (0, path_1.join)("src", "commands", file.replace(".js", ".ts")),
            },
            options,
        });
    }
    write("commands", commands);
})();
//# sourceMappingURL=generateMetadata.js.map