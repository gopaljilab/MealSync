import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/ui/Logo";
import {
  ArrowRight,
  ShieldCheck,
  Users,
  Building2,
  HeartHandshake,
  TrendingDown,
  Truck,
  Leaf,
  Star,
  Zap,
  Bell,
  LineChart,
  User,
} from "lucide-react";
import Hero3D from "@/components/Hero3D";
import { useEffect, useState } from "react";
import { initHeroAnimations } from "@/animations/heroAnimations";
import { initScrollReveal } from "@/animations/scrollAnimations";
import { initCounterAnimations } from "@/animations/counterAnimations";
import { 
  SectionContainer, 
  SectionHeading, 
  GlassCard, 
  BentoGrid, 
  BentoCard, 
  GlowButton, 
  AnimatedCounter,
  DashboardCard,
  StatusBadge
} from "@/components/ui/premium";
import { HowItWorks, ImpactCalculator, TrustAndPartners, FAQSection } from "@/components/landing/NewSections";

const ActivityTicker = () => {
  const activities = [
    "Sunrise PG shared 24 meals",
    "NGO Care collected surplus from GreenNest",
    "12kg food waste prevented today",
    "Healthy Bites processed 15 meals",
    "Community Kitchen active in NGO network",
    "New NGO 'Food For All' confirmed",
    "Analytics: 15% reduction in PG waste"
  ];

  return (
    <div className="w-full overflow-hidden whitespace-nowrap relative z-10 py-6">
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-20" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-20" />
      
      <div className="flex animate-scroll items-center gap-6 px-4 hover:[animation-play-state:paused]">
        {[...activities, ...activities].map((text, i) => (
          <div 
            key={i} 
            className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 dark:bg-zinc-950/30 backdrop-blur-md border border-black/5 dark:border-white/5 shadow-[0_0_15px_rgba(16,185,129,0.02)] transition-colors cursor-default"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-ring shrink-0" />
            <span className="text-xs font-bold tracking-wide text-foreground/80">{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const SocialProof = () => (
  <div className="flex items-center gap-4 hero-social bg-white/5 dark:bg-zinc-950/20 border border-black/5 dark:border-white/5 py-2 px-4 rounded-full w-fit backdrop-blur-md">
    <div className="flex -space-x-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="w-8 h-8 rounded-full border-2 border-background overflow-hidden bg-muted">
          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 20}`} alt="User" />
        </div>
      ))}
    </div>
    <div className="flex flex-col">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star key={s} size={10} className="fill-primary text-primary" />
        ))}
      </div>
      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground leading-none mt-1">
        500+ PGs reducing waste
      </span>
    </div>
  </div>
);

const Sparkline = () => (
  <div className="flex items-end gap-1 h-8 w-24">
    {[40, 70, 45, 90, 65, 85, 100].map((h, i) => (
      <div
        key={i}
        style={{ height: `${h}%` }}
        className="w-full bg-primary/30 rounded-t-sm"
      />
    ))}
  </div>
);

const CaseStudySection = () => {
  return (
    <SectionContainer className="relative z-10 border-t border-black/5 dark:border-white/5">
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-80 h-80 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="grid lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-6">
          <StatusBadge status="Confirmed Case Study" />
          <h3 className="text-3xl md:text-5xl font-black tracking-tighter leading-[1.1]">
            How Sunrise PG Saved 12,000+ Meals
          </h3>
          <blockquote className="border-l-2 border-primary pl-6 text-lg md:text-xl text-muted-foreground italic font-medium leading-relaxed">
            "MealSync completely transformed our kitchen operations. By predicting meal attendance accurately, we cut food waste by 45% and saved over ₹30,000 in monthly groceries."
            <cite className="block text-sm font-bold text-foreground not-italic mt-4">— Rajesh Kumar, Owner of Sunrise PG</cite>
          </blockquote>
        </div>
        <div className="lg:col-span-5 grid grid-cols-2 gap-4">
          <DashboardCard title="Meals Saved" value="12,540" delta="-45% Waste" deltaType="success" subtext="In partnership with Care NGO" />
          <DashboardCard title="Carbon Offset" value="6.2 Tons" delta="Verified" deltaType="neutral" subtext="Equivalent to 310 trees" />
          <DashboardCard title="Cost Savings" value="₹2.4L" delta="+18% ROI" deltaType="success" subtext="Groceries & logistics" />
          <DashboardCard title="Efficiency" value="94.8%" delta="Active" deltaType="success" subtext="Predictive accuracy" />
        </div>
      </div>
    </SectionContainer>
  );
};

export default function LandingPage() {
  useEffect(() => {
    // Small delay to ensure DOM is fully ready for GSAP
    const timer = setTimeout(() => {
      initHeroAnimations();
      initScrollReveal();
      initCounterAnimations();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary selection:text-primary-foreground mesh-gradient">
      {/* Background Glows */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-primary/[0.02] blur-[120px] rounded-full" 
        />
      </div>

      {/* Hero Section */}
      <section id="home" className="relative pt-36 pb-20 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        <div className="grid lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-7 z-10 space-y-8">
            <div className="flex flex-wrap items-center gap-4 hero-badge">
              <StatusBadge status="Operational Ecosystem" />
              <SocialProof />
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[1.05] hero-title heading-gradient">
              Connecting <br />
              <span className="text-primary shadow-glow">Surplus</span> to Need.
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl font-medium hero-description">
              MealSync is an intelligent food optimization platform connecting shared-living communities and NGOs to eliminate waste through predictive analytics.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 hero-buttons pt-2">
              <Link href="/register">
                <GlowButton size="lg" className="h-14 px-8 text-base rounded-2xl font-bold group bg-primary hover:bg-primary/95 text-primary-foreground border-none">
                  Start Saving Meals
                  <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </GlowButton>
              </Link>
              <Link href="/login">
                <Button variant="ghost" size="lg" className="h-14 px-8 text-base rounded-2xl hover:bg-white/5 backdrop-blur-md transition-all font-bold border border-black/10 dark:border-white/5">
                  Sign In
                </Button>
              </Link>
            </div>

            <div className="pt-8 border-t border-black/5 dark:border-white/5">
              <BentoGrid className="grid-cols-2 md:grid-cols-4 gap-4 stagger-reveal">
                {[
                  { label: "Meals Saved", value: "12540", suffix: "+", icon: HeartHandshake },
                  { label: "Waste Reduced", value: "45", suffix: "%", icon: TrendingDown },
                  { label: "Active NGOs", value: "120", suffix: "+", icon: Users },
                  { label: "Communities", value: "500", suffix: "+", icon: Building2 },
                ].map((stat, i) => (
                  <BentoCard 
                    key={i}
                    className="p-4 group hover:-translate-y-1 hover:border-primary/20 transition-all duration-300"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <stat.icon className="text-primary" size={15} />
                      </div>
                      <div className="text-[9px] uppercase tracking-widest font-black text-muted-foreground">{stat.label}</div>
                    </div>
                    <AnimatedCounter value={parseInt(stat.value)} suffix={stat.suffix} className="text-xl group-hover:text-primary transition-colors font-black" />
                  </BentoCard>
                ))}
              </BentoGrid>
            </div>
          </div>

          <div className="lg:col-span-5 relative flex items-center justify-center hero-3d reveal" data-reveal-direction="scale">
            <Hero3D />
          </div>
        </div>

        <div className="mt-16 -mx-4 md:-mx-8 lg:-mx-12 reveal" data-reveal-direction="up" data-reveal-delay="0.3">
          <ActivityTicker />
        </div>
      </section>

      {/* Tailored for the Ecosystem */}
      <section id="about" className="py-24 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16 reveal" data-reveal-direction="up">
          <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter">Tailored for the Ecosystem</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">One unified, secure platform built for community-level impact.</p>
        </div>

        <Tabs defaultValue="pg-owners" className="w-full reveal" data-reveal-direction="scale">
          <TabsList className="flex justify-center mb-16 bg-transparent gap-4 h-auto flex-wrap">
            {[
              { id: "pg-owners", label: "PG Owners", icon: Building2 },
              { id: "ngos", label: "NGOs", icon: Users },
              { id: "residents", label: "Residents", icon: User }
            ].map((tab) => (
              <TabsTrigger 
                key={tab.id}
                value={tab.id} 
                className="px-6 py-3 rounded-2xl border border-black/5 dark:border-white/5 data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all flex items-center gap-3 font-bold text-sm"
              >
                <tab.icon size={16} />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent value="pg-owners" className="animate-slide-up">
              <div className="grid md:grid-cols-2 gap-16 items-center">
                <div className="space-y-6 reveal" data-reveal-direction="right">
                  <h3 className="text-3xl md:text-4xl font-black leading-tight tracking-tighter">Optimize kitchen efficiency & minimize overhead.</h3>
                  <p className="text-base text-muted-foreground leading-relaxed font-medium">
                    MealSync intelligence predicts resident attendance and surplus availability, helping you save thousands on kitchen inventory every month.
                  </p>
                  <ul className="space-y-4">
                    {[
                      "Real-time surplus detection",
                      "Automated NGO pickup alerts",
                      "Waste analytics & reporting"
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 font-bold text-sm text-foreground/90">
                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <ShieldCheck size={14} />
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="relative group reveal" data-reveal-direction="left">
                  <div className="absolute inset-0 bg-primary/10 blur-[80px] rounded-full group-hover:bg-primary/20 transition-all"></div>
                  <GlassCard className="border border-black/10 dark:border-white/5 overflow-hidden relative z-10 p-8">
                    <div className="flex justify-between items-center mb-8">
                      <div>
                        <div className="text-[10px] uppercase tracking-widest font-black text-primary mb-1">Efficiency Rating</div>
                        <div className="text-3xl font-black tracking-tighter">94.8%</div>
                      </div>
                      <Sparkline />
                    </div>
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <Zap className="text-primary" size={18} />
                          </div>
                          <div>
                            <div className="text-xs font-black">Surplus Detected</div>
                            <div className="text-[10px] text-muted-foreground font-medium">Dinner (24 meals)</div>
                          </div>
                        </div>
                        <Button size="sm" className="bg-primary/10 hover:bg-primary/20 text-primary border-none font-bold px-4 rounded-xl text-xs">Notify NGO</Button>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <Bell className="text-blue-500" size={18} />
                          </div>
                          <div>
                            <div className="text-xs font-black">Pickup Scheduled</div>
                            <div className="text-[10px] text-muted-foreground font-medium">Arriving in 15 mins</div>
                          </div>
                        </div>
                        <span className="text-[9px] uppercase font-black text-blue-400">Processing</span>
                      </div>
                    </div>
                  </GlassCard>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ngos" className="animate-slide-up">
              <div className="grid md:grid-cols-2 gap-16 items-center">
                <div className="relative order-2 md:order-1 group reveal" data-reveal-direction="right">
                  <div className="absolute inset-0 bg-blue-500/10 blur-[80px] rounded-full group-hover:bg-blue-500/20 transition-all"></div>
                  <GlassCard className="border border-blue-500/20 overflow-hidden relative z-10 p-8">
                    <div className="flex justify-between items-center mb-8">
                      <div>
                        <div className="text-[10px] uppercase tracking-widest font-black text-blue-400 mb-1">Impact Tracker</div>
                        <div className="text-3xl font-black tracking-tighter">1,240kg</div>
                      </div>
                      <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                        <LineChart className="text-blue-400" size={18} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-white/5 border border-black/5 dark:border-white/5">
                        <div className="text-[9px] uppercase font-black text-muted-foreground mb-1">Pickups</div>
                        <div className="text-2xl font-black tracking-tighter">42</div>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/5 border border-black/5 dark:border-white/5">
                        <div className="text-[9px] uppercase font-black text-muted-foreground mb-1">Communities</div>
                        <div className="text-2xl font-black tracking-tighter">18</div>
                      </div>
                    </div>
                  </GlassCard>
                </div>
                <div className="space-y-6 order-1 md:order-2 reveal" data-reveal-direction="left">
                  <h3 className="text-3xl md:text-4xl font-black leading-tight tracking-tighter">Scale your redistribution with real-time data.</h3>
                  <p className="text-base text-muted-foreground leading-relaxed font-medium">
                    Stop guessing where the surplus is. MealSync connects you directly to PG kitchens the moment extra food is identified.
                  </p>
                  <ul className="space-y-4">
                    {[
                      "Geographic surplus mapping",
                      "Priority collection alerts",
                      "Impact certification exports"
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 font-bold text-sm text-foreground/90">
                        <div className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                          <Truck size={14} />
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="residents" className="animate-slide-up">
              <div className="grid md:grid-cols-2 gap-16 items-center">
                <div className="space-y-6 reveal" data-reveal-direction="right">
                  <h3 className="text-3xl md:text-4xl font-black leading-tight tracking-tighter">Your choices, global impact.</h3>
                  <p className="text-base text-muted-foreground leading-relaxed font-medium">
                    Personalize your meal preferences and see how your conscious choices contribute to a zero-waste community.
                  </p>
                  <ul className="space-y-4">
                    {[
                      "Daily attendance check-ins",
                      "Meal quality feedback",
                      "Sustainability score tracker"
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 font-bold text-sm text-foreground/90">
                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Leaf size={14} />
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="relative group reveal" data-reveal-direction="left">
                  <div className="absolute inset-0 bg-emerald-500/10 blur-[80px] rounded-full group-hover:bg-emerald-500/20 transition-all"></div>
                  <GlassCard className="border border-black/10 dark:border-white/5 overflow-hidden relative z-10 p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 rounded-full border-2 border-primary/20 overflow-hidden shrink-0">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=John" alt="User" />
                      </div>
                      <div>
                        <div className="text-base font-black tracking-tight">Alex Rivera</div>
                        <div className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Active Contributor</div>
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 flex justify-between items-center">
                      <div>
                        <div className="text-[9px] uppercase font-black text-primary">Meals Saved</div>
                        <div className="text-xl font-black tracking-tighter">124</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] uppercase font-black text-primary">CO2 Offset</div>
                        <div className="text-xl font-black tracking-tighter">18.5kg</div>
                      </div>
                    </div>
                  </GlassCard>
                </div>
              </div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </section>

      <ImpactCalculator />
      <TrustAndPartners />
      <HowItWorks />
      <CaseStudySection />

      {/* Intelligent Ecosystem Visualization */}
      <section className="py-24 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden reveal" data-reveal-direction="up">
        <SectionHeading 
          title={<>Intelligent <span className="text-primary">Ecosystem</span> Flow</>}
          subtitle="Real-time data flow connecting shared kitchens, dynamic routing, and NGOs."
          centered
        />

        <div className="relative h-[480px] w-full flex items-center justify-center mt-12 bg-white/5 dark:bg-zinc-950/20 backdrop-blur-md rounded-[3rem] border border-black/5 dark:border-white/5 p-6 overflow-hidden">
          {/* Background mesh glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-[80px]" />
          
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" viewBox="0 0 1000 480">
            {/* PG to AI */}
            <path d="M 180 240 Q 340 120 500 240" fill="none" stroke="currentColor" className="text-primary" strokeWidth="2.5" strokeDasharray="8 12" />
            {/* AI to NGO */}
            <path d="M 500 240 Q 660 360 820 240" fill="none" stroke="currentColor" className="text-primary" strokeWidth="2.5" strokeDasharray="8 12" />
          </svg>

          {/* Nodes Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 relative z-10 w-full max-w-5xl items-center">
            <div className="flex flex-col items-center gap-4 group">
              <div className="w-20 h-20 rounded-2xl bg-zinc-950/80 border border-white/5 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xl">
                <Building2 size={32} className="text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="text-center">
                <span className="block text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">01</span>
                <span className="text-xs font-bold text-foreground/80">PG Kitchen</span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 animate-float">
              <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-primary to-emerald-600 text-primary-foreground flex items-center justify-center shadow-[0_20px_50px_rgba(16,185,129,0.25)] border border-white/10">
                <Zap size={40} className="animate-pulse" />
              </div>
              <div className="text-center">
                <span className="block text-[9px] font-black uppercase tracking-[0.2em] text-primary mb-1">Core AI</span>
                <span className="text-sm font-black text-primary text-shadow">MealSync Core</span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 group">
              <div className="w-20 h-20 rounded-2xl bg-zinc-950/80 border border-white/5 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xl">
                <Users size={32} className="text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="text-center">
                <span className="block text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">02</span>
                <span className="text-xs font-bold text-foreground/80">NGO Network</span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 group">
              <div className="w-20 h-20 rounded-2xl bg-zinc-950/80 border border-white/5 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xl">
                <HeartHandshake size={32} className="text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="text-center">
                <span className="block text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">03</span>
                <span className="text-xs font-bold text-foreground/80">Impact</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FAQSection />

      {/* CTA Section */}
      <section id="contact" className="py-24 px-4 md:px-6 lg:px-8 max-w-5xl mx-auto text-center reveal" data-reveal-direction="up">
        <GlassCard className="p-12 md:p-20 rounded-[3rem] overflow-hidden group border border-black/5 dark:border-white/5 relative">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-primary/5 blur-[100px] group-hover:scale-125 transition-transform duration-700 pointer-events-none" />
          
          <h2 className="text-4xl md:text-6xl font-black mb-6 relative z-10 leading-[0.95] tracking-tighter">Ready to change <br /> the ecosystem?</h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 relative z-10 font-medium max-w-xl mx-auto leading-relaxed">
            Join the movement. Every saved meal reduces environmental waste and builds a sustainable future.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
            <Link href="/register">
              <GlowButton size="lg" className="h-16 px-10 text-base rounded-2xl bg-primary hover:bg-primary/95 text-primary-foreground font-black border-none">
                Register Now
              </GlowButton>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="h-16 px-10 text-base rounded-2xl border-black/10 dark:border-white/5 hover:bg-white/5 font-black">
                Sign In
              </Button>
            </Link>
          </div>
        </GlassCard>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 md:px-6 border-t border-black/5 dark:border-white/5 bg-white/[0.005] reveal" data-reveal-direction="up">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
          <div className="col-span-2">
            <div className="mb-6">
              <Logo size="md" showText={true} />
            </div>
            <p className="text-muted-foreground text-base font-medium max-w-sm leading-relaxed">
              Empowering shared-living spaces through predictive inventory intelligence. Redefining waste as opportunity.
            </p>
          </div>
          <div>
            <h4 className="font-black mb-6 uppercase tracking-widest text-[10px] text-primary">Platform</h4>
            <ul className="space-y-4 text-sm font-bold text-muted-foreground">
              <li className="hover:text-primary transition-colors cursor-pointer">PG Solutions</li>
              <li className="hover:text-primary transition-colors cursor-pointer">NGO Network</li>
              <li className="hover:text-primary transition-colors cursor-pointer">Analytics</li>
              <li className="hover:text-primary transition-colors cursor-pointer">Security</li>
            </ul>
          </div>
          <div>
            <h4 className="font-black mb-6 uppercase tracking-widest text-[10px] text-primary">Company</h4>
            <ul className="space-y-4 text-sm font-bold text-muted-foreground">
              <li className="hover:text-primary transition-colors cursor-pointer">About Impact</li>
              <li className="hover:text-primary transition-colors cursor-pointer">Sustainability</li>
              <li className="hover:text-primary transition-colors cursor-pointer">Contact</li>
              <li className="hover:text-primary transition-colors cursor-pointer">Legal</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-black/5 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-black text-muted-foreground uppercase tracking-widest">
          <div>© 2026 MealSync Technologies Inc.</div>
          <div className="flex gap-8">
            <span className="hover:text-primary cursor-pointer transition-colors">Twitter</span>
            <span className="hover:text-primary cursor-pointer transition-colors">LinkedIn</span>
            <span className="hover:text-primary cursor-pointer transition-colors">GitHub</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
