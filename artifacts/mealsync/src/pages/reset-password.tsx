import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlowButton } from "@/components/ui/premium";
import { Lock, Loader2, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [validateLoading, setValidateLoading] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [token, setToken] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token")?.trim() ?? "";
    if (!tokenParam) {
      setMessage("Invalid or expired reset link.");
      setStatus("error");
      setValidateLoading(false);
      return;
    }
    setToken(tokenParam);

    fetch(`/api/auth/reset-password?token=${encodeURIComponent(tokenParam)}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || "Invalid or expired reset link.");
        }
        setIsValidToken(true);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err?.message || "Invalid or expired reset link.");
      })
      .finally(() => setValidateLoading(false));
  }, []);

  const validatePassword = (password: string) => {
    return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePassword(newPassword)) {
      setStatus("error");
      setMessage("Password must be at least 8 characters and include a number.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: newPassword }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to reset password.");
      }

      setStatus("success");
      setMessage("Password updated successfully. Redirecting to login...");
      setTimeout(() => {
        setLocation("/login?reset=success");
      }, 1200);
    } catch (err: any) {
      setStatus("error");
      setMessage(err?.message || "Unable to reset password.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[90vh] px-4 pt-20">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Card className="overflow-hidden shadow-2xl p-0 md:p-0">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 glow-primary">
              <Lock className="text-primary" size={32} />
            </div>
            <CardTitle className="text-3xl font-black tracking-tight">Reset Password</CardTitle>
            <CardDescription className="text-base">Set a new password for your account.</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6 pt-6">
              {validateLoading && (
                <div className="p-4 rounded-xl bg-background/70 border border-border flex items-center justify-center">
                  <Loader2 className="animate-spin text-primary" size={20} />
                </div>
              )}

              {!validateLoading && !isValidToken && message && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-3">
                  <AlertCircle className="text-destructive shrink-0" size={18} />
                  <p className="text-sm text-destructive font-bold">{message}</p>
                </motion.div>
              )}

              {!validateLoading && isValidToken && (
                <div className="space-y-4">
                  <div className="relative group">
                    <Lock className="absolute left-4 top-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10" size={18} />
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      required
                      className="h-14 pl-12 pr-12 pt-4 bg-white/5 border-white/10 focus-glow transition-all peer"
                      placeholder=" "
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={status === "loading"}
                    />
                    <Label htmlFor="new-password" className="absolute left-12 top-4 text-sm text-muted-foreground transition-all peer-focus:-translate-y-3 peer-focus:text-[10px] peer-focus:text-primary peer-focus:font-bold peer-placeholder-shown:translate-y-0 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-[:not(:placeholder-shown)]:-translate-y-3 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:font-bold pointer-events-none uppercase tracking-widest">
                      New Password
                    </Label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors z-10"
                      disabled={status === "loading"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <div className="relative group">
                    <Lock className="absolute left-4 top-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10" size={18} />
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      className="h-14 pl-12 pr-12 pt-4 bg-white/5 border-white/10 focus-glow transition-all peer"
                      placeholder=" "
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={status === "loading"}
                    />
                    <Label htmlFor="confirm-password" className="absolute left-12 top-4 text-sm text-muted-foreground transition-all peer-focus:-translate-y-3 peer-focus:text-[10px] peer-focus:text-primary peer-focus:font-bold peer-placeholder-shown:translate-y-0 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-[:not(:placeholder-shown)]:-translate-y-3 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:font-bold pointer-events-none uppercase tracking-widest">
                      Confirm Password
                    </Label>
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors z-10"
                      disabled={status === "loading"}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {message && status !== "idle" && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`p-3 rounded-xl ${status === "success" ? "bg-primary/10 border border-primary/20 text-primary" : "bg-destructive/10 border border-destructive/20 text-destructive"} flex items-center gap-3`}>
                      {status === "success" ? <CheckCircle2 className="shrink-0" size={18} /> : <AlertCircle className="shrink-0" size={18} />}
                      <p className="text-sm font-bold">{message}</p>
                    </motion.div>
                  )}
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-4 pt-2 pb-8 px-6">
              {isValidToken && (
                <GlowButton type="submit" className="w-full h-12 text-lg font-bold" disabled={status === "loading"}>
                  {status === "loading" ? <Loader2 className="animate-spin" size={18} /> : "Update Password"}
                </GlowButton>
              )}

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
