import { describe, it, expect, vi, beforeEach } from "vitest";
import ChangeModal from "./ChangeModal.svelte";
import { renderWithProviders } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";

const tick = (ms = 10) => new Promise((r) => setTimeout(r, ms));
const course = { id: 4, user_id: 1, title: "Judul Awal", description: "Deskripsi Awal" };
const value = (wrapper: any, id: string) => (wrapper.find(`[data-testid="${id}"]`).element as HTMLInputElement).value;

describe("ChangeModal (course)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not render when show is false or course is null", () => {
    const { wrapper } = renderWithProviders(ChangeModal, { props: { show: false, course } });
    expect(wrapper.find('[data-testid="edit-course-modal"]').exists()).toBe(false);

    const { wrapper: w2 } = renderWithProviders(ChangeModal, { props: { show: true, course: null } });
    expect(w2.find('[data-testid="edit-course-modal"]').exists()).toBe(false);
  });

  it("should prefill the form with course data", () => {
    const { wrapper } = renderWithProviders(ChangeModal, { props: { show: true, course } });
    expect(wrapper.text()).toContain("Ubah Data Kursus");
    expect(value(wrapper, "edit-course-title-input")).toBe("Judul Awal");
    expect(value(wrapper, "edit-course-description-input")).toBe("Deskripsi Awal");
  });

  it("should validate empty title and description", async () => {
    const errorSpy = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => ({}) as any);
    const { wrapper, coursesStore } = renderWithProviders(ChangeModal, { props: { show: true, course } });
    const changeSpy = vi.spyOn(coursesStore, "asyncSetIsCourseChange").mockResolvedValue();

    await wrapper.find('[data-testid="edit-course-title-input"]').setValue("  ");
    await wrapper.find("form").trigger("submit");
    expect(errorSpy).toHaveBeenCalledWith("Judul kursus tidak boleh kosong");

    await wrapper.find('[data-testid="edit-course-title-input"]').setValue("Baru");
    await wrapper.find('[data-testid="edit-course-description-input"]').setValue("  ");
    await wrapper.find("form").trigger("submit");
    expect(errorSpy).toHaveBeenCalledWith("Deskripsi kursus tidak boleh kosong");

    expect(changeSpy).not.toHaveBeenCalled();
  });

  it("should submit trimmed values", async () => {
    const { wrapper, coursesStore } = renderWithProviders(ChangeModal, { props: { show: true, course } });
    const changeSpy = vi.spyOn(coursesStore, "asyncSetIsCourseChange").mockResolvedValue();

    await wrapper.find('[data-testid="edit-course-title-input"]').setValue(" Judul Baru ");
    await wrapper.find('[data-testid="edit-course-description-input"]').setValue(" Deskripsi Baru ");
    await wrapper.find("form").trigger("submit");

    expect(changeSpy).toHaveBeenCalledWith(4, "Judul Baru", "Deskripsi Baru");
    expect(wrapper.text()).toContain("Menyimpan...");
  });

  it("should reload the course and close after a successful change", async () => {
    const onClose = vi.fn();
    const { coursesStore } = renderWithProviders(ChangeModal, { props: { show: true, course, onClose } });
    const reloadSpy = vi.spyOn(coursesStore, "asyncSetCourse").mockResolvedValue();

    coursesStore.setIsCourseChanged(true);
    coursesStore.setIsCourseChange(true);
    await tick();

    expect(reloadSpy).toHaveBeenCalledWith(4);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(coursesStore.isCourseChange).toBe(false);
    expect(coursesStore.isCourseChanged).toBe(false);
  });

  it("should stay open when the change failed", async () => {
    const onClose = vi.fn();
    const { wrapper, coursesStore } = renderWithProviders(ChangeModal, { props: { show: true, course, onClose } });

    coursesStore.setIsCourseChanged(false);
    coursesStore.setIsCourseChange(true);
    await tick();

    expect(onClose).not.toHaveBeenCalled();
    expect(wrapper.find('[data-testid="edit-course-modal"]').exists()).toBe(true);
  });

  it("should trigger onClose from buttons and work without onClose", async () => {
    const onClose = vi.fn();
    const { wrapper } = renderWithProviders(ChangeModal, { props: { show: true, course, onClose } });
    await wrapper.find('[data-testid="close-edit-modal-btn"]').trigger("click");
    await wrapper.find('[data-testid="cancel-edit-modal-btn"]').trigger("click");
    expect(onClose).toHaveBeenCalledTimes(2);

    const { wrapper: w2 } = renderWithProviders(ChangeModal, { props: { show: true, course } });
    await w2.find('[data-testid="close-edit-modal-btn"]').trigger("click");
    expect(w2.exists()).toBe(true);
  });

  it("should toggle document body overflow on show prop change", async () => {
    const { rerender } = renderWithProviders(ChangeModal, { props: { show: true, course } });
    expect(document.body.style.overflow).toBe("hidden");

    await rerender({ show: false, course });
    expect(document.body.style.overflow).toBe("auto");
  });
});
