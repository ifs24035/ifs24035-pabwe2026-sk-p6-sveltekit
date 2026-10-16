<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { Video, X, LoaderCircle, Save } from "lucide-svelte";
  import { coursesStore } from "../states/coursesStore";
  import { showErrorDialog } from "../../../helpers/toolsHelper";
  import { getYoutubeEmbedUrl } from "../../../helpers/youtubeHelper";
  import type { CourseContent } from "../api/courseApi";

  export let show: boolean = false;
  export let courseId: string | number | null = null;
  // null = mode tambah, berisi konten = mode ubah
  export let content: CourseContent | null = null;
  export let onClose: (() => void) | undefined = undefined;
  export let onSuccess: (() => void) | undefined = undefined;

  const dispatch = createEventDispatcher();

  let loading: boolean = false;
  let title: string = "";
  let youtube: string = "";

  $: isEdit = content !== null;

  function handleClose() {
    dispatch("close");
    if (onClose) onClose();
  }

  $: {
    if (show) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }

  // Isi form setiap kali modal dibuka: data konten (ubah) atau kosong (tambah)
  $: if (show) {
    title = content ? content.title : "";
    youtube = content ? content.youtube : "";
  }

  $: if ($coursesStore.isContentAdd || $coursesStore.isContentChange) {
    const succeeded = $coursesStore.isContentAdded || $coursesStore.isContentChanged;
    loading = false;
    coursesStore.setIsContentAdd(false);
    coursesStore.setIsContentChange(false);
    coursesStore.setIsContentAdded(false);
    coursesStore.setIsContentChanged(false);
    if (succeeded) {
      if (onSuccess) onSuccess();
      handleClose();
    }
  }

  function handleSave() {
    if (!title.trim()) {
      showErrorDialog("Judul konten tidak boleh kosong");
      return;
    }

    if (!getYoutubeEmbedUrl(youtube)) {
      showErrorDialog("Tautan YouTube tidak valid");
      return;
    }

    loading = true;
    if (content) {
      coursesStore.asyncSetIsContentChange(content.id, title.trim(), youtube.trim());
    } else {
      coursesStore.asyncSetIsContentAdd(courseId, title.trim(), youtube.trim());
    }
  }
</script>

{#if show}
  <div
    data-testid="content-modal"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
  >
    <div class="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
            <Video size={18} strokeWidth={2.5} />
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-800">
              {isEdit ? "Ubah Konten" : "Tambah Konten"}
            </h3>
            <p class="text-xs text-slate-500">Materi kursus berupa video dari YouTube</p>
          </div>
        </div>
        <button
          type="button"
          data-testid="close-content-modal-btn"
          on:click={handleClose}
          class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <form on:submit|preventDefault={handleSave} class="p-6 space-y-4">
        <div>
          <label for="content-title-input" class="block text-sm font-semibold text-slate-700 mb-1.5">
            Judul Konten <span class="text-red-500">*</span>
          </label>
          <input
            id="content-title-input"
            type="text"
            data-testid="content-title-input"
            bind:value={title}
            placeholder="Contoh: Pengenalan Komponen"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
          />
        </div>

        <div>
          <label for="content-youtube-input" class="block text-sm font-semibold text-slate-700 mb-1.5">
            Tautan YouTube <span class="text-red-500">*</span>
          </label>
          <input
            id="content-youtube-input"
            type="url"
            data-testid="content-youtube-input"
            bind:value={youtube}
            placeholder="https://youtu.be/uHyfQV0kbgo"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
          />
        </div>

        <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            data-testid="cancel-content-modal-btn"
            on:click={handleClose}
            disabled={loading}
            class="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            data-testid="submit-content-modal-btn"
            disabled={loading}
            class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-md shadow-indigo-600/25 transition-all disabled:opacity-60"
          >
            {#if loading}
              <LoaderCircle size={18} class="animate-spin" />
              <span>Menyimpan...</span>
            {:else}
              <Save size={18} strokeWidth={2.5} />
              <span>Simpan Konten</span>
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
