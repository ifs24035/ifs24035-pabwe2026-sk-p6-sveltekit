import { describe, it, expect, vi, beforeEach } from "vitest";
import { proxyToDelcom, UPSTREAM_BASEURL } from "./proxyHelper";
import * as routeModule from "../routes/api/v1/[...path]/+server";

function upstreamResponse(body: string, status = 200, contentType: string | null = "application/json") {
  const headers = new Headers();
  if (contentType) headers.set("content-type", contentType);
  // body null -> Response tidak menambahkan content-type otomatis
  return new Response(contentType ? body : null, { status, headers });
}

describe("proxyHelper", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should forward a GET request with authorization and query, without a body", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(upstreamResponse('{"status":"success"}'));
    const request = new Request("http://localhost/api/v1/courses", {
      method: "GET",
      headers: { authorization: "Bearer abc" },
    });

    const response = await proxyToDelcom(request, "courses", "?is_me=1");

    const [url, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${UPSTREAM_BASEURL}/courses?is_me=1`);
    expect(options.method).toBe("GET");
    expect(options.body).toBeUndefined();
    expect((options.headers as Headers).get("authorization")).toBe("Bearer abc");
    expect((options.headers as Headers).get("content-type")).toBeNull();
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/json");
    expect(await response.json()).toEqual({ status: "success" });
  });

  it("should forward a POST request with content-type and body, keeping the upstream status", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(upstreamResponse('{"status":"fail"}', 401));
    const request = new Request("http://localhost/api/v1/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "a@b.c", password: "x" }),
    });

    const response = await proxyToDelcom(request, "auth/login", "");

    const [url, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${UPSTREAM_BASEURL}/auth/login`);
    expect((options.headers as Headers).get("content-type")).toBe("application/json");
    expect((options.headers as Headers).get("authorization")).toBeNull();
    expect(new TextDecoder().decode(options.body as ArrayBuffer)).toBe(
      JSON.stringify({ email: "a@b.c", password: "x" })
    );
    expect(response.status).toBe(401);
  });

  it("should default the response content-type to JSON when upstream gives none", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(upstreamResponse("{}", 200, null));
    const response = await proxyToDelcom(new Request("http://localhost/x"), "x", "");
    expect(response.headers.get("content-type")).toBe("application/json");
  });

  it("should expose GET, POST, PUT, PATCH and DELETE route handlers that proxy the request", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => upstreamResponse("{}"));

    for (const method of ["GET", "POST", "PUT", "PATCH", "DELETE"] as const) {
      const request = new Request("http://localhost/api/v1/courses/1", { method });
      const response = await (routeModule as any)[method]({
        request,
        params: { path: "courses/1" },
        url: new URL("http://localhost/api/v1/courses/1?x=1"),
      });
      expect(response.status).toBe(200);
    }

    expect(fetchSpy).toHaveBeenCalledTimes(5);
    expect(fetchSpy.mock.calls[0][0]).toBe(`${UPSTREAM_BASEURL}/courses/1?x=1`);
  });
});