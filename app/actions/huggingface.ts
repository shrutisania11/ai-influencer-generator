"use server";

import { client } from "@gradio/client";

/**
 * Generates an image using a public Hugging Face Space via Gradio.
 * This uses a PuLID-FLUX space for character face consistency.
 */
export async function generateWithHuggingFace(
  prompt: string,
  characterUrl?: string,
  width: number = 1024,
  height: number = 1024
) {
  try {
    console.log("Connecting to Hugging Face Space (PuLID-FLUX)...");
    
    // We connect to a popular face-consistency space. 
    // Note: Public spaces can sometimes be busy or paused.
    const app = await client("yanze/PuLID-FLUX");
    
    // Convert character URL to a format Gradio accepts if provided
    let imageInput = null;
    if (characterUrl) {
      // In Gradio, we usually pass the URL directly or download it as a blob
      const res = await fetch(characterUrl);
      const blob = await res.blob();
      imageInput = blob;
    }

    // Call the predict endpoint
    // The exact endpoint and parameters depend on the specific space's API.
    // This is a generalized structure for PuLID spaces:
    const result: any = await app.predict("/predict", [
      prompt, // prompt
      imageInput, // face image
      width,
      height,
      4, // num inference steps
      3, // guidance scale
      1, // id scale (how strong the face is)
    ]);

    if (!result || !result.data) {
      throw new Error("Failed to generate image from Hugging Face Space");
    }

    return {
      success: true,
      // Gradio returns a URL or a base64 string depending on the space
      imageUrl: result.data[0]?.url || result.data[0]
    };

  } catch (error: any) {
    console.error("Hugging Face Error:", error);
    return { success: false, error: "Hugging Face Space is currently busy, paused, or the API structure changed. Try again later or use the fallback." };
  }
}
