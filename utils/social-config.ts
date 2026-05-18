// Supported platforms list for connectivity
export const SUPPORTED_PLATFORMS = [
  "instagram",
  "tiktok",
  "facebook",
  "pinterest",
  "twitter",
  "linkedin",
  "youtube",
];

/**
 * Checks if a given platform ID is supported for connectivity.
 * Returns true if supported, false otherwise.
 */
export function isPlatformSupported(platformId: string): boolean {
  return SUPPORTED_PLATFORMS.includes(platformId);
}
