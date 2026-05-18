const Luma = require('luma-agents');
const client = new Luma({ apiKey: process.env.LUMA_AGENTS_API_KEY });

async function main() {
  const params = {
    prompt: "A photo of a character holding a product",
    model: "uni-1",
    character_ref: {
      identity0: {
        images: ["https://images.unsplash.com/photo-1534528741775-53994a69daeb"]
      }
    },
    style_ref: [
      { url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30" }
    ]
  };
  
  console.log("Sending params:", JSON.stringify(params, null, 2));
  
  try {
    const response = await client.generations.create(params);
    console.log("Success:", response.id);
  } catch (e) {
    console.error("Error:", e.message);
  }
}
main();
