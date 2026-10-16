import { describe, it, expect, vi, beforeEach } from "vitest";
import AddModal from "./AddModal.svelte";
import { renderWithProviders } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";

const tick = (ms = 10) => new Promise((r) => setTimeout(r, ms));

describe("AddModal (course)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not render when show is false", () => {
    const { wrapper } = renderWithProviders(AddModal, { props: { show: false } });
    expect(wrapper.find('[data-testid="add-course-modal"]').exists()).toBe(false);
  });

  it("should render form when show is true", () => {
    const { wrapper } = renderWithProviders(AddModal, { props: { show: true } });
    expect(wrapper.find('[data-testid="add-course-modal"]').exists()).toBe(true);
    expect(wrapper.text()).toContain("Tambah Kursus Baru");
  });

  it("should validate empty title and description", async () => {
    const errorSpy = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => ({}) as any);
    const { wrapper, coursesStore } = renderWithProviders(AddModal, { props: { show: true } });
    const addSpy = vi.spyOn(coursesStore, "asyncSetIsCourseAdd").mockResolvedValue();

    await wrapper.find("form").trigger("submit");
    expect(errorSpy).toHaveBeenCalledWith("Judul kursus tidak boleh kosong");

    await wrapper.find('[data-testid="add-course-title-input"]').setValue("Judul");
    await wrapper.find("form").trigger("submit");
    expect(errorSpy).toHaveBeenCalledWith("Deskripsi kursus tidak boleh kosong");

    expect(addSpy).not.toHaveBeenCalled();
  });

  it("should submit trimmed values and show loading state", async () => {
    const { wrapper, coursesStore } = renderWithProviders(AddModal, { props: { show: true } });
    const addSpy = vi.spyOn(coursesStore, "asyncSetIsCourseAdd").mockResolvedValue();

    await wrapper.find('[data-testid="add-course-title-input"]').setValue("  Judul  ");
    await wrapper.find('[data-testid="add-course-description-input"]').setValue("  Deskripsi  ");
    await wrapper.find("form").trigger("submit");

    expect(addSpy).toHaveBeenCalledWith("Judul", "Deskripsi");
    expect(wrapper.text()).toContain("Menyimpan...");
  });

  it("should call onSuccess and onClose and reset the form after a successful add", async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    const { wrapper, coursesStore } = renderWithProviders(AddModal, {
      props: { show: true, onClose, onSuccess },
    });
    vi.spyOn(coursesStore, "asyncSetIsCourseAdd").mockResolvedValue();

    await wrapper.find('[data-testid="add-course-title-input"]').setValue("Judul");
    await wrapper.find('[data-testid="add-course-description-input"]').setValue("Deskripsi");
    await wrapper.find("form").trigger("submit");

    coursesStore.setIsCourseAdded(true);
    coursesStore.setIsCourseAdd(true);
    await tick();

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(coursesStore.isCourseAdd).toBe(false);
    expect(coursesStore.isCourseAdded).toBe(false);
    expect(
      (wrapper.find('[data-testid="add-course-title-input"]').element as HTMLInputElement).value
    ).toBe("");
  });

  it("should close without callbacks being defined", async () => {
    const { wrapper, coursesStore } = renderWithProviders(AddModal, { props: { show: true } });

    coursesStore.setIsCourseAdded(true);
    coursesStore.setIsCourseAdd(true);
    await tick();

    expect(wrapper.exists()).toBe(true);
    expect(coursesStore.isCourseAdded).toBe(false);
  });

  it("should stay open when adding failed", async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    const { coursesStore } = renderWithProviders(AddModal, {
      props: { show: true, onClose, onSuccess },
    });

    coursesStore.setIsCourseAdded(false);
    coursesStore.setIsCourseAdd(true);
    await tick();

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(coursesStore.isCourseAdd).toBe(false);
  });

  it("should trigger onClose from close and cancel buttons, and work without onClose", async () => {
    const onClose = vi.fn();
    const { wrapper } = renderWithProviders(AddModal, { props: { show: true, onClose } });

    await wrapper.find('[data-testid="close-add-modal-btn"]').trigger("click");
    await wrapper.find('[data-testid="cancel-add-modal-btn"]').trigger("click");
    expect(onClose).toHaveBeenCalledTimes(2);

    const { wrapper: w2 } = renderWithProviders(AddModal, { props: { show: true } });
    await w2.find('[data-testid="close-add-modal-btn"]').trigger("click");
    expect(w2.exists()).toBe(true);
  });

  it("should toggle document body overflow on show prop change", async () => {
    const { rerender } = renderWithProviders(AddModal, { props: { show: true } });
    expect(document.body.style.overflow).toBe("hidden");

    await rerender({ show: false });
    expect(document.body.style.overflow).toBe("auto");
  });
});
