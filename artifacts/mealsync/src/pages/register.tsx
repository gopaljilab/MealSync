import React, { useEffect, useState, useCallback } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/components/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useRegister, RegisterBodyRole } from "@workspace/api-client-react";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft, Mail, Lock, Home, Users, User, Globe2, Globe, CheckCircle2 } from "lucide-react";

interface RegisteredPg {
  id: number;
  name: string;
  pgName: string;
}

const ROLE_DATA = {
  owner: {
    icon: Home,
    title: "PG Owner",
    desc: "Manage your PG meals, schedules, and resident coordination"
  },
  ngo: {
    icon: Users,
    title: "NGO",
    desc: "Request meals from PGs and distribute to those in need"
  },
  resident: {
    icon: User,
    title: "Resident", 
    desc: "View available meals and confirm your daily intake"
  }
} as Record<RegisterBodyRole, { icon: React.ComponentType; title: string; desc: string }>;

function PasswordStrength({ password }: { password: string }) {
  const score = password.length > 8 && /[A-Z]/.test(password) && /\d/.test(password) ? 100 : 30;
  const color = score > 50 ? "bg-green-500" : score > 20 ? "bg-yellow-500" : "bg-red-500";
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-medium text-muted-foreground">
        <span>Password Strength</span>
        <span>{score > 50 ? "Strong" : score > 20 ? "Medium" : "Weak"}</span>
      </div>
      <Progress value={score} className={`h-2 [&>div]:bg-gradient-to-r [&>div]:from-green-500 [&>div]:to-emerald-600 ${color === 'bg-green-500' ? '[&>div]:from-green-500 [&>div]:to-emerald-600' : color === 'bg-yellow-500' ? '[&>div]:from-yellow-500 [&>div]:to-amber-600' : '[&>div]:from-red-500 [&>div]:to-rose-600'}`} />
    </div>
  );
}

export default function Register() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const registerMutation = useRegister();

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<RegisterBodyRole>("owner");
  const [pgName, setPgName] = useState("");
  const [registeredPgs, setRegisteredPgs] = useState<RegisteredPg[]>([]);
  const [pgsLoading, setPgsLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = 5;

  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;

  // Validation
  const isStepValid = (() => {
    switch (currentStep) {
      case 0: return name.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      case 1: return !!role;
      case 2: 
        if (role === "resident") return !pgsLoading && registeredPgs.length > 0 && !!pgName;
        return !!pgName;
      case 3: return password.length >= 8 && password === confirmPassword;
      case 4: return true;
      default: return false;
    }
  })();

  const handleOAuth = useCallback((provider: string) => {
    toast.info(`Sign up with ${provider} coming soon!`);
  }, []);

  const nextStep = () => {
    if (isStepValid) setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => setCurrentStep((prev) => Math.max(0, prev - 1));

  // Preserve original PG fetch
  useEffect(() => {
    setPgsLoading(true);
    fetch("/api/pgs")
      .then((res) => (res.ok ? res.json() : []))
      .then((pgs: RegisteredPg[]) => setRegisteredPgs(pgs))
      .catch(() => setRegisteredPgs([]))
      .finally(() => setPgsLoading(false));
  }, []);

  useEffect(() => {
    setPgName("");
  }, [role]);

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
    }
  };

  const STEPS = [
    { title: "Identity", desc: "Tell us who you are" },
    { title: "Role", desc: "Choose your role" },
    { title: "Organization", desc: "Organization details" },
    { title: "Security", desc: "Create secure password" },
    { title: "Complete", desc: "Review & create account" }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-900/50 dark:to-slate-900 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-200/30 via-transparent to-blue-200/30 dark:from-emerald-900/30 dark:to-blue-900/30" />
      
      <Card className="w-full max-w-lg xl:max-w-2xl relative backdrop-blur-xl bg-white/20 dark:bg-black/20 border border-white/20 dark:border-white/10 shadow-2xl ring-1 ring-white/10 dark:ring-white/20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/50 to-blue-50/50 dark:from-slate-900/50 dark:to-slate-800/50 rounded-3xl blur-xl opacity-80" />
        
        {/* Progress Header */}
        <CardHeader className="text-center space-y-4 pb-8 pt-12">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-white/90 dark:bg-black/60 backdrop-blur-sm border border-white/60 shadow-2xl mx-auto mb-6">
            <Users className="h-12 w-12 text-primary" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-indigo-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent tracking-tight">
              Join MealSync
            </CardTitle>
            <CardDescription className="text-lg mt-1">
              Create your account in a few simple steps
            </CardDescription>
          </div>

          {/* Progress */}
          <div className="space-y-4">
            <Progress value={(currentStep / (totalSteps - 1)) * 100} className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:to-blue-600" />
            <div className="flex items-center justify-between text-sm font-medium">
              {STEPS.map((step, idx) => (
                <div key={idx} className={`flex flex-col items-center gap-1 group ${currentStep > idx ? "text-emerald-600" : currentStep === idx ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                  <div className={`w-3 h-3 rounded-full transition-all duration-300 ${currentStep > idx ? "bg-emerald-500 scale-110 shadow-lg shadow-emerald-500/25" : currentStep === idx ? "bg-primary border-2 border-primary/50 shadow-lg shadow-primary/25" : "bg-background border-2 border-border hover:bg-muted shadow-md"}`} />
                  <span className="text-xs tracking-tight">{idx + 1}</span>
                </div>
              ))}
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">{STEPS[currentStep].title}</p>
              <p className="text-sm text-muted-foreground">{STEPS[currentStep].desc}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-0 space-y-8">
          {error && (
            <Badge variant="destructive" className="w-full h-12 p-4 text-sm justify-start">
              <CheckCircle2 className="h-4 w-4 mr-2" /> {error}
            </Badge>
          )}

          <form id="register-form" onSubmit={handleSubmit}>

          {/* Step Content */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="relative">
                  <Input
                    id="name"
                    required
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-14 pl-12 pr-4 peer ring-2 ring-transparent focus-visible:ring-emerald-500/50 focus-visible:shadow-glow transition-all hover:shadow-md"
                    data-testid="input-name"
                  />
                  <Label 
                    htmlFor="name"
                    className="absolute left-12 top-1/2 -translate-y-1/2 pointer-events-none text-sm transition-all peer-focus:-translate-y-3 peer-focus:scale-90 peer-valid:-translate-y-3 peer-valid:scale-90 bg-background/90 px-2 text-emerald-700 peer-focus:text-emerald-600"
                  >
                    Full Name
                  </Label>
                </div>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-14 pl-12 pr-4 peer ring-2 ring-transparent focus-visible:ring-blue-500/50 focus-visible:shadow-glow transition-all hover:shadow-md"
                    data-testid="input-email"
                  />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground peer-focus:text-blue-600 peer-focus:scale-110 transition-all" />
                  <Label 
                    htmlFor="email"
                    className="absolute left-12 top-1/2 -translate-y-1/2 pointer-events-none text-sm transition-all peer-focus:-translate-y-3 peer-focus:scale-90 peer-valid:-translate-y-3 peer-valid:scale-90 bg-background/90 px-2"
                  >
                    Email Address
                  </Label>
                </div>
              </div>

              <div className="space-y-3 pt-6">
                <div className="text-center text-sm font-medium text-muted-foreground py-4 border-t border-border/50">
                  Or continue with
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    className="h-14 border-2 hover:scale-[1.02] transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10"
                    onClick={() => handleOAuth('Google')}
                  >
<Globe2 className="h-5 w-5 mr-2" />
                    Google
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-14 border-2 hover:scale-[1.02] transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10"
                    onClick={() => handleOAuth('Microsoft')}
                  >
<Globe className="h-5 w-5 mr-2" />

                    Microsoft
                  </Button>
                </div>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="grid md:grid-cols-3 gap-4 max-w-md mx-auto">
              {Object.entries(ROLE_DATA).map(([roleKey, data]) => {
                const Icon = data.icon;
                const isSelected = role === roleKey as RegisterBodyRole;
                return (
                  <Card
                    key={roleKey}
                    className={`h-32 p-6 cursor-pointer group hover:scale-105 transition-all duration-300 border-2 hover:shadow-2xl hover:shadow-primary/20 hover:border-primary/50 relative overflow-hidden ${
                      isSelected ? "border-primary/70 bg-primary/5 shadow-2xl shadow-primary/25 ring-2 ring-primary/30" : "border-border/50 hover:border-primary/30"
                    }`}
                    onClick={() => setRole(roleKey as RegisterBodyRole)}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${
                      isSelected ? "from-primary/10 via-primary/5 to-primary/20" : "from-muted/20 group-hover:from-primary/10"
                    } transition-all duration-500`} />
                    <div className="relative z-10 flex flex-col items-center text-center h-full justify-center space-y-3">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                        isSelected ? "bg-primary/20 text-primary shadow-lg shadow-primary/30 scale-110" : "bg-background border hover:bg-primary/10 hover:text-primary hover:shadow-md hover:shadow-primary/20"
                      }`}>
                        <Icon className="h-8 w-8" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-lg leading-tight">{data.title}</h3>
                        <p className="text-sm text-muted-foreground leading-tight">{data.desc}</p>
                      </div>
                      {isSelected && (
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <div className="inline-flex p-4 bg-primary/10 rounded-2xl border border-primary/20">
                  {(() => {
                    const Icon = ROLE_DATA[role].icon;
                    return <Icon className="h-12 w-12 text-primary" />;
                  })()}
                </div>
                <h3 className="text-2xl font-bold mt-4 mb-2">{ROLE_DATA[role].title}</h3>
                <p className="text-muted-foreground text-lg">Enter your organization details</p>
              </div>

              {role === "resident" ? (
                <div className="space-y-4">
                  <div className="relative">
                    <Select value={pgName} onValueChange={setPgName} disabled={pgsLoading || registeredPgs.length === 0}>
                      <SelectTrigger className="h-14">
                        <SelectValue placeholder={pgsLoading ? "Loading PGs..." : registeredPgs.length === 0 ? "No PGs available" : "Select your PG"} />
                      </SelectTrigger>
                      <SelectContent>
                        {registeredPgs.map((pg) => (
                          <SelectItem key={pg.id} value={pg.pgName} data-testid="select-resident-pg">
                            {pg.pgName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {registeredPgs.length === 0 && !pgsLoading && (
                      <p className="text-xs text-muted-foreground mt-2">
                        A PG Owner needs to register their PG first.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <Input
                      id="pgName"
                      required
                      value={pgName}
                      onChange={(e) => setPgName(e.target.value)}
                      placeholder={role === "owner" ? "Your PG name" : "Your NGO name"}
                      className="h-14 pl-12 pr-4 peer ring-2 ring-transparent focus-visible:ring-primary/50 focus-visible:shadow-glow transition-all hover:shadow-md"
                      data-testid="input-pgname"
                    />
                    <Label 
                      htmlFor="pgName"
                      className="absolute left-12 top-4 text-sm font-medium text-muted-foreground peer-focus:text-primary"
                    >
                      {role === "owner" ? "PG Name" : "NGO Name"}
                    </Label>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <Lock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-2xl font-bold mb-2">Secure your account</h3>
                <p className="text-muted-foreground">Create a strong password to keep your account safe</p>
              </div>
              
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-14 pl-12 pr-4 peer ring-2 ring-transparent focus-visible:ring-emerald-500/50 focus-visible:shadow-glow transition-all hover:shadow-md"
                    data-testid="input-password"
                  />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground peer-focus:text-emerald-600 transition-colors" />
                  <Label 
                    htmlFor="password"
                    className="absolute left-12 top-1/2 -translate-y-1/2 pointer-events-none text-sm transition-all peer-focus:-translate-y-3 peer-focus:scale-90 bg-background/90 px-2"
                  >
                    Password
                  </Label>
                </div>
                
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-14 pl-12 pr-4 peer ring-2 ring-transparent focus-visible:ring-emerald-500/50 focus-visible:shadow-glow transition-all hover:shadow-md"
                  />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground peer-focus:text-emerald-600 transition-colors" />
                  <Label 
                    htmlFor="confirm-password"
                    className="absolute left-12 top-1/2 -translate-y-1/2 pointer-events-none text-sm transition-all peer-focus:-translate-y-3 peer-focus:scale-90 bg-background/90 px-2"
                  >
                    Confirm Password
                  </Label>
                </div>
                
                <PasswordStrength password={password} />
                
                {password && confirmPassword && password !== confirmPassword && (
                  <Badge variant="destructive" className="w-full h-10 justify-start">
                    Passwords do not match
                  </Badge>
                )}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6 text-center">
              <div className="inline-flex h-24 w-24 mx-auto bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-3xl items-center justify-center shadow-2xl">
                <CheckCircle2 className="h-12 w-12" />
              </div>
              
              <div>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-slate-700 dark:from-white bg-clip-text text-transparent mb-3">
                  Almost there!
                </h3>
                <p className="text-xl text-muted-foreground mb-8">Review your information and create account</p>
              </div>

              <div className="space-y-4 bg-background/60 backdrop-blur-sm rounded-2xl p-6 border border-border/50">
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <span className="text-muted-foreground">Name</span>
                    <Badge variant="secondary" className="w-full justify-start">{name}</Badge>
                  </div>
                  <div className="space-y-2">
                    <span className="text-muted-foreground">Email</span>
                    <Badge variant="secondary" className="w-full justify-start">{email}</Badge>
                  </div>
                  <div className="space-y-2">
                    <span className="text-muted-foreground">Role</span>
                    <Badge variant="default" className="capitalize">{ROLE_DATA[role].title}</Badge>
                  </div>
                  {(role === "owner" || role === "resident") && (
                    <div className="space-y-2">
                      <span className="text-muted-foreground">{role === "owner" ? "PG Name" : "PG"}</span>
                      <Badge variant="secondary" className="w-full justify-start">{pgName}</Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          </form>
        </CardContent>

        <CardFooter className="pt-12 pb-12 px-8 bg-gradient-to-r from-white/70 to-white/30 dark:from-black/50 dark:to-black/30 backdrop-blur-sm border-t border-border/30">
          <div className="flex items-center w-full gap-4">
            {!isFirstStep && (
              <Button
                variant="ghost"
                size="lg"
                onClick={prevStep}
                className="h-14 flex-1 hover:scale-105 transition-all duration-200 text-lg font-semibold"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Previous
              </Button>
            )}
            
            <div className="flex-1" />

            <Button
              type={isLastStep ? "submit" : "button"}
              form="register-form"
              onClick={isLastStep ? handleSubmit : nextStep}
              disabled={!isStepValid || registerMutation.isPending}
              className={`h-14 flex-1 text-lg font-semibold transition-all duration-200 shadow-lg ${
                isStepValid 
                  ? "bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 hover:scale-105 hover:shadow-glow-lg hover:shadow-emerald-500/25" 
                  : "bg-muted cursor-not-allowed"
              }`}
              data-testid="button-register"
            >
              {registerMutation.isPending ? (
                <>
                  <ArrowRight className="h-5 w-5 animate-spin mr-2" />
                  Creating...
                </>
              ) : isLastStep ? (
                <>
                  Create Account <ArrowRight className="h-5 w-5 ml-2 translate-x-0 group-hover:translate-x-2 transition-transform" />
                </>
              ) : (
                <>
                  Next Step <ArrowRight className="h-5 w-5 ml-2 translate-x-0 group-hover:translate-x-2 transition-transform" />
                </>
              )}
            </Button>
          </div>

          <Separator className="my-8" />
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary hover:text-primary/80 hover:underline transition-colors">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
