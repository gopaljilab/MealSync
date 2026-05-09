import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/components/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useLogin } from "@workspace/api-client-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Mail, Lock, Loader2, Wand2, ArrowRight } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const { user, login } = useAuth();
  const loginMutation = useLogin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isMagicLinkLoading, setIsMagicLinkLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setLocation(`/dashboard/${user.role}`);
    }
  }, [user, setLocation]);

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

  const handleMagicLink = () => {
    setIsMagicLinkLoading(true);
    setTimeout(() => {
      setIsMagicLinkLoading(false);
      toast.info("Magic link sent to your email!");
    }, 1500);
  };

  return (
    <div className="flex items-center justify-center min-h-[90vh] px-4 pt-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="glass border-white/10 overflow-hidden shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 glow-primary">
              <Lock className="text-primary" size={32} />
            </div>
            <CardTitle className="text-3xl font-black tracking-tight">Welcome back</CardTitle>
            <CardDescription className="text-base">Enter your credentials to access your dashboard</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Email Address</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                  <Input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    className="h-12 pl-12 bg-white/5 border-white/10 focus-glow transition-all"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Password</Label>
                  <Link href="/forgot-password" title="Forgot Password" className="text-[10px] uppercase font-bold text-primary hover:underline">Forgot?</Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                  <Input
                    id="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    className="h-12 pl-12 bg-white/5 border-white/10 focus-glow transition-all"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              {error && (
                <motion.p 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="text-sm text-destructive font-bold text-center"
                >
                  {error}
                </motion.p>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4 pt-2">
              <Button
                type="submit"
                className="w-full h-12 text-lg font-bold glow-primary"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <Loader2 className="animate-spin mr-2" />
                ) : (
                  <>Login <ArrowRight className="ml-2" size={20} /></>
                )}
              </Button>
              
              <div className="relative w-full py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground font-bold">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 border-white/10 hover:bg-white/5 font-bold flex items-center justify-center gap-2"
                onClick={handleMagicLink}
                disabled={isMagicLinkLoading}
              >
                {isMagicLinkLoading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <><Wand2 size={18} /> Send Magic Link</>
                )}
              </Button>

              <div className="text-sm text-center text-muted-foreground mt-4">
                Don't have an account?{" "}
                <Link href="/register" className="text-primary hover:underline font-bold">
                  Register for free
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
