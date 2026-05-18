import { client } from "@gradio/client";

async function main() {
  try {
    const app = await client("black-forest-labs/FLUX.1-schnell");
    console.log(JSON.stringify(app.view_api(), null, 2));
  } catch (e) {
    console.error("schnell failed", e);
  }
}
main();
