import { describe, it, expect, vi, beforeEach } from "vitest";
import courseApi from "./courseApi";
import apiHelper from "../../../helpers/apiHelper";

const BASE = "https://open-api.delcom.org/api/v1/courses";

function mockFetch(body: Record<string, any>) {
  return vi.spyOn(apiHelper, "fetchData").mockResolvedValue({
    json: async () => body,
  } as any);
}

describe("courseApi", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("error handling (_parse)", () => {
    it("should throw the server message when status is not success", async () => {
      mockFetch({ status: "fail", message: "Data tidak valid" });
      await expect(courseApi.postCourse("", "")).rejects.toThrow("Data tidak valid");
    });

    it("should append validation details when data is an object", async () => {
      mockFetch({
        status: "fail",
        message: "Data tidak valid",
        data: { title: ["Judul wajib diisi"], description: ["Deskripsi wajib diisi"] },
      });
      await expect(courseApi.postCourse("", "")).rejects.toThrow(
        "Data tidak valid: Judul wajib diisi, Deskripsi wajib diisi"
      );
    });

    it("should ignore data that is not an object", async () => {
      mockFetch({ status: "fail", message: "Gagal", data: "bukan objek" });
      await expect(courseApi.postCourse("a", "b")).rejects.toThrow(/^Gagal$/);
    });

    it("should use the fallback message when server gives none", async () => {
      mockFetch({ status: "fail" });
      await expect(courseApi.postCourse("a", "b")).rejects.toThrow("Gagal menambahkan kursus");
    });
  });

  describe("postCourse", () => {
    it("should POST title and description as JSON and return data", async () => {
      const spy = mockFetch({ status: "success", data: { course_id: 7 } });

      const data = await courseApi.postCourse("Belajar Svelte", "Dasar Svelte");

      expect(data).toEqual({ course_id: 7 });
      expect(spy).toHaveBeenCalledWith(`${BASE}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Belajar Svelte", description: "Dasar Svelte" }),
      });
    });
  });

  describe("postCourseCover", () => {
    it("should upload the cover as multipart form data", async () => {
      const spy = mockFetch({ status: "success", message: "Berhasil mengubah cover" });
      const file = new File(["x"], "sampul.png", { type: "image/png" });

      const message = await courseApi.postCourseCover(3, file);

      expect(message).toBe("Berhasil mengubah cover");
      const [url, options] = spy.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE}/3/cover`);
      expect(options.method).toBe("POST");
      const form = options.body as FormData;
      expect(form).toBeInstanceOf(FormData);
      expect((form.get("cover") as File).name).toBe("sampul.png");
    });

    it("should use a default file name for a Blob without name", async () => {
      const spy = mockFetch({ status: "success", message: "ok" });

      await courseApi.postCourseCover(3, new Blob(["x"], { type: "image/png" }));

      const form = (spy.mock.calls[0][1] as RequestInit).body as FormData;
      expect((form.get("cover") as File).name).toBe("cover.jpg");
    });

    it("should throw on failure", async () => {
      mockFetch({ status: "fail", message: "Format tidak didukung" });
      await expect(courseApi.postCourseCover(3, new File(["x"], "a.png"))).rejects.toThrow(
        "Format tidak didukung"
      );
    });
  });

  describe("putCourse", () => {
    it("should PUT title and description and return the message", async () => {
      const spy = mockFetch({ status: "success", message: "Berhasil mengubah data" });

      const message = await courseApi.putCourse(5, "Judul Baru", "Deskripsi Baru");

      expect(message).toBe("Berhasil mengubah data");
      expect(spy).toHaveBeenCalledWith(`${BASE}/5`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Judul Baru", description: "Deskripsi Baru" }),
      });
    });

    it("should throw on failure", async () => {
      mockFetch({ status: "fail" });
      await expect(courseApi.putCourse(5, "a", "b")).rejects.toThrow("Gagal mengubah kursus");
    });
  });

  describe("getCourses", () => {
    it("should GET all courses by default", async () => {
      const spy = mockFetch({ status: "success", data: { courses: [{ id: 1 }, { id: 2 }] } });

      const courses = await courseApi.getCourses();

      expect(courses).toEqual([{ id: 1 }, { id: 2 }]);
      expect(spy).toHaveBeenCalledWith(`${BASE}/`, { method: "GET" });
    });

    it("should send is_me=1 when only my courses are requested", async () => {
      const spy = mockFetch({ status: "success", data: { courses: [{ id: 9 }] } });

      const courses = await courseApi.getCourses(true);

      expect(courses).toEqual([{ id: 9 }]);
      expect(spy).toHaveBeenCalledWith(`${BASE}/?is_me=1`, { method: "GET" });
    });

    it("should return an empty array when courses key is missing", async () => {
      mockFetch({ status: "success", data: {} });
      expect(await courseApi.getCourses()).toEqual([]);
    });

    it("should return an empty array when data is missing", async () => {
      mockFetch({ status: "success" });
      expect(await courseApi.getCourses()).toEqual([]);
    });

    it("should throw on failure", async () => {
      mockFetch({ status: "fail" });
      await expect(courseApi.getCourses()).rejects.toThrow("Gagal mengambil data kursus");
    });
  });

  describe("getCourseById", () => {
    it("should return data.course", async () => {
      const spy = mockFetch({ status: "success", data: { course: { id: 4, title: "C" } } });

      const course = await courseApi.getCourseById(4);

      expect(course).toEqual({ id: 4, title: "C" });
      expect(spy).toHaveBeenCalledWith(`${BASE}/4`, { method: "GET" });
    });

    it("should return undefined when data is missing", async () => {
      mockFetch({ status: "success" });
      expect(await courseApi.getCourseById(4)).toBeUndefined();
    });

    it("should throw on failure", async () => {
      mockFetch({ status: "fail" });
      await expect(courseApi.getCourseById(4)).rejects.toThrow("Gagal mengambil detail kursus");
    });
  });

  describe("deleteCourse", () => {
    it("should DELETE the course and return the message", async () => {
      const spy = mockFetch({ status: "success", message: "Berhasil menghapus data" });

      expect(await courseApi.deleteCourse(8)).toBe("Berhasil menghapus data");
      expect(spy).toHaveBeenCalledWith(`${BASE}/8`, { method: "DELETE" });
    });

    it("should throw on failure", async () => {
      mockFetch({ status: "fail" });
      await expect(courseApi.deleteCourse(8)).rejects.toThrow("Gagal menghapus kursus");
    });
  });

  describe("deleteAllCourses", () => {
    it("should DELETE /courses and return the message", async () => {
      const spy = mockFetch({ status: "success", message: "Berhasil menghapus semua data kursus" });

      expect(await courseApi.deleteAllCourses()).toBe("Berhasil menghapus semua data kursus");
      expect(spy).toHaveBeenCalledWith(`${BASE}/`, { method: "DELETE" });
    });

    it("should throw on failure", async () => {
      mockFetch({ status: "fail", message: "Unauthenticated." });
      await expect(courseApi.deleteAllCourses()).rejects.toThrow("Unauthenticated.");
    });
  });

  describe("students", () => {
    it("should POST /students to join a course", async () => {
      const spy = mockFetch({ status: "success", message: "Berhasil menjadi pelajar pada kursus" });

      expect(await courseApi.postCourseStudent(2)).toBe("Berhasil menjadi pelajar pada kursus");
      expect(spy).toHaveBeenCalledWith(`${BASE}/2/students`, { method: "POST" });
    });

    it("should throw when joining fails", async () => {
      mockFetch({ status: "fail" });
      await expect(courseApi.postCourseStudent(2)).rejects.toThrow("Gagal bergabung ke kursus");
    });

    it("should DELETE /students to leave a course", async () => {
      const spy = mockFetch({ status: "success", message: "Berhasil keluar" });

      expect(await courseApi.deleteCourseStudent(2)).toBe("Berhasil keluar");
      expect(spy).toHaveBeenCalledWith(`${BASE}/2/students`, { method: "DELETE" });
    });

    it("should throw when leaving fails", async () => {
      mockFetch({ status: "fail" });
      await expect(courseApi.deleteCourseStudent(2)).rejects.toThrow("Gagal keluar dari kursus");
    });
  });

  describe("putCourseRating", () => {
    it("should PUT ratings and comment", async () => {
      const spy = mockFetch({ status: "success", message: "Berhasil mengubah ratings pada kursus" });

      const message = await courseApi.putCourseRating(2, 5, "Mantap");

      expect(message).toBe("Berhasil mengubah ratings pada kursus");
      expect(spy).toHaveBeenCalledWith(`${BASE}/2/students/ratings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ratings: 5, comment: "Mantap" }),
      });
    });

    it("should throw on failure", async () => {
      mockFetch({ status: "fail" });
      await expect(courseApi.putCourseRating(2, 5, "x")).rejects.toThrow(
        "Gagal mengubah rating kursus"
      );
    });
  });

  describe("contents", () => {
    it("should POST a new content and return data", async () => {
      const spy = mockFetch({ status: "success", data: { content_id: 11 } });

      const data = await courseApi.postCourseContent(2, "Intro", "https://youtu.be/abc12345");

      expect(data).toEqual({ content_id: 11 });
      expect(spy).toHaveBeenCalledWith(`${BASE}/2/contents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Intro", youtube: "https://youtu.be/abc12345" }),
      });
    });

    it("should throw when adding content fails", async () => {
      mockFetch({ status: "fail" });
      await expect(courseApi.postCourseContent(2, "a", "b")).rejects.toThrow(
        "Gagal menambahkan konten kursus"
      );
    });

    it("should PUT content on /courses/-/contents/:id", async () => {
      const spy = mockFetch({ status: "success", message: "Berhasil mengubah konten kursus" });

      const message = await courseApi.putCourseContent(11, "Baru", "https://youtu.be/xyz98765");

      expect(message).toBe("Berhasil mengubah konten kursus");
      expect(spy).toHaveBeenCalledWith(`${BASE}/-/contents/11`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Baru", youtube: "https://youtu.be/xyz98765" }),
      });
    });

    it("should throw when changing content fails", async () => {
      mockFetch({ status: "fail" });
      await expect(courseApi.putCourseContent(11, "a", "b")).rejects.toThrow(
        "Gagal mengubah konten kursus"
      );
    });

    it("should GET content detail from data.course_content", async () => {
      const spy = mockFetch({
        status: "success",
        data: { course_content: { id: 11, title: "Intro" } },
      });

      expect(await courseApi.getCourseContentById(11)).toEqual({ id: 11, title: "Intro" });
      expect(spy).toHaveBeenCalledWith(`${BASE}/-/contents/11`, { method: "GET" });
    });

    it("should return undefined for content detail when data is missing", async () => {
      mockFetch({ status: "success" });
      expect(await courseApi.getCourseContentById(11)).toBeUndefined();
    });

    it("should throw when content detail fails", async () => {
      mockFetch({ status: "fail" });
      await expect(courseApi.getCourseContentById(11)).rejects.toThrow(
        "Gagal mengambil detail konten kursus"
      );
    });

    it("should DELETE content", async () => {
      const spy = mockFetch({ status: "success", message: "Berhasil menghapus konten kursus" });

      expect(await courseApi.deleteCourseContent(11)).toBe("Berhasil menghapus konten kursus");
      expect(spy).toHaveBeenCalledWith(`${BASE}/-/contents/11`, { method: "DELETE" });
    });

    it("should throw when deleting content fails", async () => {
      mockFetch({ status: "fail" });
      await expect(courseApi.deleteCourseContent(11)).rejects.toThrow(
        "Gagal menghapus konten kursus"
      );
    });
  });

  describe("postCourseContentStatus", () => {
    it("should send status 1 when finished", async () => {
      const spy = mockFetch({ status: "success", message: "Berhasil mengubah status" });

      expect(await courseApi.postCourseContentStatus(11, true)).toBe("Berhasil mengubah status");
      expect(spy).toHaveBeenCalledWith(`${BASE}/-/contents/11/learns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: 1 }),
      });
    });

    it("should send status 0 when not finished", async () => {
      const spy = mockFetch({ status: "success", message: "ok" });

      await courseApi.postCourseContentStatus(11, 0);

      expect((spy.mock.calls[0][1] as RequestInit).body).toBe(JSON.stringify({ status: 0 }));
    });

    it("should throw on failure", async () => {
      mockFetch({ status: "fail" });
      await expect(courseApi.postCourseContentStatus(11, 1)).rejects.toThrow(
        "Gagal mengubah status pembelajaran"
      );
    });
  });
});
