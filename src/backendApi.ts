import { Client } from "discord.js";
import express from "express";
import { readdirSync } from "fs";
import { join } from "path";
interface API {
  res: express.Response;
  req: express.Request;
  client: Client<true>;
  route: Route;
  start: number;
  send: (data: any) => void;
  error: (message: string) => void;
}

interface IRoute {
  path: string | null;
  method: string;
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
      client,
      route: this,
      start: performance.now(),
      error: function error(message: string, e: any = Error) {
        let err = new e(message);
        this.send(err);
      },
      send: function send(data: any, status = 200) {
        res.status(200).send({
          path: this.route.path,
          execution: performance.now() - this.start,
          data:
            data instanceof Error
              ? {
                  error: true,
                  type: (data as Error).name,
                  message: (data as Error).message,
                }
              : typeof data == "object" && !Array.isArray(data)
                ? {
                    error: false,
                    ...data,
                  }
                : {
                    error: false,
                    data,
                  },
        });
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
      execute: async function (ctx) {
        ctx.error("Not Found");
      },
    }).execute(req, res, client);
  });

  app.listen(2000);
}
