import { sveltekit } from "@sveltejs/kit/vite";
import adapterBun from "@sveltejs/adapter-bun";
import adapterVercel from "@sveltejs/adapter-vercel";
import tailwindcss from "@tailwindcss/vite";
import { svelteTesting } from "@testing-library/svelte/vite";
import { defineConfig, loadEnv } from "vite";
import process from "process";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const port = Number(process.env.APP_PORT || env.APP_PORT) || 3005;

  // Di Vercel, variabel VERCEL otomatis terisi.
  const isVercel = Boolean(process.env.VERCEL);

  const adapter = isVercel
    ? adapterVercel()
    : adapterBun({
        envPrefix: "APP_",
        serverOptions: {
          port: port,
        },
      });

  // Di Vercel, panggil domain sendiri (/api/v1) yang diteruskan oleh vercel.json
  // agar tidak terkena CORS. Di tempat lain pakai alamat API langsung.
  const baseUrl = isVercel
    ? "/api/v1"
    : env.VITE_DELCOM_BASEURL || "https://open-api.delcom.org/api/v1";

  return {
    plugins: [sveltekit({ adapter }), tailwindcss(), svelteTesting()],
    server: {
      port: port,
    },
    preview: {
      port: port,
    },
    build: {
      chunkSizeWarningLimit: 1500,
    },
    define: {
      DELCOM_BASEURL: JSON.stringify(baseUrl),
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/setupTests.ts",
      coverage: {
        provider: "v8",
        reporter: ["text", "json", "html", "lcov"],
        include: ["src/**/*.{js,ts,svelte}"],
        exclude: [
          "src/app.d.ts",
          "src/env.d.ts",
          "src/setupTests.ts",
          "src/test-utils.ts",
          "**/*.test.{js,ts}",
          "node_modules/**",
          ".svelte-kit/**",
          ".docs/**",
        ],
        thresholds: {
          lines: 100,
          functions: 100,
          branches: 100,
          statements: 100,
        },
      },
    },
  };
});