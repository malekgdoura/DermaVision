// Errors of the Face++ integration, in one place.
// No UI, no database, no network: only types, an error class and message translation.

export type SkinApiErrorKind =
  | "invalid_image" // the image breaks Face++ requirements (format, size, face)
  | "network" // Face++ could not be reached
  | "timeout" // Face++ did not answer in time
  | "facepp" // Face++ answered with an error_message we do not classify more precisely
  | "invalid_response" // Face++ answered something that does not match the schema
  | "configuration"; // FACEPP_* variables missing or wrong, or credentials refused

export type SkinApiErrorDetails = {
  kind: SkinApiErrorKind;
  // Clean message that DermaVision can show or store. Never contains secrets or raw API text.
  message: string;
  // True when trying again later can work (busy service, network, timeout).
  retryable: boolean;
  // Face++ error code without its parameter, e.g. "BAD_ARGUMENTS" for "BAD_ARGUMENTS:image_file".
  faceppCode?: string;
  httpStatus?: number;
};

export class SkinApiError extends Error {
  readonly kind: SkinApiErrorKind;
  readonly retryable: boolean;
  readonly faceppCode?: string;
  readonly httpStatus?: number;

  constructor(details: SkinApiErrorDetails) {
    super(details.message);
    this.name = "SkinApiError";
    this.kind = details.kind;
    this.retryable = details.retryable;
    this.faceppCode = details.faceppCode;
    this.httpStatus = details.httpStatus;
  }
}

export function isSkinApiError(error: unknown): error is SkinApiError {
  return error instanceof SkinApiError;
}

// Default message for each kind, used when no more precise Face++ code is known.
const DEFAULT_ERRORS: Record<SkinApiErrorKind, Omit<SkinApiErrorDetails, "kind">> = {
  invalid_image: {
    message: "The photo cannot be analyzed. Please use a clear JPEG photo of your face, under 2 MB.",
    retryable: false,
  },
  network: {
    message: "The skin analysis service cannot be reached right now. Please try again later.",
    retryable: true,
  },
  timeout: {
    message: "The skin analysis took too long. Please try again.",
    retryable: true,
  },
  facepp: {
    message: "The skin analysis service returned an error. Please try again later.",
    retryable: true,
  },
  invalid_response: {
    message: "The skin analysis service returned an unexpected result.",
    retryable: false,
  },
  configuration: {
    message: "The skin analysis service is not configured correctly.",
    retryable: false,
  },
};

// Frequent Face++ error codes and their DermaVision meaning.
const FACEPP_ERRORS: Record<string, Omit<SkinApiErrorDetails, "faceppCode" | "httpStatus">> = {
  CONCURRENCY_LIMIT_EXCEEDED: {
    kind: "facepp",
    message: "The skin analysis service is busy. Please try again in a few moments.",
    retryable: true,
  },
  AUTHENTICATION_ERROR: {
    kind: "configuration",
    message: "The skin analysis service refused the DermaVision credentials.",
    retryable: false,
  },
  AUTHORIZATION_ERROR: {
    kind: "configuration",
    message: "The DermaVision account is not allowed to use skin analysis (quota or permissions).",
    retryable: false,
  },
  INVALID_IMAGE_FACE: {
    kind: "invalid_image",
    message: "The face in the photo is not clear enough. Face the camera in good light, without glasses or hair on the face.",
    retryable: false,
  },
  NO_FACE_FOUND: {
    kind: "invalid_image",
    message: "No face was found in the photo. Please take a front-facing photo of your face.",
    retryable: false,
  },
  IMAGE_FILE_TOO_LARGE: {
    kind: "invalid_image",
    message: "The photo is too large. Please use a JPEG photo under 2 MB.",
    retryable: false,
  },
  INVALID_IMAGE_SIZE: {
    kind: "invalid_image",
    message: "The photo resolution is not supported. Use a photo between 200×200 and 4096×4096 pixels.",
    retryable: false,
  },
  IMAGE_ERROR_UNSUPPORTED_FORMAT: {
    kind: "invalid_image",
    message: "The photo format is not supported. Please use a JPEG photo.",
    retryable: false,
  },
  BAD_ARGUMENTS: {
    kind: "facepp",
    message: "The skin analysis request was rejected. Please try again with another photo.",
    retryable: false,
  },
  MISSING_ARGUMENTS: {
    kind: "facepp",
    message: "The skin analysis request was incomplete.",
    retryable: false,
  },
  INTERNAL_ERROR: {
    kind: "facepp",
    message: "The skin analysis service had an internal problem. Please try again later.",
    retryable: true,
  },
};

// Face++ error_message looks like "CODE" or "CODE:parameter" (e.g. "BAD_ARGUMENTS:image_file").
export function getFaceppErrorCode(errorMessage: string): string {
  return errorMessage.split(":")[0].trim().toUpperCase();
}

// Turns a raw Face++ error_message into clean DermaVision error details.
export function describeFaceppError(errorMessage: string, httpStatus?: number): SkinApiErrorDetails {
  const faceppCode = getFaceppErrorCode(errorMessage);
  const known = FACEPP_ERRORS[faceppCode];

  if (known) return { ...known, faceppCode, httpStatus };
  return { kind: "facepp", ...DEFAULT_ERRORS.facepp, faceppCode, httpStatus };
}

// Clean error details for errors that do not come from a Face++ error_message.
export function describeSkinApiError(kind: SkinApiErrorKind, httpStatus?: number): SkinApiErrorDetails {
  return { kind, ...DEFAULT_ERRORS[kind], httpStatus };
}
