import { useState } from "react";
import {
  PageShell,
  ContentSection,
  SectionHeading,
  GlassCard,
  GlowButton,
  FloatingLabelInput,
} from "@/components/ui/premium";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings as SettingsIcon, Save, Bell, Users, DollarSign, Heart, Moon } from "lucide-react";
import { toast } from "sonner";
import { useDarkMode } from "@/hooks/useDarkMode";

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [dark, toggleDark] = useDarkMode();

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Settings saved successfully", {
        description: "Your workspace configuration has been updated."
      });
    }, 800);
  };

  return (
    <PageShell>
      <ContentSection>
        <div className="flex items-center justify-between mb-6">
          <SectionHeading icon={<SettingsIcon size={20} />} title="Workspace Settings" subtitle="Manage your PG configuration and automations" />
          <GlowButton onClick={handleSave} disabled={isSaving} className="glow-primary rounded-xl gap-2">
            <Save size={16} />
            {isSaving ? "Saving..." : "Save Changes"}
          </GlowButton>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <GlassCard>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Users size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-[var(--text-primary)]">Capacity & Operations</h3>
                  <p className="text-xs text-[var(--text-secondary)]">Manage your resident count and meal costs.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FloatingLabelInput id="pg-capacity" label="Total PG Capacity (Residents)" type="number" defaultValue="50" />
                <FloatingLabelInput id="cost-per-meal" label="Estimated Cost Per Meal (₹)" type="number" defaultValue="45" icon={<DollarSign size={16} />} />
              </div>
            </GlassCard>

            <GlassCard>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] flex items-center justify-center">
                  <Bell size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-[var(--text-primary)]">Automations & Nudges</h3>
                  <p className="text-xs text-[var(--text-secondary)]">Configure automatic reminders for your residents.</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold text-[var(--text-primary)]">WhatsApp Attendance Nudge</Label>
                    <p className="text-xs text-[var(--text-secondary)]">Automatically remind residents to confirm their meals 3 hours before serving.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="h-[1px] w-full bg-[var(--border-subtle)]" />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold text-[var(--text-primary)]">Smart Default Opt-in</Label>
                    <p className="text-xs text-[var(--text-secondary)]">Assume resident is eating unless they explicitly opt-out.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </GlassCard>
          </div>

          <div className="space-y-6">
            <GlassCard>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center">
                  <Heart size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-[var(--text-primary)]">NGO Integration</h3>
                  <p className="text-xs text-[var(--text-secondary)]">Connect with local food recovery partners.</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <FloatingLabelInput id="ngo-token" label="Partner API Token" type="password" defaultValue="token_123456789" />
                <div className="flex items-center justify-between pt-2">
                  <Label className="text-xs font-bold text-[var(--text-secondary)]">Auto-Notify on Surplus ({'>'}10 meals)</Label>
                  <Switch defaultChecked />
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                  <Moon size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-[var(--text-primary)]">Appearance</h3>
                  <p className="text-xs text-[var(--text-secondary)]">Theme preferences.</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-sm font-bold text-[var(--text-primary)]">Cinematic Dark Mode</Label>
                <Switch checked={dark} onCheckedChange={toggleDark} />
              </div>
            </GlassCard>
          </div>
        </div>
      </ContentSection>
    </PageShell>
  );
}
