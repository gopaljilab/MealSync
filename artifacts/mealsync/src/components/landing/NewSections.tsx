import { useState } from "react";
import { 
  SectionContainer, 
  SectionHeading, 
  GlassCard, 
  BentoGrid, 
  BentoCard, 
  AnimatedCounter,
  StatusBadge,
  DashboardCard
} from "../ui/premium";
import { Search, MapPin, CheckCircle2, ChevronDown, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { transitionEase } from "@/lib/motion";

// --- How It Works ---
export const HowItWorks = () => {
  const steps = [
    {
      icon: Search,
      stepNum: "01",
      title: "Detect Surplus",
      description: "MealSync core intelligence monitors PG dining logs and resident attendances to predict excess portions before kitchen shifts end.",
      span: "md:col-span-1"
    },
    {
      icon: MapPin,
      stepNum: "02",
      title: "Smart Matching",
      description: "Our matching engine pairs the verified leftover volume with nearby certified food banks and shelters in real time.",
      span: "md:col-span-1"
    },
    {
      icon: CheckCircle2,
      stepNum: "03",
      title: "Secure Collection",
      description: "NGO partners execute contactless, temperature-monitored collections, documenting safety logs and digital receipts.",
      span: "md:col-span-1"
    }
  ];

  return (
    <SectionContainer className="relative z-10 border-t border-black/5 dark:border-white/5">
      <SectionHeading 
        title="Seamless Operational Flow" 
        subtitle="Eliminate waste automatically through simple, secure, and fully traced steps." 
        centered 
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((step, i) => (
          <BentoCard key={i} className={cn("group min-h-[280px] p-8", step.span)}>
            <div className="flex flex-col h-full justify-between">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <step.icon size={20} className="text-primary" />
                </div>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{step.stepNum}</span>
              </div>
              <div className="mt-8">
                <h3 className="text-xl font-black mb-2 tracking-tight">{step.title}</h3>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed">{step.description}</p>
              </div>
            </div>
          </BentoCard>
        ))}
      </div>
    </SectionContainer>
  );
};

// --- Interactive Impact Calculator ---
export const ImpactCalculator = () => {
  const [residents, setResidents] = useState(150);

  // Constants aligned with Stripe/Linear luxury calculator feeling
  // 1 resident confirms dinner -> average saving 0.1 meals/day
  // 30 days/month
  const mealsPerMonth = Math.floor(residents * 0.1 * 30);
  const co2Reduction = (mealsPerMonth * 0.5).toFixed(0);
  const value = mealsPerMonth * 40;

  return (
    <SectionContainer dense className="relative z-10">
      <GlassCard className="max-w-5xl mx-auto overflow-hidden border border-black/5 dark:border-white/5 p-8 md:p-12 relative">
        {/* Subtle mesh background element */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="grid lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-5 space-y-6">
            <StatusBadge status="Impact Estimator" />
            <h2 className="text-3xl md:text-4xl font-black leading-[1.1] tracking-tighter">Scale Your PG's <br />Green Score.</h2>
            <p className="text-muted-foreground text-sm font-medium leading-relaxed">
              Slide the cursor to define your total PG or hostel capacity and view estimated carbon and cost benefits generated monthly.
            </p>
            
            <div className="pt-4 space-y-3">
              <div className="flex justify-between items-baseline">
                <label className="font-black text-[9px] uppercase tracking-widest text-primary">PG Residents</label>
                <span className="font-black text-3xl text-primary tracking-tighter">{residents}</span>
              </div>
              <input 
                type="range" 
                min="50" 
                max="1000" 
                step="50"
                value={residents}
                onChange={(e) => setResidents(parseInt(e.target.value))}
                className="w-full h-1 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-2 gap-4">
            <DashboardCard 
              title="Meals Saved / Month" 
              value={<AnimatedCounter value={mealsPerMonth} />}
              delta="Processing"
              deltaType="success"
              subtext="Donated to local shelters"
            />
            <DashboardCard 
              title="CO₂ Prevention" 
              value={<><AnimatedCounter value={parseInt(co2Reduction)} />kg</>}
              delta="Active"
              deltaType="success"
              subtext="Equivalent to 23 trees"
            />
            <DashboardCard 
              title="Grocery Cost Recovered" 
              value={<>₹{(value).toLocaleString()}</>}
              delta="Optimized"
              deltaType="success"
              subtext="Waste-to-cost valuation"
            />
            <DashboardCard 
              title="Global Green Rank" 
              value="Tier A"
              delta="Top 5%"
              deltaType="neutral"
              subtext="Verified community score"
            />
          </div>
        </div>
      </GlassCard>
    </SectionContainer>
  );
};

// --- Trust & Partners ---
export const TrustAndPartners = () => {
  return (
    <SectionContainer dense className="border-t border-b border-black/5 dark:border-white/5 py-16 bg-white/[0.005]">
      <div className="text-center mb-10">
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-40">STRATEGIC REDISTRIBUTION PARTNERS</span>
      </div>
      
      {/* Premium Grayscale Marquee */}
      <div className="flex justify-center flex-wrap gap-12 md:gap-20 items-center px-4 opacity-40 grayscale contrast-125 dark:opacity-30">
        {['Horizon Food', 'GreenNest PG', 'Care Foundation', 'FoodPlus NGO', 'EcoSave Network'].map((partner, i) => (
          <div key={i} className="text-lg md:text-xl font-black tracking-tighter flex items-center gap-2 hover:opacity-100 transition-opacity duration-300 select-none">
            <div className="w-5 h-5 bg-foreground rounded-md flex items-center justify-center">
              <Award size={10} className="text-background" />
            </div>
            {partner}
          </div>
        ))}
      </div>
    </SectionContainer>
  );
};

// --- FAQ Section ---
export const FAQSection = () => {
  const faqs = [
    {
      q: "How does MealSync ensure food safety standards?",
      a: "Shared-living kitchens document exact preparation timestamps and refrigeration statuses. NGO collection schedules are algorithmically locked within a strict 3-hour consumption window, maintaining comprehensive compliance tracking."
    },
    {
      q: "Are redistribution NGOs thoroughly vetted?",
      a: "Yes. Every NGO on our network completes a detailed government registration audit, safe-handling assessment, and digital verification process before receiving active pickup request feeds."
    },
    {
      q: "How are logistics and routes calculated?",
      a: "MealSync handles intelligent notifications automatically. NGOs access real-time dashboard feeds mapping precise locations, suggested pickup route sequencing, and item weights to minimize transit overhead."
    },
    {
      q: "Is there a subscription fee for PG kitchens?",
      a: "MealSync operates free of cost for strategic communities and NGOs as part of our core mission to establish carbon-neutral food supply workflows."
    }
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <SectionContainer className="relative z-10 border-t border-black/5 dark:border-white/5">
      <SectionHeading 
        title="Frequently Answered Inquiries" 
        centered 
      />
      <div className="max-w-3xl mx-auto space-y-4">
        {faqs.map((faq, i) => {
          const isOpen = openIndex === i;
          return (
            <div 
              key={i} 
              className={cn(
                "border border-black/5 dark:border-white/5 bg-white/40 dark:bg-zinc-950/20 backdrop-blur-md rounded-2xl overflow-hidden transition-all duration-300 hover:border-primary/20 cursor-pointer",
                isOpen && "border-primary/20 shadow-lg shadow-primary/[0.02]"
              )}
              onClick={() => setOpenIndex(isOpen ? null : i)}
              role="button"
              aria-expanded={isOpen}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setOpenIndex(isOpen ? null : i);
                }
              }}
            >
              <div className="flex justify-between items-center p-6 select-none">
                <h4 className="font-bold text-base md:text-lg tracking-tight text-foreground">{faq.q}</h4>
                <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center text-muted-foreground group-hover:text-foreground shrink-0 transition-colors">
                  <ChevronDown 
                    size={16}
                    className={cn("transition-transform duration-300", isOpen && "rotate-180 text-primary")} 
                  />
                </div>
              </div>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={transitionEase}
                  >
                    <div className="px-6 pb-6 text-sm text-muted-foreground font-medium leading-relaxed max-w-2xl">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </SectionContainer>
  );
};
