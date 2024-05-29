import { Client } from "discord.js";
import express from "express";
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
export declare class Route {
    data: IRoute;
    constructor(data: IRoute);
    get path(): string | null;
    execute(req: express.Request, res: express.Response, client: Client<true>): Promise<void>;
}
export default function (client: Client<true>): void;
export {};
//# sourceMappingURL=backendApi.d.ts.map