<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import AddModal from "../modals/AddModal.svelte";
  import { coursesStore } from "../states/coursesStore";
  import { usersStore } from "../../users/states/usersStore";
  import { showConfirmDialog } from "../../../helpers/toolsHelper";
  import {
    Plus,
    BookOpen,
    Users,
    Video,
    Star,
    Eye,
    Trash2,
    Funnel,
    Search,
    LoaderCircle,
  } from "lucide-svelte";
  import type { Course } from "../api/courseApi";

  let loadingCourses: boolean = false;
  let filter: string = "";
  let searchQuery: string = "";
  let showAddModal: boolean = false;

  $: profile = $usersStore.profile;
  $: courses = $coursesStore.courses || [];

  onMount(() => {
    loadCourses();
  });

  function loadCourses() {
    loadingCourses = true;
    Promise.resolve(coursesStore.asyncSetCourses(filter === "1")).finally(() => {
      loadingCourses = false;
    });
  }

  let prevFilter = filter;
  $: if (filter !== prevFilter) {
    prevFilter = filter;
    loadCourses();
  }

  $: if ($coursesStore.isCourseDelete) {
    coursesStore.setIsCourseDelete(false);
    if ($coursesStore.isCourseDeleted) {
      coursesStore.setIsCourseDeleted(false);
      loadCourses();
    }
  }

  $: if ($coursesStore.isCourseDeleteAll) {
    coursesStore.setIsCourseDeleteAll(false);
    if ($coursesStore.isCourseDeletedAll) {
      coursesStore.setIsCourseDeletedAll(false);
      loadCourses();
    }
  }

  async function handleDeleteCourse(courseId: string | number) {
    const result = await showConfirmDialog("Apakah Anda yakin ingin menghapus kursus ini?");
    if (result.isConfirmed) {
      coursesStore.asyncSetIsCourseDelete(courseId);
    }
  }

  async function handleDeleteAll() {
    const result = await showConfirmDialog(
      "Semua kursus yang Anda buat akan dihapus permanen. Lanjutkan?"
    );
    if (result.isConfirmed) {
      coursesStore.asyncSetIsCourseDeleteAll();
    }
  }

  // Pemilik kursus = pengguna yang user_id kursusnya sama dengan id profil
  function isMine(course: Course, userId: string | number): boolean {
    return String(course.user_id) === String(userId);
  }

  const num = (value: unknown): number => Number(value) || 0;
  const formatRating = (value: unknown): string => (value ? Number(value).toFixed(1) : "-");
  const studentCount = (course: Course): number => (course.students ? course.students.length : 0);
  const searchable = (course: Course): string =>
    [course.title, course.description, course.author?.name].join(" ").toLowerCase();

  $: query = searchQuery.trim().toLowerCase();
  $: filteredCourses = courses.filter((course: Course) => !query || searchable(course).includes(query));
</script>

{#if profile}
  <div class="space-y-8 animate-in fade-in duration-300">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Semua Kursus
        </h1>
        <p class="text-sm text-slate-500 mt-1">
          Temukan kursus, bergabung, dan pantau progres belajar Anda.
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2 self-start sm:self-auto">
        <button
          type="button"
          data-testid="delete-all-courses-btn"
          on:click={handleDeleteAll}
          class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/60 transition-colors"
        >
          <Trash2 size={18} />
          <span>Hapus Semua Milik Saya</span>
        </button>
        <button
          type="button"
          data-testid="add-course-btn"
          on:click={() => (showAddModal = true)}
          class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-md shadow-indigo-600/25 transition-all"
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>Tambah Kursus</span>
        </button>
      </div>
    </div>

    <!-- Search & filter -->
    <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="relative flex-1 max-w-md">
        <Search
          size={18}
          class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          data-testid="search-course-input"
          bind:value={searchQuery}
          placeholder="Cari judul, deskripsi, atau pembuat kursus..."
          class="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
        />
      </div>

      <div class="flex items-center gap-2.5">
        <span data-testid="course-count" class="text-xs font-semibold text-slate-500 px-3 py-1 bg-slate-100 rounded-lg">
          {"Total: " + filteredCourses.length + " Kursus"}
        </span>
        <span class="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
          <Funnel size={16} /> Filter:
        </span>
        <div class="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
          <button
            type="button"
            data-testid="filter-all-btn"
            on:click={() => (filter = "")}
            class="px-3 py-1.5 rounded-lg transition-all {filter === '' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}"
          >
            Semua
          </button>
          <button
            type="button"
            data-testid="filter-mine-btn"
            on:click={() => (filter = "1")}
            class="px-3 py-1.5 rounded-lg transition-all {filter === '1' ? 'bg-white text-indigo-700 shadow-xs' : 'hover:text-slate-900'}"
          >
            Milik Saya
          </button>
        </div>
      </div>
    </div>

    <!-- Courses grid -->
    {#if loadingCourses && filteredCourses.length === 0}
      <div class="py-16 text-center text-slate-400">
        <LoaderCircle size={36} class="mx-auto text-indigo-600 animate-spin mb-2" />
        <p class="font-medium text-slate-600">Memuat daftar kursus...</p>
      </div>
    {:else if filteredCourses.length === 0}
      <div class="py-16 text-center text-slate-400">
        <BookOpen size={40} class="mx-auto text-slate-300 mb-2" />
        <p class="font-medium">Belum ada kursus yang cocok.</p>
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {#each filteredCourses as course (course.id)}
          <div
            data-testid={`course-card-${course.id}`}
            class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col hover:shadow-md hover:border-indigo-200 transition-all"
          >
            {#if course.cover}
              <img
                src={course.cover}
                alt={course.title}
                class="w-full h-40 object-cover bg-slate-100"
              />
            {:else}
              <div class="w-full h-40 bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white/80 flex items-center justify-center">
                <BookOpen size={44} strokeWidth={1.5} />
              </div>
            {/if}

            <div class="p-5 flex-1 flex flex-col gap-3">
              <div class="space-y-1">
                <div class="flex items-start justify-between gap-2">
                  <h3 class="font-bold text-slate-900 leading-snug">{course.title}</h3>
                  {#if isMine(course, profile.id)}
                    <span class="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                      Milik Saya
                    </span>
                  {/if}
                </div>
                <p class="text-xs text-slate-500 line-clamp-2">{course.description}</p>
                <p class="text-xs text-slate-400">{course.author?.name}</p>
              </div>

              <div class="flex items-center gap-4 text-xs text-slate-500 mt-auto">
                <span class="inline-flex items-center gap-1" title="Peserta">
                  <Users size={14} />
                  <span>{num(studentCount(course))}</span>
                </span>
                <span class="inline-flex items-center gap-1" title="Konten">
                  <Video size={14} />
                  <span>{num(course.total_contents)}</span>
                </span>
                <span class="inline-flex items-center gap-1" title="Rating">
                  <Star size={14} />
                  <span>{formatRating(course.avg_ratings)}</span>
                </span>
              </div>

              <div class="flex items-center justify-end gap-1.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  data-testid={`view-course-${course.id}`}
                  on:click={() => goto(`/courses/${course.id}`)}
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                  title="Lihat Detail"
                >
                  <Eye size={16} />
                  Detail
                </button>
                {#if isMine(course, profile.id)}
                  <button
                    type="button"
                    data-testid={`delete-course-${course.id}`}
                    on:click={() => handleDeleteCourse(course.id)}
                    class="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Hapus Kursus"
                  >
                    <Trash2 size={18} />
                  </button>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}

    <AddModal
      show={showAddModal}
      onClose={() => (showAddModal = false)}
      onSuccess={loadCourses}
    />
  </div>
{/if}
