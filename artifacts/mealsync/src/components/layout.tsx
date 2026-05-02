import { Link, useLocation } from "wouter";
import { useAuth } from "./auth/AuthContext";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useLogout, useHealthCheck, getHealthCheckQueryKey } from "@workspace/api-client-react";
import { useDarkMode } from "@/hooks/useDarkMode";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const logoutMutation = useLogout();
  const { data: health } = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey() } });
  const [dark, toggleDark] = useDarkMode();

  const handleLogout = async () => {
    try { await logoutMutation.mutateAsync(); } catch {}
    logout();
    setLocation("/login");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-bold text-xl text-primary tracking-tight">
              MealSync
            </Link>
            {health && (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800">
                API: {health.status}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleDark}
              aria-label="Toggle dark mode"
              className="h-9 w-9 rounded-full flex items-center justify-center border border-border hover:bg-muted transition-colors text-lg"
            >
              {dark ? "☀️" : "🌙"}
            </button>

            {user && (
              <>
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-sm font-medium">{user.name}</span>
                  <Badge variant="secondary" className="capitalize">{user.role}</Badge>
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout} disabled={logoutMutation.isPending}>
                  {logoutMutation.isPending ? "..." : "Logout"}
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
