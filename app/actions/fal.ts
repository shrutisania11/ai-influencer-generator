"use server";

import { fal } from "@fal-ai/client";

export async function generateWithFal(
  prompt: string,
  characterUrl?: string,
  productUrl?: string,
  width: number = 1024,
  height: number = 1024
) {
  try {
    // Use user-provided FAL_KEY from env, or fallback to the hardcoded default
    const falKey = process.env.FAL_KEY || "8ce30e6a-76fb-4c48-9590-f13dcf2f8e7c:bef2de46439db2c36f9f2a42f089150c";
    fal.config({
      credentials: falKey,
    });

    console.log("Connecting to Fal.ai (Flux)...");

    // Case 1: If we only have a product, we use general image-to-image to preserve the product details
    if (!characterUrl && productUrl) {
      const result: any = await fal.subscribe("fal-ai/flux/dev/image-to-image", {
        input: {
          prompt,
          image_url: productUrl,
          strength: 0.85, // 85% new generation, 15% original product structure
        },
      });
      return { success: true, imageUrl: result.images[0].url };
    }

    // Case 2: If we have a character reference, we use PuLID to ensure precise facial consistency
    if (characterUrl) {
      const result: any = await fal.subscribe("fal-ai/flux-pulid", {
        input: {
          prompt,
          reference_image_url: characterUrl,
          image_size: { width, height },
          num_inference_steps: 45, // Boosted steps for maximum texture clarity and details
          guidance_scale: 5.5,     // Boosted scale to strictly guide the model to match LLaVA's product description
          id_weight: 1.25          // Heightened character likeness/consistency multiplier
        },
      });

      if (!result || !result.images || !result.images[0]) {
        throw new Error("Failed to generate image from Fal.ai PuLID");
      }

      return {
        success: true,
        imageUrl: result.images[0].url
      };
    }

    // Case 3: If no character is provided, use standard high-fidelity Flux Dev
    const result: any = await fal.subscribe("fal-ai/flux/dev", {
      input: {
        prompt,
        image_size: { width, height },
        num_inference_steps: 28,
        guidance_scale: 3.5,
      },
    });

    if (!result || !result.images || !result.images[0]) {
      throw new Error("Failed to generate standard image from Fal.ai Flux Dev");
    }

    return {
      success: true,
      imageUrl: result.images[0].url
    };

  } catch (error: any) {
    console.error("Fal Error:", error);
    return { success: false, error: error.message };
  }
}

export async function describeProductImage(imageUrl: string): Promise<string> {
  try {
    const falKey = process.env.FAL_KEY || "8ce30e6a-76fb-4c48-9590-f13dcf2f8e7c:bef2de46439db2c36f9f2a42f089150c";
    fal.config({
      credentials: falKey,
    });

    console.log("Analyzing product image with LLaVA...");
    const result: any = await fal.subscribe("fal-ai/llava-next", {
      input: {
        image_url: imageUrl,
        prompt: "Describe the object or product in this image in extremely precise visual details: its shape, colors, material texture, and key features. Keep the description under 1-2 sentences, focusing only on visual appearance so a text-to-image model can replicate it perfectly.",
      },
    });

    if (result && result.output) {
      console.log("Product Analysis Complete:", result.output);
      return result.output.trim();
    }
    return "";
  } catch (error) {
    console.error("LLaVA Analysis Error:", error);
    return "";
  }
}
