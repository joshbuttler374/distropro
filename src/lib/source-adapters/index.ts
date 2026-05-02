/**
 * Source adapter interface for fetching reel media from various platforms.
 *
 * The default implementation is `UploadAdapter` — the user supplies an MP4 URL
 * directly (BYOC: Bring Your Own Content).
 *
 * To add IG / TikTok / YouTube acquisition, implement this interface with
 * yt-dlp or a paid scraping API. Do so only if you have legal rights to the
 * content — scraping third-party content violates most platforms' ToS and may
 * create DMCA exposure.
 */
export interface SourceAdapter {
  platform: string;
  fetchReels(handle: string, limit?: number): Promise<FetchedReel[]>;
}

export interface FetchedReel {
  externalId: string;
  title?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  durationSec?: number;
}

export { UploadAdapter } from "./upload";
