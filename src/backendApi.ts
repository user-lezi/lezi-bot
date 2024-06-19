import { Client } from "discord.js";
import express from "express";
import { readdirSync } from "fs";
import { join } from "path";
interface API {
  res: express.Response;
  req: express.Request;
  path: string;
  client: Client<true>;
  route: Route;
  start: number;
  getQuery: (name: string) => string;
  getQueries: () => Record<string, string>;
  getBody: (...properties: string[]) => string;
  getHeaders: () => Record<string, string>;
  getParam: (name: string) => string;
  getParams: () => Record<string, string>;
  send: (data: any) => void;
  error: (message: string) => void;
}

export interface Query {
  name: string;
  description: string;
  type: string;
  required: boolean;
  default: any;
}

interface IRoute {
  path: string | null;
  method: string;
  queries: Query[] | null;
  execute: (ctx: API) => Promise<unknown>;
}

export class Route {
  constructor(public data: IRoute) {
    if (this.data.path) this.data.path = "/backend" + this.data.path;
  }

  get path() {
    return this.data.path;
  }

  async execute(
    req: express.Request,
    res: express.Response,
    client: Client<true>,
  ) {
    let ctx: API = {
      res,
      req,
      path: req.originalUrl,
      client,
      route: this,
      start: performance.now(),
      error: function error(message: string, e: any = Error) {
        let err = new e(message);
        this.send(err);
      },
      send: function send(data: any, status = 200) {
        res.status(200).send({
          path: this.path,
          execution: performance.now() - this.start,
          error: data instanceof Error,
          data:
            data instanceof Error
              ? {
                  type: (data as Error).name,
                  message: (data as Error).message,
                }
              : data,
        });
      },

      getQuery: function getQuery(name: string) {
        return req.query[name] as string;
      },
      getQueries: function getQueries() {
        return req.query as Record<string, string>;
      },
      getBody: function getBody(...properties: string[]) {
        let body = req.body;
        for (let property of properties) {
          body = body[property];
          if (body == undefined) return undefined;
          if (body == null) return null;
          if ("object" !== typeof body) return body;
        }
        return body;
      },
      getHeaders: function getHeaders() {
        return req.headers as Record<string, string>;
      },
      getParam: function getParam(name: string) {
        return req.params[name] as string;
      },
      getParams: function getParams() {
        return req.params as Record<string, string>;
      },
    };
    await this.data.execute(ctx);
  }
}

export default function (client: Client<true>) {
  const app = express();
  app.set("json spaces", 2);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  let routes = readdirSync(join(__dirname, "routes")).filter((x: string) =>
    x.endsWith(".js"),
  );

  for (let file of routes) {
    let route = require(`./routes/${file}`).default;

    app[route.data.method as keyof express.Application](
      route.path,
      async (req: any, res: any) => {
        await route.execute(req, res, client);
      },
    );
    console.log(`- Loaded "${route.path}"`);
  }

  app.all("/*", async (req: any, res: any) => {
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
