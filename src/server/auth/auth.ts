import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { authConfig } from "./auth.config";
import { trouverUtilisateurParEmail } from "./repository";
import { loginSchema } from "./schemas";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(identifiants) {
        const resultat = loginSchema.safeParse(identifiants);
        if (!resultat.success) return null;

        const { email, motDePasse } = resultat.data;

        const utilisateur = await trouverUtilisateurParEmail(email);
        if (!utilisateur) return null;

        const ok = await bcrypt.compare(
          motDePasse,
          utilisateur.motDePasse
        );

        if (!ok) return null;

        return {
          id: utilisateur.id,
          email: utilisateur.email,
          name: `${utilisateur.prenom} ${utilisateur.nom}`,
          role: utilisateur.role,
        };
      },
    }),
  ],
});