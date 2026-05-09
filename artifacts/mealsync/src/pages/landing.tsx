import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
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
    <div className="w-full bg-primary/10 backdrop-blur-md border-y border-white/5 py-3 overflow-hidden whitespace-nowrap relative z-10">
      <div className="flex animate-scroll items-center gap-12 px-4">
        {[...activities, ...activities].map((text, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#10b981]" />
            <span className="text-sm font-bold tracking-wide uppercase text-primary/80">{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const SocialProof = () => (
  <div className="flex flex-col gap-4 mt-8">
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
      <motion.div
        key={i}
        initial={{ height: 0 }}
        animate={{ height: `${h}%` }}
        transition={{ delay: i * 0.1, duration: 1 }}
        className="w-full bg-primary/40 rounded-t-sm"
      />
    ))}
  </div>
);

export default function LandingPage() {
  const [mealsSaved, setMealsSaved] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMealsSaved((prev) => (prev < 12540 ? prev + 123 : 12540));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary selection:text-primary-foreground">
      {/* Hero Section */}
      <section id="home" className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#10b981]" />
              <span className="text-xs font-black uppercase tracking-widest text-primary">Intelligent Ecosystem</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8">
              Connecting <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-400 to-primary-foreground animate-gradient shadow-glow">Surplus</span> to Need.
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed mb-10 max-w-xl font-medium">
              MealSync is an intelligent food optimization ecosystem connecting PGs and NGOs to eliminate waste through predictive analytics.
            </p>

            <div className="flex flex-col sm:flex-row gap-5">
              <Link href="/register">
                <Button size="lg" className="h-16 px-10 text-lg rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold glow-primary group">
                  Get Started
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="h-16 px-10 text-lg rounded-2xl border-white/10 hover:bg-white/5 font-bold">
                  Sign In
                </Button>
              </Link>
            </div>

            <SocialProof />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            className="relative h-[400px] md:h-[600px] flex items-center justify-center"
          >
            <Hero3D />
          </motion.div>
        </div>

        {/* Live Activity Ticker - Now integrated into Hero flow to avoid overlap */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="mt-20 -mx-4 md:-mx-8 lg:-mx-12"
        >
          <ActivityTicker />
        </motion.div>
      </section>

      {/* Impact Stats */}
      <section className="py-20 px-4 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: "Meals Saved", value: mealsSaved.toLocaleString() + "+", icon: HeartHandshake },
            { label: "Connected PGs", value: "500+", icon: Building2 },
            { label: "Active NGOs", value: "120+", icon: Users },
            { label: "Waste Reduced", value: "45%", icon: TrendingDown },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center group p-6 rounded-3xl hover:bg-white/5 transition-all"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <stat.icon className="text-primary" size={24} />
              </div>
              <div className="text-4xl md:text-5xl font-black mb-1 group-hover:text-primary transition-colors">{stat.value}</div>
              <div className="text-xs uppercase tracking-widest font-bold text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Tailored for the Ecosystem */}
      <section id="about" className="py-32 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-black mb-6">Tailored for the Ecosystem</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">One platform, three powerful experiences built for impact.</p>
        </div>

        <Tabs defaultValue="pg-owners" className="w-full">
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
                <div className="space-y-8">
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
                <div className="relative group">
                  <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full group-hover:bg-primary/30 transition-all"></div>
                  <Card className="glass overflow-hidden border-white/10 relative z-10 shadow-2xl rounded-[2rem]">
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
                <div className="relative order-2 md:order-1 group">
                  <div className="absolute inset-0 bg-blue-500/20 blur-[80px] rounded-full group-hover:bg-blue-500/30 transition-all"></div>
                  <Card className="glass overflow-hidden border-white/10 relative z-10 shadow-2xl rounded-[2rem]">
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
                <div className="space-y-8 order-1 md:order-2">
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
                <div className="space-y-8">
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
                <div className="relative group">
                  <div className="absolute inset-0 bg-emerald-500/20 blur-[80px] rounded-full group-hover:bg-emerald-500/30 transition-all"></div>
                  <Card className="glass overflow-hidden border-white/10 relative z-10 shadow-2xl rounded-[2rem]">
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
      <section className="py-24 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter">Intelligent <span className="text-primary">Ecosystem</span> Visualization</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Real-time data flow connecting donors, redistributors, and communities.</p>
        </div>

        <div className="relative h-[500px] w-full flex items-center justify-center">
          {/* Animated Connection Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" viewBox="0 0 1000 500">
            <path d="M200,250 Q500,50 800,250" fill="none" stroke="#10b981" strokeWidth="2" className="animate-dash" />
            <path d="M200,250 Q500,450 800,250" fill="none" stroke="#10b981" strokeWidth="2" className="animate-dash" style={{ animationDelay: '1s' }} />
            <path d="M200,250 L800,250" fill="none" stroke="#10b981" strokeWidth="2" className="animate-dash" style={{ animationDelay: '2s' }} />
          </svg>

          {/* Nodes */}
          <div className="grid grid-cols-3 gap-24 relative z-10 w-full max-w-4xl">
            <motion.div 
              whileHover={{ scale: 1.1 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-24 h-24 rounded-3xl bg-primary/10 border-2 border-primary/30 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                <Building2 size={40} className="text-primary" />
              </div>
              <span className="text-sm font-black uppercase tracking-widest">PG Surplus</span>
            </motion.div>

            <motion.div 
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-32 h-32 rounded-[2.5rem] bg-primary text-primary-foreground flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.4)]">
                <Zap size={56} />
              </div>
              <span className="text-base font-black uppercase tracking-widest text-primary">MealSync AI</span>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.1 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-24 h-24 rounded-3xl bg-blue-500/10 border-2 border-blue-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                <Users size={40} className="text-blue-400" />
              </div>
              <span className="text-sm font-black uppercase tracking-widest text-blue-400">NGO Network</span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-32 px-4 md:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
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
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-4 md:px-6 border-t border-white/5 bg-white/[0.01]">
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
