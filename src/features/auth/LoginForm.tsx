"use client";

import Link from "next/link";
import { useActionState } from "react";

import { authContent } from "@/content/auth";
import { routes } from "@/content/home";
import { seConnecter } from "@/server/auth/actions";

import { BoutonPrincipal, Champ, MessageErreur } from "./ui";

const text = authContent.login;

export function LoginForm() {
  const [etat, action, enCours] = useActionState(seConnecter, undefined);

  return (
    // noValidate: errors come from the server schema and are shown in the design system style.
    <form action={action} noValidate className="flex flex-col gap-5">
      <MessageErreur message={etat?.erreur} />

      <Champ
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        error={etat?.champs?.email}
        defaultValue={etat?.valeurs?.email}
      />
      <Champ
        label="Password"
        name="motDePasse"
        type="password"
        autoComplete="current-password"
        error={etat?.champs?.motDePasse}
      />

      <div className="pt-1">
        <BoutonPrincipal enCours={enCours} loadingLabel={text.loading}>
          {text.submit}
        </BoutonPrincipal>
      </div>

      <p className="text-center text-[0.9375rem] text-foreground">
        {text.switchPrompt}{" "}
        <Link
          href={routes.register}
          className="inline-flex min-h-11 items-center font-semibold text-primary underline-offset-4 hover:text-primary-hover hover:underline"
        >
          {text.switchLink}
        </Link>
      </p>
    </form>
  );
}
