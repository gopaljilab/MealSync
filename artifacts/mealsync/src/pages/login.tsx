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
import { Mail, Lock, Loader2, Wand2, ArrowRight, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const { user, login } = useAuth();
  const loginMutation = useLogin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isMagicLinkLoading, setIsMagicLinkLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isEmailValid = email === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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
              <div className="space-y-4">
                <div className="relative group">
                  <Mail className={`absolute left-4 top-4 transition-colors z-10 ${email && !isEmailValid ? 'text-destructive' : email && isEmailValid ? 'text-primary' : 'text-muted-foreground group-focus-within:text-primary'}`} size={18} />
                  <Input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    className={`h-14 pl-12 pt-4 bg-white/5 border-white/10 focus-glow transition-all peer ${email && !isEmailValid ? '!border-destructive focus-within:!shadow-[0_0_0_2px_rgba(239,68,68,0.4)]' : ''}`}
                    placeholder=" "
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loginMutation.isPending}
                  />
                  <Label htmlFor="email" className={`absolute left-12 top-4 text-sm transition-all peer-focus:-translate-y-3 peer-focus:text-[10px] peer-focus:font-bold peer-placeholder-shown:translate-y-0 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-[:not(:placeholder-shown)]:-translate-y-3 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:font-bold pointer-events-none uppercase tracking-widest ${email && !isEmailValid ? 'text-destructive' : email && isEmailValid ? 'text-primary' : 'text-muted-foreground peer-focus:text-primary'}`}>
                    Email Address
                  </Label>
                  {email && isEmailValid && <CheckCircle2 className="absolute right-4 top-4 text-primary" size={18} />}
                </div>

                <div className="relative group">
                  <Lock className="absolute left-4 top-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10" size={18} />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    className="h-14 pl-12 pr-12 pt-4 bg-white/5 border-white/10 focus-glow transition-all peer"
                    placeholder=" "
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loginMutation.isPending}
                  />
                  <Label htmlFor="password" className="absolute left-12 top-4 text-sm text-muted-foreground transition-all peer-focus:-translate-y-3 peer-focus:text-[10px] peer-focus:text-primary peer-focus:font-bold peer-placeholder-shown:translate-y-0 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-[:not(:placeholder-shown)]:-translate-y-3 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:font-bold pointer-events-none uppercase tracking-widest">
                    Password
                  </Label>
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors z-10"
                    disabled={loginMutation.isPending}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                
                <div className="flex justify-end">
                  <Link href="/forgot-password" title="Forgot Password" className="text-[10px] uppercase font-bold text-primary hover:underline hover:text-primary/80 transition-colors">Forgot Password?</Link>
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-3"
                >
                  <AlertCircle className="text-destructive shrink-0" size={18} />
                  <p className="text-sm text-destructive font-bold">{error}</p>
                </motion.div>
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
