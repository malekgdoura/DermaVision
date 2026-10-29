import type { ChatMessage } from "@/server/report-api/client";

import { AI_PRECONSULTATION_DISCLAIMER } from "./ai-schema";
import type { OriginalAnswers } from "./schemas";

const SYSTEM_PROMPT = [
  "Tu aides à organiser une pré-consultation dermatologique pour un médecin.",
  "Retourne uniquement un objet JSON valide, sans markdown ni texte autour.",
  "Utilise exclusivement les informations fournies dans les réponses du patient.",
  "Ne crée jamais de symptôme, diagnostic, traitement, dosage, fréquence, allergie ou réaction.",
  "Ne transforme jamais une information inconnue ou non renseignée en réponse négative.",
  "Recopie exactement motif, attentes, habitudesSoin, informationsComplementaires, traitements et allergies.",
  "Mets dans missingInformation uniquement les informations absentes ou explicitement incomplètes.",
  `Le champ disclaimer doit être exactement : ${AI_PRECONSULTATION_DISCLAIMER}`,
  "La sortie doit contenir les clés motif, attentes, habitudesSoin, traitementsDeclares, allergiesDeclarees, informationsComplementaires, missingInformation et disclaimer.",
].join("\n");

export function buildPreConsultationMessages(answers: OriginalAnswers): ChatMessage[] {
  return [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: ["Réponses originales du patient (JSON) :", JSON.stringify(answers, null, 2)].join("\n"),
    },
  ];
}
