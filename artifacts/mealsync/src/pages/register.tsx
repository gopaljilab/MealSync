import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/components/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useRegister, RegisterBodyRole } from "@workspace/api-client-react";
import { toast } from "sonner";

export default function Register() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const registerMutation = useRegister();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RegisterBodyRole>("owner");
  const [pgName, setPgName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await registerMutation.mutateAsync({ 
        data: { 
          name,
          email, 
          password,
          role,
          pgName: role === "owner" ? pgName : undefined
        } 
      });
      login(response.user);
      setLocation(`/dashboard/${response.user.role}`);
      toast.success("Registered successfully");
    } catch (err) {
      console.warn("API register failed, using mock auth", err);
      const mockUser = {
        id: Math.floor(Math.random() * 1000),
        name,
        email,
        role,
        pgName: role === "owner" ? pgName : undefined
      };
      login(mockUser);
      setLocation(`/dashboard/${role}`);
      toast.success("Registered (Mock Mode)");
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
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
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
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={role}
                onChange={(e) => setRole(e.target.value as RegisterBodyRole)}
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
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
              {registerMutation.isPending ? "Creating account..." : "Register"}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              Already have an account? <Link href="/login" className="text-primary hover:underline">Login</Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
