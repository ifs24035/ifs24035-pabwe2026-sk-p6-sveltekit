import apiHelper from "../../../helpers/apiHelper";

declare const DELCOM_BASEURL: string;

export interface CourseAuthor {
  name: string;
  photo?: string | null;
}

export interface CourseContent {
  id: number | string;
  course_id: number | string;
  title: string;
  youtube: string;
  created_at?: string;
  updated_at?: string;
  my_status_finished?: boolean | number;
}

export interface CourseRating {
  name: string;
  ratings: number;
  comment?: string | null;
}

export interface Course {
  id: number | string;
  user_id: number | string;
  title: string;
  description: string;
  cover?: string | null;
  created_at?: string;
  updated_at?: string;
  author?: CourseAuthor | null;
  students?: Array<number | string>;
  total_contents?: number;
  avg_ratings?: string | number | null;
}

export interface CourseDetail extends Course {
  contents?: CourseContent[];
  ratings?: CourseRating[];
  my_percentage_finished?: string | number | null;
}

const courseApi = (() => {
  const BASE_URL = `${DELCOM_BASEURL}/courses`;

  function _url(path: string): string {
    return BASE_URL + path;
  }

  const JSON_HEADERS = { "Content-Type": "application/json" };

  /**
   * Membaca respons API Delcom. Jika status bukan "success", lempar Error
   * dengan pesan dari server (beserta detail validasi bila ada).
   */
  async function _parse(response: Response, fallbackMessage: string): Promise<any> {
    const result = await response.json();
    if (result.status !== "success") {
      const details =
        result.data && typeof result.data === "object"
          ? Object.values(result.data).flat().join(", ")
          : "";
      const baseMessage = result.message || fallbackMessage;
      throw new Error(details ? `${baseMessage}: ${details}` : baseMessage);
    }
    return result;
  }

  // ---------------------------------------------------------------- Kursus

  async function postCourse(title: string, description: string): Promise<any> {
    const response = await apiHelper.fetchData(_url("/"), {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ title, description }),
    });
    const result = await _parse(response, "Gagal menambahkan kursus");
    return result.data;
  }

  async function postCourseCover(courseId: string | number, cover: File | Blob): Promise<string> {
    const formData = new FormData();
    formData.append("cover", cover, (cover as File).name || "cover.jpg");
    const response = await apiHelper.fetchData(_url(`/${courseId}/cover`), {
      method: "POST",
      body: formData,
    });
    const result = await _parse(response, "Gagal mengubah sampul kursus");
    return result.message;
  }

  async function putCourse(
    courseId: string | number,
    title: string,
    description: string
  ): Promise<string> {
    const response = await apiHelper.fetchData(_url(`/${courseId}`), {
      method: "PUT",
      headers: JSON_HEADERS,
      body: JSON.stringify({ title, description }),
    });
    const result = await _parse(response, "Gagal mengubah kursus");
    return result.message;
  }

  async function getCourses(isMe: boolean = false): Promise<Course[]> {
    const response = await apiHelper.fetchData(_url(isMe ? "/?is_me=1" : "/"), {
      method: "GET",
    });
    const result = await _parse(response, "Gagal mengambil data kursus");
    return result.data?.courses || [];
  }

  async function getCourseById(courseId: string | number): Promise<CourseDetail> {
    const response = await apiHelper.fetchData(_url(`/${courseId}`), {
      method: "GET",
    });
    const result = await _parse(response, "Gagal mengambil detail kursus");
    return result.data?.course;
  }

  async function deleteCourse(courseId: string | number): Promise<string> {
    const response = await apiHelper.fetchData(_url(`/${courseId}`), {
      method: "DELETE",
    });
    const result = await _parse(response, "Gagal menghapus kursus");
    return result.message;
  }

  async function deleteAllCourses(): Promise<string> {
    const response = await apiHelper.fetchData(_url("/"), {
      method: "DELETE",
    });
    const result = await _parse(response, "Gagal menghapus semua kursus");
    return result.message;
  }

  // --------------------------------------------------------------- Peserta

  async function postCourseStudent(courseId: string | number): Promise<string> {
    const response = await apiHelper.fetchData(_url(`/${courseId}/students`), {
      method: "POST",
    });
    const result = await _parse(response, "Gagal bergabung ke kursus");
    return result.message;
  }

  async function deleteCourseStudent(courseId: string | number): Promise<string> {
    const response = await apiHelper.fetchData(_url(`/${courseId}/students`), {
      method: "DELETE",
    });
    const result = await _parse(response, "Gagal keluar dari kursus");
    return result.message;
  }

  async function putCourseRating(
    courseId: string | number,
    ratings: number,
    comment: string
  ): Promise<string> {
    const response = await apiHelper.fetchData(_url(`/${courseId}/students/ratings`), {
      method: "PUT",
      headers: JSON_HEADERS,
      body: JSON.stringify({ ratings, comment }),
    });
    const result = await _parse(response, "Gagal mengubah rating kursus");
    return result.message;
  }

  // ----------------------------------------------------------------- Konten

  async function postCourseContent(
    courseId: string | number,
    title: string,
    youtube: string
  ): Promise<any> {
    const response = await apiHelper.fetchData(_url(`/${courseId}/contents`), {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ title, youtube }),
    });
    const result = await _parse(response, "Gagal menambahkan konten kursus");
    return result.data;
  }

  async function putCourseContent(
    contentId: string | number,
    title: string,
    youtube: string
  ): Promise<string> {
    const response = await apiHelper.fetchData(_url(`/-/contents/${contentId}`), {
      method: "PUT",
      headers: JSON_HEADERS,
      body: JSON.stringify({ title, youtube }),
    });
    const result = await _parse(response, "Gagal mengubah konten kursus");
    return result.message;
  }

  async function getCourseContentById(contentId: string | number): Promise<CourseContent> {
    const response = await apiHelper.fetchData(_url(`/-/contents/${contentId}`), {
      method: "GET",
    });
    const result = await _parse(response, "Gagal mengambil detail konten kursus");
    return result.data?.course_content;
  }

  async function deleteCourseContent(contentId: string | number): Promise<string> {
    const response = await apiHelper.fetchData(_url(`/-/contents/${contentId}`), {
      method: "DELETE",
    });
    const result = await _parse(response, "Gagal menghapus konten kursus");
    return result.message;
  }

  async function postCourseContentStatus(
    contentId: string | number,
    status: boolean | number
  ): Promise<string> {
    const response = await apiHelper.fetchData(_url(`/-/contents/${contentId}/learns`), {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ status: status ? 1 : 0 }),
    });
    const result = await _parse(response, "Gagal mengubah status pembelajaran");
    return result.message;
  }

  return {
    postCourse,
    postCourseCover,
    putCourse,
    getCourses,
    getCourseById,
    deleteCourse,
    deleteAllCourses,
    postCourseStudent,
    deleteCourseStudent,
    putCourseRating,
    postCourseContent,
    putCourseContent,
    getCourseContentById,
    deleteCourseContent,
    postCourseContentStatus,
  };
})();

export default courseApi;
