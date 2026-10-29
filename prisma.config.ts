import { defineConfig } from "prisma/config";

// Load web/.env for Prisma CLI commands (Node 20.12+ built-in, no dotenv needed).
try {
  process.loadEnvFile(".env");
} catch {
  // No .env file: rely on variables already set in the environment.
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
