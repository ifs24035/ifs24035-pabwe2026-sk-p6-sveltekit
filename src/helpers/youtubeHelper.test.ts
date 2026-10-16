import { describe, it, expect } from "vitest";
import { getYoutubeVideoId, getYoutubeEmbedUrl } from "./youtubeHelper";

describe("youtubeHelper", () => {
  describe("getYoutubeVideoId", () => {
    it("should parse youtu.be short links", () => {
      expect(getYoutubeVideoId("https://youtu.be/uHyfQV0kbgo")).toBe("uHyfQV0kbgo");
    });

    it("should parse watch links, with www and mobile hosts, trimming spaces", () => {
      expect(getYoutubeVideoId("https://www.youtube.com/watch?v=uHyfQV0kbgo&t=3")).toBe("uHyfQV0kbgo");
      expect(getYoutubeVideoId("https://m.youtube.com/watch?v=uHyfQV0kbgo")).toBe("uHyfQV0kbgo");
      expect(getYoutubeVideoId("  https://youtube.com/watch?v=uHyfQV0kbgo  ")).toBe("uHyfQV0kbgo");
    });

    it("should parse embed, shorts, live and v paths", () => {
      expect(getYoutubeVideoId("https://www.youtube.com/embed/uHyfQV0kbgo")).toBe("uHyfQV0kbgo");
      expect(getYoutubeVideoId("https://www.youtube-nocookie.com/embed/uHyfQV0kbgo")).toBe("uHyfQV0kbgo");
      expect(getYoutubeVideoId("https://youtube.com/shorts/uHyfQV0kbgo?feature=share")).toBe("uHyfQV0kbgo");
      expect(getYoutubeVideoId("https://youtube.com/live/uHyfQV0kbgo")).toBe("uHyfQV0kbgo");
      expect(getYoutubeVideoId("https://youtube.com/v/uHyfQV0kbgo")).toBe("uHyfQV0kbgo");
    });

    it("should return null for empty values", () => {
      expect(getYoutubeVideoId("")).toBeNull();
      expect(getYoutubeVideoId(null)).toBeNull();
      expect(getYoutubeVideoId(undefined)).toBeNull();
    });

    it("should return null for text that is not a URL", () => {
      expect(getYoutubeVideoId("bukan tautan")).toBeNull();
    });

    it("should return null for other hosts", () => {
      expect(getYoutubeVideoId("https://vimeo.com/123456789")).toBeNull();
    });

    it("should return null when no video id is present", () => {
      expect(getYoutubeVideoId("https://youtu.be/")).toBeNull();
      expect(getYoutubeVideoId("https://youtube.com/watch")).toBeNull();
      expect(getYoutubeVideoId("https://youtube.com/channel/abcdef123")).toBeNull();
    });

    it("should return null when the id has an invalid format", () => {
      expect(getYoutubeVideoId("https://youtu.be/abc")).toBeNull();
      expect(getYoutubeVideoId("https://youtube.com/watch?v=abc$%^def")).toBeNull();
    });
  });

  describe("getYoutubeEmbedUrl", () => {
    it("should build embed url for a valid link", () => {
      expect(getYoutubeEmbedUrl("https://youtu.be/uHyfQV0kbgo")).toBe(
        "https://www.youtube.com/embed/uHyfQV0kbgo"
      );
    });

    it("should return null for an invalid link", () => {
      expect(getYoutubeEmbedUrl("nope")).toBeNull();
    });
  });
});
