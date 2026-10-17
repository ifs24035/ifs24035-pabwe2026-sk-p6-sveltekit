import { describe, it, expect, vi, beforeEach } from "vitest";
import ContentPage from "./ContentPage.svelte";
import { renderWithProviders } from "../../../test-utils";
import { coursesStore } from "../states/coursesStore";
import { mockGoto } from "../../../setupTests";

const tick = (ms = 15) => new Promise((r) => setTimeout(r, ms));
const t = (id: string) => `[data-testid="${id}"]`;

const owner = { id: 1, name: "Pemilik", email: "o@del.org" };
const student = { id: 2, name: "Peserta", email: "s@del.org" };
const visitor = { id: 3, name: "Pengunjung", email: "v@del.org" };

const course = { id: 10, user_id: 1, title: "Belajar SvelteKit", description: "Desc", students: [2] };
const content = {
  id: 100,
  course_id: 10,
  title: "Pengenalan Routing",
  youtube: "https://youtu.be/uHyfQV0kbgo",
  created_at: "2024-10-06T01:03:20.000000Z",
  my_status_finished: false,
};

const render = (profile: any, courseData: any = course, contentData: any = content) =>
  renderWithProviders(ContentPage, {
    props: { courseId: 10, contentId: 100 },
    preloadedState: { profile, course: courseData, content: contentData },
  });

describe("ContentPage", () => {
  let courseSpy: any;
  let contentSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    courseSpy = vi.spyOn(coursesStore, "asyncSetCourse").mockImplementation(() => Promise.resolve());
    contentSpy = vi.spyOn(coursesStore, "asyncSetContent").mockImplementation(() => Promise.resolve());
  });

  it("should show a spinner while profile, course or content is missing", () => {
    expect(render(null).wrapper.text()).not.toContain("Pengenalan Routing");
    expect(render(student, null).wrapper.text()).not.toContain("Pengenalan Routing");
    const loading = render(student, course, null).wrapper;
    expect(loading.text()).not.toContain("Pengenalan Routing");
    expect(loading.find("h1").text()).toContain("Memuat materi kursus");
  });

  it("should load course and content on mount", () => {
    render(student);
    expect(courseSpy).toHaveBeenCalledWith(10);
    expect(contentSpy).toHaveBeenCalledWith(100);
  });

  it("should embed the YouTube video and link back to the course", () => {
    const { wrapper } = render(student);

    expect(wrapper.text()).toContain("Pengenalan Routing");
    expect(wrapper.text()).toContain("Belajar SvelteKit");
    expect(wrapper.find(t("youtube-player")).attributes("src")).toBe(
      "https://www.youtube.com/embed/uHyfQV0kbgo"
    );
    expect(wrapper.find(t("back-to-course-link")).attributes("href")).toBe("/courses/10");
    expect(wrapper.find(t("invalid-video")).exists()).toBe(false);
  });

  it("should show a notice when the YouTube link is invalid", () => {
    const { wrapper } = render(student, course, { ...content, youtube: "bukan-tautan" });

    expect(wrapper.find(t("youtube-player")).exists()).toBe(false);
    expect(wrapper.find(t("invalid-video")).text()).toContain("Tautan video tidak valid.");
  });

  describe("as student", () => {
    it("should show unfinished status and mark the content as finished", async () => {
      const statusSpy = vi.spyOn(coursesStore, "asyncSetIsContentStatus").mockResolvedValue();
      const { wrapper } = render(student);

      expect(wrapper.find(t("status-badge")).text()).toContain("Belum Selesai");
      expect(wrapper.find(t("toggle-status-btn")).text()).toContain("Tandai Selesai");

      await wrapper.find(t("toggle-status-btn")).trigger("click");
      expect(statusSpy).toHaveBeenCalledWith(100, true);
      expect(wrapper.find(t("toggle-status-btn")).text()).toContain("Menyimpan...");
    });

    it("should show finished status and mark the content as unfinished", async () => {
      const statusSpy = vi.spyOn(coursesStore, "asyncSetIsContentStatus").mockResolvedValue();
      const { wrapper } = render(student, course, { ...content, my_status_finished: true });

      expect(wrapper.find(t("status-badge")).text()).toContain("Sudah Selesai");
      expect(wrapper.find(t("toggle-status-btn")).text()).toContain("Tandai Belum Selesai");

      await wrapper.find(t("toggle-status-btn")).trigger("click");
      expect(statusSpy).toHaveBeenCalledWith(100, false);
    });

    it("should reload content and course after the status changed", async () => {
      render(student);
      await tick();

      courseSpy.mockClear();
      contentSpy.mockClear();
      coursesStore.setIsContentStatusChanged(true);
      coursesStore.setIsContentStatus(true);
      await tick();

      expect(contentSpy).toHaveBeenCalledWith(100);
      expect(courseSpy).toHaveBeenCalledWith(10);
      expect(coursesStore.isContentStatusChanged).toBe(false);
    });

    it("should not reload when changing the status failed", async () => {
      const { wrapper } = render(student);
      await tick();

      courseSpy.mockClear();
      contentSpy.mockClear();
      coursesStore.setIsContentStatus(true);
      await tick();

      expect(contentSpy).not.toHaveBeenCalled();
      expect(courseSpy).not.toHaveBeenCalled();
      expect(wrapper.find(t("toggle-status-btn")).text()).toContain("Tandai Selesai");
    });
  });

  describe("as owner (also a student)", () => {
    it("should show the owner interface first, without status controls", () => {
      const { wrapper } = render(owner, { ...course, students: [1, 2] });

      expect(wrapper.find(t("owner-note")).exists()).toBe(true);
      expect(wrapper.find(t("toggle-status-btn")).exists()).toBe(false);
      expect(wrapper.find(t("join-note")).exists()).toBe(false);
    });

    it("should handle a course without students", () => {
      const { wrapper } = render(owner, { id: 10, user_id: 1, title: "X", description: "Y" });
      expect(wrapper.find(t("owner-note")).exists()).toBe(true);
    });
  });

  describe("as visitor", () => {
    it("should ask the visitor to join the course", () => {
      const { wrapper } = render(visitor);

      expect(wrapper.find(t("join-note")).exists()).toBe(true);
      expect(wrapper.find(t("toggle-status-btn")).exists()).toBe(false);
      expect(wrapper.find(t("owner-note")).exists()).toBe(false);
    });
  });

  describe("navigation flags", () => {
    it("should go home when the course could not be loaded", async () => {
      render(student);
      await tick();

      mockGoto.mockClear();
      coursesStore.setCourse(null);
      coursesStore.setIsCourse(true);
      await tick();
      expect(mockGoto).toHaveBeenCalledWith("/");
    });

    it("should stay when the course loaded", async () => {
      render(student);
      await tick();

      mockGoto.mockClear();
      coursesStore.setIsCourse(true);
      await tick();
      expect(mockGoto).not.toHaveBeenCalled();
    });

    it("should go back to the course page when the content could not be loaded", async () => {
      render(student);
      await tick();

      mockGoto.mockClear();
      coursesStore.setContent(null);
      coursesStore.setIsContent(true);
      await tick();
      expect(mockGoto).toHaveBeenCalledWith("/courses/10");
    });

    it("should stay when the content loaded", async () => {
      render(student);
      await tick();

      mockGoto.mockClear();
      coursesStore.setIsContent(true);
      await tick();
      expect(mockGoto).not.toHaveBeenCalled();
    });
  });
});
