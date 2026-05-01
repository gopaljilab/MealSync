import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/components/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useLogin } from "@workspace/api-client-react";
import { toast } from "sonner";
import { UserRole } from "@workspace/api-client-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const loginMutation = useLogin();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("owner");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Try API login
      const response = await loginMutation.mutateAsync({ data: { email, password } });
      login(response.user);
      setLocation(`/dashboard/${response.user.role}`);
      toast.success("Logged in successfully");
    } catch (err) {
      // Fallback to mock auth
      console.warn("API login failed, using mock auth", err);
      const mockUser = {
        id: Math.floor(Math.random() * 1000),
        name: email.split("@")[0],
        email,
        role,
        pgName: role === "owner" ? "Mock PG" : undefined
      };
      login(mockUser);
      setLocation(`/dashboard/${role}`);
      toast.success("Logged in (Mock Mode)");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Enter your credentials to access your dashboard</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select 
                id="role"
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
              >
                <option value="owner">PG Owner</option>
                <option value="ngo">NGO</option>
                <option value="resident">Resident</option>
              </select>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? "Logging in..." : "Login"}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              Don't have an account? <Link href="/register" className="text-primary hover:underline">Register</Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
