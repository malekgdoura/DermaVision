import { getFaceppConfig, type FaceppConfig } from "./config";
import {
  describeFaceppError,
  describeSkinApiError,
  SkinApiError,
  type SkinApiErrorKind,
} from "./errors";
import {
  faceppErrorResponseSchema,
  faceppSkinAnalyzeResponseSchema,
  type FaceppSkinAnalyzeResponse,
} from "./schemas";

// Technical client for Face++ Skin Analyze: sends one JPEG, returns a validated response.
// No business rules here (no database, no permissions, no storage).

const SKIN_ANALYZE_PATH = "/facepp/v1/skinanalyze";
const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // Face++ limit: JPEG, 2 MB max
const REQUEST_TIMEOUT_MS = 30_000;

export type SkinAnalyzeResult =
  | { ok: true; data: FaceppSkinAnalyzeResponse }
  | { ok: false; error: SkinApiError };

export async function analyzeSkin(image: Blob): Promise<SkinAnalyzeResult> {
  if (image.size === 0 || image.size > MAX_IMAGE_BYTES) {
    return failure("invalid_image");
  }
  if (image.type && image.type !== "image/jpeg") {
    return failure("invalid_image");
  }

  let config: FaceppConfig;
  try {
    config = getFaceppConfig();
  } catch {
    return failure("configuration");
  }

  const form = new FormData();
  form.append("api_key", config.apiKey);
  form.append("api_secret", config.apiSecret);
  form.append("image_file", image, "face.jpg");

  let response: Response;
  let body: unknown;
  try {
    response = await fetch(`${config.baseUrl}${SKIN_ANALYZE_PATH}`, {
      method: "POST",
      body: form,
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    return failure(isTimeout(error) ? "timeout" : "network");
  }

  try {
    body = await response.json();
  } catch (error) {
    // The timeout also covers reading the body.
    return failure(isTimeout(error) ? "timeout" : "invalid_response", response.status);
  }

  // Face++ reports failures with an error_message field (e.g. "CONCURRENCY_LIMIT_EXCEEDED",
  // "BAD_ARGUMENTS:image_file"), usually with a 4xx status.
  const errorBody = faceppErrorResponseSchema.safeParse(body);
  if (errorBody.success) {
    return {
      ok: false,
      error: new SkinApiError(describeFaceppError(errorBody.data.error_message, response.status)),
    };
  }

  const successBody = faceppSkinAnalyzeResponseSchema.safeParse(body);
  if (!response.ok || !successBody.success) {
    return failure("invalid_response", response.status);
  }

  return { ok: true, data: successBody.data };
}

// AbortSignal.timeout() rejects with a DOMException named "TimeoutError".
function isTimeout(error: unknown): boolean {
  return error instanceof Error && error.name === "TimeoutError";
}

function failure(kind: SkinApiErrorKind, httpStatus?: number): SkinAnalyzeResult {
  return { ok: false, error: new SkinApiError(describeSkinApiError(kind, httpStatus)) };
}
