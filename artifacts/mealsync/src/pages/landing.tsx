import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  Users,
  BarChart3,
  Building2,
  HeartHandshake,
  TrendingDown,
  Truck,
  Leaf,
  ChevronRight,
  Star,
  Zap,
  Bell,
  LineChart,
  User,
  CheckCircle2,
  Lock,
  Wand2
} from "lucide-react";
import Hero3D from "@/components/Hero3D";
import { useEffect, useState } from "react";
import { initHeroAnimations } from "@/animations/heroAnimations";
import { initScrollReveal } from "@/animations/scrollAnimations";
import { initCounterAnimations } from "@/animations/counterAnimations";

const ActivityTicker = () => {
  const activities = [
    "5 mins ago: Sunrise PG donated 24 meals",
    "NGO Care picked up food from GreenNest",
    "12kg food waste prevented today",
    "8 mins ago: Healthy Bites shared surplus",
    "Community Kitchen served 50+ residents",
    "New NGO 'Food For All' joined the network",
    "Analytics: 15% reduction in PG waste this week"
  ];

  return (
    <div className="w-full overflow-hidden whitespace-nowrap relative z-10 py-4">
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-20" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-20" />
      
      <div className="flex animate-scroll items-center gap-6 px-4 hover:[animation-play-state:paused]">
        {[...activities, ...activities].map((text, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-2.5 rounded-full glass border border-primary/20 shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:border-primary/50 transition-colors cursor-default">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#10b981]" />
            <span className="text-sm font-medium tracking-wide text-foreground/90">{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const SocialProof = () => (
  <div className="flex flex-col gap-4 mt-8 hero-social">
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} size={16} className="fill-primary text-primary" />
      ))}
      <span className="ml-2 font-bold text-sm uppercase tracking-widest text-muted-foreground">Trusted by 500+ Communities</span>
    </div>
    <div className="flex -space-x-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="w-10 h-10 rounded-full border-2 border-background overflow-hidden bg-muted">
          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} alt="User" />
        </div>
      ))}
      <div className="w-10 h-10 rounded-full border-2 border-background bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary backdrop-blur-sm">
        +500
      </div>
    </div>
  </div>
);

const Sparkline = () => (
  <div className="flex items-end gap-1 h-8 w-24">
    {[40, 70, 45, 90, 65, 85, 100].map((h, i) => (
      <div
        key={i}
        style={{ height: `${h}%` }}
        className="w-full bg-primary/40 rounded-t-sm"
      />
    ))}
  </div>
);

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
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary selection:text-primary-foreground">
      {/* Background Parallax Elements */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div 
          className="absolute top-[5%] left-[2%] w-72 h-72 bg-primary/10 blur-[100px] rounded-full parallax" 
          data-parallax-speed="0.03"
        />
        <div 
          className="absolute bottom-[15%] right-[5%] w-[400px] h-[400px] bg-blue-500/10 blur-[120px] rounded-full parallax" 
          data-parallax-speed="0.05"
        />
      </div>

      {/* Hero Section */}
      <section id="home" className="relative pt-24 pb-12 md:pt-32 md:pb-16 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div className="z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 backdrop-blur-sm hero-badge">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#10b981]" />
              <span className="text-xs font-black uppercase tracking-widest text-primary">Intelligent Ecosystem</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] mb-6 hero-title">
              Connecting <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-400 to-primary-foreground animate-gradient shadow-glow">Surplus</span> to Need.
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8 max-w-xl font-medium hero-description">
              MealSync is an intelligent food optimization ecosystem connecting PGs and NGOs to eliminate waste through predictive analytics.
            </p>

            <div className="mt-8 mb-8">
              <SocialProof />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 hero-buttons">
              <Link href="/register">
                <Button size="lg" className="h-14 px-8 text-lg rounded-2xl bg-primary hover:bg-primary/90 hover:-translate-y-1 transition-all text-primary-foreground font-bold glow-primary group">
                  Start Saving Meals
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-2xl border-white/20 hover:bg-white/10 backdrop-blur-md transition-all font-bold">
                  Sign In
                </Button>
              </Link>
            </div>

            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 stagger-reveal">
              {[
                { label: "Meals Saved", value: "12540", suffix: "+", icon: HeartHandshake },
                { label: "Waste Reduced", value: "45", suffix: "%", icon: TrendingDown },
                { label: "Active NGOs", value: "120", suffix: "+", icon: Users },
                { label: "Communities", value: "500", suffix: "+", icon: Building2 },
              ].map((stat, i) => (
                <div 
                  key={i}
                  className="flex flex-col p-3 rounded-2xl glass-premium hover:border-primary/40 transition-all group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <stat.icon className="text-primary" size={16} />
                    </div>
                    <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{stat.label}</div>
                  </div>
                  <div 
                    className="text-2xl font-black group-hover:text-primary transition-colors counter"
                    data-target={stat.value}
                    data-suffix={stat.suffix}
                  >
                    0{stat.suffix}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative h-[350px] md:h-[500px] flex items-center justify-center hero-3d">
            <Hero3D />
          </div>
        </div>

        <div className="mt-12 -mx-4 md:-mx-8 lg:-mx-12 reveal" data-reveal-direction="up" data-reveal-delay="0.3">
          <ActivityTicker />
        </div>
      </section>

      {/* Removed separate Impact Stats section as it was integrated into the Hero */}

      {/* Tailored for the Ecosystem */}
      <section id="about" className="py-20 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12 reveal" data-reveal-direction="up">
          <h2 className="text-4xl md:text-5xl font-black mb-4">Tailored for the Ecosystem</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">One platform, three powerful experiences built for impact.</p>
        </div>

        <Tabs defaultValue="pg-owners" className="w-full reveal" data-reveal-direction="scale">
          <TabsList className="flex justify-center mb-16 bg-transparent gap-4 md:gap-8 h-auto flex-wrap">
            {[
              { id: "pg-owners", label: "PG Owners", icon: Building2 },
              { id: "ngos", label: "NGOs", icon: Users },
              { id: "residents", label: "Residents", icon: User }
            ].map((tab) => (
              <TabsTrigger 
                key={tab.id}
                value={tab.id} 
                className="px-8 py-4 rounded-2xl border border-white/5 data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all flex items-center gap-3 font-bold text-lg"
              >
                <tab.icon size={20} />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent value="pg-owners" className="animate-slide-up">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-8 reveal" data-reveal-direction="right">
                  <h3 className="text-4xl font-black leading-tight">Optimize kitchen efficiency <br /> & reduce overhead.</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    MealSync intelligence predicts resident attendance and surplus availability, helping you save thousands on groceries every month.
                  </p>
                  <ul className="space-y-4">
                    {[
                      "Real-time surplus detection",
                      "Automated NGO pickup alerts",
                      "Waste analytics & reporting"
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 font-bold text-primary">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                          <ShieldCheck size={14} />
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="relative group reveal" data-reveal-direction="left">
                  <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full group-hover:bg-primary/30 transition-all"></div>
                  <Card className="glass-premium neon-border overflow-hidden relative z-10 shadow-2xl rounded-[2rem] floating-element">
                    <CardContent className="p-8">
                      <div className="flex justify-between items-center mb-8">
                        <div>
                          <div className="text-xs uppercase tracking-widest font-black text-primary mb-1">Efficiency Score</div>
                          <div className="text-3xl font-black">94.8%</div>
                        </div>
                        <Sparkline />
                      </div>
                      <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                              <Zap className="text-emerald-500" size={20} />
                            </div>
                            <div>
                              <div className="text-sm font-bold">Surplus Detected</div>
                              <div className="text-xs text-muted-foreground">Dinner (24 meals)</div>
                            </div>
                          </div>
                          <Button size="sm" className="bg-primary/20 text-primary border-none hover:bg-primary/30 font-bold px-4">Notify NGO</Button>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                              <Bell className="text-blue-500" size={20} />
                            </div>
                            <div>
                              <div className="text-sm font-bold">Pickup Scheduled</div>
                              <div className="text-xs text-muted-foreground">In 15 mins</div>
                            </div>
                          </div>
                          <span className="text-[10px] uppercase font-black text-blue-400">Arriving</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ngos" className="animate-slide-up">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="relative order-2 md:order-1 group reveal" data-reveal-direction="right">
                  <div className="absolute inset-0 bg-blue-500/20 blur-[80px] rounded-full group-hover:bg-blue-500/30 transition-all"></div>
                  <Card className="glass-premium border-blue-500/30 overflow-hidden relative z-10 shadow-2xl rounded-[2rem] floating-element shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                    <CardContent className="p-8">
                      <div className="flex justify-between items-center mb-8">
                        <div>
                          <div className="text-xs uppercase tracking-widest font-black text-blue-400 mb-1">Impact Tracker</div>
                          <div className="text-3xl font-black">1,240kg</div>
                        </div>
                        <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center">
                          <LineChart className="text-blue-400" size={24} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                          <div className="text-[10px] uppercase font-black text-muted-foreground mb-1">Pickups</div>
                          <div className="text-2xl font-black">42</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                          <div className="text-[10px] uppercase font-black text-muted-foreground mb-1">Communities</div>
                          <div className="text-2xl font-black">18</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="space-y-8 order-1 md:order-2 reveal" data-reveal-direction="left">
                  <h3 className="text-4xl font-black leading-tight">Scale your redistribution <br /> with real-time data.</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Stop guessing where the surplus is. MealSync connects you directly to PG kitchens the moment extra food is identified.
                  </p>
                  <ul className="space-y-4">
                    {[
                      "Geographic surplus mapping",
                      "Priority collection alerts",
                      "Impact certification exports"
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 font-bold text-blue-400">
                        <div className="w-6 h-6 rounded-full bg-blue-400/20 flex items-center justify-center">
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
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-8 reveal" data-reveal-direction="right">
                  <h3 className="text-4xl font-black leading-tight">Your choices, <br /> global impact.</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Personalize your meal preferences and see how your conscious choices contribute to a zero-waste community.
                  </p>
                  <ul className="space-y-4">
                    {[
                      "Daily attendance check-ins",
                      "Meal quality feedback",
                      "Sustainability score tracker"
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 font-bold text-emerald-400">
                        <div className="w-6 h-6 rounded-full bg-emerald-400/20 flex items-center justify-center">
                          <Leaf size={14} />
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="relative group reveal" data-reveal-direction="left">
                  <div className="absolute inset-0 bg-emerald-500/20 blur-[80px] rounded-full group-hover:bg-emerald-500/30 transition-all"></div>
                  <Card className="glass-premium neon-border overflow-hidden relative z-10 shadow-2xl rounded-[2rem] floating-element">
                    <CardContent className="p-8">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full border-4 border-emerald-500/30 overflow-hidden">
                          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=John" alt="User" />
                        </div>
                        <div>
                          <div className="text-lg font-black">Alex Rivera</div>
                          <div className="text-xs text-muted-foreground uppercase font-bold">Top Contributor</div>
                        </div>
                      </div>
                      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex justify-between items-center">
                        <div>
                          <div className="text-xs uppercase font-black text-emerald-400">Meals Saved</div>
                          <div className="text-2xl font-black">124</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs uppercase font-black text-emerald-400">CO2 Offset</div>
                          <div className="text-2xl font-black">18.5kg</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </section>

      {/* Dashboard Preview Section */}
      <section className="py-24 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden reveal" data-reveal-direction="up">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter">Intelligent <span className="text-primary">Ecosystem</span> Visualization</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Real-time data flow connecting donors, redistributors, and communities.</p>
        </div>

        <div className="relative h-[500px] w-full flex items-center justify-center mt-12">
          {/* Animated Connection Lines with Glow */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-60" viewBox="0 0 1000 500">
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path d="M250,250 Q500,100 750,250" fill="none" stroke="#10b981" strokeWidth="3" filter="url(#glow)" className="animate-dash opacity-50" />
            <path d="M250,250 Q500,400 750,250" fill="none" stroke="#3b82f6" strokeWidth="3" filter="url(#glow)" className="animate-dash opacity-50" style={{ animationDelay: '1s' }} />
            <path d="M250,250 L750,250" fill="none" stroke="#10b981" strokeWidth="2" filter="url(#glow)" className="animate-dash" style={{ animationDelay: '2s' }} />
          </svg>

          {/* Nodes */}
          <div className="grid grid-cols-3 gap-12 md:gap-24 relative z-10 w-full max-w-4xl stagger-reveal">
            <div className="flex flex-col items-center gap-4 hover:-translate-y-2 transition-transform cursor-pointer group">
              <div className="w-24 h-24 rounded-3xl glass-premium neon-border flex items-center justify-center group-hover:shadow-[0_0_40px_rgba(16,185,129,0.4)] transition-all">
                <Building2 size={40} className="text-primary animate-pulse" />
              </div>
              <span className="text-sm font-black uppercase tracking-widest text-foreground/80">PG Surplus</span>
            </div>

            <div className="flex flex-col items-center gap-4 animate-float">
              <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-primary to-emerald-600 text-primary-foreground flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.5)] border border-white/20">
                <Zap size={56} className="animate-pulse" />
              </div>
              <span className="text-base font-black uppercase tracking-widest text-primary text-glow">MealSync AI</span>
            </div>

            <div className="flex flex-col items-center gap-4 hover:-translate-y-2 transition-transform cursor-pointer group">
              <div className="w-24 h-24 rounded-3xl glass-premium border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)] flex items-center justify-center group-hover:shadow-[0_0_40px_rgba(59,130,246,0.4)] transition-all">
                <Users size={40} className="text-blue-400 animate-pulse" />
              </div>
              <span className="text-sm font-black uppercase tracking-widest text-blue-400">NGO Network</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-32 px-4 md:px-6 lg:px-8 max-w-5xl mx-auto text-center reveal" data-reveal-direction="up">
        <div
          className="relative glass border-white/10 p-12 md:p-20 rounded-[3rem] overflow-hidden group"
        >
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-primary/10 blur-[100px] group-hover:scale-125 transition-transform duration-700"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-black/10 blur-[100px] group-hover:scale-125 transition-transform duration-700"></div>

          <h2 className="text-4xl md:text-7xl font-black mb-8 relative z-10 leading-[0.9] tracking-tighter">Ready to change <br /> the ecosystem?</h2>
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 relative z-10 font-medium max-w-2xl mx-auto">
            Join the movement. Every meal saved is a step toward a zero-waste future.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center relative z-10">
            <Link href="/register">
              <Button size="lg" className="h-16 px-12 text-xl rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black glow-primary shadow-2xl">
                Register Now
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="h-16 px-12 text-xl rounded-2xl border-white/10 hover:bg-white/5 font-black">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-4 md:px-6 border-t border-white/5 bg-white/[0.01] reveal" data-reveal-direction="up">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center font-black text-xl text-primary-foreground shadow-glow">M</div>
              <span className="text-2xl font-black tracking-tighter">MealSync</span>
            </div>
            <p className="text-muted-foreground text-lg font-medium max-w-md leading-relaxed">
              Empowering communities through intelligent food optimization. Redefining waste as opportunity.
            </p>
          </div>
          <div>
            <h4 className="font-black mb-6 uppercase tracking-widest text-xs text-primary">Platform</h4>
            <ul className="space-y-4 text-muted-foreground font-bold">
              <li className="hover:text-primary transition-colors cursor-pointer">PG Solutions</li>
              <li className="hover:text-primary transition-colors cursor-pointer">NGO Network</li>
              <li className="hover:text-primary transition-colors cursor-pointer">Analytics Engine</li>
              <li className="hover:text-primary transition-colors cursor-pointer">Security</li>
            </ul>
          </div>
          <div>
            <h4 className="font-black mb-6 uppercase tracking-widest text-xs text-primary">Company</h4>
            <ul className="space-y-4 text-muted-foreground font-bold">
              <li className="hover:text-primary transition-colors cursor-pointer">About Impact</li>
              <li className="hover:text-primary transition-colors cursor-pointer">Sustainability</li>
              <li className="hover:text-primary transition-colors cursor-pointer">Contact</li>
              <li className="hover:text-primary transition-colors cursor-pointer">Legal</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-sm font-bold text-muted-foreground uppercase tracking-widest">
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
