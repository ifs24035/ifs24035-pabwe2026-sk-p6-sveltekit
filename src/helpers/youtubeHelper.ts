/**
 * Mengambil ID video dari berbagai bentuk tautan YouTube:
 * youtu.be/ID, youtube.com/watch?v=ID, /embed/ID, /shorts/ID, /live/ID, /v/ID.
 * Mengembalikan null bila tautan bukan tautan video YouTube yang valid.
 */
export function getYoutubeVideoId(url: string | null | undefined): string | null {
  if (!url) return null;

  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^(www|m)\./, "");
  let id: string | null = null;

  if (host === "youtu.be") {
    id = parsed.pathname.split("/")[1] || null;
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (parsed.pathname === "/watch") {
      id = parsed.searchParams.get("v");
    } else {
      const match = parsed.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/);
      id = match ? match[1] : null;
    }
  }

  return id && /^[A-Za-z0-9_-]{6,}$/.test(id) ? id : null;
}

/** Mengubah tautan YouTube menjadi URL embed untuk iframe, atau null jika tidak valid. */
export function getYoutubeEmbedUrl(url: string | null | undefined): string | null {
  const id = getYoutubeVideoId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}
