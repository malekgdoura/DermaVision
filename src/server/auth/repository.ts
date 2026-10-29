import { prisma } from "@/server/db/prisma";

export function trouverUtilisateurParEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
}

export function creerUtilisateur(donnees: {
  prenom: string;
  nom: string;
  email: string;
  telephone?: string;
  motDePasseHache: string;
}) {
  return prisma.user.create({
    data: {
      prenom: donnees.prenom,
      nom: donnees.nom,
      email: donnees.email.toLowerCase(),
      telephone: donnees.telephone || null,
      motDePasse: donnees.motDePasseHache,
    },
  });
}