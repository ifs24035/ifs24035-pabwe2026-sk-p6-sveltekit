export const UPSTREAM_BASEURL = "https://open-api.delcom.org/api/v1";

/**
 * Meneruskan permintaan dari browser ke API Delcom lewat server (menghindari CORS).
 * Hanya header Authorization dan Content-Type yang diteruskan.
 */
export async function proxyToDelcom(request: Request, path: string, search: string): Promise<Response> {
  const headers = new Headers();

  const authorization = request.headers.get("authorization");
  if (authorization) headers.set("authorization", authorization);

  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  const hasBody = request.method !== "GET" && request.method !== "HEAD";

  const upstream = await fetch(`${UPSTREAM_BASEURL}/${path}${search}`, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") || "application/json" },
  });
}