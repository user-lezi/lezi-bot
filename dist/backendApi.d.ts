import { Client } from "discord.js";
import express from "express";
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
export declare class Route {
    data: IRoute;
    constructor(data: IRoute);
    get path(): string | null;
    execute(req: express.Request, res: express.Response, client: Client<true>): Promise<void>;
}
export default function (client: Client<true>): void;
export {};
//# sourceMappingURL=backendApi.d.ts.map