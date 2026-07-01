import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlowButton } from "@/components/ui/premium";
import { Mail, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const isEmailValid = email === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !isEmailValid) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to send reset link.");
      }

      setStatus("success");
      setMessage("If an account with this email exists, a password reset link has been sent.");
    } catch (err: any) {
      setStatus("error");
      setMessage(err?.message || "Unable to send reset link.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[90vh] px-4 pt-20">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Card className="overflow-hidden shadow-2xl p-0 md:p-0">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 glow-primary">
              <Mail className="text-primary" size={32} />
            </div>
            <CardTitle className="text-3xl font-black tracking-tight">Forgot Password</CardTitle>
            <CardDescription className="text-base">Enter your email to receive a secure password reset link.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-4">
                <div className="relative group">
                  <Mail className={`absolute left-4 top-4 transition-colors z-10 ${email && !isEmailValid ? 'text-destructive' : email && isEmailValid ? 'text-primary' : 'text-muted-foreground group-focus-within:text-primary'}`} size={18} />
                  <Input
                    id="forgot-email"
                    type="email"
                    required
                    autoComplete="email"
                    className={`h-14 pl-12 pt-4 bg-white/5 border-white/10 focus-glow transition-all peer ${email && !isEmailValid ? '!border-destructive focus-within:!shadow-[0_0_0_2px_rgba(239,68,68,0.4)]' : ''}`}
                    placeholder=" "
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={status === "loading"}
                  />
                  <Label htmlFor="forgot-email" className={`absolute left-12 top-4 text-sm transition-all peer-focus:-translate-y-3 peer-focus:text-[10px] peer-focus:font-bold peer-placeholder-shown:translate-y-0 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-[:not(:placeholder-shown)]:-translate-y-3 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:font-bold pointer-events-none uppercase tracking-widest ${email && !isEmailValid ? 'text-destructive' : email && isEmailValid ? 'text-primary' : 'text-muted-foreground peer-focus:text-primary'}`}>
                    Email Address
                  </Label>
                  {email && isEmailValid && <CheckCircle2 className="absolute right-4 top-4 text-primary" size={18} />}
                </div>
              </div>

              {message && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`p-3 rounded-xl ${status === "success" ? "bg-primary/10 border border-primary/20 text-primary" : "bg-destructive/10 border border-destructive/20 text-destructive"} flex items-center gap-3`}>
                  {status === "success" ? <CheckCircle2 className="shrink-0" size={18} /> : <AlertCircle className="shrink-0" size={18} />}
                  <p className="text-sm font-bold">{message}</p>
                </motion.div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-4 pt-2 pb-8 px-6">
              <GlowButton type="submit" className="w-full h-12 text-lg font-bold" disabled={status === "loading"}>
                {status === "loading" ? <Loader2 className="animate-spin" size={18} /> : "Send Reset Link"}
              </GlowButton>

              <div className="text-sm text-center text-muted-foreground">
                <Link href="/login" className="text-primary hover:underline font-bold">
                  Back to login
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
