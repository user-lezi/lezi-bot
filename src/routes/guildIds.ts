import { Route } from "../backendApi";

export default new Route({
  path: "/guildIds",
  method: "get",
  execute: async function (ctx) {
    let guilds = await ctx.client.guilds.fetch();

    let guildIds = guilds.map((guild) => guild.id);
    ctx.send(guildIds);
  },
});
