<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { coursesStore } from "../states/coursesStore";
  import { usersStore } from "../../users/states/usersStore";
  import { formatDate } from "../../../helpers/toolsHelper";
  import { getYoutubeEmbedUrl } from "../../../helpers/youtubeHelper";
  import { ArrowLeft, Video, CircleCheck, Circle, LoaderCircle, Calendar } from "lucide-svelte";

  export let courseId: string | number;
  export let contentId: string | number;

  $: profile = $usersStore.profile;
  $: course = $coursesStore.course;
  $: content = $coursesStore.content;

  // Pemilik: user_id kursus sama dengan id profil. Peserta: id profil ada di students.
  $: isOwner = profile && course ? String(course.user_id) === String(profile.id) : false;
  $: isStudent =
    profile && course
      ? (course.students || []).map(String).includes(String(profile.id))
      : false;
  $: finished = Boolean(content && content.my_status_finished);
  $: embedUrl = content ? getYoutubeEmbedUrl(content.youtube) : null;

  let busy: boolean = false;

  onMount(() => {
    coursesStore.asyncSetCourse(courseId);
    coursesStore.asyncSetContent(contentId);
  });

  $: if ($coursesStore.isCourse) {
    coursesStore.setIsCourse(false);
    if (!course) {
      goto("/");
    }
  }

  $: if ($coursesStore.isContent) {
    coursesStore.setIsContent(false);
    if (!content) {
      goto("/courses/" + courseId);
    }
  }

  $: if ($coursesStore.isContentStatus) {
    busy = false;
    coursesStore.setIsContentStatus(false);
    if ($coursesStore.isContentStatusChanged) {
      coursesStore.setIsContentStatusChanged(false);
      // muat ulang konten (status) dan kursus (persentase progres)
      coursesStore.asyncSetContent(contentId);
      coursesStore.asyncSetCourse(courseId);
    }
  }

  function handleToggleStatus() {
    busy = true;
    coursesStore.asyncSetIsContentStatus(content.id, !finished);
  }
</script>

{#if !profile || !course || !content}
  <div class="flex flex-col items-center justify-center py-20">
    <div class="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
{:else}
  <div class="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
    <a
      href={"/courses/" + courseId}
      data-testid="back-to-course-link"
      class="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
    >
      <ArrowLeft size={18} />
      Kembali ke Kursus
    </a>

    <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div class="aspect-video w-full bg-slate-900">
        {#if embedUrl}
          <iframe
            data-testid="youtube-player"
            src={embedUrl}
            title={content.title}
            class="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        {:else}
          <div data-testid="invalid-video" class="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
            <Video size={40} />
            <p class="text-sm font-medium">Tautan video tidak valid.</p>
          </div>
        {/if}
      </div>

      <div class="p-6 sm:p-8 space-y-4">
        <div class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-wider text-indigo-600">{course.title}</p>
          <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">{content.title}</h1>
          <p class="flex items-center gap-1.5 text-xs text-slate-400">
            <Calendar size={14} class="shrink-0" />
            <strong class="text-slate-500">{formatDate(content.created_at)}</strong>
          </p>
        </div>

        {#if isOwner}
          <p data-testid="owner-note" class="text-sm text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
            Anda adalah pemilik kursus ini. Ubah atau hapus konten dari halaman detail kursus.
          </p>
        {:else if isStudent}
          <div class="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <span
              data-testid="status-badge"
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border {finished ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}"
            >
              {#if finished}
                <CircleCheck size={14} />
                <span>Sudah Selesai</span>
              {:else}
                <Circle size={14} />
                <span>Belum Selesai</span>
              {/if}
            </span>

            <button
              type="button"
              data-testid="toggle-status-btn"
              disabled={busy}
              on:click={handleToggleStatus}
              class="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/25 transition-colors disabled:opacity-60"
            >
              {#if busy}
                <LoaderCircle size={16} class="animate-spin" />
                <span>Menyimpan...</span>
              {:else}
                <span>{finished ? "Tandai Belum Selesai" : "Tandai Selesai"}</span>
              {/if}
            </button>
          </div>
        {:else}
          <p data-testid="join-note" class="text-sm text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
            Gabung ke kursus ini untuk menandai progres belajar Anda.
          </p>
        {/if}
      </div>
    </div>
  </div>
{/if}
