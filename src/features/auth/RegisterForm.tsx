"use client";

import Link from "next/link";
import { useActionState } from "react";

import { authContent } from "@/content/auth";
import { routes } from "@/content/home";
import { sInscrire } from "@/server/auth/actions";

import { BoutonPrincipal, Champ, MessageErreur } from "./ui";

const text = authContent.register;

export function RegisterForm() {
  const [etat, action, enCours] = useActionState(sInscrire, undefined);
  const champs = etat?.champs;
  const valeurs = etat?.valeurs;

  return (
    // noValidate: errors come from the server schema and are shown in the design system style.
    <form action={action} noValidate className="flex flex-col gap-5">
      <MessageErreur message={etat?.erreur} />

      <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
        <Champ
          label="First name"
          name="prenom"
          autoComplete="given-name"
          error={champs?.prenom}
          defaultValue={valeurs?.prenom}
        />
        <Champ
          label="Last name"
          name="nom"
          autoComplete="family-name"
          error={champs?.nom}
          defaultValue={valeurs?.nom}
        />
      </div>

      <Champ
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        error={champs?.email}
        defaultValue={valeurs?.email}
      />

      <Champ
        label="Phone"
        name="telephone"
        type="tel"
        required={false}
        autoComplete="tel"
        error={champs?.telephone}
        defaultValue={valeurs?.telephone}
      />

      <Champ
        label="Password"
        name="motDePasse"
        type="password"
        autoComplete="new-password"
        hint={text.passwordHint}
        error={champs?.motDePasse}
      />

      <Champ
        label="Confirm password"
        name="confirmation"
        type="password"
        autoComplete="new-password"
        error={champs?.confirmation}
      />

      <div className="pt-1">
        <BoutonPrincipal enCours={enCours} loadingLabel={text.loading}>
          {text.submit}
        </BoutonPrincipal>
      </div>

      <p className="text-center text-[0.9375rem] text-foreground">
        {text.switchPrompt}{" "}
        <Link
          href={routes.login}
          className="inline-flex min-h-11 items-center font-semibold text-primary underline-offset-4 hover:text-primary-hover hover:underline"
        >
          {text.switchLink}
        </Link>
      </p>
    </form>
  );
}
