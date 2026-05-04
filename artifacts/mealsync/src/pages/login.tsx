import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/components/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLogin } from "@workspace/api-client-react";
import { toast } from "sonner";
import { ArrowRight, Mail, Lock, Github, Globe2, Globe } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const loginMutation = useLogin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");  
  const [error, setError] = useState("");

  const handleOAuth = (provider: string) => {
    toast.info(`Login with ${provider} coming soon!`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const response = await loginMutation.mutateAsync({ data: { email, password } });
      login(response.user);
      setLocation(`/dashboard/${response.user.role}`);
      toast.success("Logged in successfully");
    } catch (err: any) {
      const msg = err?.data?.error ?? "Invalid email or password";
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-900/50 dark:to-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_right,_var(--tw-gradient-stops))] from-sky-200/30 via-transparent to-rose-200/30 dark:from-sky-900/30 dark:to-rose-900/30" />
      
      <Card className="w-full max-w-md relative backdrop-blur-xl bg-white/20 dark:bg-black/20 border border-white/20 dark:border-white/10 shadow-2xl ring-1 ring-white/10 dark:ring-white/20">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-slate-900/50 dark:to-slate-800/50 rounded-2xl -z-10 blur-xl" />
        
        <CardHeader className="text-center space-y-2 pb-6">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/80 dark:bg-black/50 backdrop-blur-sm border border-white/50 shadow-lg mx-auto mb-4">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
            Welcome back
          </CardTitle>
          <CardDescription className="text-lg">
            Enter your credentials to access your dashboard
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* OAuth Buttons */}
          <div className="space-y-3">
            <div className="text-center text-sm font-medium text-muted-foreground py-4 border-y border-border/50">
              Or continue with
            </div>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full h-14 justify-start gap-3 border-2 hover:scale-105 transition-all duration-200 hover:shadow-lg hover:shadow-primary/10 group/data-[state=active]:scale-105" 
                onClick={() => handleOAuth('Google')}
              >
<Globe2 className="h-5 w-5" />
                Continue with Google
              </Button>
              <Button 
                variant="outline" 
                className="w-full h-14 justify-start gap-3 border-2 hover:scale-105 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10 group/data-[state=active]:scale-105" 
                onClick={() => handleOAuth('Microsoft')}
              >
<Globe className="h-5 w-5" />

                Continue with Microsoft
              </Button>
            </div>
          </div>

<form id="login-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 pl-12 pr-4 peer ring-2 ring-transparent focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:shadow-glow transition-all duration-200 hover:shadow-md"
                  data-testid="input-email"
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground peer-focus:text-primary peer-focus:scale-110 transition-all duration-200" />
                <Label 
                  htmlFor="email" 
                  className="absolute left-12 top-1/2 -translate-y-1/2 pointer-events-none text-sm transition-all duration-200 peer-focus:-translate-y-3 peer-focus:scale-90 peer-focus:text-primary peer-valid:-translate-y-3 peer-valid:scale-90 bg-background/90 px-2"
                >
                  Email
                </Label>
              </div>

              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 pl-12 pr-4 peer ring-2 ring-transparent focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:shadow-glow transition-all duration-200 hover:shadow-md"
                  data-testid="input-password"
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground peer-focus:text-primary peer-focus:scale-110 transition-all duration-200" />
                <Label 
                  htmlFor="password" 
                  className="absolute left-12 top-1/2 -translate-y-1/2 pointer-events-none text-sm transition-all duration-200 peer-focus:-translate-y-3 peer-focus:scale-90 peer-focus:text-primary peer-valid:-translate-y-3 peer-valid:scale-90 bg-background/90 px-2"
                >
                  Password
                </Label>
              </div>

              {error && (
                <Badge variant="destructive" className="w-full justify-start h-10 p-3 text-sm data-testid=text-login-error">
                  {error}
                </Badge>
              )}
            </div>
          </form>
        </CardContent>

        <CardFooter className="pt-0 pb-8 px-6">
          <Button
            type="submit"
            form="login-form" // Add id to form
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary hover:scale-105 hover:shadow-glow-lg transition-all duration-200 shadow-lg"
            disabled={loginMutation.isPending}
            data-testid="button-login"
          >
            {loginMutation.isPending ? (
              <>
                <ArrowRight className="h-4 w-4 animate-spin mr-2" />
                Signing you in...
              </>
            ) : (
              <>
                Sign In <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>

          <div className="text-center pt-6">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/register" className="text-primary hover:text-primary/80 font-semibold hover:underline transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
