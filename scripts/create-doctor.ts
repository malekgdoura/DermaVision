/**
 * Creates (or promotes) a doctor account. Public registration only creates patients.
 *
 *   npm run db:create-doctor -- --email dr.ben@clinic.tn --prenom Amel --nom Ben --password "..."
 *
 * If the email already exists, the account is switched to MEDECIN and the password is left unchanged.
 */
import { parseArgs } from "node:util";

import bcrypt from "bcryptjs";
import { z } from "zod";

try {
  process.loadEnvFile(".env");
} catch {
  // No .env file: rely on variables already set in the environment.
}

const argsSchema = z.object({
  email: z.email(),
  prenom: z.string().trim().min(2),
  nom: z.string().trim().min(2),
  password: z.string().min(8, "Use at least 8 characters").optional(),
});

async function main() {
  const { values } = parseArgs({
    options: {
      email: { type: "string" },
      prenom: { type: "string" },
      nom: { type: "string" },
      password: { type: "string" },
    },
  });

  const parsed = argsSchema.safeParse(values);
  if (!parsed.success) {
    console.error(parsed.error.issues.map((issue) => `--${issue.path.join(".")}: ${issue.message}`).join("\n"));
    process.exit(1);
  }

  // Imported after loading .env: the client reads DATABASE_URL when it is created.
  const { prisma } = await import("../src/server/db/prisma");
  const email = parsed.data.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({ where: { email }, data: { role: "MEDECIN" } });
    console.log(`${email} is now a doctor (password unchanged).`);
  } else {
    if (!parsed.data.password) {
      console.error("--password is required to create a new account.");
      process.exit(1);
    }
    await prisma.user.create({
      data: {
        email,
        prenom: parsed.data.prenom,
        nom: parsed.data.nom,
        motDePasse: await bcrypt.hash(parsed.data.password, 10),
        role: "MEDECIN",
      },
    });
    console.log(`Doctor account created for ${email}.`);
  }

  await prisma.$disconnect();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
