import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/components/auth/AuthContext";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";
import LandingPage from "@/pages/landing";

// Dashboard Pages
import OwnerDashboard from "@/pages/dashboard/owner";
import NgoDashboard from "@/pages/dashboard/ngo";
import ResidentDashboard from "@/pages/dashboard/resident";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    }
  }
});

function ProtectedRoute({ component: Component, allowedRole }: { component: any, allowedRole?: string }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading application...</div>;

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Redirect to={`/dashboard/${user.role}`} />;
  }

  return <Component />;
}

function RootRoute() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading application...</div>;
  
  if (user) {
    return <Redirect to={`/dashboard/${user.role}`} />;
  }
  
  return <LandingPage />;
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={RootRoute} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        
        <Route path="/dashboard/owner">
          {() => <ProtectedRoute component={OwnerDashboard} allowedRole="owner" />}
        </Route>
        <Route path="/dashboard/ngo">
          {() => <ProtectedRoute component={NgoDashboard} allowedRole="ngo" />}
        </Route>
        <Route path="/dashboard/resident">
          {() => <ProtectedRoute component={ResidentDashboard} allowedRole="resident" />}
        </Route>
        
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
