"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import type { z } from "zod";

import { signIn, signOut } from "./auth";
import { loginSchema, registerSchema } from "./schemas";
import { creerUtilisateur, trouverUtilisateurParEmail } from "./repository";

export type EtatFormulaire =
  | {
      /** Message for the whole form (wrong credentials, existing account, invalid fields). */
      erreur?: string;
      /** First validation message per field name, shown under each field. */
      champs?: Record<string, string>;
      /** Submitted values to refill the form after an error (passwords are never returned). */
      valeurs?: Record<string, string>;
    }
  | undefined;

const CHAMPS_SECRETS = new Set(["motDePasse", "confirmation"]);

function valeursSaisies(formData: FormData) {
  const valeurs: Record<string, string> = {};
  for (const [cle, valeur] of formData.entries()) {
    if (typeof valeur === "string" && !CHAMPS_SECRETS.has(cle) && !cle.startsWith("$")) {
      valeurs[cle] = valeur;
    }
  }
  return valeurs;
}

function erreursParChamp(erreur: z.ZodError) {
  const champs: Record<string, string> = {};
  for (const issue of erreur.issues) {
    const champ = String(issue.path[0] ?? "");
    if (champ && !(champ in champs)) champs[champ] = issue.message;
  }
  return champs;
}

// CONNEXION
export async function seConnecter(_etat: EtatFormulaire, formData: FormData) {
  const resultat = loginSchema.safeParse(Object.fromEntries(formData));

  if (!resultat.success) {
    return {
      erreur: "Please check the highlighted fields.",
      champs: erreursParChamp(resultat.error),
      valeurs: valeursSaisies(formData),
    };
  }

  try {
    await signIn("credentials", {
      ...resultat.data,
      redirectTo: "/tableau-de-bord",
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return { erreur: "Incorrect email or password.", valeurs: valeursSaisies(formData) };
    }

    throw e;
  }
}

// INSCRIPTION
export async function sInscrire(_etat: EtatFormulaire, formData: FormData) {
  const resultat = registerSchema.safeParse(Object.fromEntries(formData));

  if (!resultat.success) {
    return {
      erreur: "Please check the highlighted fields.",
      champs: erreursParChamp(resultat.error),
      valeurs: valeursSaisies(formData),
    };
  }

  const { prenom, nom, email, telephone, motDePasse } = resultat.data;

  if (await trouverUtilisateurParEmail(email)) {
    return {
      erreur: "An account already exists with this email.",
      champs: { email: "This email is already registered" },
      valeurs: valeursSaisies(formData),
    };
  }

  await creerUtilisateur({
    prenom,
    nom,
    email,
    telephone,
    motDePasseHache: await bcrypt.hash(motDePasse, 10),
  });

  await signIn("credentials", {
    email,
    motDePasse,
    redirectTo: "/tableau-de-bord",
  });
}

// DÉCONNEXION
export async function seDeconnecter() {
  await signOut({ redirectTo: "/login" });
}
