import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/components/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useRegister, RegisterBodyRole } from "@workspace/api-client-react";
import { toast } from "sonner";

interface RegisteredPg {
  id: number;
  name: string;
  pgName: string;
}

export default function Register() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const registerMutation = useRegister();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RegisterBodyRole>("owner");
  const [pgName, setPgName] = useState("");
  const [registeredPgs, setRegisteredPgs] = useState<RegisteredPg[]>([]);
  const [pgsLoading, setPgsLoading] = useState(false);
  const [error, setError] = useState("");
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

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>Join MealSync to start managing food waste</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="input-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="input-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="input-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={role}
                onChange={(e) => setRole(e.target.value as RegisterBodyRole)}
                data-testid="select-role"
              >
                <option value="owner">PG Owner</option>
                <option value="ngo">NGO</option>
                <option value="resident">Resident</option>
              </select>
            </div>
            {role === "owner" && (
              <div className="space-y-2">
                <Label htmlFor="pgName">PG Name</Label>
                <Input
                  id="pgName"
                  required
                  value={pgName}
                  onChange={(e) => setPgName(e.target.value)}
                  data-testid="input-pgname"
                />
              </div>
            )}
            {role === "resident" && (
              <div className="space-y-2">
                <Label htmlFor="pgName">Select Your PG</Label>
                <select
                  id="pgName"
                  required
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={pgName}
                  onChange={(e) => setPgName(e.target.value)}
                  disabled={pgsLoading || registeredPgs.length === 0}
                  data-testid="select-resident-pg"
                >
                  <option value="">
                    {pgsLoading
                      ? "Loading registered PGs..."
                      : registeredPgs.length === 0
                        ? "No PGs registered yet"
                        : "Choose a registered PG"}
                  </option>
                  {registeredPgs.map((pg) => (
                    <option key={pg.id} value={pg.pgName}>
                      {pg.pgName}
                    </option>
                  ))}
                </select>
                {registeredPgs.length === 0 && !pgsLoading && (
                  <p className="text-xs text-muted-foreground">
                    A PG Owner needs to register their PG before residents can join.
                  </p>
                )}
              </div>
            )}
            {error && (
              <p className="text-sm text-destructive" data-testid="text-register-error">{error}</p>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full"
              disabled={registrationDisabled}
              data-testid="button-register"
            >
              {registerMutation.isPending ? "Creating account..." : "Register"}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Login
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
