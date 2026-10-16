import { describe, it, expect, vi, beforeEach } from "vitest";
import RootLayout from "./routes/+layout.svelte";
import { ssr } from "./routes/+layout";
import RootPage from "./routes/+page.svelte";
import RootError from "./routes/+error.svelte";
import AuthLayout from "./routes/auth/+layout.svelte";
import LoginPageWrapper from "./routes/auth/login/+page.svelte";
import RegisterPageWrapper from "./routes/auth/register/+page.svelte";
import ProfilePageWrapper from "./routes/profile/+page.svelte";
import CourseDetailPageWrapper from "./routes/courses/[courseId]/+page.svelte";
import CourseContentPageWrapper from "./routes/courses/[courseId]/contents/[contentId]/+page.svelte";
import UsersPageWrapper from "./routes/users/+page.svelte";
import { renderWithProviders } from "./test-utils";
import { mockPageStore, updateMockPage } from "./setupTests";
import apiHelper from "./helpers/apiHelper";

describe("SvelteKit Routes and Layouts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateMockPage({
      url: new URL("http://localhost/"),
      params: { courseId: "1", contentId: "5" },
      route: { id: "/" },
      status: 200,
      error: null,
      data: {},
      form: null,
    });
  });

  it("should verify ssr is true in +layout.ts", () => {
    expect(ssr).toBe(true);
  });

  it("should render RootLayout for non-auth route using CourseLayout", () => {
    vi.spyOn(apiHelper, "getAccessToken").mockReturnValue("valid-token");
    const { wrapper } = renderWithProviders(RootLayout, {
      preloadedState: {
        profile: { id: 1, name: "Logged User", email: "user@del.org" },
      },
    });

    expect(wrapper.text()).toContain("Delcom Courses");
  });

  it("should render RootLayout for /auth route directly", async () => {
    const { wrapper } = renderWithProviders(RootLayout, { route: "/auth/login" });
    expect(wrapper.text()).not.toContain("Delcom Courses");
  });

  it("should dynamically switch layout between non-auth and auth route on navigation", async () => {
    vi.spyOn(apiHelper, "getAccessToken").mockReturnValue("valid-token");
    const { wrapper } = renderWithProviders(RootLayout, {
      route: "/",
      preloadedState: {
        profile: { id: 1, name: "Logged User", email: "user@del.org" },
      },
    });

    expect(wrapper.text()).toContain("Delcom Courses");

    // Navigate to /auth/login (simulating logout)
    updateMockPage({ url: new URL("http://localhost:3000/auth/login") });
    await new Promise((r) => setTimeout(r, 0));
    expect(wrapper.text()).not.toContain("Delcom Courses");

    // Navigate back to / (simulating login)
    updateMockPage({ url: new URL("http://localhost:3000/") });
    await new Promise((r) => setTimeout(r, 0));
    expect(wrapper.text()).toContain("Delcom Courses");
  });

  it("should render RootPage (+page.svelte)", () => {
    const { wrapper } = renderWithProviders(RootPage, {
      preloadedState: {
        profile: { id: 1, name: "Logged User" },
        courses: [],
      },
    });
    expect(wrapper.exists()).toBe(true);
  });

  it("should render RootError (+error.svelte)", () => {
    const { wrapper } = renderWithProviders(RootError);
    expect(wrapper.text()).toContain("404");
    expect(wrapper.text()).toContain("Halaman Tidak Ditemukan");
  });

  it("should render AuthLayout (routes/auth/+layout.svelte)", () => {
    const { wrapper } = renderWithProviders(AuthLayout);
    expect(wrapper.text()).toContain("Delcom Courses");
  });

  it("should render LoginPageWrapper (routes/auth/login/+page.svelte)", () => {
    const { wrapper } = renderWithProviders(LoginPageWrapper);
    expect(wrapper.text()).toContain("Masuk Sekarang");
  });

  it("should render RegisterPageWrapper (routes/auth/register/+page.svelte)", () => {
    const { wrapper } = renderWithProviders(RegisterPageWrapper);
    expect(wrapper.text()).toContain("Daftar Sekarang");
  });

  it("should render ProfilePageWrapper (routes/profile/+page.svelte)", () => {
    const { wrapper } = renderWithProviders(ProfilePageWrapper, {
      preloadedState: {
        profile: { id: 1, name: "Logged User", email: "user@del.org" },
      },
    });
    expect(wrapper.text()).toContain("Profil Akun");
  });

  it("should render CourseDetailPageWrapper (routes/courses/[courseId]/+page.svelte)", () => {
    const { wrapper } = renderWithProviders(CourseDetailPageWrapper, {
      preloadedState: {
        profile: { id: 1, name: "Logged User" },
        course: { id: 1, user_id: 1, title: "Detail Test", description: "Desc" },
      },
    });
    expect(wrapper.text()).toContain("Detail Test");
  });

  it("should render CourseContentPageWrapper (routes/courses/[courseId]/contents/[contentId]/+page.svelte)", () => {
    const { wrapper } = renderWithProviders(CourseContentPageWrapper, {
      preloadedState: {
        profile: { id: 1, name: "Logged User" },
        course: { id: 1, user_id: 1, title: "Kursus Test", description: "Desc" },
        content: { id: 5, course_id: 1, title: "Materi Test", youtube: "https://youtu.be/uHyfQV0kbgo" },
      },
    });
    expect(wrapper.text()).toContain("Materi Test");
  });

  it("should render UsersPageWrapper (routes/users/+page.svelte)", () => {
    const { wrapper } = renderWithProviders(UsersPageWrapper, {
      preloadedState: {
        users: [{ id: 1, name: "User Satu", email: "satu@del.org" }],
      },
    });
    expect(wrapper.text()).toContain("Semua Pengguna");
  });
});
