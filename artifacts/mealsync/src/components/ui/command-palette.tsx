import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from "./command";
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
  LayoutDashboard,
  Utensils,
  Leaf,
  Bell,
  Heart
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        {user?.role === "owner" && (
          <CommandGroup heading="Owner Actions">
            <CommandItem onSelect={() => runCommand(() => setLocation("/dashboard/owner"))}>
              <Utensils className="mr-2 h-4 w-4" />
              <span>Plan Weekly Meals</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setLocation("/dashboard/owner"))}>
              <Heart className="mr-2 h-4 w-4 text-amber-500" />
              <span>Log Surplus / Notify NGO</span>
              <CommandShortcut>⌘N</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setLocation("/dashboard/owner"))}>
              <Calculator className="mr-2 h-4 w-4" />
              <span>Open What-If Planner</span>
            </CommandItem>
          </CommandGroup>
        )}

        {user?.role === "resident" && (
          <CommandGroup heading="Resident Actions">
            <CommandItem onSelect={() => runCommand(() => setLocation("/dashboard/resident"))}>
              <Utensils className="mr-2 h-4 w-4" />
              <span>Confirm Next Meal</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setLocation("/dashboard/resident"))}>
              <Calendar className="mr-2 h-4 w-4" />
              <span>Update Weekly Schedule</span>
            </CommandItem>
          </CommandGroup>
        )}

        {user?.role === "ngo" && (
          <CommandGroup heading="NGO Actions">
            <CommandItem onSelect={() => runCommand(() => setLocation("/dashboard/ngo"))}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>View Active Donors</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setLocation("/dashboard/ngo"))}>
              <Leaf className="mr-2 h-4 w-4 text-green-500" />
              <span>View Impact Matrix</span>
            </CommandItem>
          </CommandGroup>
        )}

        <CommandGroup heading="System">
          <CommandItem onSelect={() => runCommand(() => setLocation(`/dashboard/${user?.role || 'owner'}`))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
            <CommandShortcut>⌘D</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setLocation("/dashboard/settings"))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setLocation("/dashboard/settings"))}>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
