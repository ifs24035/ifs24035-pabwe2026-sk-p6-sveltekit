import { describe, it, expect, vi, beforeEach } from "vitest";
import HomePage from "./HomePage.svelte";
import { renderWithProviders } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";
import { coursesStore } from "../states/coursesStore";
import { mockGoto } from "../../../setupTests";

const tick = (ms = 20) => new Promise((r) => setTimeout(r, ms));

describe("HomePage (courses)", () => {
  const profile = { id: 1, name: "Abdullah", email: "abdul@del.org" };
  const courses = [
    {
      id: 1,
      user_id: 1,
      title: "Belajar Svelte",
      description: "Dasar Svelte untuk pemula",
      cover: "https://example.com/cover1.jpg",
      author: { name: "Abdullah Ubaid" },
      students: [1, 2],
      total_contents: 3,
      avg_ratings: "4.5000",
    },
    {
      id: 2,
      user_id: 2,
      title: "Belajar Bahasa C",
      description: "Dasar C dari awal",
      cover: null,
      author: null,
      students: undefined,
      total_contents: undefined,
      avg_ratings: null,
    },
  ];

  let loadSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    loadSpy = vi.spyOn(coursesStore, "asyncSetCourses").mockImplementation(() => Promise.resolve());
  });

  it("should render nothing when profile is missing", () => {
    const { wrapper } = renderWithProviders(HomePage, { preloadedState: { profile: null } });
    expect(wrapper.find('[data-testid="add-course-btn"]').exists()).toBe(false);
  });

  it("should load all courses on mount and show the empty state", async () => {
    const { wrapper } = renderWithProviders(HomePage, { preloadedState: { profile, courses: [] } });
    await tick();

    expect(loadSpy).toHaveBeenCalledWith(false);
    expect(wrapper.text()).toContain("Semua Kursus");
    expect(wrapper.text()).toContain("Belum ada kursus yang cocok.");
    expect(wrapper.find('[data-testid="course-count"]').text()).toContain("Total: 0 Kursus");
  });

  it("should show a loading indicator while courses are loading", async () => {
    const { wrapper } = renderWithProviders(HomePage, { preloadedState: { profile, courses: [] } });
    await tick();

    loadSpy.mockReturnValue(new Promise(() => {}));
    await wrapper.find('[data-testid="filter-mine-btn"]').trigger("click");

    expect(wrapper.text()).toContain("Memuat daftar kursus...");
  });

  it("should render course cards with owner badge, fallbacks and stats", async () => {
    const { wrapper } = renderWithProviders(HomePage, { preloadedState: { profile, courses } });
    await tick();

    const card1 = wrapper.find('[data-testid="course-card-1"]');
    expect(card1.text()).toContain("Belajar Svelte");
    expect(card1.text()).toContain("Abdullah Ubaid");
    expect(card1.text()).toContain("Milik Saya");
    expect(card1.text()).toContain("4.5");
    expect(card1.find("img").exists()).toBe(true);
    expect(wrapper.find('[data-testid="delete-course-1"]').exists()).toBe(true);

    const card2 = wrapper.find('[data-testid="course-card-2"]');
    expect(card2.text()).toContain("Belajar Bahasa C");
    expect(card2.text()).not.toContain("Milik Saya");
    expect(card2.find("img").exists()).toBe(false);
    expect(wrapper.find('[data-testid="delete-course-2"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="course-count"]').text()).toContain("Total: 2 Kursus");
  });

  it("should search by title, description and author name", async () => {
    const { wrapper } = renderWithProviders(HomePage, { preloadedState: { profile, courses } });
    await tick();
    const search = wrapper.find('[data-testid="search-course-input"]');

    await search.setValue("svelte");
    expect(wrapper.text()).toContain("Belajar Svelte");
    expect(wrapper.text()).not.toContain("Belajar Bahasa C");

    await search.setValue("dari awal");
    expect(wrapper.text()).toContain("Belajar Bahasa C");
    expect(wrapper.text()).not.toContain("Belajar Svelte");

    await search.setValue("ubaid");
    expect(wrapper.text()).toContain("Belajar Svelte");

    await search.setValue("tidak ada");
    expect(wrapper.text()).toContain("Belum ada kursus yang cocok.");
  });

  it("should tolerate courses with null fields and a null courses store", async () => {
    const { wrapper } = renderWithProviders(HomePage, {
      preloadedState: { profile, courses: [{ id: 9, user_id: 3, title: null, description: null }] },
    });
    await tick();
    await wrapper.find('[data-testid="search-course-input"]').setValue("xyz");
    expect(wrapper.text()).toContain("Belum ada kursus yang cocok.");

    const { wrapper: w2 } = renderWithProviders(HomePage, { preloadedState: { profile, courses: null } });
    await tick();
    expect(w2.text()).toContain("Belum ada kursus yang cocok.");
  });

  it("should reload with my-courses filter and back to all", async () => {
    const { wrapper } = renderWithProviders(HomePage, { preloadedState: { profile, courses } });
    await tick();

    await wrapper.find('[data-testid="filter-mine-btn"]').trigger("click");
    expect(loadSpy).toHaveBeenLastCalledWith(true);

    await wrapper.find('[data-testid="filter-all-btn"]').trigger("click");
    expect(loadSpy).toHaveBeenLastCalledWith(false);
  });

  it("should open and close AddModal, and reload courses after a course is added", async () => {
    const { wrapper } = renderWithProviders(HomePage, { preloadedState: { profile, courses } });
    await tick();

    await wrapper.find('[data-testid="add-course-btn"]').trigger("click");
    expect(wrapper.find('[data-testid="add-course-modal"]').exists()).toBe(true);

    await wrapper.find('[data-testid="close-add-modal-btn"]').trigger("click");
    expect(wrapper.find('[data-testid="add-course-modal"]').exists()).toBe(false);

    await wrapper.find('[data-testid="add-course-btn"]').trigger("click");
    loadSpy.mockClear();
    coursesStore.setIsCourseAdded(true);
    coursesStore.setIsCourseAdd(true);
    await tick();

    expect(loadSpy).toHaveBeenCalled();
    expect(wrapper.find('[data-testid="add-course-modal"]').exists()).toBe(false);
  });

  it("should navigate to the detail page", async () => {
    const { wrapper } = renderWithProviders(HomePage, { preloadedState: { profile, courses } });
    await tick();

    mockGoto.mockClear();
    await wrapper.find('[data-testid="view-course-1"]').trigger("click");
    expect(mockGoto).toHaveBeenCalledWith("/courses/1");
  });

  it("should delete a course only after confirmation", async () => {
    const { wrapper } = renderWithProviders(HomePage, { preloadedState: { profile, courses } });
    await tick();
    const deleteSpy = vi.spyOn(coursesStore, "asyncSetIsCourseDelete").mockResolvedValue();
    const confirmSpy = vi.spyOn(toolsHelper, "showConfirmDialog");

    confirmSpy.mockResolvedValue({ isConfirmed: false } as any);
    await wrapper.find('[data-testid="delete-course-1"]').trigger("click");
    await tick();
    expect(confirmSpy).toHaveBeenCalled();
    expect(deleteSpy).not.toHaveBeenCalled();

    confirmSpy.mockResolvedValue({ isConfirmed: true } as any);
    await wrapper.find('[data-testid="delete-course-1"]').trigger("click");
    await tick();
    expect(deleteSpy).toHaveBeenCalledWith(1);
  });

  it("should delete all my courses only after confirmation", async () => {
    const { wrapper } = renderWithProviders(HomePage, { preloadedState: { profile, courses } });
    await tick();
    const deleteAllSpy = vi.spyOn(coursesStore, "asyncSetIsCourseDeleteAll").mockResolvedValue();
    const confirmSpy = vi.spyOn(toolsHelper, "showConfirmDialog");

    confirmSpy.mockResolvedValue({ isConfirmed: false } as any);
    await wrapper.find('[data-testid="delete-all-courses-btn"]').trigger("click");
    await tick();
    expect(deleteAllSpy).not.toHaveBeenCalled();

    confirmSpy.mockResolvedValue({ isConfirmed: true } as any);
    await wrapper.find('[data-testid="delete-all-courses-btn"]').trigger("click");
    await tick();
    expect(deleteAllSpy).toHaveBeenCalled();
  });

  it("should reload only when a course delete succeeded", async () => {
    renderWithProviders(HomePage, { preloadedState: { profile, courses } });
    await tick();

    loadSpy.mockClear();
    coursesStore.setIsCourseDelete(true);
    await tick();
    expect(loadSpy).not.toHaveBeenCalled();
    expect(coursesStore.isCourseDelete).toBe(false);

    coursesStore.setIsCourseDeleted(true);
    coursesStore.setIsCourseDelete(true);
    await tick();
    expect(loadSpy).toHaveBeenCalledTimes(1);
    expect(coursesStore.isCourseDeleted).toBe(false);
  });

  it("should reload only when delete-all succeeded", async () => {
    renderWithProviders(HomePage, { preloadedState: { profile, courses } });
    await tick();

    loadSpy.mockClear();
    coursesStore.setIsCourseDeleteAll(true);
    await tick();
    expect(loadSpy).not.toHaveBeenCalled();
    expect(coursesStore.isCourseDeleteAll).toBe(false);

    coursesStore.setIsCourseDeletedAll(true);
    coursesStore.setIsCourseDeleteAll(true);
    await tick();
    expect(loadSpy).toHaveBeenCalledTimes(1);
    expect(coursesStore.isCourseDeletedAll).toBe(false);
  });

  it("should not break when unmounted before loading finishes", async () => {
    let resolveLoad: () => void = () => {};
    const pending = new Promise<void>((resolve) => {
      resolveLoad = resolve;
    });
    loadSpy.mockReturnValue(pending);

    const { wrapper } = renderWithProviders(HomePage, { preloadedState: { profile, courses: [] } });
    wrapper.unmount();
    resolveLoad();
    await pending;
  });
});
