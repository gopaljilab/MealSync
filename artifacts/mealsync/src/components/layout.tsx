import { Link, useLocation } from "wouter";
import { Logo } from "./ui/Logo";
import { useAuth } from "./auth/AuthContext";
import { Button } from "./ui/button";
import { useLogout, useHealthCheck, getHealthCheckQueryKey } from "@workspace/api-client-react";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useState, useEffect, useRef } from "react";
import { Menu, X, Moon, Sun, LayoutDashboard, LogOut, ChevronRight, Bell, Search, UserCircle, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSmoothScroll } from "@/hooks/useSmoothScroll";
import { gsap } from "@/animations/gsap";
import { StatusBadge } from "./ui/premium";
import { CommandPalette } from "./ui/command-palette";

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const logoutMutation = useLogout();
  const [dark, toggleDark] = useDarkMode();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try { await logoutMutation.mutateAsync(); } catch {}
    logout();
    setLocation("/login");
  };

  const navItems = [
    { name: "Overview", icon: LayoutDashboard, href: `/dashboard/${user?.role || 'owner'}` },
    { name: "Settings", icon: Settings, href: "/dashboard/settings" },
  ];

  return (
    <div className={`min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex ${dark ? 'dark' : ''}`}>
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Navigation */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-[var(--surface-primary)] border-r border-[var(--border-strong)] z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Brand & Workspace */}
          <div className="h-16 flex items-center px-6 border-b border-[var(--border-subtle)] justify-between">
            <Link href="/">
              <Logo size="sm" showText={true} />
            </Link>
            <button className="lg:hidden p-1 text-[var(--text-muted)]" onClick={() => setIsSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>
          
          {/* Org Switcher */}
          <div className="px-4 py-4 border-b border-[var(--border-subtle)]">
            <button className="w-full flex items-center justify-between bg-[var(--surface-secondary)] hover:bg-[var(--border-subtle)] px-3 py-2 rounded-xl transition-colors">
              <div className="flex flex-col items-start">
                <span className="text-sm font-bold text-[var(--text-primary)]">{user?.name || 'Workspace'}</span>
                <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{user?.role || 'User'}</span>
              </div>
              <ChevronRight size={16} className="text-[var(--text-muted)]" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <a className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-[var(--brand-accent)]/10 text-[var(--brand-accent)]' 
                      : 'text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]'
                  }`}>
                    <item.icon size={18} />
                    {item.name}
                    {isActive && <motion.div layoutId="sidebar-active" className="absolute left-0 w-1 h-6 bg-[var(--brand-accent)] rounded-r-full" />}
                  </a>
                </Link>
              );
            })}
          </nav>

          {/* Footer Actions */}
          <div className="p-4 border-t border-[var(--border-subtle)] space-y-2">
            <button onClick={toggleDark} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] transition-colors">
              {dark ? <Sun size={18} /> : <Moon size={18} />}
              <span>{dark ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[var(--status-danger)] hover:bg-[var(--status-danger-bg)] transition-colors">
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Utility Header */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-8 bg-[var(--surface-primary)] border-b border-[var(--border-strong)] sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 text-[var(--text-secondary)]" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <div 
              onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
              className="hidden md:flex items-center gap-2 text-[var(--text-muted)] bg-[var(--surface-secondary)] px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] hover:border-[var(--brand-accent)] hover:ring-1 hover:ring-[var(--brand-accent)] transition-all cursor-text"
            >
              <Search size={16} />
              <div className="text-sm w-64 text-[var(--text-muted)] select-none">Search or type a command...</div>
              <div className="flex gap-1">
                <kbd className="text-[10px] bg-[var(--surface-primary)] px-1.5 py-0.5 rounded border border-[var(--border-strong)] font-mono">⌘</kbd>
                <kbd className="text-[10px] bg-[var(--surface-primary)] px-1.5 py-0.5 rounded border border-[var(--border-strong)] font-mono">K</kbd>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <StatusBadge status="API: OK" className="hidden sm:inline-flex" />
            <button className="p-2 text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] rounded-full transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--status-danger)] rounded-full border-2 border-[var(--surface-primary)]"></span>
            </button>
            <div className="h-8 w-8 rounded-full bg-[var(--brand-accent)]/20 text-[var(--brand-accent)] flex items-center justify-center font-bold shadow-sm border border-[var(--brand-accent)]/30">
              {user?.name?.[0] || 'U'}
            </div>
          </div>
        </header>
        
        {/* Scrollable Canvas */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          {children}
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}

function LandingLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const logoutMutation = useLogout();
  const [dark, toggleDark] = useDarkMode();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const lenis = useSmoothScroll();

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 20;
      if (headerRef.current) {
        if (scrolled) {
          gsap.to(headerRef.current, {
            height: 64,
            backgroundColor: dark ? 'rgba(11, 17, 32, 0.75)' : 'rgba(255, 255, 255, 0.75)',
            backdropFilter: 'blur(16px)',
            borderBottom: dark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
            boxShadow: dark ? '0 10px 30px -10px rgba(0, 0, 0, 0.5)' : '0 10px 30px -10px rgba(0, 0, 0, 0.05)',
            duration: 0.3, ease: 'power2.out'
          });
        } else {
          gsap.to(headerRef.current, {
            height: 80, backgroundColor: 'transparent', backdropFilter: 'blur(0px)',
            borderBottom: '1px solid transparent', boxShadow: 'none',
            duration: 0.3, ease: 'power2.out'
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
    e.preventDefault();
    if (lenis) {
      lenis.scrollTo(`#${targetId}`, { offset: -100, duration: 1.5, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    } else {
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  const navLinks = [
    { name: "Home", href: "#home", id: "home" },
    { name: "About", href: "#about", id: "about" },
    { name: "Contact", href: "#contact", id: "contact" },
  ];

  return (
    <div className={`min-h-screen flex flex-col ${dark ? 'dark' : ''} bg-[var(--bg-canvas)] text-[var(--text-primary)]`}>
      <header ref={headerRef} className="fixed top-0 w-full z-50 bg-transparent border-transparent">
        <div className="container mx-auto px-4 md:px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/">
              <Logo size="md" showText={true} />
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a key={link.name} href={link.href} onClick={(e) => smoothScroll(e, link.id)} className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--brand-accent)] transition-colors relative group">
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--brand-accent)] transition-all group-hover:w-full"></span>
              </a>
            ))}
            
            <div className="h-6 w-[1px] bg-[var(--border-strong)] mx-2"></div>
            
            <button onClick={toggleDark} className="p-2.5 rounded-xl border border-[var(--border-strong)] hover:bg-[var(--surface-secondary)] transition-all hover:scale-105 active:scale-95">
              {dark ? <Sun size={18} className="text-yellow-500" /> : <Moon size={18} className="text-[var(--brand-accent)]" />}
            </button>

            {user ? (
              <div className="flex items-center gap-4">
                <Link href={`/dashboard/${user.role}`}>
                  <Button size="sm" className="rounded-xl glow-primary gap-2">
                    <LayoutDashboard size={16} /> Dashboard
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-xl hover:bg-[var(--status-danger-bg)] hover:text-[var(--status-danger)] transition-colors">
                  <LogOut size={18} />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login"><Button variant="ghost" className="rounded-xl px-6">Login</Button></Link>
                <Link href="/register"><Button className="rounded-xl px-6 glow-primary bg-[var(--brand-accent)] text-white hover:bg-[var(--brand-accent)]/90">Get Started</Button></Link>
              </div>
            )}
          </nav>

          <div className="flex items-center gap-4 md:hidden">
            <button onClick={toggleDark} className="p-2 rounded-lg border border-[var(--border-strong)]">
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-lg bg-[var(--surface-secondary)] text-[var(--text-primary)] transition-colors">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="md:hidden absolute top-full left-0 w-full glass bg-[var(--surface-elevated)] border-b border-[var(--border-strong)] p-6 space-y-6">
              <div className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <a key={link.name} href={link.href} onClick={(e) => smoothScroll(e, link.id)} className="text-lg font-medium py-2 border-b border-[var(--border-subtle)] text-[var(--text-primary)]">
                    {link.name}
                  </a>
                ))}
              </div>
              <div className="flex flex-col gap-3">
                {user ? (
                  <>
                    <Link href={`/dashboard/${user.role}`} onClick={() => setIsMenuOpen(false)}>
                      <Button className="w-full justify-start gap-2 h-12 rounded-xl bg-[var(--brand-accent)] text-white">
                        <LayoutDashboard size={18} /> Go to Dashboard
                      </Button>
                    </Link>
                    <Button variant="outline" onClick={handleLogout} className="w-full justify-start gap-2 h-12 rounded-xl border-[var(--status-danger)]/20 text-[var(--status-danger)]">
                      <LogOut size={18} /> Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setIsMenuOpen(false)}><Button variant="outline" className="w-full h-12 rounded-xl">Login</Button></Link>
                    <Link href="/register" onClick={() => setIsMenuOpen(false)}><Button className="w-full h-12 rounded-xl bg-[var(--brand-accent)] text-white">Get Started</Button></Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const isDashboard = location.startsWith("/dashboard");

  if (isDashboard) {
    return <DashboardLayout>{children}</DashboardLayout>;
  }
  return <LandingLayout>{children}</LandingLayout>;
}
