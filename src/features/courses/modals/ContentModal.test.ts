import { describe, it, expect, vi, beforeEach } from "vitest";
import ContentModal from "./ContentModal.svelte";
import { renderWithProviders } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";

const tick = (ms = 10) => new Promise((r) => setTimeout(r, ms));
const content = { id: 9, course_id: 4, title: "Intro", youtube: "https://youtu.be/uHyfQV0kbgo" };
const value = (wrapper: any, id: string) => (wrapper.find(`[data-testid="${id}"]`).element as HTMLInputElement).value;

describe("ContentModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not render when show is false", () => {
    const { wrapper } = renderWithProviders(ContentModal, { props: { show: false, courseId: 4 } });
    expect(wrapper.find('[data-testid="content-modal"]').exists()).toBe(false);
  });

  it("should render an empty add form when no content is given", () => {
    const { wrapper } = renderWithProviders(ContentModal, { props: { show: true, courseId: 4 } });
    expect(wrapper.text()).toContain("Tambah Konten");
    expect(value(wrapper, "content-title-input")).toBe("");
    expect(value(wrapper, "content-youtube-input")).toBe("");
  });

  it("should render a prefilled edit form when content is given", () => {
    const { wrapper } = renderWithProviders(ContentModal, { props: { show: true, courseId: 4, content } });
    expect(wrapper.text()).toContain("Ubah Konten");
    expect(value(wrapper, "content-title-input")).toBe("Intro");
    expect(value(wrapper, "content-youtube-input")).toBe("https://youtu.be/uHyfQV0kbgo");
  });

  it("should validate title and YouTube link", async () => {
    const errorSpy = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => ({}) as any);
    const { wrapper, coursesStore } = renderWithProviders(ContentModal, { props: { show: true, courseId: 4 } });
    const addSpy = vi.spyOn(coursesStore, "asyncSetIsContentAdd").mockResolvedValue();

    await wrapper.find("form").trigger("submit");
    expect(errorSpy).toHaveBeenCalledWith("Judul konten tidak boleh kosong");

    await wrapper.find('[data-testid="content-title-input"]').setValue("Judul");
    await wrapper.find('[data-testid="content-youtube-input"]').setValue("bukan tautan youtube");
    await wrapper.find("form").trigger("submit");
    expect(errorSpy).toHaveBeenCalledWith("Tautan YouTube tidak valid");

    expect(addSpy).not.toHaveBeenCalled();
  });

  it("should add a new content with trimmed values", async () => {
    const { wrapper, coursesStore } = renderWithProviders(ContentModal, { props: { show: true, courseId: 4 } });
    const addSpy = vi.spyOn(coursesStore, "asyncSetIsContentAdd").mockResolvedValue();

    await wrapper.find('[data-testid="content-title-input"]').setValue(" Materi 1 ");
    await wrapper.find('[data-testid="content-youtube-input"]').setValue(" https://youtu.be/uHyfQV0kbgo ");
    await wrapper.find("form").trigger("submit");

    expect(addSpy).toHaveBeenCalledWith(4, "Materi 1", "https://youtu.be/uHyfQV0kbgo");
    expect(wrapper.text()).toContain("Menyimpan...");
  });

  it("should change an existing content", async () => {
    const { wrapper, coursesStore } = renderWithProviders(ContentModal, { props: { show: true, courseId: 4, content } });
    const changeSpy = vi.spyOn(coursesStore, "asyncSetIsContentChange").mockResolvedValue();
    const addSpy = vi.spyOn(coursesStore, "asyncSetIsContentAdd").mockResolvedValue();

    await wrapper.find('[data-testid="content-title-input"]').setValue("Intro Baru");
    await wrapper.find("form").trigger("submit");

    expect(changeSpy).toHaveBeenCalledWith(9, "Intro Baru", "https://youtu.be/uHyfQV0kbgo");
    expect(addSpy).not.toHaveBeenCalled();
  });

  it("should call onSuccess and onClose after a successful add", async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    const { coursesStore } = renderWithProviders(ContentModal, {
      props: { show: true, courseId: 4, onClose, onSuccess },
    });

    coursesStore.setIsContentAdded(true);
    coursesStore.setIsContentAdd(true);
    await tick();

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(coursesStore.isContentAdd).toBe(false);
    expect(coursesStore.isContentAdded).toBe(false);
  });

  it("should call onSuccess and onClose after a successful change", async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    const { coursesStore } = renderWithProviders(ContentModal, {
      props: { show: true, courseId: 4, content, onClose, onSuccess },
    });

    coursesStore.setIsContentChanged(true);
    coursesStore.setIsContentChange(true);
    await tick();

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(coursesStore.isContentChange).toBe(false);
    expect(coursesStore.isContentChanged).toBe(false);
  });

  it("should close when no callbacks are defined", async () => {
    const { wrapper, coursesStore } = renderWithProviders(ContentModal, { props: { show: true, courseId: 4 } });

    coursesStore.setIsContentAdded(true);
    coursesStore.setIsContentAdd(true);
    await tick();

    expect(wrapper.exists()).toBe(true);
  });

  it("should stay open when the mutation failed", async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    const { coursesStore } = renderWithProviders(ContentModal, {
      props: { show: true, courseId: 4, onClose, onSuccess },
    });

    coursesStore.setIsContentAdd(true);
    await tick();

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(coursesStore.isContentAdd).toBe(false);
  });

  it("should trigger onClose from buttons and work without onClose", async () => {
    const onClose = vi.fn();
    const { wrapper } = renderWithProviders(ContentModal, { props: { show: true, courseId: 4, onClose } });
    await wrapper.find('[data-testid="close-content-modal-btn"]').trigger("click");
    await wrapper.find('[data-testid="cancel-content-modal-btn"]').trigger("click");
    expect(onClose).toHaveBeenCalledTimes(2);

    const { wrapper: w2 } = renderWithProviders(ContentModal, { props: { show: true, courseId: 4 } });
    await w2.find('[data-testid="close-content-modal-btn"]').trigger("click");
    expect(w2.exists()).toBe(true);
  });

  it("should toggle document body overflow on show prop change", async () => {
    const { rerender } = renderWithProviders(ContentModal, { props: { show: true, courseId: 4 } });
    expect(document.body.style.overflow).toBe("hidden");

    await rerender({ show: false, courseId: 4 });
    expect(document.body.style.overflow).toBe("auto");
  });
});
