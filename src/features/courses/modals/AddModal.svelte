<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { Plus, X, LoaderCircle } from "lucide-svelte";
  import { coursesStore } from "../states/coursesStore";
  import { showErrorDialog } from "../../../helpers/toolsHelper";

  export let show: boolean = false;
  export let onClose: (() => void) | undefined = undefined;
  export let onSuccess: (() => void) | undefined = undefined;

  const dispatch = createEventDispatcher();

  let loading: boolean = false;
  let title: string = "";
  let description: string = "";

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

  $: if ($coursesStore.isCourseAdd) {
    loading = false;
    coursesStore.setIsCourseAdd(false);
    if ($coursesStore.isCourseAdded) {
      coursesStore.setIsCourseAdded(false);
      title = "";
      description = "";
      if (onSuccess) onSuccess();
      handleClose();
    }
  }

  function handleSave() {
    if (!title.trim()) {
      showErrorDialog("Judul kursus tidak boleh kosong");
      return;
    }

    if (!description.trim()) {
      showErrorDialog("Deskripsi kursus tidak boleh kosong");
      return;
    }

    loading = true;
    coursesStore.asyncSetIsCourseAdd(title.trim(), description.trim());
  }
</script>

{#if show}
  <div
    data-testid="add-course-modal"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
  >
    <div class="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
            <Plus size={18} strokeWidth={2.5} />
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-800">Tambah Kursus Baru</h3>
            <p class="text-xs text-slate-500">Isi judul dan deskripsi kursus Anda</p>
          </div>
        </div>
        <button
          type="button"
          data-testid="close-add-modal-btn"
          on:click={handleClose}
          class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <form on:submit|preventDefault={handleSave} class="p-6 space-y-4">
        <div>
          <label for="add-course-title-input" class="block text-sm font-semibold text-slate-700 mb-1.5">
            Judul Kursus <span class="text-red-500">*</span>
          </label>
          <input
            id="add-course-title-input"
            type="text"
            data-testid="add-course-title-input"
            bind:value={title}
            placeholder="Contoh: Belajar SvelteKit dari Nol"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
          />
        </div>

        <div>
          <label for="add-course-description-input" class="block text-sm font-semibold text-slate-700 mb-1.5">
            Deskripsi <span class="text-red-500">*</span>
          </label>
          <textarea
            id="add-course-description-input"
            data-testid="add-course-description-input"
            bind:value={description}
            rows="5"
            placeholder="Jelaskan apa yang akan dipelajari pada kursus ini..."
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all resize-none"
          ></textarea>
        </div>

        <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            data-testid="cancel-add-modal-btn"
            on:click={handleClose}
            disabled={loading}
            class="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            data-testid="submit-add-modal-btn"
            disabled={loading}
            class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-md shadow-indigo-600/25 transition-all disabled:opacity-60"
          >
            {#if loading}
              <LoaderCircle size={18} class="animate-spin" />
              <span>Menyimpan...</span>
            {:else}
              <Plus size={18} strokeWidth={2.5} />
              <span>Tambah Kursus</span>
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
