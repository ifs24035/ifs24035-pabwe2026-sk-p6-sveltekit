import { describe, it, expect, vi, beforeEach } from "vitest";
import DetailPage from "./DetailPage.svelte";
import { renderWithProviders } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";
import { coursesStore } from "../states/coursesStore";
import { mockGoto } from "../../../setupTests";

const tick = (ms = 15) => new Promise((r) => setTimeout(r, ms));

const owner = { id: 1, name: "Pemilik", email: "owner@del.org" };
const student = { id: 2, name: "Peserta", email: "student@del.org" };
const visitor = { id: 3, name: "Pengunjung", email: "visitor@del.org" };

const course = {
  id: 10,
  user_id: 1,
  title: "Belajar SvelteKit",
  description: "Deskripsi kursus SvelteKit",
  cover: "https://example.com/cover.jpg",
  created_at: "2024-10-06T00:40:35.000000Z",
  author: { name: "Abdullah Ubaid" },
  students: [2],
  total_contents: 2,
  avg_ratings: "4.00",
  my_percentage_finished: "50.00",
  contents: [
    { id: 100, course_id: 10, title: "Pengenalan", youtube: "https://youtu.be/uHyfQV0kbgo", my_status_finished: true },
    { id: 101, course_id: 10, title: "Routing", youtube: "https://youtu.be/uHyfQV0kbgp", my_status_finished: false },
  ],
  ratings: [{ name: "Peserta", ratings: 4, comment: "Keren kursusnya" }],
};

const render = (profile: any, courseData: any = course, extra: Record<string, any> = {}) =>
  renderWithProviders(DetailPage, {
    props: { courseId: 10 },
    preloadedState: { profile, course: courseData, ...extra },
  });

const t = (id: string) => `[data-testid="${id}"]`;

describe("DetailPage (course)", () => {
  let loadSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    loadSpy = vi.spyOn(coursesStore, "asyncSetCourse").mockImplementation(() => Promise.resolve());
  });

  describe("loading", () => {
    it("should show a spinner when profile or course is missing", () => {
      const { wrapper } = render(null, null);
      expect(wrapper.text()).not.toContain("Belajar SvelteKit");

      const { wrapper: w2 } = render(owner, null);
      expect(w2.text()).not.toContain("Belajar SvelteKit");
    });

    it("should load the course on mount and when courseId changes", async () => {
      const { rerender } = render(owner);
      expect(loadSpy).toHaveBeenCalledWith(10);

      await rerender({ courseId: 11 });
      await tick();
      expect(loadSpy).toHaveBeenCalledWith(11);
    });
  });

  describe("as owner", () => {
    it("should render course info and owner actions", async () => {
      const { wrapper } = render(owner);
      await tick();

      expect(wrapper.text()).toContain("Belajar SvelteKit");
      expect(wrapper.text()).toContain("Deskripsi kursus SvelteKit");
      expect(wrapper.text()).toContain("Abdullah Ubaid");
      expect(wrapper.find(t("role-badge")).text()).toContain("Pemilik Kursus");
      expect(wrapper.find(t("back-to-courses-link")).attributes("href")).toBe("/");
      expect(wrapper.find(t("stat-students")).text()).toContain("1 Peserta");
      expect(wrapper.find(t("stat-contents")).text()).toContain("2 Konten");
      expect(wrapper.find(t("stat-rating")).text()).toContain("4.0");

      expect(wrapper.find(t("edit-cover-btn")).exists()).toBe(true);
      expect(wrapper.find(t("edit-detail-course-btn")).exists()).toBe(true);
      expect(wrapper.find(t("delete-detail-course-btn")).exists()).toBe(true);
      expect(wrapper.find(t("join-course-btn")).exists()).toBe(false);
      expect(wrapper.find(t("leave-course-btn")).exists()).toBe(false);
      expect(wrapper.find(t("progress-section")).exists()).toBe(false);
      expect(wrapper.find(t("rating-form")).exists()).toBe(false);
      expect(wrapper.find(t("join-hint")).exists()).toBe(false);
    });

    it("should list contents with open, edit and delete actions", async () => {
      const { wrapper } = render(owner);
      await tick();

      expect(wrapper.find(t("content-item-100")).text()).toContain("Pengenalan");
      expect(wrapper.find(t("content-item-101")).text()).toContain("Routing");
      expect(wrapper.find(t("content-finished-100")).exists()).toBe(false);

      mockGoto.mockClear();
      await wrapper.find(t("open-content-100")).trigger("click");
      expect(mockGoto).toHaveBeenCalledWith("/courses/10/contents/100");
    });

    it("should open and close the cover and edit modals", async () => {
      const { wrapper } = render(owner);
      await tick();

      await wrapper.find(t("edit-cover-btn")).trigger("click");
      expect(wrapper.find(t("change-cover-modal")).exists()).toBe(true);
      await wrapper.find(t("close-cover-modal-btn")).trigger("click");
      expect(wrapper.find(t("change-cover-modal")).exists()).toBe(false);

      await wrapper.find(t("edit-detail-course-btn")).trigger("click");
      expect(wrapper.find(t("edit-course-modal")).exists()).toBe(true);
      await wrapper.find(t("close-edit-modal-btn")).trigger("click");
      expect(wrapper.find(t("edit-course-modal")).exists()).toBe(false);
    });

    it("should open the content modal in add and edit mode, and reload after success", async () => {
      const { wrapper } = render(owner);
      await tick();

      await wrapper.find(t("add-content-btn")).trigger("click");
      expect(wrapper.find(t("content-modal")).text()).toContain("Tambah Konten");
      await wrapper.find(t("close-content-modal-btn")).trigger("click");
      expect(wrapper.find(t("content-modal")).exists()).toBe(false);

      await wrapper.find(t("edit-content-100")).trigger("click");
      expect(wrapper.find(t("content-modal")).text()).toContain("Ubah Konten");
      expect((wrapper.find(t("content-title-input")).element as HTMLInputElement).value).toBe("Pengenalan");

      loadSpy.mockClear();
      coursesStore.setIsContentChanged(true);
      coursesStore.setIsContentChange(true);
      await tick();
      expect(loadSpy).toHaveBeenCalledWith(10);
      expect(wrapper.find(t("content-modal")).exists()).toBe(false);
    });

    it("should delete the course only after confirmation", async () => {
      const deleteSpy = vi.spyOn(coursesStore, "asyncSetIsCourseDelete").mockResolvedValue();
      const confirmSpy = vi.spyOn(toolsHelper, "showConfirmDialog");
      const { wrapper } = render(owner);
      await tick();

      confirmSpy.mockResolvedValue({ isConfirmed: false } as any);
      await wrapper.find(t("delete-detail-course-btn")).trigger("click");
      await tick();
      expect(deleteSpy).not.toHaveBeenCalled();

      confirmSpy.mockResolvedValue({ isConfirmed: true } as any);
      await wrapper.find(t("delete-detail-course-btn")).trigger("click");
      await tick();
      expect(deleteSpy).toHaveBeenCalledWith(10);
    });

    it("should delete a content only after confirmation", async () => {
      const deleteSpy = vi.spyOn(coursesStore, "asyncSetIsContentDelete").mockResolvedValue();
      const confirmSpy = vi.spyOn(toolsHelper, "showConfirmDialog");
      const { wrapper } = render(owner);
      await tick();

      confirmSpy.mockResolvedValue({ isConfirmed: false } as any);
      await wrapper.find(t("delete-content-100")).trigger("click");
      await tick();
      expect(deleteSpy).not.toHaveBeenCalled();

      confirmSpy.mockResolvedValue({ isConfirmed: true } as any);
      await wrapper.find(t("delete-content-100")).trigger("click");
      await tick();
      expect(deleteSpy).toHaveBeenCalledWith(100);
    });

    it("should show the empty states and fallbacks for a bare course", async () => {
      const bare = { id: 10, user_id: 1, title: "Kosong", description: "Tanpa data" };
      const { wrapper } = render(owner, bare);
      await tick();

      expect(wrapper.text()).toContain("Belum ada konten pada kursus ini.");
      expect(wrapper.text()).toContain("Belum ada rating untuk kursus ini.");
      expect(wrapper.find(t("stat-students")).text()).toContain("0 Peserta");
      expect(wrapper.find(t("stat-contents")).text()).toContain("0 Konten");
      expect(wrapper.find(t("stat-rating")).text()).toContain("-");
      expect(wrapper.element?.querySelector("img")).toBeNull();
    });
  });

  describe("as student", () => {
    it("should render student UI with progress, finished badge and rating form", async () => {
      const { wrapper } = render(student);
      await tick();

      expect(wrapper.find(t("role-badge")).text()).toContain("Peserta");
      expect(wrapper.find(t("leave-course-btn")).exists()).toBe(true);
      expect(wrapper.find(t("join-course-btn")).exists()).toBe(false);
      expect(wrapper.find(t("edit-cover-btn")).exists()).toBe(false);
      expect(wrapper.find(t("add-content-btn")).exists()).toBe(false);
      expect(wrapper.find(t("progress-value")).text()).toContain("50%");
      expect(wrapper.find(t("content-finished-100")).exists()).toBe(true);
      expect(wrapper.find(t("content-finished-101")).exists()).toBe(false);
      expect(wrapper.find(t("open-content-100")).exists()).toBe(true);
      expect(wrapper.find(t("edit-content-100")).exists()).toBe(false);
      expect(wrapper.find(t("rating-form")).exists()).toBe(true);
      expect(wrapper.find(t("rating-item-0")).text()).toContain("Keren kursusnya");
      expect(wrapper.find(t("rating-item-0")).text()).toContain("4 / 5");
    });

    it("should treat missing progress as 0%", async () => {
      const { wrapper } = render(student, { ...course, my_percentage_finished: null });
      await tick();
      expect(wrapper.find(t("progress-value")).text()).toContain("0%");
    });

    it("should leave the course only after confirmation", async () => {
      const leaveSpy = vi.spyOn(coursesStore, "asyncSetIsCourseLeave").mockResolvedValue();
      const confirmSpy = vi.spyOn(toolsHelper, "showConfirmDialog");
      const { wrapper } = render(student);
      await tick();

      confirmSpy.mockResolvedValue({ isConfirmed: false } as any);
      await wrapper.find(t("leave-course-btn")).trigger("click");
      await tick();
      expect(leaveSpy).not.toHaveBeenCalled();

      confirmSpy.mockResolvedValue({ isConfirmed: true } as any);
      await wrapper.find(t("leave-course-btn")).trigger("click");
      await tick();
      expect(leaveSpy).toHaveBeenCalledWith(10);
    });

    it("should validate and submit a rating, then reset the form after success", async () => {
      const errorSpy = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => ({}) as any);
      const ratingSpy = vi.spyOn(coursesStore, "asyncSetIsCourseRating").mockResolvedValue();
      const { wrapper } = render(student);
      await tick();

      await wrapper.find("form").trigger("submit");
      expect(errorSpy).toHaveBeenCalledWith("Pilih rating 1 sampai 5 bintang");

      await wrapper.find(t("rating-star-4")).trigger("click");
      await wrapper.find("form").trigger("submit");
      expect(errorSpy).toHaveBeenCalledWith("Komentar tidak boleh kosong");
      expect(ratingSpy).not.toHaveBeenCalled();

      await wrapper.find(t("rating-comment-input")).setValue("  Mantap  ");
      await wrapper.find("form").trigger("submit");
      expect(ratingSpy).toHaveBeenCalledWith(10, 4, "Mantap");
      expect(wrapper.find(t("submit-rating-btn")).text()).toContain("Menyimpan...");

      loadSpy.mockClear();
      coursesStore.setIsCourseRated(true);
      coursesStore.setIsCourseRating(true);
      await tick();

      expect(loadSpy).toHaveBeenCalledWith(10);
      expect((wrapper.find(t("rating-comment-input")).element as HTMLTextAreaElement).value).toBe("");
      expect(wrapper.find(t("submit-rating-btn")).text()).toContain("Kirim Rating");
    });

    it("should keep the rating form when rating failed", async () => {
      const { wrapper } = render(student);
      await tick();
      await wrapper.find(t("rating-comment-input")).setValue("Komentar");

      loadSpy.mockClear();
      coursesStore.setIsCourseRating(true);
      await tick();

      expect(loadSpy).not.toHaveBeenCalled();
      expect((wrapper.find(t("rating-comment-input")).element as HTMLTextAreaElement).value).toBe("Komentar");
    });

    it("should reload after leaving succeeded, but not when it failed", async () => {
      render(student);
      await tick();

      loadSpy.mockClear();
      coursesStore.setIsCourseLeave(true);
      await tick();
      expect(loadSpy).not.toHaveBeenCalled();
      expect(coursesStore.isCourseLeave).toBe(false);

      coursesStore.setIsCourseLeft(true);
      coursesStore.setIsCourseLeave(true);
      await tick();
      expect(loadSpy).toHaveBeenCalledWith(10);
      expect(coursesStore.isCourseLeft).toBe(false);
    });
  });

  describe("as visitor", () => {
    it("should render join button, hide contents actions and show a hint", async () => {
      const { wrapper } = render(visitor);
      await tick();

      expect(wrapper.find(t("role-badge")).exists()).toBe(false);
      expect(wrapper.find(t("join-course-btn")).exists()).toBe(true);
      expect(wrapper.find(t("leave-course-btn")).exists()).toBe(false);
      expect(wrapper.find(t("open-content-100")).exists()).toBe(false);
      expect(wrapper.find(t("content-finished-100")).exists()).toBe(false);
      expect(wrapper.find(t("rating-form")).exists()).toBe(false);
      expect(wrapper.find(t("join-hint")).exists()).toBe(true);
    });

    it("should join the course and reload on success", async () => {
      const joinSpy = vi.spyOn(coursesStore, "asyncSetIsCourseJoin").mockResolvedValue();
      const { wrapper } = render(visitor);
      await tick();

      await wrapper.find(t("join-course-btn")).trigger("click");
      expect(joinSpy).toHaveBeenCalledWith(10);

      loadSpy.mockClear();
      coursesStore.setIsCourseJoined(true);
      coursesStore.setIsCourseJoin(true);
      await tick();
      expect(loadSpy).toHaveBeenCalledWith(10);
      expect(coursesStore.isCourseJoined).toBe(false);
    });

    it("should not reload when joining failed", async () => {
      render(visitor);
      await tick();

      loadSpy.mockClear();
      coursesStore.setIsCourseJoin(true);
      await tick();
      expect(loadSpy).not.toHaveBeenCalled();
    });
  });

  describe("when the user is both owner and student", () => {
    it("should show the owner interface first", async () => {
      const { wrapper } = render(owner, { ...course, students: [1, 2] });
      await tick();

      expect(wrapper.find(t("role-badge")).text()).toContain("Pemilik Kursus");
      expect(wrapper.find(t("edit-cover-btn")).exists()).toBe(true);
      expect(wrapper.find(t("leave-course-btn")).exists()).toBe(false);
      expect(wrapper.find(t("progress-section")).exists()).toBe(false);
      expect(wrapper.find(t("rating-form")).exists()).toBe(false);
      expect(wrapper.find(t("open-content-100")).exists()).toBe(true);
      expect(wrapper.find(t("edit-content-100")).exists()).toBe(true);
    });
  });

  describe("store flags", () => {
    it("should go home when the course could not be loaded", async () => {
      render(owner);
      await tick();

      mockGoto.mockClear();
      coursesStore.setCourse(null);
      coursesStore.setIsCourse(true);
      await tick();
      expect(mockGoto).toHaveBeenCalledWith("/");
    });

    it("should stay on the page when isCourse is raised and the course exists", async () => {
      const { wrapper } = render(owner);
      await tick();

      mockGoto.mockClear();
      coursesStore.setIsCourse(true);
      await tick();
      expect(mockGoto).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("Belajar SvelteKit");
    });

    it("should go home after the course is deleted, but not when deleting failed", async () => {
      render(owner);
      await tick();

      mockGoto.mockClear();
      coursesStore.setIsCourseDelete(true);
      await tick();
      expect(mockGoto).not.toHaveBeenCalled();

      coursesStore.setIsCourseDeleted(true);
      coursesStore.setIsCourseDelete(true);
      await tick();
      expect(mockGoto).toHaveBeenCalledWith("/");
    });

    it("should reload after a content is deleted, but not when deleting failed", async () => {
      render(owner);
      await tick();

      loadSpy.mockClear();
      coursesStore.setIsContentDelete(true);
      await tick();
      expect(loadSpy).not.toHaveBeenCalled();

      coursesStore.setIsContentDeleted(true);
      coursesStore.setIsContentDelete(true);
      await tick();
      expect(loadSpy).toHaveBeenCalledWith(10);
    });
  });
});
