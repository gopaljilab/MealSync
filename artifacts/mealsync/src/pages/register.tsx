import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/components/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useRegister, RegisterBodyRole } from "@workspace/api-client-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, 
  Users, 
  User, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  ShieldCheck,
  Building,
  Mail,
  Lock,
  Loader2,
  Eye,
  EyeOff
} from "lucide-react";

interface RegisteredPg {
  id: number;
  name: string;
  pgName: string;
}

export default function Register() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const registerMutation = useRegister();

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RegisterBodyRole>("owner");
  const [pgName, setPgName] = useState("");
  const [registeredPgs, setRegisteredPgs] = useState<RegisteredPg[]>([]);
  const [pgsLoading, setPgsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const isEmailValid = email === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const registrationDisabled =
    registerMutation.isPending || (role === "resident" && (pgsLoading || registeredPgs.length === 0 || !pgName));

  useEffect(() => {
    setPgsLoading(true);
    fetch("/api/pgs")
      .then((res) => (res.ok ? res.json() : []))
      .then((pgs: RegisteredPg[]) => setRegisteredPgs(pgs))
      .catch(() => setRegisteredPgs([]))
      .finally(() => setPgsLoading(false));
  }, []);

  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    
    if (score < 2) return { label: "Weak", color: "bg-red-500", width: "33%" };
    if (score < 4) return { label: "Medium", color: "bg-yellow-500", width: "66%" };
    return { label: "Strong", color: "bg-emerald-500", width: "100%" };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const response = await registerMutation.mutateAsync({
        data: {
          name,
          email,
          password,
          role,
          pgName: role === "owner" || role === "resident" ? pgName : undefined,
        },
      });
      login(response.user);
      setLocation(`/dashboard/${response.user.role}`);
      toast.success("Account created successfully");
    } catch (err: any) {
      const msg = err?.data?.error ?? "Registration failed. Please try again.";
      setError(msg);
      setStep(2); // Go back to account info if it failed there
    }
  };

  const nextStep = () => {
    if (step === 1 && role) setStep(2);
    else if (step === 2 && name && email && password) setStep(3);
  };

  const prevStep = () => setStep(step - 1);

  const RoleCard = ({ type, icon: Icon, title, desc }: { type: RegisterBodyRole, icon: any, title: string, desc: string }) => (
    <motion.div
      whileHover={{ y: -8, scale: 1.03 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => {
        setRole(type);
        setStep(2);
      }}
      className={`relative p-6 rounded-3xl border-2 cursor-pointer transition-all duration-300 overflow-hidden group ${
        role === type 
          ? "border-primary bg-primary/10 shadow-[0_0_30px_rgba(16,185,129,0.2)]" 
          : "border-white/10 glass hover:border-primary/50 hover:bg-white/5"
      }`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 transition-opacity duration-500 pointer-events-none ${role === type ? 'opacity-100' : 'group-hover:opacity-50'}`} />
      
      <div className={`relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-colors ${
        role === type ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(16,185,129,0.4)]" : "bg-white/10 text-muted-foreground group-hover:text-primary group-hover:bg-primary/20"
      }`}>
        <Icon size={28} />
      </div>
      <h3 className="relative z-10 text-xl font-black mb-2">{title}</h3>
      <p className="relative z-10 text-sm text-muted-foreground leading-relaxed">{desc}</p>
      
      {role === type && (
        <motion.div 
          layoutId="role-check"
          className="absolute top-6 right-6 text-primary z-10 bg-primary/20 rounded-full p-1 backdrop-blur-sm"
        >
          <CheckCircle2 size={24} className="animate-pulse" />
        </motion.div>
      )}
    </motion.div>
  );

  return (
    <div className="flex items-center justify-center min-h-[90vh] px-4 pt-20">
      <div className="w-full max-w-2xl">
        {/* Progress Indicator */}
        <div className="mb-12 flex justify-center items-center max-w-lg mx-auto">
          {[
            { id: 1, label: "Role" },
            { id: 2, label: "Details" },
            { id: 3, label: "Verify" }
          ].map((s, i) => (
            <div key={s.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-2 relative z-10">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-500 border-2 ${
                  step >= s.id ? "bg-primary border-primary text-primary-foreground scale-110 shadow-[0_0_15px_rgba(16,185,129,0.4)]" : "bg-white/5 border-white/10 text-muted-foreground"
                }`}>
                  {step > s.id ? <CheckCircle2 size={20} /> : s.id}
                </div>
                <span className={`text-xs font-bold uppercase tracking-widest absolute -bottom-6 whitespace-nowrap transition-colors ${
                  step >= s.id ? "text-primary" : "text-muted-foreground"
                }`}>
                  {s.label}
                </span>
              </div>
              {i < 2 && (
                <div className={`flex-1 h-1 mx-2 rounded-full transition-all duration-500 ${
                  step > s.id ? "bg-primary shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-white/10"
                }`} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h1 className="text-4xl font-black mb-3">Join the Ecosystem</h1>
                <p className="text-muted-foreground text-lg">Who are you representing today?</p>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                <RoleCard 
                  type="owner" 
                  icon={Building2} 
                  title="PG Owner" 
                  desc="Manage food surplus and optimize kitchen waste." 
                />
                <RoleCard 
                  type="ngo" 
                  icon={Users} 
                  title="NGO" 
                  desc="Collect surplus food and redistribute to communities." 
                />
                <RoleCard 
                  type="resident" 
                  icon={User} 
                  title="Resident" 
                  desc="Track meals, provide feedback, and reduce waste." 
                />
              </div>
              <div className="text-center text-sm text-muted-foreground">
                Already have an account? <Link href="/login" className="text-primary hover:underline font-bold">Login here</Link>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="glass border-white/10 overflow-hidden">
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-3xl font-black">Account Details</CardTitle>
                  <CardDescription>Enter your credentials to get started</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-4">
                    <div className="relative group">
                      <User className="absolute left-4 top-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10" size={18} />
                      <Input
                        required
                        id="name"
                        className="h-14 pl-12 pt-4 bg-white/5 border-white/10 focus-glow transition-all peer"
                        placeholder=" "
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                      <Label htmlFor="name" className="absolute left-12 top-4 text-sm text-muted-foreground transition-all peer-focus:-translate-y-3 peer-focus:text-[10px] peer-focus:text-primary peer-focus:font-bold peer-placeholder-shown:translate-y-0 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-[:not(:placeholder-shown)]:-translate-y-3 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:font-bold pointer-events-none uppercase tracking-widest">
                        Full Name
                      </Label>
                    </div>

                    <div className="relative group">
                      <Mail className={`absolute left-4 top-4 transition-colors z-10 ${email && !isEmailValid ? 'text-destructive' : email && isEmailValid ? 'text-primary' : 'text-muted-foreground group-focus-within:text-primary'}`} size={18} />
                      <Input
                        type="email"
                        required
                        id="email"
                        className={`h-14 pl-12 pt-4 bg-white/5 border-white/10 focus-glow transition-all peer ${email && !isEmailValid ? '!border-destructive focus-within:!shadow-[0_0_0_2px_rgba(239,68,68,0.4)]' : ''}`}
                        placeholder=" "
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <Label htmlFor="email" className={`absolute left-12 top-4 text-sm transition-all peer-focus:-translate-y-3 peer-focus:text-[10px] peer-focus:font-bold peer-placeholder-shown:translate-y-0 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-[:not(:placeholder-shown)]:-translate-y-3 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:font-bold pointer-events-none uppercase tracking-widest ${email && !isEmailValid ? 'text-destructive' : email && isEmailValid ? 'text-primary' : 'text-muted-foreground peer-focus:text-primary'}`}>
                        Email Address
                      </Label>
                      {email && isEmailValid && <CheckCircle2 className="absolute right-4 top-4 text-primary" size={18} />}
                    </div>

                    <div className="relative group">
                      <Lock className="absolute left-4 top-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10" size={18} />
                      <Input
                        type={showPassword ? "text" : "password"}
                        required
                        id="password"
                        className="h-14 pl-12 pr-12 pt-4 bg-white/5 border-white/10 focus-glow transition-all peer"
                        placeholder=" "
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <Label htmlFor="password" className="absolute left-12 top-4 text-sm text-muted-foreground transition-all peer-focus:-translate-y-3 peer-focus:text-[10px] peer-focus:text-primary peer-focus:font-bold peer-placeholder-shown:translate-y-0 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-[:not(:placeholder-shown)]:-translate-y-3 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:font-bold pointer-events-none uppercase tracking-widest">
                        Password
                      </Label>
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors z-10"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {password && (
                      <div className="pt-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground">Strength: {strength.label}</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: strength.width }}
                            className={`h-full ${strength.color} transition-all duration-500`}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 flex flex-col gap-3">
                    <Button variant="outline" className="h-12 border-white/10 hover:bg-white/5 flex items-center gap-2">
                      <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
                      Continue with Google
                    </Button>
                    <Button variant="outline" className="h-12 border-white/10 hover:bg-white/5 flex items-center gap-2">
                      <img src="https://www.microsoft.com/favicon.ico" className="w-4 h-4" alt="Microsoft" />
                      Continue with Microsoft
                    </Button>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between gap-4 border-t border-white/10 pt-6">
                  <Button variant="ghost" onClick={prevStep} className="flex items-center gap-2 h-12 px-6">
                    <ArrowLeft size={18} /> Back
                  </Button>
                  <Button onClick={nextStep} disabled={!name || !email || !password} className="flex items-center gap-2 h-12 px-8 glow-primary">
                    Next <ArrowRight size={18} />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="glass border-white/10 overflow-hidden">
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-3xl font-black">Final Details</CardTitle>
                  <CardDescription>Tell us a bit more about your {role}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  {role === "owner" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-widest font-bold text-muted-foreground">PG Name</Label>
                        <div className="relative group">
                          <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                          <Input
                            required
                            className="h-12 pl-12 bg-white/5 border-white/10 focus-glow transition-all"
                            placeholder="Emerald Heights PG"
                            value={pgName}
                            onChange={(e) => setPgName(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Location</Label>
                        <Input className="h-12 bg-white/5 border-white/10 focus-glow" placeholder="City, Area" />
                      </div>
                    </div>
                  )}

                  {role === "ngo" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Verification ID</Label>
                        <div className="relative group">
                          <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                          <Input
                            required
                            className="h-12 pl-12 bg-white/5 border-white/10 focus-glow transition-all"
                            placeholder="NGO-123456"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Operating Area</Label>
                        <Input className="h-12 bg-white/5 border-white/10 focus-glow" placeholder="South Delhi, Bangalore, etc." />
                      </div>
                    </div>
                  )}

                  {role === "resident" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Select Your PG</Label>
                        <div className="relative group">
                          <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                          <select
                            required
                            className="flex h-12 w-full items-center justify-between rounded-md border border-white/10 bg-white/5 pl-12 pr-3 py-2 text-sm focus-glow transition-all appearance-none outline-none"
                            value={pgName}
                            onChange={(e) => setPgName(e.target.value)}
                            disabled={pgsLoading || registeredPgs.length === 0}
                          >
                            <option value="" className="bg-background">
                              {pgsLoading
                                ? "Loading registered PGs..."
                                : registeredPgs.length === 0
                                  ? "No PGs registered yet"
                                  : "Choose a registered PG"}
                            </option>
                            {registeredPgs.map((pg) => (
                              <option key={pg.id} value={pg.pgName} className="bg-background">
                                {pg.pgName}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Room Number (Optional)</Label>
                        <Input className="h-12 bg-white/5 border-white/10 focus-glow" placeholder="B-102" />
                      </div>
                    </div>
                  )}

                  {error && (
                    <p className="text-sm text-destructive font-bold text-center">{error}</p>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between gap-4 border-t border-white/10 pt-6">
                  <Button variant="ghost" onClick={prevStep} className="flex items-center gap-2 h-12 px-6">
                    <ArrowLeft size={18} /> Back
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={registrationDisabled} 
                    className="flex items-center gap-2 h-12 px-10 glow-primary font-bold"
                  >
                    {registerMutation.isPending ? (
                      <>
                        <Loader2 className="animate-spin" size={18} /> Creating...
                      </>
                    ) : (
                      <>
                        Complete Registration <CheckCircle2 size={18} />
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
