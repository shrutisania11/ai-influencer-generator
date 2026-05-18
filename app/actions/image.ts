"use server";

import { createClient } from "@/utils/supabase/server";

/**
 * Generates an image using Pollinations.ai (Free service)
 */
export async function generateImage(prompt: string, width: number = 1024, height: number = 1024) {
  try {
    // Pollinations.ai uses a simple URL-based generation
    // We'll use a random seed to ensure unique generations
    const seed = Math.floor(Math.random() * 1000000);
    const encodedPrompt = encodeURIComponent(prompt);
    
    // Construct the URL
    // Model 'flux' is currently one of the best available on Pollinations
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&model=flux&nologo=true`;

    // With Pollinations, we don't actually "wait" for a generation ID. 
    // The image is generated when the URL is accessed.
    // However, to verify it works, we can do a quick fetch
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error("Failed to generate image from Pollinations");
    }

    // We return the URL directly
    return { 
      success: true, 
      imageUrl: imageUrl,
      generation: { id: `poll_${seed}`, state: "completed" } 
    };
  } catch (error: any) {
    console.error("Image Generation Error:", error);
    return { success: false, error: error.message };
  }
}
