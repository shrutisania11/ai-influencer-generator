"use server";

import Luma from "luma-agents";
import { createClient } from "@/utils/supabase/server";

// Use API key from environment variables
const API_KEY = process.env.LUMA_AGENTS_API_KEY;

const client = new Luma({
  apiKey: API_KEY || "",
} as any);

export async function createLumaGeneration(
  prompt: string, 
  aspectRatio: "1:1" | "16:9" | "9:16" | "4:3" | "3:4" = "1:1",
  characterUrls: string[] = [],
  styleUrls: string[] = []
) {
  try {
    const isMockEnabled = process.env.ENABLE_MOCK_GENERATION === "true";

    if (!API_KEY && !isMockEnabled) {
      throw new Error("LUMA_AGENTS_API_KEY is not configured");
    }

    // Prepare parameters for Uni-1
    const params: any = {
      prompt,
      aspect_ratio: aspectRatio,
      model: "uni-1", // Explicitly specify the high-quality model
    };

    // Use specific character and style references for Uni-1 model
    if (characterUrls.length > 0) {
      params.character_ref = {
        identity0: {
          images: characterUrls
        }
      };
    }

    if (styleUrls.length > 0) {
      params.style_ref = styleUrls.map(url => ({ url }));
    }

    try {
      // @ts-ignore
      const generation = await client.generations.create(params);
      return { success: true, generation };
    } catch (apiError: any) {
      console.error("Luma API Error:", apiError);
      
      if (apiError.message?.includes("402") || apiError.message?.includes("Insufficient credits")) {
        if (isMockEnabled) {
          console.log("Credits exhausted. Falling back to Mock Generation.");
          const mockRef = characterUrls[0] || styleUrls[0] || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1000";
          const encoded = Buffer.from(mockRef).toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
          const mockId = `mock_${encoded.substring(0, 100)}`;
          
          return { 
            success: true, 
            isMock: true,
            generation: {
              id: mockId,
              state: "completed",
              output: [{ url: mockRef }]
            }
          };
        }
        return { success: false, error: "Luma API credits exhausted. Please top up your account.", code: "INSUFFICIENT_CREDITS" };
      }
      throw apiError;
    }
  } catch (error: any) {
    console.error("Luma Generation Error:", error);
    return { success: false, error: error.message };
  }
}

export async function getLumaGeneration(id: string) {
  try {
    if (id.startsWith("mock_")) {
      let mockUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1000";
      
      try {
        const encoded = id.replace("mock_", "").replace(/_/g, '/').replace(/-/g, '+');
        // We can't perfectly decode if it was truncated, so we'll just check if it looks like a URL
        const decoded = Buffer.from(encoded, 'base64').toString();
        if (decoded.startsWith('http')) {
          mockUrl = decoded;
        }
      } catch (e) {
        // Fallback to default
      }
      
      return { 
        success: true, 
        generation: {
          id,
          state: "completed",
          output: [{ url: mockUrl }]
        } 
      };
    }

    const generation = await client.generations.get(id);
    return { success: true, generation };
  } catch (error: any) {
    console.error("Luma Get Generation Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * High-level function to generate an image and wait for it to complete
 */
export async function generateLumaImage(
  prompt: string,
  aspectRatio: "1:1" | "16:9" | "9:16" | "4:3" | "3:4" = "1:1",
  characterUrls: string[] = [],
  styleUrls: string[] = []
) {
  try {
    const res = await createLumaGeneration(prompt, aspectRatio, characterUrls, styleUrls);
    
    if (!res.success) return res;
    if (res.isMock) return { success: true, imageUrl: res.generation?.output?.[0]?.url };

    if (!res.generation) {
      return { success: false, error: "Luma generation response was malformed." };
    }

    let attempts = 0;
    const maxAttempts = 60; // 2 minutes max

    while (attempts < maxAttempts) {
      const check = await getLumaGeneration(res.generation.id);
      if (check.success && check.generation && check.generation.state === "completed") {
        return { 
          success: true, 
          imageUrl: check.generation.output?.[0]?.url,
          generation: check.generation
        };
      }
      if (check.success && check.generation && check.generation.state === "failed") {
        return { success: false, error: "Luma generation failed" };
      }
      
      // Wait 2 seconds between polls
      await new Promise(r => setTimeout(r, 2000));
      attempts++;
    }

    return { success: false, error: "Luma generation timed out" };
  } catch (error: any) {
    console.error("Generate Luma Image Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Helper to add credits for testing
 */
export async function addUserCredits(amount: number = 5000) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { success: false, error: "Not authenticated" };

  // Get current credits first
  const { data: userData } = await supabase
    .from('users')
    .select('credits')
    .eq('id', user.id)
    .single();

  const currentCredits = userData?.credits || 0;

  const { error } = await supabase
    .from('users')
    .update({ credits: currentCredits + amount })
    .eq('id', user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
