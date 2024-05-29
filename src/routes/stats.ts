import { Route } from "../backendApi";
import { getBotStats } from "../helpers";

export default new Route({
  path: "/stats",
  method: "get",
  queries: null,
  execute: async function (ctx) {
    let stats = await getBotStats(ctx.client);
    ctx.send(stats);
  },
});
