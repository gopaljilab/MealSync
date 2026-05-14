import { Link, useLocation } from "wouter";
import { useAuth } from "./auth/AuthContext";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useLogout, useHealthCheck, getHealthCheckQueryKey } from "@workspace/api-client-react";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useState, useEffect, useRef } from "react";
import { Menu, X, Moon, Sun, LayoutDashboard, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSmoothScroll } from "@/hooks/useSmoothScroll";
import { gsap } from "@/animations/gsap";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const logoutMutation = useLogout();
  const { data: health } = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey() } });
  const [dark, toggleDark] = useDarkMode();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const isLandingPage = location === "/";
  const lenis = useSmoothScroll();

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 20;
      setIsScrolled(scrolled);
      
      if (headerRef.current) {
        if (scrolled) {
          gsap.to(headerRef.current, {
            height: 70,
            backgroundColor: dark ? 'rgba(9, 9, 11, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            duration: 0.3,
            ease: 'power2.out'
          });
        } else {
          gsap.to(headerRef.current, {
            height: 80,
            backgroundColor: 'transparent',
            backdropFilter: 'blur(0px)',
            borderBottom: '1px solid transparent',
            duration: 0.3,
            ease: 'power2.out'
          });
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [dark]);

  const handleLogout = async () => {
    try { await logoutMutation.mutateAsync(); } catch {}
    logout();
    setLocation("/login");
  };

  const smoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    if (!isLandingPage) return;
    e.preventDefault();
    
    if (lenis) {
      lenis.scrollTo(`#${targetId}`, {
        offset: -100,
        duration: 1.5,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
    } else {
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setIsMenuOpen(false);
  };

  const navLinks = [
    { name: "Home", href: "#home", id: "home" },
    { name: "About", href: "#about", id: "about" },
    { name: "Contact", href: "#contact", id: "contact" },
  ];

  return (
    <div className={`min-h-screen flex flex-col ${dark ? 'dark' : ''}`}>
      <header 
        ref={headerRef}
        className="fixed top-0 w-full z-50 bg-transparent border-transparent"
      >
        <div className="container mx-auto px-4 md:px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                <span className="text-white font-bold text-xl">M</span>
              </div>
              <span className="font-bold text-2xl tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                MealSync
              </span>
            </Link>
            
            <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-full glass border border-primary/20 backdrop-blur-md shadow-sm">
              <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse" />
              <div className="text-xs uppercase tracking-widest font-black text-primary w-[200px] overflow-hidden relative h-[18px]">
                <div className="absolute inset-0 flex flex-col animate-[badgeRotate_10s_cubic-bezier(0.83,0,0.17,1)_infinite]">
                  <span className="h-[18px] flex items-center leading-none">1,200+ Meals Saved</span>
                  <span className="h-[18px] flex items-center leading-none">Live Connections Active</span>
                  <span className="h-[18px] flex items-center leading-none">45+ NGOs Connected</span>
                  <span className="h-[18px] flex items-center leading-none">1,200+ Meals Saved</span>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {isLandingPage && navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => smoothScroll(e, link.id)}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
              </a>
            ))}
            
            <div className="h-6 w-[1px] bg-border mx-2"></div>
            
            <button
              onClick={toggleDark}
              className="p-2.5 rounded-xl border border-border hover:bg-muted transition-all hover:scale-105 active:scale-95"
              aria-label="Toggle Theme"
            >
              {dark ? <Sun size={18} className="text-yellow-500" /> : <Moon size={18} className="text-primary" />}
            </button>

            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-semibold">{user.name}</span>
                  <span className="text-[10px] uppercase tracking-tighter text-muted-foreground">{user.role}</span>
                </div>
                <Link href={`/dashboard/${user.role}`}>
                  <Button size="sm" className="rounded-xl glow-primary gap-2">
                    <LayoutDashboard size={16} />
                    Dashboard
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors" aria-label="Logout">
                  <LogOut size={18} />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login">
                  <Button variant="ghost" className="rounded-xl px-6">Login</Button>
                </Link>
                <Link href="/register">
                  <Button className="rounded-xl px-6 glow-primary">Get Started</Button>
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-4 md:hidden">
            <button
              onClick={toggleDark}
              className="p-2 rounded-lg border border-border"
              aria-label="Toggle Theme"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg bg-muted text-foreground transition-colors"
              aria-label="Toggle Mobile Menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Dropdown */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="md:hidden absolute top-full left-0 w-full glass border-b border-border p-6 space-y-6"
            >
              {isLandingPage && (
                <div className="flex flex-col gap-4">
                  {navLinks.map((link) => (
                    <a
                      key={link.name}
                      href={link.href}
                      onClick={(e) => smoothScroll(e, link.id)}
                      className="text-lg font-medium py-2 border-b border-border/50"
                    >
                      {link.name}
                    </a>
                  ))}
                </div>
              )}
              
              <div className="flex flex-col gap-3">
                {user ? (
                  <>
                    <Link href={`/dashboard/${user.role}`} onClick={() => setIsMenuOpen(false)}>
                      <Button className="w-full justify-start gap-2 h-12 rounded-xl">
                        <LayoutDashboard size={18} />
                        Go to Dashboard
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      onClick={handleLogout} 
                      className="w-full justify-start gap-2 h-12 rounded-xl border-destructive/20 text-destructive"
                    >
                      <LogOut size={18} />
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outline" className="w-full h-12 rounded-xl">Login</Button>
                    </Link>
                    <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                      <Button className="w-full h-12 rounded-xl glow-primary">Get Started</Button>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}

