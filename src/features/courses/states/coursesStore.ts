import { writable } from "svelte/store";
import courseApi, { type Course, type CourseContent, type CourseDetail } from "../api/courseApi";
import { showErrorDialog, showSuccessDialog } from "../../../helpers/toolsHelper";

export interface CoursesState {
  // koleksi, detail, dan konten
  courses: Course[];
  course: CourseDetail | null;
  content: CourseContent | null;
  isCourse: boolean;
  isContent: boolean;
  // mutasi kursus
  isCourseAdd: boolean;
  isCourseAdded: boolean;
  isCourseChange: boolean;
  isCourseChanged: boolean;
  isCourseDelete: boolean;
  isCourseDeleted: boolean;
  isCourseDeleteAll: boolean;
  isCourseDeletedAll: boolean;
  // sampul
  isCourseChangeCover: boolean;
  isCourseChangedCover: boolean;
  // peserta
  isCourseJoin: boolean;
  isCourseJoined: boolean;
  isCourseLeave: boolean;
  isCourseLeft: boolean;
  // rating
  isCourseRating: boolean;
  isCourseRated: boolean;
  // mutasi konten
  isContentAdd: boolean;
  isContentAdded: boolean;
  isContentChange: boolean;
  isContentChanged: boolean;
  isContentDelete: boolean;
  isContentDeleted: boolean;
  isContentStatus: boolean;
  isContentStatusChanged: boolean;
}

type Setters = {
  [K in keyof CoursesState as `set${Capitalize<K & string>}`]: (value: CoursesState[K]) => void;
};

const initial: CoursesState = {
  courses: [],
  course: null,
  content: null,
  isCourse: false,
  isContent: false,
  isCourseAdd: false,
  isCourseAdded: false,
  isCourseChange: false,
  isCourseChanged: false,
  isCourseDelete: false,
  isCourseDeleted: false,
  isCourseDeleteAll: false,
  isCourseDeletedAll: false,
  isCourseChangeCover: false,
  isCourseChangedCover: false,
  isCourseJoin: false,
  isCourseJoined: false,
  isCourseLeave: false,
  isCourseLeft: false,
  isCourseRating: false,
  isCourseRated: false,
  isContentAdd: false,
  isContentAdded: false,
  isContentChange: false,
  isContentChanged: false,
  isContentDelete: false,
  isContentDeleted: false,
  isContentStatus: false,
  isContentStatusChanged: false,
};

function createCoursesStore() {
  let currentState: CoursesState = { ...initial };
  const innerStore = writable<CoursesState>(currentState);
  innerStore.subscribe((val) => {
    currentState = val;
  });

  function set<K extends keyof CoursesState>(key: K, value: CoursesState[K]) {
    innerStore.update((s) => ({ ...s, [key]: value }));
  }

  /**
   * Pola mutasi yang sama untuk semua aksi tulis:
   * sukses -> dialog sukses + bendera "berhasil" true,
   * gagal  -> dialog error + bendera "berhasil" false,
   * selesai (apa pun hasilnya) -> bendera "proses selesai" true.
   */
  async function mutate(
    action: () => Promise<string | void>,
    successMessage: string,
    okKey: keyof CoursesState,
    doneKey: keyof CoursesState
  ) {
    try {
      const message = await action();
      showSuccessDialog(message || successMessage);
      set(okKey, true as never);
    } catch (error: any) {
      showErrorDialog(error.message);
      set(okKey, false as never);
    } finally {
      set(doneKey, true as never);
    }
  }

  const store = {
    subscribe: innerStore.subscribe,
    get $state() {
      return currentState;
    },
    reset(state: Partial<CoursesState> = initial) {
      innerStore.set({ ...initial, ...state });
    },

    // ----------------------------------------------------------- Pengambilan
    async asyncSetCourses(isMe: boolean = false) {
      try {
        set("courses", await courseApi.getCourses(isMe));
      } catch {
        set("courses", []);
      }
    },
    async asyncSetCourse(courseId: string | number) {
      try {
        set("course", await courseApi.getCourseById(courseId));
      } catch {
        set("course", null);
      } finally {
        set("isCourse", true);
      }
    },
    async asyncSetContent(contentId: string | number) {
      try {
        set("content", await courseApi.getCourseContentById(contentId));
      } catch {
        set("content", null);
      } finally {
        set("isContent", true);
      }
    },

    // -------------------------------------------------------------- Kursus
    asyncSetIsCourseAdd(title: string, description: string) {
      return mutate(
        async () => {
          await courseApi.postCourse(title, description);
        },
        "Kursus berhasil ditambahkan!",
        "isCourseAdded",
        "isCourseAdd"
      );
    },
    asyncSetIsCourseChange(courseId: string | number, title: string, description: string) {
      return mutate(
        () => courseApi.putCourse(courseId, title, description),
        "Kursus berhasil diubah!",
        "isCourseChanged",
        "isCourseChange"
      );
    },
    asyncSetIsCourseChangeCover(courseId: string | number, cover: File) {
      return mutate(
        () => courseApi.postCourseCover(courseId, cover),
        "Sampul kursus berhasil diubah!",
        "isCourseChangedCover",
        "isCourseChangeCover"
      );
    },
    asyncSetIsCourseDelete(courseId: string | number) {
      return mutate(
        () => courseApi.deleteCourse(courseId),
        "Kursus berhasil dihapus!",
        "isCourseDeleted",
        "isCourseDelete"
      );
    },
    asyncSetIsCourseDeleteAll() {
      return mutate(
        () => courseApi.deleteAllCourses(),
        "Semua kursus berhasil dihapus!",
        "isCourseDeletedAll",
        "isCourseDeleteAll"
      );
    },

    // ------------------------------------------------------ Peserta & rating
    asyncSetIsCourseJoin(courseId: string | number) {
      return mutate(
        () => courseApi.postCourseStudent(courseId),
        "Berhasil bergabung ke kursus!",
        "isCourseJoined",
        "isCourseJoin"
      );
    },
    asyncSetIsCourseLeave(courseId: string | number) {
      return mutate(
        () => courseApi.deleteCourseStudent(courseId),
        "Berhasil keluar dari kursus!",
        "isCourseLeft",
        "isCourseLeave"
      );
    },
    asyncSetIsCourseRating(courseId: string | number, ratings: number, comment: string) {
      return mutate(
        () => courseApi.putCourseRating(courseId, ratings, comment),
        "Rating berhasil disimpan!",
        "isCourseRated",
        "isCourseRating"
      );
    },

    // --------------------------------------------------------------- Konten
    asyncSetIsContentAdd(courseId: string | number, title: string, youtube: string) {
      return mutate(
        async () => {
          await courseApi.postCourseContent(courseId, title, youtube);
        },
        "Konten berhasil ditambahkan!",
        "isContentAdded",
        "isContentAdd"
      );
    },
    asyncSetIsContentChange(contentId: string | number, title: string, youtube: string) {
      return mutate(
        () => courseApi.putCourseContent(contentId, title, youtube),
        "Konten berhasil diubah!",
        "isContentChanged",
        "isContentChange"
      );
    },
    asyncSetIsContentDelete(contentId: string | number) {
      return mutate(
        () => courseApi.deleteCourseContent(contentId),
        "Konten berhasil dihapus!",
        "isContentDeleted",
        "isContentDelete"
      );
    },
    asyncSetIsContentStatus(contentId: string | number, status: boolean | number) {
      return mutate(
        () => courseApi.postCourseContentStatus(contentId, status),
        "Status belajar berhasil diubah!",
        "isContentStatusChanged",
        "isContentStatus"
      );
    },
  };

  // Getter (store.courses, store.isCourseAdd, ...) dan setter (store.setCourses, ...)
  // dibuat otomatis untuk setiap kunci state agar konsisten dan tidak repetitif.
  for (const key of Object.keys(initial) as Array<keyof CoursesState>) {
    Object.defineProperty(store, key, {
      get: () => currentState[key],
      enumerable: true,
      configurable: true,
    });
    (store as any)[`set${key.charAt(0).toUpperCase()}${key.slice(1)}`] = (value: any) =>
      set(key, value);
  }

  return store as typeof store & Readonly<CoursesState> & Setters;
}

export const coursesStore = createCoursesStore();
export const useCoursesStore = () => coursesStore;
export default coursesStore;
