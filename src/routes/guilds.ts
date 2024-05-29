import { Route } from "../backendApi";

export default new Route({
  path: "/guilds",
  method: "get",
  execute: async function (ctx) {
    let guilds = await ctx.client.guilds.fetch();
    let data = [];
    for (let guild of guilds.values()) {
      data.push({
        id: guild.id,
        name: guild.name,
        icon: guild.iconURL(),
      });
    }
    ctx.send(data);
  },
});
