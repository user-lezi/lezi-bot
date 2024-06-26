"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Route = void 0;
const express_1 = __importDefault(require("express"));
const fs_1 = require("fs");
const path_1 = require("path");
class Route {
    data;
    constructor(data) {
        this.data = data;
        if (this.data.path)
            this.data.path = "/backend" + this.data.path;
    }
    get path() {
        return this.data.path;
    }
    async execute(req, res, client) {
        let ctx = {
            res,
            req,
            path: req.originalUrl,
            client,
            route: this,
            start: performance.now(),
            error: function error(message, e = Error) {
                let err = new e(message);
                this.send(err);
            },
            send: function send(data, status = 200) {
                res.status(200).send({
                    path: this.path,
                    execution: performance.now() - this.start,
                    error: data instanceof Error,
                    data: data instanceof Error
                        ? {
                            type: data.name,
                            message: data.message,
                        }
                        : data,
                });
            },
            getQuery: function getQuery(name) {
                return req.query[name];
            },
            getQueries: function getQueries() {
                return req.query;
            },
            getBody: function getBody(...properties) {
                let body = req.body;
                for (let property of properties) {
                    body = body[property];
                    if (body == undefined)
                        return undefined;
                    if (body == null)
                        return null;
                    if ("object" !== typeof body)
                        return body;
                }
                return body;
            },
            getHeaders: function getHeaders() {
                return req.headers;
            },
            getParam: function getParam(name) {
                return req.params[name];
            },
            getParams: function getParams() {
                return req.params;
            },
        };
        await this.data.execute(ctx);
    }
}
exports.Route = Route;
function default_1(client) {
    const app = (0, express_1.default)();
    app.set("json spaces", 2);
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    let routes = (0, fs_1.readdirSync)((0, path_1.join)(__dirname, "routes")).filter((x) => x.endsWith(".js"));
    for (let file of routes) {
        let route = require(`./routes/${file}`).default;
        app[route.data.method](route.path, async (req, res) => {
            await route.execute(req, res, client);
        });
        console.log(`- Loaded "${route.path}"`);
    }
    app.all("/*", async (req, res) => {
        new Route({
            path: null,
            method: "",
            queries: null,
            execute: async function (ctx) {
                ctx.error("Not Found");
            },
        }).execute(req, res, client);
    });
    app.listen(2000);
}
exports.default = default_1;
//# sourceMappingURL=backendApi.js.map