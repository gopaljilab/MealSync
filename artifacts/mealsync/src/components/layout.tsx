import { Link, useLocation } from "wouter";
import { useAuth } from "./auth/AuthContext";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useLogout, useHealthCheck, getHealthCheckQueryKey } from "@workspace/api-client-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const logoutMutation = useLogout();
  const { data: health } = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey() } });

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (e) {
      // Mock logout if API fails
    }
    logout();
    setLocation("/login");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-bold text-xl text-primary">
              MealSync
            </Link>
            {health && (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                API: {health.status}
              </Badge>
            )}
          </div>
          
          {user && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{user.name}</span>
                <Badge variant="secondary" className="capitalize">{user.role}</Badge>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout} disabled={logoutMutation.isPending}>
                {logoutMutation.isPending ? "..." : "Logout"}
              </Button>
            </div>
          )}
        </div>
      </header>
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}

