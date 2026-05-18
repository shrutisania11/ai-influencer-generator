"use server";

export async function generateCaptionAction({
  campaignName,
  productName,
  goal,
  tone,
  platform,
  language
}: {
  campaignName: string;
  productName: string;
  goal: string;
  tone: string;
  platform: string;
  language: string;
}) {
  // Simulate AI generation with templates
  const templates: Record<string, string[]> = {
    Professional: [
      "Introducing the new {productName} from our {campaignName} campaign. Designed for those who value excellence. {cta}",
      "We are proud to unveil {productName}. Elevating standards in {campaignName}. Discover the difference today. {cta}",
      "Efficiency meets innovation with {productName}. Part of the {campaignName} series. {cta}"
    ],
    Casual: [
      "Obsessed with the new {productName}! ✨ The {campaignName} vibes are real. What do you think? {cta}",
      "Finally got my hands on {productName} from {campaignName}. Total game changer! 🙌 {cta}",
      "Just another day with my favorite {productName}. Can't get enough of this {campaignName} look! {cta}"
    ],
    Witty: [
      "I told {productName} I needed space, but it's part of the {campaignName} campaign, so here we are. 🤷‍♂️ {cta}",
      "If you're looking for a sign to get {productName}, this is it. (And the {campaignName} lighting helps too) 😉 {cta}",
      "My {productName} is cooler than your {productName}. Sorry, I don't make the {campaignName} rules. 💅 {cta}"
    ],
    Luxury: [
      "The epitome of elegance: {productName}. Experience the {campaignName} collection. {cta}",
      "Refined. Timeless. {productName}. A new chapter in {campaignName} luxury. {cta}",
      "Indulge in the extraordinary with {productName} from the {campaignName} selection. {cta}"
    ],
    Energetic: [
      "GET READY! {productName} is HERE! 🔥 The {campaignName} launch is going to be HUGE! {cta}",
      "LFG! {productName} just dropped as part of {campaignName}. Don't miss out! 🚀 {cta}",
      "ENERGY IS HIGH! ⚡️ Testing out the new {productName} from {campaignName}. Let's go! {cta}"
    ],
    Friendly: [
      "Hey friends! So excited to show you {productName} from the {campaignName} campaign. Hope you love it! ❤️ {cta}",
      "Sharing a little {campaignName} magic today with {productName}. How's everyone's week going? 😊 {cta}",
      "Can't wait for you guys to try {productName}! It's my favorite part of {campaignName}. {cta}"
    ]
  };

  const selectedTemplates = templates[tone] || templates.Casual;
  const template = selectedTemplates[Math.floor(Math.random() * selectedTemplates.length)];

  let caption = template
    .replace("{productName}", productName || "this amazing product")
    .replace("{campaignName}", campaignName || "our latest launch");

  const hashtags: Record<string, string[]> = {
    instagram: ["#AI", "#Influencer", "#Lifestyle", "#Tech", "#Growth"],
    tiktok: ["#FYP", "#Trending", "#AIModel", "#Viral", "#NewTech"],
    x: ["#Breaking", "#Innovation", "#AI", "#Future"],
    linkedin: ["#Professional", "#Networking", "#Innovation", "#B2B"],
    pinterest: ["#Inspiration", "#Aesthetic", "#Design", "#Style"],
    facebook: ["#Community", "#Update", "#Innovation", "#AI"]
  };

  const platformHashtags = hashtags[platform] || hashtags.instagram;
  const selectedHashtags = platformHashtags.slice(0, 3).join(" ");

  return {
    success: true,
    caption: `${caption}\n\n${selectedHashtags}`
  };
}
