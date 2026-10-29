import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  motDePasse: z.string().min(1, "Enter your password"),
});

export const registerSchema = z
  .object({
    prenom: z.string().trim().min(2, "First name must be at least 2 characters"),
    nom: z.string().trim().min(2, "Last name must be at least 2 characters"),
    email: z.email("Enter a valid email address"),
    telephone: z.string().trim().optional(),
    motDePasse: z.string().min(8, "Use at least 8 characters"),
    confirmation: z.string(),
  })
  .refine((d) => d.motDePasse === d.confirmation, {
    message: "Passwords do not match",
    path: ["confirmation"],
  });
