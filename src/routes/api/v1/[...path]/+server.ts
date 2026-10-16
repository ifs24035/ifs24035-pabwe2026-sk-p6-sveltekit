import type { RequestHandler } from "./$types";
import { proxyToDelcom } from "../../../../helpers/proxyHelper";

const handler: RequestHandler = ({ request, params, url }) =>
  proxyToDelcom(request, params.path, url.search);

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;