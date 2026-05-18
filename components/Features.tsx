export default function Features() {
  const features = [
    {
      title: "Hyper-Realistic AI Personas",
      description: "Generate consistent, photorealistic images of your AI influencer in various outfits, locations, and poses.",
      icon: "🧑‍🎤",
    },
    {
      title: "Automated Content Calendar",
      description: "Set your strategy once and let our AI generate, schedule, and post content across Instagram, TikTok, and X.",
      icon: "🗓️",
    },
    {
      title: "Voice & Video Cloning",
      description: "Bring your persona to life with synthetic voice generation and lip-synced video capabilities for Reels and TikToks.",
      icon: "🎙️",
    },
    {
      title: "Engagement Analytics",
      description: "Track performance, audience growth, and engagement metrics in real-time with our comprehensive dashboard.",
      icon: "📈",
    },
    {
      title: "Brand Deal Management",
      description: "Automatically filter and respond to collaboration requests, and generate branded content seamlessly.",
      icon: "🤝",
    },
    {
      title: "Trend Detection",
      description: "Our AI monitors viral trends and automatically suggests or creates content to capitalize on current algorithms.",
      icon: "🔥",
    },
  ];

  return (
    <section id="features" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Everything you need to <span className="text-gradient">go viral</span></h2>
          <p className="text-white/60 text-lg">Replace an entire creative agency with our all-in-one AI influencer platform. From generation to monetization.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div key={i} className="glass p-8 rounded-3xl border border-white/5 hover:border-white/20 transition-all hover:-translate-y-1 group">
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-2xl mb-6 group-hover:scale-110 group-hover:bg-primary/20 transition-all">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-white/50 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
