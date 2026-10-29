import { getAnalysisForUser } from "@/server/analysis/service";
import { auth } from "@/server/auth/auth";
import { canDoctorViewAnalysis } from "@/server/review/service";
import { readPrivateImage } from "@/server/storage/private-images";

/**
 * Streams the private photo of one analysis to its owner, or to a doctor once it reached the review stage.
 * Same 404 for "missing" and "not yours", so other patients' analyses stay invisible.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return new Response(null, { status: 401 });

  const { id } = await params;
  const analysis =
    session.user.role === "MEDECIN"
      ? await canDoctorViewAnalysis(id)
      : await getAnalysisForUser(session.user.id, id);
  if (!analysis) return new Response(null, { status: 404 });

  const file = await readPrivateImage(analysis.image.storageKey);
  if (!file) return new Response(null, { status: 404 });

  return new Response(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Length": String(file.size),
      // Health data: never stored by shared caches, never sniffed as another type.
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
