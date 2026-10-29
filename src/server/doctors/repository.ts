import { prisma } from "@/server/db/prisma";

// Database access for doctor profiles. Public data only: never email, phone or password.
export function findPublicDoctors() {
  return prisma.user.findMany({
    where: { role: "MEDECIN" },
    orderBy: [{ nom: "asc" }, { prenom: "asc" }],
    select: { id: true, prenom: true, nom: true },
  });
}
