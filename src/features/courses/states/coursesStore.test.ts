import { describe, it, expect, vi, beforeEach } from "vitest";
import { useCoursesStore, coursesStore } from "./coursesStore";
import courseApi from "../api/courseApi";
import * as toolsHelper from "../../../helpers/toolsHelper";

const FLAG_KEYS = [
  "isCourse",
  "isContent",
  "isCourseAdd",
  "isCourseAdded",
  "isCourseChange",
  "isCourseChanged",
  "isCourseDelete",
  "isCourseDeleted",
  "isCourseDeleteAll",
  "isCourseDeletedAll",
  "isCourseChangeCover",
  "isCourseChangedCover",
  "isCourseJoin",
  "isCourseJoined",
  "isCourseLeave",
  "isCourseLeft",
  "isCourseRating",
  "isCourseRated",
  "isContentAdd",
  "isContentAdded",
  "isContentChange",
  "isContentChanged",
  "isContentDelete",
  "isContentDeleted",
  "isContentStatus",
  "isContentStatusChanged",
];

describe("coursesStore", () => {
  beforeEach(() => {
    coursesStore.reset();
    vi.restoreAllMocks();
  });

  it("should expose the same store through useCoursesStore", () => {
    expect(useCoursesStore()).toBe(coursesStore);
  });

  it("should have correct default state", () => {
    const store = useCoursesStore();
    expect(store.courses).toEqual([]);
    expect(store.course).toBeNull();
    expect(store.content).toBeNull();
    for (const key of FLAG_KEYS) {
      expect((store as any)[key]).toBe(false);
    }
    expect(store.$state.courses).toEqual([]);
  });

  it("should update data with setters", () => {
    const store = useCoursesStore();
    store.setCourses([{ id: 1 } as any]);
    expect(store.courses).toEqual([{ id: 1 }]);
    store.setCourse({ id: 2 } as any);
    expect(store.course).toEqual({ id: 2 });
    store.setContent({ id: 3 } as any);
    expect(store.content).toEqual({ id: 3 });
  });

  it("should update every flag with its setter", () => {
    const store = useCoursesStore();
    for (const key of FLAG_KEYS) {
      const setter = `set${key.charAt(0).toUpperCase()}${key.slice(1)}`;
      expect(typeof (store as any)[setter]).toBe("function");
      (store as any)[setter](true);
      expect((store as any)[key]).toBe(true);
    }
  });

  it("should reset to initial state, optionally with a partial state", () => {
    const store = useCoursesStore();
    store.setCourses([{ id: 1 } as any]);
    store.reset({ isCourseDeleted: true });
    expect(store.courses).toEqual([]);
    expect(store.isCourseDeleted).toBe(true);
  });

  it("should be subscribable", () => {
    const values: any[] = [];
    const unsubscribe = coursesStore.subscribe((s) => values.push(s.courses.length));
    coursesStore.setCourses([{ id: 1 } as any]);
    unsubscribe();
    expect(values).toEqual([0, 1]);
  });

  describe("asyncSetCourses", () => {
    it("should load all courses by default", async () => {
      const spy = vi.spyOn(courseApi, "getCourses").mockResolvedValue([{ id: 1 } as any]);
      await coursesStore.asyncSetCourses();
      expect(spy).toHaveBeenCalledWith(false);
      expect(coursesStore.courses).toEqual([{ id: 1 }]);
    });

    it("should load only my courses when requested", async () => {
      const spy = vi.spyOn(courseApi, "getCourses").mockResolvedValue([]);
      await coursesStore.asyncSetCourses(true);
      expect(spy).toHaveBeenCalledWith(true);
    });

    it("should set empty array on error", async () => {
      coursesStore.setCourses([{ id: 1 } as any]);
      vi.spyOn(courseApi, "getCourses").mockRejectedValue(new Error("x"));
      await coursesStore.asyncSetCourses();
      expect(coursesStore.courses).toEqual([]);
    });
  });

  describe("asyncSetCourse", () => {
    it("should set course and raise isCourse on success", async () => {
      vi.spyOn(courseApi, "getCourseById").mockResolvedValue({ id: 1 } as any);
      await coursesStore.asyncSetCourse(1);
      expect(coursesStore.course).toEqual({ id: 1 });
      expect(coursesStore.isCourse).toBe(true);
    });

    it("should set null and raise isCourse on error", async () => {
      vi.spyOn(courseApi, "getCourseById").mockRejectedValue(new Error("x"));
      await coursesStore.asyncSetCourse(99);
      expect(coursesStore.course).toBeNull();
      expect(coursesStore.isCourse).toBe(true);
    });
  });

  describe("asyncSetContent", () => {
    it("should set content and raise isContent on success", async () => {
      vi.spyOn(courseApi, "getCourseContentById").mockResolvedValue({ id: 5 } as any);
      await coursesStore.asyncSetContent(5);
      expect(coursesStore.content).toEqual({ id: 5 });
      expect(coursesStore.isContent).toBe(true);
    });

    it("should set null and raise isContent on error", async () => {
      vi.spyOn(courseApi, "getCourseContentById").mockRejectedValue(new Error("x"));
      await coursesStore.asyncSetContent(5);
      expect(coursesStore.content).toBeNull();
      expect(coursesStore.isContent).toBe(true);
    });
  });

  // [nama aksi, argumen, metode API, nilai kembali API, pesan default, bendera sukses, bendera selesai]
  const mutations: Array<[string, any[], keyof typeof courseApi, string, string, string]> = [
    ["asyncSetIsCourseAdd", ["T", "D"], "postCourse", "Kursus berhasil ditambahkan!", "isCourseAdded", "isCourseAdd"],
    ["asyncSetIsCourseChange", [1, "T", "D"], "putCourse", "Kursus berhasil diubah!", "isCourseChanged", "isCourseChange"],
    ["asyncSetIsCourseChangeCover", [1, new File(["x"], "c.png")], "postCourseCover", "Sampul kursus berhasil diubah!", "isCourseChangedCover", "isCourseChangeCover"],
    ["asyncSetIsCourseDelete", [1], "deleteCourse", "Kursus berhasil dihapus!", "isCourseDeleted", "isCourseDelete"],
    ["asyncSetIsCourseDeleteAll", [], "deleteAllCourses", "Semua kursus berhasil dihapus!", "isCourseDeletedAll", "isCourseDeleteAll"],
    ["asyncSetIsCourseJoin", [1], "postCourseStudent", "Berhasil bergabung ke kursus!", "isCourseJoined", "isCourseJoin"],
    ["asyncSetIsCourseLeave", [1], "deleteCourseStudent", "Berhasil keluar dari kursus!", "isCourseLeft", "isCourseLeave"],
    ["asyncSetIsCourseRating", [1, 5, "Bagus"], "putCourseRating", "Rating berhasil disimpan!", "isCourseRated", "isCourseRating"],
    ["asyncSetIsContentAdd", [1, "T", "https://youtu.be/abcdefg"], "postCourseContent", "Konten berhasil ditambahkan!", "isContentAdded", "isContentAdd"],
    ["asyncSetIsContentChange", [1, "T", "https://youtu.be/abcdefg"], "putCourseContent", "Konten berhasil diubah!", "isContentChanged", "isContentChange"],
    ["asyncSetIsContentDelete", [1], "deleteCourseContent", "Konten berhasil dihapus!", "isContentDeleted", "isContentDelete"],
    ["asyncSetIsContentStatus", [1, 1], "postCourseContentStatus", "Status belajar berhasil diubah!", "isContentStatusChanged", "isContentStatus"],
  ];


  for (const [action, args, apiMethod, defaultMessage, okKey, doneKey] of mutations) {
    describe(action, () => {
      it("should call the API with its arguments, show the default success dialog and set flags", async () => {
        const apiSpy = vi.spyOn(courseApi, apiMethod as any).mockResolvedValue(undefined as any);
        const successSpy = vi.spyOn(toolsHelper, "showSuccessDialog").mockImplementation(() => ({}) as any);

        await (coursesStore as any)[action](...args);

        expect(apiSpy).toHaveBeenCalledWith(...args);
        expect(successSpy).toHaveBeenCalledWith(defaultMessage);
        expect((coursesStore as any)[okKey]).toBe(true);
        expect((coursesStore as any)[doneKey]).toBe(true);
      });

      // aksi "tambah" mengembalikan data (bukan pesan), jadi selalu memakai pesan default
      const returnsMessage = !["asyncSetIsCourseAdd", "asyncSetIsContentAdd"].includes(action);
      (returnsMessage ? it : it.skip)("should prefer the server message for the success dialog", async () => {
        vi.spyOn(courseApi, apiMethod as any).mockResolvedValue("Pesan dari server" as any);
        const successSpy = vi.spyOn(toolsHelper, "showSuccessDialog").mockImplementation(() => ({}) as any);

        await (coursesStore as any)[action](...args);

        expect(successSpy).toHaveBeenCalledWith("Pesan dari server");
      });

      it("should show an error dialog and keep success flag false on failure", async () => {
        vi.spyOn(courseApi, apiMethod as any).mockRejectedValue(new Error("Gagal total"));
        const errorSpy = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => ({}) as any);
        (coursesStore as any)[`set${okKey.charAt(0).toUpperCase()}${okKey.slice(1)}`](true);

        await (coursesStore as any)[action](...args);

        expect(errorSpy).toHaveBeenCalledWith("Gagal total");
        expect((coursesStore as any)[okKey]).toBe(false);
        expect((coursesStore as any)[doneKey]).toBe(true);
      });
    });
  }
});
