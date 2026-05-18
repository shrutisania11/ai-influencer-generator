"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

interface InfluencerData {
  name: string;
  gender: string;
  body_type: string;
  skin_tone: string;
  age_range: string;
  hair_style: string;
  hair_color: string;
  eye_color: string;
  vibe: string;
  prompt: string;
  portrait_url: string;
  full_body_url: string;
}

interface PostData {
  model_id: string;
  prompt: string;
  image_url: string;
  aspect_ratio: string;
}

/**
 * Downloads an image from a URL and returns a Buffer (supports base64 and standard URLs)
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
 * Uploads a buffer to Supabase Storage and returns the public URL
 */
async function uploadToStorage(supabase: any, buffer: Buffer, fileName: string): Promise<string> {
  let { data, error } = await supabase.storage
    .from('influencers')
    .upload(fileName, buffer, {
      contentType: 'image/jpeg',
      upsert: true
    });

  if (error) {
    console.log("Bucket might not exist, attempting to auto-create 'influencers' bucket...");
    try {
      await supabase.storage.createBucket('influencers', { public: true });
      // Retry upload
      const retryResult = await supabase.storage
        .from('influencers')
        .upload(fileName, buffer, {
          contentType: 'image/jpeg',
          upsert: true
        });
      data = retryResult.data;
      error = retryResult.error;
    } catch (createErr) {
      console.error("Auto bucket creation failed:", createErr);
    }
  }

  if (error) {
    console.error("Storage upload error:", error);
    throw new Error(`Failed to upload to storage: ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('influencers')
    .getPublicUrl(fileName);

  return publicUrl;
}

export async function createInfluencer(data: InfluencerData) {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // 1. Check credits first
    const { data: userData } = await supabase
      .from('users')
      .select('credits')
      .eq('id', user.id)
      .single();

    const currentCredits = userData?.credits ?? 0;
    if (currentCredits < 50) {
      throw new Error("Insufficient credits. You need at least 50 credits to create an AI Influencer. Please purchase a subscription under Settings.");
    }

    // 2. Download images from Pollinations (or other source)
    const portraitBuffer = await downloadImage(data.portrait_url);
    const fullBodyBuffer = await downloadImage(data.full_body_url);

    // 3. Upload to Supabase Storage
    const timestamp = Date.now();
    const portraitPath = `${user.id}/${timestamp}_portrait.jpg`;
    const fullBodyPath = `${user.id}/${timestamp}_fullbody.jpg`;

    const portraitStorageUrl = await uploadToStorage(supabase, portraitBuffer, portraitPath);
    const fullBodyStorageUrl = await uploadToStorage(supabase, fullBodyBuffer, fullBodyPath);

    // 4. Save to database
    const { data: model, error: modelError } = await supabase
      .from('models')
      .insert({
        user_id: user.id,
        name: data.name,
        gender: data.gender,
        body_type: data.body_type,
        skin_tone: data.skin_tone,
        age_range: data.age_range,
        hair_style: data.hair_style,
        hair_color: data.hair_color,
        eye_color: data.eye_color,
        vibe: data.vibe,
        prompt: data.prompt,
        portrait_url: portraitStorageUrl,
        full_body_url: fullBodyStorageUrl,
      })
      .select()
      .single();

    if (modelError) throw modelError;

    // 5. Deduct credits (50 Credits for AI Influencer Create)
    const { error: creditError } = await supabase
      .from('users')
      .update({ credits: Math.max(0, currentCredits - 50) })
      .eq('id', user.id);

    if (creditError) console.error("Failed to deduct credits:", creditError);

    revalidatePath('/dashboard/models');

    return { success: true, model };
  } catch (error: any) {
    console.error("Error in createInfluencer action:", error);
    return { success: false, error: error.message };
  }
}

export async function createPost(data: PostData) {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // 1. Fetch user data (credits & subscription tier)
    const { data: userData } = await supabase
      .from('users')
      .select('credits, subscription_tier')
      .eq('id', user.id)
      .single();

    const currentCredits = userData?.credits ?? 0;
    const currentTier = userData?.subscription_tier || 'free';

    // 2. Validate credits
    if (currentCredits < 20) {
      throw new Error("Insufficient credits. You need at least 20 credits to create a post. Please purchase a subscription under Settings.");
    }

    // 3. Parse prompt to see if scheduling is requested
    let isScheduling = false;
    let parsedPrompt: any = null;
    try {
      if (data.prompt && data.prompt.startsWith("{")) {
        parsedPrompt = JSON.parse(data.prompt);
        isScheduling = parsedPrompt.status === "scheduled";
      }
    } catch (e) {}

    // 4. Enforce "5 Max Autopost schedule at one time" for Free users
    if (isScheduling && currentTier === 'free') {
      const { data: userPosts } = await supabase
        .from('posts')
        .select('prompt')
        .eq('user_id', user.id);

      let scheduledCount = 0;
      if (userPosts) {
        for (const p of userPosts) {
          try {
            if (p.prompt && p.prompt.startsWith('{')) {
              const parsed = JSON.parse(p.prompt);
              if (parsed.status === 'scheduled') {
                scheduledCount++;
              }
            }
          } catch (e) {}
        }
      }

      if (scheduledCount >= 5) {
        throw new Error("Free users can schedule up to 5 posts at a time. Please upgrade your subscription plan under Settings to schedule unlimited posts.");
      }
    }

    // 5. Download image
    const imageBuffer = await downloadImage(data.image_url);

    // 6. Upload to Supabase Storage
    const timestamp = Date.now();
    const imagePath = `${user.id}/posts/${timestamp}.jpg`;

    const storageUrl = await uploadToStorage(supabase, imageBuffer, imagePath);

    // 7. Save to database
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        model_id: data.model_id,
        prompt: data.prompt,
        image_url: storageUrl,
        aspect_ratio: data.aspect_ratio,
      })
      .select()
      .single();

    if (postError) throw postError;

    // Intercept: Zernio API scheduling integration
    try {
      if (post.prompt && post.prompt.startsWith("{")) {
        const parsed = JSON.parse(post.prompt);
        if (parsed.status === "scheduled") {
          const { schedulePostToZernio } = await import("./social");
          const zernioRes = await schedulePostToZernio({
            userId: user.id,
            postId: post.id,
            platform: parsed.platform || "instagram",
            content: parsed.caption || parsed.campaignName || "",
            imageUrl: storageUrl,
            scheduledAt: parsed.scheduledAt,
            publishNow: parsed.publishOption === "now"
          });
          console.log(`[Zernio Integration] CreatePost Scheduling Result:`, zernioRes);
        }
      }
    } catch (zernioError) {
      console.error("[Zernio Integration] Error during post scheduling intercept:", zernioError);
    }

    // 8. Deduct credits (20 Credits to Create New Post)
    const { error: creditError } = await supabase
      .from('users')
      .update({ credits: Math.max(0, currentCredits - 20) })
      .eq('id', user.id);

    if (creditError) console.error("Failed to deduct credits:", creditError);

    revalidatePath('/dashboard/generator');
    revalidatePath('/dashboard');

    return { success: true, post };
  } catch (error: any) {
    console.error("Error in createPost action:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteInfluencer(modelId: string) {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from('models')
      .delete()
      .eq('id', modelId)
      .eq('user_id', user.id);

    if (error) throw error;

    revalidatePath('/dashboard/models');
    revalidatePath('/dashboard');

    return { success: true };
  } catch (error: any) {
    console.error("Error in deleteInfluencer action:", error);
    return { success: false, error: error.message };
  }
}

export async function uploadReferenceImage(base64Image: string) {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Convert base64 to buffer
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');

    const timestamp = Date.now();
    const fileName = `${user.id}/refs/${timestamp}.jpg`;

    const storageUrl = await uploadToStorage(supabase, buffer, fileName);

    return { success: true, url: storageUrl };
  } catch (error: any) {
    console.error("Error uploading reference image:", error);
    return { success: false, error: error.message };
  }
}

export async function updatePostPrompt(postId: string, newPrompt: string) {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: post, error } = await supabase
      .from('posts')
      .update({ prompt: newPrompt })
      .eq('id', postId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    // Intercept: Zernio API scheduling integration
    try {
      if (post.prompt && post.prompt.startsWith("{")) {
        const parsedPrompt = JSON.parse(post.prompt);
        if (parsedPrompt.status === "scheduled") {
          const { schedulePostToZernio } = await import("./social");
          const zernioRes = await schedulePostToZernio({
            userId: user.id,
            postId: post.id,
            platform: parsedPrompt.platform || "instagram",
            content: parsedPrompt.caption || parsedPrompt.campaignName || "",
            imageUrl: post.image_url,
            scheduledAt: parsedPrompt.scheduledAt,
            publishNow: parsedPrompt.publishOption === "now"
          });
          console.log(`[Zernio Integration] UpdatePostPrompt Scheduling Result:`, zernioRes);
        }
      }
    } catch (zernioError) {
      console.error("[Zernio Integration] Error during post scheduling intercept:", zernioError);
    }

    revalidatePath('/dashboard/models');
    revalidatePath('/dashboard');

    return { success: true, post };
  } catch (error: any) {
    console.error("Error in updatePostPrompt action:", error);
    return { success: false, error: error.message };
  }
}

export async function deletePost(postId: string) {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', user.id);

    if (error) throw error;

    revalidatePath('/dashboard/models');
    revalidatePath('/dashboard');

    return { success: true };
  } catch (error: any) {
    console.error("Error in deletePost action:", error);
    return { success: false, error: error.message };
  }
}

export async function add5000Credits() {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: userData } = await supabase
      .from('users')
      .select('credits')
      .eq('id', user.id)
      .single();

    const currentCredits = userData?.credits || 0;
    const { error } = await supabase
      .from('users')
      .update({ credits: currentCredits + 5000 })
      .eq('id', user.id);

    if (error) throw error;

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/generator');
    return { success: true, newCredits: currentCredits + 5000 };
  } catch (error: any) {
    console.error("Error in add5000Credits action:", error);
    return { success: false, error: error.message };
  }
}

