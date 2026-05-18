export default function Pricing() {
  const plans = [
    {
      name: "Starter",
      price: "$29",
      description: "Perfect for exploring AI influencer generation.",
      features: ["1 AI Persona", "50 Image Generations/mo", "Basic Scheduling (1 platform)", "Standard Support"],
      isPopular: false,
    },
    {
      name: "Professional",
      price: "$99",
      description: "Everything you need to run a full AI influencer.",
      features: ["3 AI Personas", "Unlimited Image Generations", "Advanced Auto-Scheduler (3 platforms)", "Video Generation (30 mins/mo)", "Priority Support"],
      isPopular: true,
    },
    {
      name: "Agency",
      price: "$299",
      description: "For managing multiple influencers at scale.",
      features: ["10 AI Personas", "Unlimited Images & Videos", "Omnichannel Auto-Scheduler", "API Access", "Custom Voice Cloning", "24/7 Dedicated Support"],
      isPopular: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px] -z-10" />
      
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Simple, transparent <span className="text-gradient">pricing</span></h2>
          <p className="text-white/60 text-lg">Scale your AI influencer empire without breaking the bank.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-center max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <div key={i} className={`relative glass rounded-3xl p-8 border ${plan.isPopular ? 'border-primary shadow-[0_0_30px_rgba(139,92,246,0.1)] transform md:-translate-y-4' : 'border-white/10'}`}>
              {plan.isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-primary to-secondary rounded-full text-xs font-bold uppercase tracking-wider">
                  Most Popular
                </div>
              )}
              
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <p className="text-white/50 text-sm mb-6">{plan.description}</p>
              
              <div className="mb-6">
                <span className="text-5xl font-bold">{plan.price}</span>
                <span className="text-white/50">/mo</span>
              </div>
              
              <button className={`w-full py-3 rounded-full font-bold mb-8 transition-all ${plan.isPopular ? 'bg-white text-background hover:bg-white/90' : 'bg-white/10 hover:bg-white/20'}`}>
                Get Started
              </button>
              
              <ul className="space-y-4">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm text-white/80">
                    <span className="text-primary">✓</span> {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
