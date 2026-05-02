const GRAPH_BASE = "https://graph.facebook.com/v19.0";

/**
 * Get OAuth URL for Facebook Login (Pages permissions).
 * Redirect the user here; they'll come back to your callback URL.
 */
export function getFacebookOAuthUrl(callbackUrl: string): string {
  const appId = process.env.META_APP_ID ?? "";
  const scope = [
    "pages_show_list",
    "pages_read_engagement",
    "pages_manage_posts",
    "pages_manage_metadata",
  ].join(",");

  return `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=${scope}&response_type=code`;
}

/** Exchange short-lived code for a long-lived user access token. */
export async function exchangeCodeForToken(code: string, callbackUrl: string) {
  const url = new URL(`${GRAPH_BASE}/oauth/access_token`);
  url.searchParams.set("client_id", process.env.META_APP_ID ?? "");
  url.searchParams.set("client_secret", process.env.META_APP_SECRET ?? "");
  url.searchParams.set("redirect_uri", callbackUrl);
  url.searchParams.set("code", code);

  const res = await fetch(url.toString());
  const data = await res.json();

  // Exchange short-lived for long-lived
  const llUrl = new URL(`${GRAPH_BASE}/oauth/access_token`);
  llUrl.searchParams.set("grant_type", "fb_exchange_token");
  llUrl.searchParams.set("client_id", process.env.META_APP_ID ?? "");
  llUrl.searchParams.set("client_secret", process.env.META_APP_SECRET ?? "");
  llUrl.searchParams.set("fb_exchange_token", data.access_token);

  const llRes = await fetch(llUrl.toString());
  return llRes.json() as Promise<{ access_token: string; expires_in: number }>;
}

/** List all pages the user manages. */
export async function listUserPages(userAccessToken: string) {
  const res = await fetch(`${GRAPH_BASE}/me/accounts?access_token=${userAccessToken}`);
  const data = await res.json();
  return data.data as Array<{
    id: string;
    name: string;
    access_token: string;
  }>;
}

/**
 * Publish a reel to a Facebook Page using the 3-stage Reels upload protocol.
 * 1. Start upload session
 * 2. Transfer video binary
 * 3. Finish (publish)
 */
export async function publishReelToPage(params: {
  pageId: string;
  pageAccessToken: string;
  videoUrl: string;
  description?: string;
}): Promise<{ success: boolean; postId?: string; error?: string }> {
  const { pageId, pageAccessToken, videoUrl, description } = params;

  try {
    // Stage 1: initialize upload
    const startRes = await fetch(`${GRAPH_BASE}/${pageId}/video_reels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        upload_phase: "start",
        access_token: pageAccessToken,
      }),
    });
    const startData = await startRes.json();
    const videoId = startData.video_id;
    if (!videoId) return { success: false, error: startData.error?.message ?? "Failed to start upload" };

    // Stage 2: transfer video
    const transferRes = await fetch(
      `https://rupload.facebook.com/video-upload/v19.0/${videoId}`,
      {
        method: "POST",
        headers: {
          Authorization: `OAuth ${pageAccessToken}`,
          file_url: videoUrl,
        },
      },
    );
    const transferData = await transferRes.json();
    if (!transferData.success) return { success: false, error: "Transfer failed" };

    // Stage 3: finish / publish
    const finishRes = await fetch(`${GRAPH_BASE}/${pageId}/video_reels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        upload_phase: "finish",
        video_id: videoId,
        access_token: pageAccessToken,
        description: description ?? "",
      }),
    });
    const finishData = await finishRes.json();

    if (finishData.success) {
      return { success: true, postId: finishData.post_id ?? videoId };
    }
    return { success: false, error: finishData.error?.message ?? "Publish failed" };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
