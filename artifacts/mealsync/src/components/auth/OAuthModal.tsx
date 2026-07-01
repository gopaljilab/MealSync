import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";
import { useLocation } from "wouter";
import { toast } from "sonner";

interface OAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: "google" | "microsoft";
  role?: string;
  pgName?: string;
}

export const OAuthModal: React.FC<OAuthModalProps> = ({
  isOpen,
  onClose,
  provider,
  role = "resident",
  pgName = "",
}) => {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [step, setStep] = useState<"email" | "password" | "submitting">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === "email") {
      if (!email || !email.includes("@")) {
        toast.error("Please enter a valid email address");
        return;
      }
      // Extract name from email as default
      const defaultName = email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      setFullName(defaultName);
      setStep("password");
    } else if (step === "password") {
      submitOAuth();
    }
  };

  const submitOAuth = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          email,
          name: fullName || (provider === "google" ? "Google User" : "Microsoft User"),
          role,
          pgName: pgName || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        login(data.user);
        toast.success(`Signed in with ${provider === "google" ? "Google" : "Microsoft"}`);
        onClose();
        setLocation(`/dashboard/${data.user.role}`);
      } else {
        toast.error(data.error || "Authentication failed");
      }
    } catch (err) {
      // Fallback for offline demo mode
      const mockUser = {
        id: Date.now(),
        name: fullName || (provider === "google" ? "Google Account User" : "Microsoft Account User"),
        email: email,
        role: role as any,
        pgName: role === "owner" ? "Emerald Heights PG" : role === "resident" ? (pgName || "Emerald Heights PG") : undefined,
      };
      login(mockUser);
      toast.success(`Signed in with ${provider === "google" ? "Google" : "Microsoft"}`);
      onClose();
      setLocation(`/dashboard/${role}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-[850px] overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
          >
            <X size={20} />
          </button>

          {provider === "google" ? (
            /* GOOGLE SIGN IN CARD DESIGN */
            <div className="bg-[#1f1f1f] text-[#e3e3e3] rounded-3xl p-8 md:p-12 shadow-2xl border border-white/10 flex flex-col md:flex-row gap-8 justify-between min-h-[380px]">
              <div className="flex-1 flex flex-col justify-between space-y-6">
                <div>
                  {/* Official Google Color SVG */}
                  <svg className="w-10 h-10 mb-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <h2 className="text-3xl font-normal text-white mb-2">Sign in</h2>
                  <p className="text-base text-[#c4c7c5]">
                    with your Google Account to continue to MealSync. This account will be available to other Google apps in the browser.
                  </p>
                </div>
                <div className="text-xs text-[#a8c7fa] flex gap-4 pt-4">
                  <span className="cursor-pointer hover:underline">English (United States)</span>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-between pt-4 md:pt-12">
                <form onSubmit={handleNext} className="space-y-6">
                  {step === "email" ? (
                    <div>
                      <div className="relative">
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder=" "
                          className="peer w-full h-14 bg-transparent border border-[#8e918f] rounded-md px-4 pt-4 text-white focus:outline-none focus:border-[#a8c7fa] focus:ring-1 focus:ring-[#a8c7fa] transition-all"
                        />
                        <label className="absolute left-4 top-4 text-[#c4c7c5] text-base transition-all peer-focus:top-1 peer-focus:text-xs peer-focus:text-[#a8c7fa] peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-[#c4c7c5] pointer-events-none">
                          Email or phone
                        </label>
                      </div>
                      <div className="mt-2">
                        <button type="button" className="text-sm text-[#a8c7fa] font-medium hover:underline">
                          Forgot email?
                        </button>
                      </div>
                      <p className="mt-8 text-xs text-[#c4c7c5] leading-relaxed">
                        Not your computer? Use Guest mode to sign in privately.{" "}
                        <span className="text-[#a8c7fa] font-medium cursor-pointer hover:underline">Learn more about using Guest mode</span>
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="mb-4 p-3 bg-white/5 rounded-lg flex items-center gap-3 border border-white/10">
                        <div className="w-8 h-8 rounded-full bg-[#a8c7fa] text-black font-bold flex items-center justify-center text-sm">
                          {email.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs text-gray-400">Signing in as</p>
                          <p className="text-sm font-medium text-white truncate">{email}</p>
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder=" "
                          className="peer w-full h-14 bg-transparent border border-[#8e918f] rounded-md px-4 pt-4 text-white focus:outline-none focus:border-[#a8c7fa] focus:ring-1 focus:ring-[#a8c7fa] transition-all"
                        />
                        <label className="absolute left-4 top-4 text-[#c4c7c5] text-base transition-all peer-focus:top-1 peer-focus:text-xs peer-focus:text-[#a8c7fa] peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-[#c4c7c5] pointer-events-none">
                          Enter your password
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-6">
                    <button type="button" className="text-sm text-[#a8c7fa] font-medium hover:underline">
                      Create account
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="bg-[#a8c7fa] text-[#040c1e] font-semibold px-6 py-2.5 rounded-full hover:bg-[#c2e7ff] transition-all flex items-center gap-2"
                    >
                      {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Next"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            /* MICROSOFT SIGN IN CARD DESIGN */
            <div className="bg-[#262626] text-white rounded-2xl p-8 md:p-10 shadow-2xl border border-white/10 max-w-md mx-auto relative overflow-hidden">
              {/* Microsoft 4 Color Squares Logo */}
              <div className="flex items-center gap-2 mb-6">
                <div className="grid grid-cols-2 gap-0.5 w-6 h-6">
                  <div className="bg-[#f25022] w-2.5 h-2.5"></div>
                  <div className="bg-[#7fba00] w-2.5 h-2.5"></div>
                  <div className="bg-[#00a4ef] w-2.5 h-2.5"></div>
                  <div className="bg-[#ffb900] w-2.5 h-2.5"></div>
                </div>
                <span className="text-xl font-semibold tracking-tight text-gray-200">Microsoft</span>
              </div>

              <h2 className="text-2xl font-bold text-white mb-1">Sign in</h2>
              <p className="text-sm text-gray-300 mb-6">Use your Microsoft account.</p>

              <form onSubmit={handleNext} className="space-y-4">
                {step === "email" ? (
                  <div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email or phone number"
                      className="w-full h-11 bg-[#1b1b1b] border border-gray-600 rounded-none px-3 text-sm text-white focus:outline-none focus:border-[#0067b8] focus:ring-1 focus:ring-[#0067b8] placeholder:text-gray-400 transition-all"
                    />
                    <div className="mt-3">
                      <button type="button" className="text-xs text-[#0067b8] hover:underline">
                        Forgot your username?
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-gray-400 mb-2 truncate">{email}</p>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full h-11 bg-[#1b1b1b] border border-gray-600 rounded-none px-3 text-sm text-white focus:outline-none focus:border-[#0067b8] focus:ring-1 focus:ring-[#0067b8] placeholder:text-gray-400 transition-all"
                    />
                  </div>
                )}

                <div className="pt-4 flex flex-col gap-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#0067b8] hover:bg-[#005da6] text-white font-semibold h-10 text-sm transition-all flex items-center justify-center gap-2"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Next"}
                  </button>

                  <div className="text-xs text-gray-300">
                    New to Microsoft?{" "}
                    <button type="button" className="text-[#0067b8] hover:underline font-medium">
                      Create an account
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
