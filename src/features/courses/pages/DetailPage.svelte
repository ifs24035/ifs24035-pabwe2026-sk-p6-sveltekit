<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import ChangeCoverModal from "../modals/ChangeCoverModal.svelte";
  import ChangeModal from "../modals/ChangeModal.svelte";
  import ContentModal from "../modals/ContentModal.svelte";
  import { coursesStore } from "../states/coursesStore";
  import { usersStore } from "../../users/states/usersStore";
  import { formatDate, showConfirmDialog, showErrorDialog } from "../../../helpers/toolsHelper";
  import {
    ArrowLeft,
    ImagePlus,
    PenLine,
    Trash2,
    Calendar,
    Users,
    Video,
    Star,
    Plus,
    Play,
    Pencil,
    CircleCheck,
    UserPlus,
    UserMinus,
    LoaderCircle,
    BookOpen,
  } from "lucide-svelte";
  import type { CourseContent } from "../api/courseApi";

  export let courseId: string | number;

  $: profile = $usersStore.profile;
  $: course = $coursesStore.course;

  // Pemilik: user_id kursus sama dengan id profil. Peserta: id profil ada di students.
  $: isOwner = profile && course ? String(course.user_id) === String(profile.id) : false;
  $: isStudent =
    profile && course
      ? (course.students || []).map(String).includes(String(profile.id))
      : false;
  $: contents = (course && course.contents) || [];
  $: ratings = (course && course.ratings) || [];

  let showCoverModal: boolean = false;
  let showEditModal: boolean = false;
  let showContentModal: boolean = false;
  let selectedContent: CourseContent | null = null;
  let busy: boolean = false;
  let ratingValue: number = 0;
  let ratingComment: string = "";
  const stars = [1, 2, 3, 4, 5];

  onMount(() => {
    coursesStore.asyncSetCourse(courseId);
  });

  let prevId = courseId;
  $: if (courseId !== prevId) {
    prevId = courseId;
    coursesStore.asyncSetCourse(courseId);
  }

  function reloadCourse() {
    coursesStore.asyncSetCourse(courseId);
  }

  $: if ($coursesStore.isCourse) {
    coursesStore.setIsCourse(false);
    if (!course) {
      goto("/");
    }
  }

  $: if ($coursesStore.isCourseDelete) {
    coursesStore.setIsCourseDelete(false);
    if ($coursesStore.isCourseDeleted) {
      coursesStore.setIsCourseDeleted(false);
      goto("/");
    }
  }

  $: if ($coursesStore.isCourseJoin) {
    busy = false;
    coursesStore.setIsCourseJoin(false);
    if ($coursesStore.isCourseJoined) {
      coursesStore.setIsCourseJoined(false);
      reloadCourse();
    }
  }

  $: if ($coursesStore.isCourseLeave) {
    busy = false;
    coursesStore.setIsCourseLeave(false);
    if ($coursesStore.isCourseLeft) {
      coursesStore.setIsCourseLeft(false);
      reloadCourse();
    }
  }

  $: if ($coursesStore.isCourseRating) {
    busy = false;
    coursesStore.setIsCourseRating(false);
    if ($coursesStore.isCourseRated) {
      coursesStore.setIsCourseRated(false);
      ratingValue = 0;
      ratingComment = "";
      reloadCourse();
    }
  }

  $: if ($coursesStore.isContentDelete) {
    coursesStore.setIsContentDelete(false);
    if ($coursesStore.isContentDeleted) {
      coursesStore.setIsContentDeleted(false);
      reloadCourse();
    }
  }

  async function handleDelete() {
    const result = await showConfirmDialog("Apakah Anda yakin ingin menghapus kursus ini?");
    if (result.isConfirmed) {
      coursesStore.asyncSetIsCourseDelete(course.id);
    }
  }

  function handleJoin() {
    busy = true;
    coursesStore.asyncSetIsCourseJoin(course.id);
  }

  async function handleLeave() {
    const result = await showConfirmDialog("Apakah Anda yakin ingin keluar dari kursus ini?");
    if (result.isConfirmed) {
      busy = true;
      coursesStore.asyncSetIsCourseLeave(course.id);
    }
  }

  function handleSubmitRating() {
    if (!ratingValue) {
      showErrorDialog("Pilih rating 1 sampai 5 bintang");
      return;
    }
    if (!ratingComment.trim()) {
      showErrorDialog("Komentar tidak boleh kosong");
      return;
    }
    busy = true;
    coursesStore.asyncSetIsCourseRating(course.id, ratingValue, ratingComment.trim());
  }

  function openAddContent() {
    selectedContent = null;
    showContentModal = true;
  }

  function openEditContent(content: CourseContent) {
    selectedContent = content;
    showContentModal = true;
  }

  async function handleDeleteContent(contentId: string | number) {
    const result = await showConfirmDialog("Apakah Anda yakin ingin menghapus konten ini?");
    if (result.isConfirmed) {
      coursesStore.asyncSetIsContentDelete(contentId);
    }
  }

  const num = (value: unknown): number => Number(value) || 0;
  const formatRating = (value: unknown): string => (value ? Number(value).toFixed(1) : "-");
</script>

{#if !profile || !course}
  <div class="flex flex-col items-center justify-center py-20">
    <div class="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
{:else}
  <div class="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
    <!-- Back button & role-based actions -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <a
        href="/"
        data-testid="back-to-courses-link"
        class="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft size={18} />
        Kembali ke Semua Kursus
      </a>

      <div class="flex flex-wrap items-center gap-2">
        {#if isOwner}
          <button
            type="button"
            data-testid="edit-cover-btn"
            on:click={() => (showCoverModal = true)}
            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200/60 transition-colors"
          >
            <ImagePlus size={16} />
            Ubah Sampul
          </button>
          <button
            type="button"
            data-testid="edit-detail-course-btn"
            on:click={() => (showEditModal = true)}
            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/60 transition-colors"
          >
            <PenLine size={16} />
            Ubah Data
          </button>
          <button
            type="button"
            data-testid="delete-detail-course-btn"
            on:click={handleDelete}
            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/60 transition-colors"
          >
            <Trash2 size={16} />
            Hapus
          </button>
        {:else if isStudent}
          <button
            type="button"
            data-testid="leave-course-btn"
            disabled={busy}
            on:click={handleLeave}
            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/60 transition-colors disabled:opacity-60"
          >
            <UserMinus size={16} />
            Keluar dari Kursus
          </button>
        {:else}
          <button
            type="button"
            data-testid="join-course-btn"
            disabled={busy}
            on:click={handleJoin}
            class="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/25 transition-colors disabled:opacity-60"
          >
            <UserPlus size={16} />
            Gabung ke Kursus
          </button>
        {/if}
      </div>
    </div>

    <!-- Main detail card -->
    <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
      {#if course.cover}
        <div class="relative w-full h-64 sm:h-80 bg-slate-900 overflow-hidden">
          <img src={course.cover} alt={course.title} class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>
        </div>
      {/if}

      <div class="p-6 sm:p-8 space-y-5">
        <div class="space-y-3">
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-mono text-xs font-bold text-slate-400">{"#" + course.id}</span>
            {#if isOwner}
              <span data-testid="role-badge" class="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Pemilik Kursus
              </span>
            {:else if isStudent}
              <span data-testid="role-badge" class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Peserta
              </span>
            {/if}
          </div>

          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {course.title}
          </h1>
          <p class="text-sm text-slate-500">{course.author?.name}</p>

          <div class="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-500">
            <span class="inline-flex items-center gap-1.5" data-testid="stat-students">
              <Users size={14} />
              <span>{num(course.students ? course.students.length : 0) + " Peserta"}</span>
            </span>
            <span class="inline-flex items-center gap-1.5" data-testid="stat-contents">
              <Video size={14} />
              <span>{num(course.total_contents) + " Konten"}</span>
            </span>
            <span class="inline-flex items-center gap-1.5" data-testid="stat-rating">
              <Star size={14} />
              <span>{formatRating(course.avg_ratings)}</span>
            </span>
            <span class="inline-flex items-center gap-1.5">
              <Calendar size={14} class="shrink-0" />
              <strong class="text-slate-500">{formatDate(course.created_at)}</strong>
            </span>
          </div>
        </div>

        <p
          data-testid="course-detail-description"
          class="text-slate-600 bg-slate-50/60 p-5 rounded-2xl border border-slate-100 leading-relaxed whitespace-pre-line"
        >
          {course.description}
        </p>

        {#if isStudent && !isOwner}
          <div data-testid="progress-section" class="space-y-1.5">
            <div class="flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>Progres Belajar Anda</span>
              <span data-testid="progress-value">{Math.round(num(course.my_percentage_finished)) + "%"}</span>
            </div>
            <div class="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                class="h-full bg-emerald-500 transition-all"
                style={"width:" + Math.round(num(course.my_percentage_finished)) + "%"}
              ></div>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Contents -->
    <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-4">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-lg font-bold text-slate-800">Daftar Konten</h2>
        {#if isOwner}
          <button
            type="button"
            data-testid="add-content-btn"
            on:click={openAddContent}
            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            <Plus size={16} />
            Tambah Konten
          </button>
        {/if}
      </div>

      {#if contents.length === 0}
        <div class="py-8 text-center text-slate-400">
          <BookOpen size={36} class="mx-auto text-slate-300 mb-2" />
          <p class="font-medium">Belum ada konten pada kursus ini.</p>
        </div>
      {:else}
        <ul class="divide-y divide-slate-100">
          {#each contents as content (content.id)}
            <li data-testid={`content-item-${content.id}`} class="py-3 flex items-center justify-between gap-3">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <Video size={18} />
                </div>
                <div class="min-w-0">
                  <p class="font-semibold text-slate-800 truncate">{content.title}</p>
                  {#if isStudent && content.my_status_finished}
                    <span data-testid={`content-finished-${content.id}`} class="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                      <CircleCheck size={12} />
                      Selesai
                    </span>
                  {/if}
                </div>
              </div>

              <div class="flex items-center gap-1.5 shrink-0">
                {#if isOwner || isStudent}
                  <button
                    type="button"
                    data-testid={`open-content-${content.id}`}
                    on:click={() => goto(`/courses/${course.id}/contents/${content.id}`)}
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                  >
                    <Play size={14} />
                    Buka
                  </button>
                {/if}
                {#if isOwner}
                  <button
                    type="button"
                    data-testid={`edit-content-${content.id}`}
                    on:click={() => openEditContent(content)}
                    class="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    title="Ubah Konten"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    data-testid={`delete-content-${content.id}`}
                    on:click={() => handleDeleteContent(content.id)}
                    class="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Hapus Konten"
                  >
                    <Trash2 size={16} />
                  </button>
                {/if}
              </div>
            </li>
          {/each}
        </ul>
        {#if !isOwner && !isStudent}
          <p data-testid="join-hint" class="text-xs text-slate-400">
            Gabung ke kursus ini untuk membuka materi.
          </p>
        {/if}
      {/if}
    </div>

    <!-- Ratings -->
    <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-4">
      <h2 class="text-lg font-bold text-slate-800">Rating Peserta</h2>

      {#if isStudent && !isOwner}
        <form on:submit|preventDefault={handleSubmitRating} data-testid="rating-form" class="space-y-3 p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
          <div class="flex items-center gap-1">
            {#each stars as star (star)}
              <button
                type="button"
                data-testid={`rating-star-${star}`}
                on:click={() => (ratingValue = star)}
                class="p-1 rounded-lg transition-colors {star <= ratingValue ? 'text-amber-500' : 'text-slate-300 hover:text-amber-400'}"
                aria-label={"Beri rating " + star}
              >
                <Star size={24} fill={star <= ratingValue ? "currentColor" : "none"} />
              </button>
            {/each}
          </div>
          <textarea
            data-testid="rating-comment-input"
            bind:value={ratingComment}
            rows="3"
            placeholder="Tulis komentar Anda tentang kursus ini..."
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all resize-none"
          ></textarea>
          <div class="flex justify-end">
            <button
              type="submit"
              data-testid="submit-rating-btn"
              disabled={busy}
              class="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-60"
            >
              {#if busy}
                <LoaderCircle size={16} class="animate-spin" />
                <span>Menyimpan...</span>
              {:else}
                <span>Kirim Rating</span>
              {/if}
            </button>
          </div>
        </form>
      {/if}

      {#if ratings.length === 0}
        <p class="text-sm text-slate-400">Belum ada rating untuk kursus ini.</p>
      {:else}
        <ul class="space-y-3">
          {#each ratings as rating, index (index)}
            <li data-testid={`rating-item-${index}`} class="p-4 rounded-2xl border border-slate-100">
              <div class="flex items-center justify-between gap-2">
                <p class="font-semibold text-slate-800 text-sm">{rating.name}</p>
                <span class="inline-flex items-center gap-1 text-xs font-bold text-amber-600">
                  <Star size={14} fill="currentColor" />
                  <span>{rating.ratings + " / 5"}</span>
                </span>
              </div>
              <p class="text-sm text-slate-500 mt-1">{rating.comment}</p>
            </li>
          {/each}
        </ul>
      {/if}
    </div>

    <ChangeCoverModal
      show={showCoverModal}
      {course}
      onClose={() => (showCoverModal = false)}
    />

    <ChangeModal
      show={showEditModal}
      {course}
      onClose={() => (showEditModal = false)}
    />

    <ContentModal
      show={showContentModal}
      courseId={course.id}
      content={selectedContent}
      onClose={() => (showContentModal = false)}
      onSuccess={reloadCourse}
    />
  </div>
{/if}
