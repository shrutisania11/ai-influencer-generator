"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { isPlatformSupported } from "@/utils/social-config";

const ZERNIO_API_KEY = process.env.ZERNIO_API_KEY;
const API_BASE = "https://zernio.com/api/v1";

// Helper to make Zernio API requests
async function zernioFetch(endpoint: string, options: RequestInit = {}) {
  if (!ZERNIO_API_KEY) {
    return { success: false, error: "Zernio API key not configured" };
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        "Authorization": `Bearer ${ZERNIO_API_KEY}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      return { success: false, error: errBody.message || `API error: ${res.status}` };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message || "Network request failed" };
  }
}

/**
 * Gets or creates a Zernio Profile for the user.
 * We use a deterministic profile ID name to make it stateless and simple, or we create it.
 */
export async function getOrCreateZernioProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Generate a deterministic profile name
  const profileName = `InfluenceAI Profile (${user.email?.split("@")[0] || "User"})`;
  
  if (!ZERNIO_API_KEY) {
    // Return a mock profile ID for preview mode
    const mockProfileId = `prof_mock_${user.id.substring(0, 8)}`;
    return { success: true, profileId: mockProfileId, isMock: true };
  }

  // Real Zernio integration
  // 1. Try to search or just create a profile. In Zernio, we can create a profile.
  const res = await zernioFetch("/profiles", {
    method: "POST",
    body: JSON.stringify({
      name: profileName,
      description: "Automated profile created by InfluenceAI Pro Creator",
    }),
  });

  if (res.success && res.data?.profile?._id) {
    return { success: true, profileId: res.data.profile._id, isMock: false };
  }

  // Fallback / Try listing profiles if creation fails due to duplicate or limit
  const listRes = await zernioFetch("/profiles");
  if (listRes.success && listRes.data?.profiles && listRes.data.profiles.length > 0) {
    return { success: true, profileId: listRes.data.profiles[0]._id, isMock: false };
  }

  return { success: false, error: res.error || "Failed to create Zernio Profile" };
}

/**
 * Generates the OAuth connection URL for Zernio
 */
export async function getConnectUrl(platform: string) {
  // Verify platform support before proceeding
  if (!isPlatformSupported(platform)) {
    return { success: false, error: `Platform '${platform}' is not supported for connectivity.` };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Check social connect limits based on subscription tier
  try {
    const { data: userData } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    const tier = userData?.subscription_tier || 'free';

    const { data: accounts, error: countError } = await supabase
      .from('social_accounts')
      .select('id')
      .eq('user_id', user.id);

    if (!countError && accounts) {
      const totalConnected = accounts.length;
      if (tier === 'free' && totalConnected >= 1) {
        return { success: false, error: "Free tier users can only connect 1 social media account. Please upgrade to Standard or Pro to connect more accounts." };
      }
      if (tier === 'standard' && totalConnected >= 5) {
        return { success: false, error: "Standard tier users can only connect up to 5 social media accounts. Please upgrade to Pro for unlimited accounts." };
      }
    }
  } catch (err) {
    // If table doesn't exist, we'll let it proceed and handle it client-side
    console.warn("DB check failed for social limits, continuing:", err);
  }

  const profileResult = await getOrCreateZernioProfile();
  if (!profileResult.success) return profileResult;

  const { profileId, isMock } = profileResult;

  if (isMock) {
    // Generate a mock auth URL that triggers our frontend interactive simulation popup
    return { 
      success: true, 
      authUrl: `mock-oauth://${platform}?profileId=${profileId}`,
      isMock: true 
    };
  }

  // Real Zernio connection URL request
  const res = await zernioFetch(`/connect/${platform}?profileId=${profileId}`);
  if (res.success && res.data?.authUrl) {
    return { success: true, authUrl: res.data.authUrl, isMock: false };
  }

  return { success: false, error: res.error || "Failed to retrieve connection URL from Zernio" };
}

/**
 * Syncs connected accounts from Zernio to our database
 */
export async function syncConnectedAccounts() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  if (!ZERNIO_API_KEY) {
    // In mock mode, we pull connected accounts from a persistent cookie or local state,
    // or return whatever is in the database.
    return getSocialAccounts();
  }

  // Real Zernio integration
  const res = await zernioFetch("/accounts");
  if (!res.success || !res.data?.accounts) {
    return { success: false, error: res.error || "Failed to sync accounts from Zernio" };
  }

  const zernioAccounts = res.data.accounts;
  const syncedAccounts = [];

  try {
    for (const acc of zernioAccounts) {
      // Clean up names
      const accountName = acc.name || acc.username || `User_${acc._id.substring(0, 6)}`;
      const avatarUrl = acc.avatarUrl || acc.profilePicture || `https://api.dicebear.com/7.x/adventurer/svg?seed=${accountName}`;

      const { data, error } = await supabase
        .from("social_accounts")
        .upsert({
          user_id: user.id,
          platform: acc.platform,
          profile_id: acc.profileId || "",
          account_id: acc._id,
          account_name: accountName,
          avatar_url: avatarUrl,
        }, { onConflict: "user_id,platform,account_id" })
        .select()
        .single();

      if (error) {
        console.error("Supabase upsert error:", error);
      } else if (data) {
        syncedAccounts.push(data);
      }
    }

    revalidatePath("/dashboard/accounts");
    return { success: true, accounts: syncedAccounts };
  } catch (e: any) {
    return { success: false, error: e.message || "Failed to persist synced accounts" };
  }
}

/**
 * Fetches all connected accounts for the current user
 */
export async function getSocialAccounts() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated", zernioKeyExists: !!ZERNIO_API_KEY };

  try {
    const { data, error } = await supabase
      .from("social_accounts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      // If table does not exist, return gracefully to trigger local storage sync on client
      if (error.code === "P0001" || error.message?.includes("does not exist") || error.code === "42P01") {
        return { success: true, accounts: [], dbTableMissing: true, zernioKeyExists: !!ZERNIO_API_KEY };
      }
      return { success: false, error: error.message, zernioKeyExists: !!ZERNIO_API_KEY };
    }

    return { success: true, accounts: data || [], dbTableMissing: false, zernioKeyExists: !!ZERNIO_API_KEY };
  } catch (e: any) {
    return { success: false, error: e.message, zernioKeyExists: !!ZERNIO_API_KEY };
  }
}

/**
 * Adds a social account manually (useful for mock simulation or quick setups)
 */
export async function saveConnectedAccount(platform: string, accountId: string, accountName: string, avatarUrl: string, profileId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    // Check social connect limits based on subscription tier
    const { data: userData } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    const tier = userData?.subscription_tier || 'free';

    const { data: accounts } = await supabase
      .from('social_accounts')
      .select('account_id')
      .eq('user_id', user.id);

    const totalConnected = accounts?.length || 0;
    const isExisting = accounts?.some(a => a.account_id === accountId) || false;

    if (!isExisting) {
      if (tier === 'free' && totalConnected >= 1) {
        return { success: false, error: "Free tier users can only connect 1 social media account. Please upgrade to Standard or Pro under Settings to connect more accounts." };
      }
      if (tier === 'standard' && totalConnected >= 5) {
        return { success: false, error: "Standard tier users can only connect up to 5 social media accounts. Please upgrade to Pro under Settings." };
      }
    }

    const { data, error } = await supabase
      .from("social_accounts")
      .upsert({
        user_id: user.id,
        platform,
        profile_id: profileId,
        account_id: accountId,
        account_name: accountName,
        avatar_url: avatarUrl,
      }, { onConflict: "user_id,platform,account_id" })
      .select()
      .single();

    if (error) {
      if (error.code === "42P01" || error.message?.includes("does not exist") || error.code === "23503" || error.message?.includes("violates foreign key")) {
        return { success: true, mockMode: true, message: "Saved in browser session." };
      }
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/accounts");
    return { success: true, account: data };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Disconnects a social account (removes it from database and optionally Zernio if real key exists)
 */
export async function disconnectSocialAccount(accountId: string, platform: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    // 1. Delete from database
    const { error } = await supabase
      .from("social_accounts")
      .delete()
      .eq("user_id", user.id)
      .eq("account_id", accountId);

    if (error && !(error.code === "42P01" || error.message?.includes("does not exist"))) {
      return { success: false, error: error.message };
    }

    // 2. If real API key, disconnect from Zernio as well
    if (ZERNIO_API_KEY) {
      await zernioFetch(`/accounts/${accountId}`, { method: "DELETE" });
    }

    revalidatePath("/dashboard/accounts");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Downloads an image from a URL and returns a Buffer
 */
async function downloadImage(url: string): Promise<Buffer> {
  if (url.startsWith("data:image/")) {
    const base64Data = url.split(",")[1];
    return Buffer.from(base64Data, 'base64');
  }

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download image from ${url}`);
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Schedules a post to Zernio using its REST API endpoints
 */
export async function schedulePostToZernio({
  userId,
  postId,
  platform,
  content,
  imageUrl,
  scheduledAt,
  publishNow
}: {
  userId: string;
  postId: string;
  platform: string;
  content: string;
  imageUrl: string;
  scheduledAt?: string | null;
  publishNow?: boolean;
}) {
  const supabase = await createClient();

  // 1. Get the account ID from social_accounts table for the given platform and user
  let accountId = "";
  try {
    const { data: accData } = await supabase
      .from("social_accounts")
      .select("account_id")
      .eq("user_id", userId)
      .eq("platform", platform)
      .limit(1)
      .maybeSingle();

    if (accData && accData.account_id) {
      accountId = accData.account_id;
    } else {
      // Fallback: If not found, use a mock ID so the system keeps functioning seamlessly
      accountId = `acc_mock_${platform}_${userId.substring(0, 6)}`;
    }
  } catch (err) {
    accountId = `acc_mock_${platform}_${userId.substring(0, 6)}`;
  }

  // 2. Determine Zernio API configuration
  if (!ZERNIO_API_KEY) {
    // Mock Mode
    console.log(`[ZERNIO MOCK] Scheduling post ID: ${postId} for platform: ${platform}`);
    console.log(`[ZERNIO MOCK] Content: "${content}"`);
    console.log(`[ZERNIO MOCK] Image URL: ${imageUrl}`);
    console.log(`[ZERNIO MOCK] Account ID: ${accountId}`);
    if (publishNow) {
      console.log(`[ZERNIO MOCK] Publishing immediately`);
    } else {
      console.log(`[ZERNIO MOCK] Scheduled for: ${scheduledAt}`);
    }
    return {
      success: true,
      isMock: true,
      postId: `post_mock_${Date.now()}`
    };
  }

  // Real Zernio integration
  try {
    // A. Step 1 & 2: Presigned Media Upload Flow
    let zernioMediaUrl = imageUrl;
    if (imageUrl) {
      // Download the image
      const imageBuffer = await downloadImage(imageUrl);

      // Request presigned URL from Zernio
      const presignRes = await zernioFetch("/media/presign", {
        method: "POST",
        body: JSON.stringify({
          fileName: `zernio_media_${postId}_${Date.now()}.jpg`,
          fileType: "image/jpeg"
        })
      });

      if (presignRes.success && presignRes.data?.uploadUrl && presignRes.data?.publicUrl) {
        const { uploadUrl, publicUrl } = presignRes.data;

        // Upload directly to the presigned URL
        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": "image/jpeg" },
          body: imageBuffer as any
        });

        if (uploadRes.ok) {
          zernioMediaUrl = publicUrl;
        } else {
          console.error("[ZERNIO] Failed to upload media to presigned URL:", uploadRes.statusText);
        }
      } else {
        console.error("[ZERNIO] Failed to obtain presigned URL:", presignRes.error);
      }
    }

    // B. Step 3: Create / Schedule Post on Zernio
    const payload: any = {
      content: content || "",
      platforms: [
        { platform: platform, accountId: accountId }
      ]
    };

    if (zernioMediaUrl) {
      payload.mediaItems = [
        { url: zernioMediaUrl, type: "image" }
      ];
    }

    if (publishNow) {
      payload.publishNow = true;
    } else if (scheduledAt) {
      payload.scheduledFor = scheduledAt;
      payload.timezone = "UTC";
    }

    const postRes = await zernioFetch("/posts", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    if (postRes.success && postRes.data?.post?._id) {
      return {
        success: true,
        isMock: false,
        postId: postRes.data.post._id
      };
    } else {
      return {
        success: false,
        error: postRes.error || "Failed to schedule post on Zernio API"
      };
    }
  } catch (e: any) {
    return {
      success: false,
      error: e.message || "Failed to execute Zernio post integration"
    };
  }
}

