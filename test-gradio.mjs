import { client } from "@gradio/client";

async function main() {
  const app = await client("yanze/PuLID-FLUX");
  const apiInfo = app.view_api();
  console.log(JSON.stringify(apiInfo, null, 2));
}
main();
