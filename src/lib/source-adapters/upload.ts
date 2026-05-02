import type { SourceAdapter, FetchedReel } from "./index";

/**
 * Default adapter: the user provides a direct video URL (MP4).
 * No scraping — the user is responsible for having rights to the content.
 */
export class UploadAdapter implements SourceAdapter {
  platform = "UPLOAD";

  async fetchReels(videoUrl: string): Promise<FetchedReel[]> {
    return [
      {
        externalId: videoUrl,
        title: "User-uploaded reel",
        videoUrl,
      },
    ];
  }
}
