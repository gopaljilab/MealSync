import { useState, useEffect, useCallback } from "react";
import {
  useGetOwnerStats, getGetOwnerStatsQueryKey,
  useGetGreenScore, getGetGreenScoreQueryKey,
  useGetDailyTrends, getGetDailyTrendsQueryKey,
  useListMeals, getListMealsQueryKey,
  useGetTodaysMenu, getGetTodaysMenuQueryKey,
  useUpsertTodaysMenu, useDeleteTodaysMenu,
  useCreateMeal, usePredictMeal, useReportLeftover, useNotifyNgo, Meal,
} from "@workspace/api-client-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from "recharts";
import { useQueryClient } from "@tanstack/react-query";
import { useCountUp } from "@/hooks/useCountUp";
import {
  SectionContainer,
  SectionHeading,
  GlassCard,
  PremiumCard,
  GlowButton,
  StatusBadge,
  DashboardCard,
  FloatingLabelInput,
  PremiumSkeleton,
  PageShell,
  ContentSection,
} from "@/components/ui/premium";
import {
  Award,
  Utensils,
  Brain,
  AlertTriangle,
  Volume2,
  VolumeX,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  Activity,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Label } from "@/components/ui/label";

interface RawMaterial { ingredient: string; quantity: number; unit: string }
interface RawMaterialsData { items: RawMaterial[]; basedOnMeals: number }
interface WasteCostData { costPerMeal: number; totalLeftover: number; totalCostLost: number; wastePercent: number; weeklyBreakdown: { date: string; menu: string; leftover: number; costLost: number }[]; currency: string }
interface Suggestion { type: "warning" | "tip" | "info"; message: string }
interface SuggestionsData { suggestions: Suggestion[]; weatherNote: string; weekend: boolean; rainy: boolean }
interface GlobalImpact { totalMealsSaved: number; totalWasteKg: number; totalNgoPickups: number; totalMealsRedistributed: number; totalResidentResponses: number; co2Prevented: number }

const SUGGESTION_ICONS: Record<Suggestion["type"], string> = { warning: "⚠️", tip: "💡", info: "✅" };
const SUGGESTION_STYLES: Record<Suggestion["type"], string> = {
  warning: "border-l-[var(--status-warning)] text-[var(--status-warning-text)] bg-[var(--status-warning-bg)] border-[var(--status-warning)]/20",
  tip: "border-l-[var(--status-info)] text-[var(--status-info)] bg-[var(--status-info-bg)] border-[var(--status-info)]/20",
  info: "border-l-[var(--status-success)] text-[var(--status-success-text)] bg-[var(--status-success-bg)] border-[var(--status-success)]/20",
};

/* ─── SVG Arc Gauge ─────────────────────────────────────────── */
function ProductionDial({ predicted, actual, max }: { predicted: number; actual: number; max: number }) {
  const safMax = Math.max(max, 1);
  const pPct = Math.min(predicted / safMax, 1);
  const aPct = Math.min(actual / safMax, 1);

  function arcPath(pct: number, r: number) {
    const startAngle = -225 * (Math.PI / 180);
    const sweep = 270 * (Math.PI / 180) * pct;
    const endAngle = startAngle + sweep;
    const x1 = 60 + r * Math.cos(startAngle), y1 = 60 + r * Math.sin(startAngle);
    const x2 = 60 + r * Math.cos(endAngle), y2 = 60 + r * Math.sin(endAngle);
    const large = sweep > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  }

  function fullArc(r: number) {
    const s = -225 * (Math.PI / 180);
    const e = 45 * (Math.PI / 180);
    const x1 = 60 + r * Math.cos(s), y1 = 60 + r * Math.sin(s), x2 = 60 + r * Math.cos(e), y2 = 60 + r * Math.sin(e);
    return `M ${x1} ${y1} A ${r} ${r} 0 1 1 ${x2} ${y2}`;
  }

  const isOptimal = aPct >= pPct * 0.9;
  const isUnder = aPct >= pPct * 0.7;

  const color = isOptimal ? "var(--status-success)" : isUnder ? "var(--status-warning)" : "var(--status-danger)";
  const label = isOptimal ? "Optimized" : isUnder ? "Processing" : "Underprepared";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width="120" height="100" viewBox="0 0 120 120">
          <path d={fullArc(42)} fill="none" stroke="var(--border-subtle)" strokeWidth="10" strokeLinecap="round" />
          {pPct > 0 && <path d={arcPath(pPct, 42)} fill="none" stroke="var(--border-strong)" strokeWidth="10" strokeLinecap="round" style={{ transition: "all 1s ease-out" }} />}
          {aPct > 0 && <path d={arcPath(aPct, 42)} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" style={{ transition: "all 1.2s ease-out" }} />}
          <text x="60" y="62" textAnchor="middle" fontSize="18" fontWeight="900" letterSpacing="-0.05em" className="fill-[var(--text-primary)]">{actual}</text>
          <text x="60" y="78" textAnchor="middle" fontSize="8" fontWeight="700" letterSpacing="0.05em" className="fill-[var(--text-muted)] uppercase">prepared</text>
        </svg>
      </div>
      <StatusBadge status={label} />
      <p className="text-xs text-[var(--text-secondary)] font-medium">Target: <span className="font-bold text-[var(--text-primary)]">{predicted}</span></p>
    </div>
  );
}

/* ─── Circular progress (attendance) ───────────────────────── */
function CircularProgress({ value, max, label, color = "var(--brand-accent)" }: { value: number; max: number; label: string; color?: string }) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const r = 36, circ = 2 * Math.PI * r, dash = circ * pct;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-20 w-20">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r={r} fill="none" stroke="var(--border-subtle)" strokeWidth="6" />
          <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="6" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition: "stroke-dasharray 1s ease-out" }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-black text-sm text-[var(--text-primary)] tracking-tighter">{Math.round(pct * 100)}%</span>
        </div>
      </div>
      <span className="text-xs text-[var(--text-secondary)] font-semibold uppercase tracking-wider text-center leading-none">{label}</span>
      <span className="text-xs font-bold text-[var(--text-primary)]">{value}/{max}</span>
    </div>
  );
}

function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const count = useCountUp(Math.round(value));
  return <span>{prefix}{count}{suffix}</span>;
}

/* ─── What-If Planner ───────────────────────────────────────── */
const INGREDIENT_RATIOS: { name: string; per: number; unit: string }[] = [
  { name: "Rice", per: 0.15, unit: "kg" },
  { name: "Dal", per: 0.05, unit: "kg" },
  { name: "Roti flour", per: 0.08, unit: "kg" },
  { name: "Vegetables", per: 0.10, unit: "kg" },
  { name: "Oil", per: 0.015, unit: "L" },
  { name: "Spices", per: 0.008, unit: "kg" },
];

function WhatIfPlanner({ basePeople }: { basePeople: number }) {
  const [count, setCount] = useState(Math.max(basePeople, 20));
  return (
    <GlassCard>
      <div className="mb-4">
        <h3 className="text-base font-black tracking-tight text-[var(--text-primary)] flex items-center gap-2">
          <Layers size={16} className="text-[var(--brand-accent)]" />
          <span>What-If Planner</span>
        </h3>
        <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">Adjust headcount and see live ingredient estimates</p>
      </div>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-baseline mb-2">
            <Label className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-bold">Residents</Label>
            <span className="text-sm font-black text-[var(--brand-accent)]">{count}</span>
          </div>
          <input
            type="range" min={10} max={300} step={5} value={count}
            onChange={e => setCount(Number(e.target.value))}
            className="w-full h-1 bg-[var(--border-strong)] rounded-full accent-[var(--brand-accent)] cursor-pointer transition-all"
          />
          <div className="flex justify-between text-[10px] font-bold text-[var(--text-muted)] mt-1"><span>10</span><span>300</span></div>
        </div>
        <div className="rounded-2xl border border-[var(--border-strong)] overflow-hidden divide-y divide-[var(--border-strong)]">
          {INGREDIENT_RATIOS.map((ing, i) => (
            <div key={ing.name} className={`flex justify-between px-3.5 py-2.5 text-xs font-medium ${i % 2 === 0 ? "bg-[var(--surface-secondary)]" : "bg-[var(--surface-primary)]"}`}>
              <span className="text-[var(--text-muted)]">{ing.name}</span>
              <span className="text-[var(--text-primary)] font-bold">{(ing.per * count).toFixed(1)} {ing.unit}</span>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

function TodaysMenuCard() {
  const queryClient = useQueryClient();
  const { data: menuData, isLoading } = useGetTodaysMenu({ query: { queryKey: getGetTodaysMenuQueryKey() } });
  const upsert = useUpsertTodaysMenu();
  const deleteMenu = useDeleteTodaysMenu();

  const [breakfastMenu, setBreakfastMenu] = useState("");
  const [breakfastTime, setBreakfastTime] = useState("");
  const [lunchMenu, setLunchMenu] = useState("");
  const [lunchTime, setLunchTime] = useState("");
  const [dinnerMenu, setDinnerMenu] = useState("");
  const [dinnerTime, setDinnerTime] = useState("");
  const [expectedPeople, setExpectedPeople] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (menuData) {
      setBreakfastMenu(menuData.breakfastMenu || "");
      setBreakfastTime(menuData.breakfastTime || "");
      setLunchMenu(menuData.lunchMenu || "");
      setDinnerMenu(menuData.dinnerMenu || "");
      setLunchTime(menuData.lunchTime || "");
      setDinnerTime(menuData.dinnerTime || "");
      setExpectedPeople(menuData.expectedPeople ? String(menuData.expectedPeople) : "");
      setNotes(menuData.notes || "");
    }
  }, [menuData]);

  const validate = () => {
    if ((!breakfastMenu && !lunchMenu && !dinnerMenu) || !expectedPeople) {
      toast.error("Please provide at least one meal and expected residents");
      return false;
    }
    if (Number(expectedPeople) <= 0) {
      toast.error("Expected residents must be > 0");
      return false;
    }
    return true;
  };

  const handleSaveDraft = async () => {
    if (!validate()) return;
    try {
      await upsert.mutateAsync({ data: { breakfastMenu, breakfastTime, lunchMenu, dinnerMenu, lunchTime, dinnerTime, expectedPeople: Number(expectedPeople), notes, status: "draft" }});
      toast.success("✓ Draft saved");
      queryClient.invalidateQueries({ queryKey: getGetTodaysMenuQueryKey() });
    } catch { toast.error("Failed to save draft"); }
  };

  const handlePublish = async () => {
    if (!validate()) return;
    try {
      await upsert.mutateAsync({ data: { breakfastMenu, breakfastTime, lunchMenu, dinnerMenu, lunchTime, dinnerTime, expectedPeople: Number(expectedPeople), notes, status: "published" }});
      toast.success("✓ Menu published");
      queryClient.invalidateQueries({ queryKey: getGetTodaysMenuQueryKey() });
    } catch { toast.error("Failed to publish menu"); }
  };

  const handleUpdate = async () => {
    if (!validate()) return;
    try {
      await upsert.mutateAsync({ data: { breakfastMenu, breakfastTime, lunchMenu, dinnerMenu, lunchTime, dinnerTime, expectedPeople: Number(expectedPeople), notes, status: menuData?.status as any || "draft" }});
      toast.success("✓ Menu updated");
      queryClient.invalidateQueries({ queryKey: getGetTodaysMenuQueryKey() });
    } catch { toast.error("Failed to update menu"); }
  };

  const handleDelete = async () => {
    try {
      await deleteMenu.mutateAsync();
      toast.success("✓ Draft deleted");
      setBreakfastMenu(""); setBreakfastTime(""); setLunchMenu(""); setDinnerMenu(""); setLunchTime(""); setDinnerTime(""); setExpectedPeople(""); setNotes("");
      queryClient.invalidateQueries({ queryKey: getGetTodaysMenuQueryKey() });
      queryClient.setQueryData(getGetTodaysMenuQueryKey(), null);
    } catch { toast.error("Failed to delete draft"); }
  };

  const isSaving = upsert.isPending || deleteMenu.isPending;
  const isDraft = menuData?.status === "draft";
  const isPublished = menuData?.status === "published";
  
  // Assume for now that if it's published, we don't allow edits unless we explicitly want to (based on resident responses).
  // The user requested context-aware buttons:
  // New menu: Save Draft, Publish Menu
  // Draft exists: Update Draft, Publish Menu, Delete Draft
  // Published menu: Update Menu, (and form read-only if responses exist... since we don't have responses yet, we keep it editable or completely read-only based on the "UX improvement" note)
  // UX Improvement: "After publishing, make the form read-only and display a status badge (e.g. 🟢 Published)"
  const readOnly = isPublished;

  if (isLoading) return <GlassCard><PremiumSkeleton className="h-40 w-full" /></GlassCard>;

  return (
    <GlassCard>
      <div className="mb-4 flex justify-between items-start">
        <div>
          <h3 className="text-base font-black tracking-tight text-[var(--text-primary)] flex items-center gap-2">
            <Utensils size={16} className="text-[var(--brand-accent)]" />
            Today's Menu
          </h3>
          <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">Manage and publish today's meals</p>
        </div>
        {isPublished && (
          <div className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-[var(--status-success-bg)] border border-[var(--status-success)]/20 text-[var(--status-success)] flex items-center gap-1.5 select-none">
            <span>🟢 Published</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="col-span-2 text-xs font-black uppercase tracking-wider text-[var(--brand-accent)] mt-2">🍳 Breakfast</div>
        <div className="space-y-1">
          <Label className="text-[9px] uppercase tracking-wider font-black text-[var(--text-muted)]">Menu</Label>
          <input disabled={readOnly} value={breakfastMenu} onChange={e => setBreakfastMenu(e.target.value)} placeholder="E.g. Poha + Tea" className="w-full h-9 px-3 rounded-lg text-xs bg-[var(--surface-secondary)] border border-[var(--border-strong)] focus:outline-none focus:border-[var(--brand-accent)]/50 text-[var(--text-primary)] disabled:opacity-60" />
        </div>
        <div className="space-y-1">
          <Label className="text-[9px] uppercase tracking-wider font-black text-[var(--text-muted)]">Time</Label>
          <input disabled={readOnly} value={breakfastTime} onChange={e => setBreakfastTime(e.target.value)} type="time" className="w-full h-9 px-3 rounded-lg text-xs bg-[var(--surface-secondary)] border border-[var(--border-strong)] focus:outline-none focus:border-[var(--brand-accent)]/50 text-[var(--text-primary)] disabled:opacity-60" />
        </div>

        <div className="col-span-2 text-xs font-black uppercase tracking-wider text-[var(--brand-accent)] mt-2">🍛 Lunch</div>
        <div className="space-y-1">
          <Label className="text-[9px] uppercase tracking-wider font-black text-[var(--text-muted)]">Menu</Label>
          <input disabled={readOnly} value={lunchMenu} onChange={e => setLunchMenu(e.target.value)} placeholder="E.g. Rajma Chawal" className="w-full h-9 px-3 rounded-lg text-xs bg-[var(--surface-secondary)] border border-[var(--border-strong)] focus:outline-none focus:border-[var(--brand-accent)]/50 text-[var(--text-primary)] disabled:opacity-60" />
        </div>
        <div className="space-y-1">
          <Label className="text-[9px] uppercase tracking-wider font-black text-[var(--text-muted)]">Time</Label>
          <input disabled={readOnly} value={lunchTime} onChange={e => setLunchTime(e.target.value)} type="time" className="w-full h-9 px-3 rounded-lg text-xs bg-[var(--surface-secondary)] border border-[var(--border-strong)] focus:outline-none focus:border-[var(--brand-accent)]/50 text-[var(--text-primary)] disabled:opacity-60" />
        </div>

        <div className="col-span-2 text-xs font-black uppercase tracking-wider text-[var(--brand-accent)] mt-2">🍽 Dinner</div>
        <div className="space-y-1">
          <Label className="text-[9px] uppercase tracking-wider font-black text-[var(--text-muted)]">Menu</Label>
          <input disabled={readOnly} value={dinnerMenu} onChange={e => setDinnerMenu(e.target.value)} placeholder="E.g. Paneer Butter Masala" className="w-full h-9 px-3 rounded-lg text-xs bg-[var(--surface-secondary)] border border-[var(--border-strong)] focus:outline-none focus:border-[var(--brand-accent)]/50 text-[var(--text-primary)] disabled:opacity-60" />
        </div>
        <div className="space-y-1">
          <Label className="text-[9px] uppercase tracking-wider font-black text-[var(--text-muted)]">Time</Label>
          <input disabled={readOnly} value={dinnerTime} onChange={e => setDinnerTime(e.target.value)} type="time" className="w-full h-9 px-3 rounded-lg text-xs bg-[var(--surface-secondary)] border border-[var(--border-strong)] focus:outline-none focus:border-[var(--brand-accent)]/50 text-[var(--text-primary)] disabled:opacity-60" />
        </div>
        
        <div className="col-span-2 border-t border-[var(--border-subtle)] my-2"></div>

        <div className="space-y-1">
          <Label className="text-[9px] uppercase tracking-wider font-black text-[var(--text-muted)]">Expected Residents</Label>
          <input disabled={readOnly} value={expectedPeople} onChange={e => setExpectedPeople(e.target.value)} type="number" placeholder="50" className="w-full h-9 px-3 rounded-lg text-xs bg-[var(--surface-secondary)] border border-[var(--border-strong)] focus:outline-none focus:border-[var(--brand-accent)]/50 text-[var(--text-primary)] disabled:opacity-60" />
        </div>
        <div className="space-y-1">
          <Label className="text-[9px] uppercase tracking-wider font-black text-[var(--text-muted)]">Notes (Optional)</Label>
          <input disabled={readOnly} value={notes} onChange={e => setNotes(e.target.value)} placeholder="E.g. Less spicy" className="w-full h-9 px-3 rounded-lg text-xs bg-[var(--surface-secondary)] border border-[var(--border-strong)] focus:outline-none focus:border-[var(--brand-accent)]/50 text-[var(--text-primary)] disabled:opacity-60" />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-3 border-t border-[var(--border-subtle)]">
        {isSaving ? (
          <GlowButton disabled variant="outline" className="w-full h-9 text-xs rounded-xl border-[var(--border-strong)] bg-[var(--surface-secondary)]">Saving...</GlowButton>
        ) : (
          <>
            {!isPublished && !isDraft && (
              <>
                <GlowButton onClick={handleSaveDraft} variant="outline" className="flex-1 h-9 text-xs rounded-xl border-[var(--border-strong)] bg-[var(--surface-primary)] hover:bg-[var(--surface-secondary)]">Save Draft</GlowButton>
                <GlowButton onClick={handlePublish} className="flex-1 h-9 text-xs rounded-xl glow-primary">Publish Menu</GlowButton>
              </>
            )}
            {isDraft && (
              <>
                <GlowButton onClick={handleUpdate} variant="outline" className="flex-1 h-9 text-xs rounded-xl border-[var(--border-strong)] bg-[var(--surface-primary)] hover:bg-[var(--surface-secondary)]">Update Draft</GlowButton>
                <GlowButton onClick={handlePublish} className="flex-1 h-9 text-xs rounded-xl glow-primary">Publish Menu</GlowButton>
                <GlowButton onClick={handleDelete} variant="outline" className="h-9 text-xs rounded-xl border-red-500/20 text-red-500 bg-red-500/5 hover:bg-red-500/10">Delete Draft</GlowButton>
              </>
            )}
            {isPublished && (
              <GlowButton onClick={handleUpdate} variant="outline" className="flex-1 h-9 text-xs rounded-xl border-[var(--border-strong)] bg-[var(--surface-primary)] hover:bg-[var(--surface-secondary)]">Update Menu</GlowButton>
            )}
          </>
        )}
      </div>
    </GlassCard>
  );
}

export default function OwnerDashboard() {
  const queryClient = useQueryClient();
  const { data: stats, isLoading: statsLoading } = useGetOwnerStats({ query: { queryKey: getGetOwnerStatsQueryKey() } });
  const { data: greenScore, isLoading: greenLoading } = useGetGreenScore({ query: { queryKey: getGetGreenScoreQueryKey() } });
  const { data: trends, isLoading: trendsLoading } = useGetDailyTrends({ query: { queryKey: getGetDailyTrendsQueryKey() } });
  const { data: meals, isLoading: mealsLoading } = useListMeals({ query: { queryKey: getListMealsQueryKey() } });

  const [rawMaterials, setRawMaterials] = useState<RawMaterialsData | null>(null);
  const [wasteCost, setWasteCost] = useState<WasteCostData | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionsData | null>(null);
  const [globalImpact, setGlobalImpact] = useState<GlobalImpact | null>(null);
  const [nudgeSent, setNudgeSent] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const createMeal = useCreateMeal();
  const predictMeal = usePredictMeal();
  const reportLeftover = useReportLeftover();
  const notifyNgo = useNotifyNgo();
  const [menu, setMenu] = useState("");
  const [expectedPeople, setExpectedPeople] = useState("");

  const fetchIntelligence = useCallback(() => {
    const creds = { credentials: "include" as const };
    fetch("/api/intelligence/raw-materials", creds).then(r => r.ok ? r.json() : null).then(d => d && setRawMaterials(d)).catch(() => { });
    fetch("/api/intelligence/waste-cost", creds).then(r => r.ok ? r.json() : null).then(d => d && setWasteCost(d)).catch(() => { });
    fetch("/api/intelligence/suggestions", creds).then(r => r.ok ? r.json() : null).then(d => d && setSuggestions(d)).catch(() => { });
    fetch("/api/intelligence/global-impact", creds).then(r => r.ok ? r.json() : null).then(d => d && setGlobalImpact(d)).catch(() => { });
  }, []);

  useEffect(() => { fetchIntelligence(); }, [fetchIntelligence]);

  const handlePredictMeals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menu || !expectedPeople) { toast.error("Please fill all fields"); return; }
    try {
      const meal = await createMeal.mutateAsync({ data: { menu, expectedPeople: Number(expectedPeople) } });
      const prediction = await predictMeal.mutateAsync({ id: meal.id });
      toast.success(`🎯 ${prediction.predictedMeals} meals predicted for "${menu}"`);
      queryClient.invalidateQueries({ queryKey: getListMealsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetOwnerStatsQueryKey() });
      fetchIntelligence();
      setMenu(""); setExpectedPeople("");
    } catch { toast.error("Failed to predict meals."); }
  };

  const handleVoiceSummary = () => {
    if (!("speechSynthesis" in window)) { toast.error("Voice not supported in this browser"); return; }
    window.speechSynthesis.cancel();
    const parts = [
      `Good ${new Date().getHours() < 12 ? "morning" : "afternoon"}, here is your MealSync summary.`,
      `Total meals today: ${stats?.totalMealsToday ?? 0}.`,
      `AI prediction: ${stats?.predictedMeals ?? 0} meals needed.`,
      `Green score: ${greenScore?.score ?? 0} percent.`,
      wasteCost ? `This week, food waste cost you ${wasteCost.totalCostLost} rupees.` : "",
      suggestions?.suggestions[0] ? suggestions.suggestions[0].message : "",
      "That's your summary. Have a great day!",
    ].filter(Boolean).join(" ");
    const utter = new SpeechSynthesisUtterance(parts);
    utter.rate = 0.92; utter.pitch = 1;
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utter);
    toast.success("🔊 Reading summary...");
  };

  const todayMeals = meals?.filter((m: Meal) => {
    const d = new Date(m.date), t = new Date();
    return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
  }) ?? [];

  const totalResidents = stats?.predictedMeals ?? 0;
  const respondedCount = Math.floor((stats?.totalMealsToday ?? 0) * 0.6);
  const estimatedSavings = wasteCost ? Math.max(0, ((stats?.predictedMeals ?? 0) - (stats?.leftoverMeals ?? 0)) * wasteCost.costPerMeal) : 0;
  const heatmapDays = trends?.slice(-7) ?? [];
  const actionSuggestion = suggestions?.suggestions.find(s => s.type === "warning") ?? suggestions?.suggestions[0];

  const [weekSchedule, setWeekSchedule] = useState<Record<string, { lunch: string; dinner: string }>>({
    Monday: { lunch: "", dinner: "" },
    Tuesday: { lunch: "", dinner: "" },
    Wednesday: { lunch: "", dinner: "" },
    Thursday: { lunch: "", dinner: "" },
    Friday: { lunch: "", dinner: "" },
    Saturday: { lunch: "", dinner: "" },
    Sunday: { lunch: "", dinner: "" },
  });
  const [scheduleSaving, setScheduleSaving] = useState(false);

  // Auto-save debounce simulation
  useEffect(() => {
    const t = setTimeout(() => {
      if (Object.values(weekSchedule).some(d => d.lunch || d.dinner)) {
        setScheduleSaving(true);
        setTimeout(() => setScheduleSaving(false), 800);
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [weekSchedule]);

  const copyLastWeek = () => {
    setWeekSchedule({
      Monday: { lunch: "Rajma Chawal", dinner: "Paneer Butter Masala" },
      Tuesday: { lunch: "Chole Bhature", dinner: "Dal Makhani" },
      Wednesday: { lunch: "Veg Biryani", dinner: "Aloo Gobi" },
      Thursday: { lunch: "Kadhi Pakora", dinner: "Mix Veg" },
      Friday: { lunch: "Dal Tadka", dinner: "Malai Kofta" },
      Saturday: { lunch: "Puri Sabzi", dinner: "Matar Paneer" },
      Sunday: { lunch: "Idli Sambar", dinner: "Pav Bhaji" },
    });
    toast.success("Copied previous week's menu");
  };

  return (
    <PageShell>
      <ContentSection
        title="Owner Command"
        description="Real-time optimization matrix for your PG kitchen."
        action={
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[var(--brand-accent)] animate-pulse-ring" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--brand-accent)] hidden sm:inline-block">Operational Core</span>
            </div>
            {suggestions?.weatherNote && (
              <div className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-[var(--surface-secondary)] border border-[var(--border-strong)] text-[var(--text-muted)] flex items-center gap-1.5 select-none hidden md:flex">
                <span>🌤️</span>
                <span>{suggestions.weatherNote}</span>
              </div>
            )}
            <GlowButton variant="outline" className="gap-2 rounded-xl h-10 border-[var(--border-strong)] bg-[var(--surface-primary)]" onClick={handleVoiceSummary} disabled={speaking}>
              {speaking ? <VolumeX size={14} className="animate-pulse" /> : <Volume2 size={14} />}
              <span className="text-xs font-bold">{speaking ? "Speaking..." : "Read Summary"}</span>
            </GlowButton>
          </div>
        }
      />

      {/* Action Banner */}
      {actionSuggestion && (
        <div className={`flex items-start gap-4 rounded-2xl p-5 border-l-4 shadow-sm animate-slide-up bg-[var(--surface-secondary)] border-[var(--border-strong)] ${
          actionSuggestion.type === "warning" ? "border-l-[var(--status-warning)]" : "border-l-[var(--brand-accent)]"
        }`}>
          <span className="text-2xl shrink-0 mt-0.5">{actionSuggestion.type === "warning" ? "⚠️" : "💡"}</span>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Operational Suggestion</p>
            <p className="font-bold text-sm text-[var(--text-primary)] leading-snug">{actionSuggestion.message}</p>
          </div>
        </div>
      )}

      {/* Primary Metrics (Max 4 per row rule) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Meals Today"
          value={statsLoading ? <PremiumSkeleton className="h-8 w-16" /> : <AnimatedNumber value={stats?.totalMealsToday ?? 0} />}
          delta={statsLoading ? undefined : "Active"}
          deltaType="success"
          subtext="Prepared target"
          icon={Utensils}
        />
        <DashboardCard
          title="Predicted Need"
          value={statsLoading ? <PremiumSkeleton className="h-8 w-16" /> : <AnimatedNumber value={stats?.predictedMeals ?? 0} />}
          delta={statsLoading ? undefined : "Optimized"}
          deltaType="neutral"
          subtext="AI smart target"
          icon={Brain}
        />
        <DashboardCard
          title="Surplus Leftover"
          value={statsLoading ? <PremiumSkeleton className="h-8 w-16" /> : <AnimatedNumber value={stats?.leftoverMeals ?? 0} />}
          delta={statsLoading ? undefined : stats?.leftoverMeals && stats.leftoverMeals >= 10 ? "Alert" : "Confirmed"}
          deltaType={stats?.leftoverMeals && stats.leftoverMeals >= 10 ? "warning" : "success"}
          subtext="Overproduction leftover"
          icon={AlertTriangle}
        />
        <PremiumCard className="flex flex-col justify-between border-[var(--brand-accent)]/20 shadow-sm bg-[var(--brand-accent)]/5">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--brand-accent)]">Eco Performance</span>
            </div>
            <div className="text-4xl font-black tracking-tight text-[var(--text-primary)] mt-3">
              {greenLoading ? <PremiumSkeleton className="h-10 w-24" /> : <AnimatedNumber value={greenScore?.score ?? 0} suffix="%" />}
            </div>
            <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase mt-2">Green Score</p>
          </div>
        </PremiumCard>
      </div>

      {/* Production Dial + Savings + Attendance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="flex flex-col justify-between p-6">
          <div className="mb-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-[var(--text-muted)]">Production Dial</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Prepared vs AI predicted target</p>
          </div>
          <div className="flex justify-center py-4">
            <ProductionDial
              predicted={stats?.predictedMeals ?? 0}
              actual={stats?.totalMealsToday ?? 0}
              max={Math.max((stats?.predictedMeals ?? 0) * 1.2, 10)}
            />
          </div>
        </GlassCard>

        <GlassCard className="flex flex-col justify-between overflow-hidden p-6">
          <div className="mb-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-[var(--text-muted)]">Estimated Savings</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Prevented loss in monetary value</p>
          </div>
          <div className="py-2">
            <div className="text-4xl font-black tracking-tighter text-[var(--brand-accent)]">
              {wasteCost ? <AnimatedNumber prefix="₹" value={estimatedSavings} /> : "—"}
            </div>
            <p className="text-xs text-[var(--text-muted)] font-semibold mt-1">Calculated at ₹{wasteCost?.costPerMeal ?? 80}/meal</p>
          </div>
          <div className="border-t border-[var(--border-subtle)] pt-4 flex justify-between items-center text-xs mt-auto">
            <span className="text-[var(--text-muted)] font-medium">Surplus cost loss</span>
            <span className="font-bold text-[var(--status-danger)]">₹{wasteCost ? Math.max(0, (stats?.leftoverMeals ?? 0) * wasteCost.costPerMeal) : 0} lost</span>
          </div>
        </GlassCard>

        <GlassCard className="flex flex-col justify-between p-6">
          <div className="mb-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-[var(--text-muted)]">Live Attendance</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Resident check-in response rate</p>
          </div>
          <div className="flex items-center gap-6 py-2">
            <CircularProgress value={respondedCount} max={totalResidents > 0 ? totalResidents : Math.max(respondedCount, 10)} label="Responded" />
            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-xs font-semibold"><span className="text-[var(--text-muted)]">Confirmed</span><span className="font-bold text-[var(--brand-accent)]">{respondedCount}</span></div>
              <div className="flex justify-between text-xs font-semibold"><span className="text-[var(--text-muted)]">Expected</span><span className="font-bold text-[var(--text-primary)]">{stats?.predictedMeals ?? 0}</span></div>
              <GlowButton size="sm" variant="outline" className="w-full rounded-xl text-xs h-9 border-[var(--border-strong)] bg-[var(--surface-primary)] mt-2" disabled={nudgeSent} onClick={() => { setNudgeSent(true); toast.success("📲 Reminder sent to all residents!"); setTimeout(() => setNudgeSent(false), 10000); }}>
                {nudgeSent ? "✅ Sent" : "📲 Nudge All"}
              </GlowButton>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Asymmetrical Dashboard Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Span 2: Main Operational Tools (Scheduler, Forms) */}
        <div className="lg:col-span-2 space-y-6">
          
          <TodaysMenuCard />

          {/* Weekly Meal Scheduler */}
          <GlassCard className="p-0 overflow-hidden">
            <div className="p-5 border-b border-[var(--border-subtle)] bg-[var(--surface-secondary)] flex justify-between items-center">
              <div>
                <h3 className="text-base font-black tracking-tight text-[var(--text-primary)] flex items-center gap-2">
                  <Calendar size={16} className="text-[var(--brand-accent)]" />
                  Weekly Meal Scheduler
                </h3>
                <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">Plan menus to enable predictive intelligence</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-black uppercase tracking-wider transition-opacity ${scheduleSaving ? "opacity-100 text-[var(--text-muted)]" : "opacity-0"}`}>Saving...</span>
                <GlowButton size="sm" variant="outline" className="h-8 rounded-lg text-[10px] font-bold border-[var(--border-strong)] bg-[var(--surface-primary)]" onClick={copyLastWeek}>Copy Last Week</GlowButton>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--surface-primary)] border-b border-[var(--border-strong)] text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">
                    <th className="p-4 w-32 border-r border-[var(--border-subtle)]">Day</th>
                    <th className="p-4 border-r border-[var(--border-subtle)]">Lunch Menu</th>
                    <th className="p-4">Dinner Menu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)] text-sm font-semibold text-[var(--text-primary)] bg-[var(--surface-primary)]">
                  {Object.entries(weekSchedule).map(([day, meals]) => (
                    <tr key={day} className="hover:bg-[var(--surface-secondary)]/50 transition-colors">
                      <td className="p-4 border-r border-[var(--border-subtle)]">{day}</td>
                      <td className="p-2 border-r border-[var(--border-subtle)]">
                        <input
                          type="text"
                          placeholder="E.g. Rajma Chawal"
                          value={meals.lunch}
                          onChange={e => setWeekSchedule(s => ({ ...s, [day]: { ...s[day], lunch: e.target.value } }))}
                          className="w-full h-9 px-3 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-[var(--brand-accent)] rounded-lg text-xs placeholder:text-[var(--text-muted)]/50"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          placeholder="E.g. Paneer Butter Masala"
                          value={meals.dinner}
                          onChange={e => setWeekSchedule(s => ({ ...s, [day]: { ...s[day], dinner: e.target.value } }))}
                          className="w-full h-9 px-3 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-[var(--brand-accent)] rounded-lg text-xs placeholder:text-[var(--text-muted)]/50"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>

          {/* Today's Operational Logging */}
          <GlassCard>
            <div className="mb-4">
              <h3 className="text-base font-black tracking-tight text-[var(--text-primary)]">Operational Logging</h3>
              <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">Log actual served meals and notify surplus</p>
            </div>
            {mealsLoading ? (
              <div className="space-y-3">
                <PremiumSkeleton className="h-24 w-full" />
                <PremiumSkeleton className="h-24 w-full" />
              </div>
            ) : todayMeals.length === 0 ? (
              <div className="text-center py-8 text-[var(--text-muted)] border border-dashed border-[var(--border-strong)] rounded-2xl bg-[var(--surface-secondary)]">
                <p className="text-xs font-semibold uppercase tracking-wider">No active meals planned today</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todayMeals.map((meal: Meal) => (
                  <MealCard
                    key={meal.id}
                    meal={meal}
                    onReport={reportLeftover}
                    onNotify={notifyNgo}
                    queryClient={queryClient}
                    onUpdate={fetchIntelligence}
                  />
                ))}
              </div>
            )}
          </GlassCard>
          
        </div>

        {/* Right Span 1: Analytics, Heatmap, Planning */}
        <div className="space-y-6">
          {/* Smart Suggestions */}
          {suggestions && suggestions.suggestions.length > 0 && (
            <GlassCard data-testid="card-suggestions">
              <div className="mb-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-[var(--text-muted)]">Smart Insights</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">AI optimizations based on resident metrics and weather</p>
              </div>
              <div className="space-y-3">
                {suggestions.suggestions.map((s, i) => (
                  <div key={i} className={`flex gap-3 items-start text-xs px-4 py-3.5 rounded-xl border border-l-4 font-medium transition-all ${SUGGESTION_STYLES[s.type]} animate-slide-up`} style={{ animationDelay: `${i * 100}ms` }}>
                    <span className="text-base shrink-0 mt-0.5">{SUGGESTION_ICONS[s.type]}</span>
                    <span className="leading-relaxed">{s.message}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          <WhatIfPlanner basePeople={Number(expectedPeople) || stats?.predictedMeals || 50} />

          {/* Waste Heatmap */}
          {heatmapDays.length > 0 && (
            <GlassCard>
              <div className="mb-4">
                <h3 className="text-base font-black tracking-tight text-[var(--text-primary)]">Waste Intensity</h3>
                <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">Surplus distribution over the last 7 cycles</p>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {heatmapDays.map((day: any, i: number) => {
                  const pct = (day.predicted ?? 0) > 0 ? (day.leftover ?? 0) / (day.predicted ?? 1) : 0;
                  const bg = pct > 0.25
                    ? "border-[var(--status-danger)] bg-[var(--status-danger-bg)] text-[var(--status-danger-text)]"
                    : pct > 0.1
                      ? "border-[var(--status-warning)] bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]"
                      : "border-[var(--status-success)] bg-[var(--status-success-bg)] text-[var(--status-success-text)]";
                  return (
                    <div key={i} className={`rounded-xl p-2 text-center border transition-all hover:scale-[1.02] cursor-default ${bg}`} title={`${day.date}: ${day.leftover ?? 0} leftover`}>
                      <p className="text-[9px] font-black opacity-70 uppercase">{typeof day.date === "string" ? day.date.slice(-5) : ""}</p>
                      <p className="text-sm font-black mt-1 leading-none">{day.leftover ?? 0}</p>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          )}

          {/* Waste-to-Cost */}
          {wasteCost && (
            <GlassCard data-testid="card-waste-cost">
              <div className="mb-4">
                <h3 className="text-base font-black tracking-tight text-[var(--text-primary)]">Loss Metrics Matrix</h3>
                <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">Financial translation of raw surplus wastage</p>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="p-3 rounded-2xl bg-[var(--status-danger-bg)] text-center border border-[var(--status-danger)]/20">
                  <p className="text-xl font-black text-[var(--status-danger)]">₹<AnimatedNumber value={wasteCost.totalCostLost} /></p>
                  <p className="text-[9px] font-bold text-[var(--status-danger-text)] uppercase mt-1 tracking-wider">Loss</p>
                </div>
                <div className="p-3 rounded-2xl bg-[var(--surface-secondary)] text-center border border-[var(--border-strong)]">
                  <p className="text-xl font-black text-[var(--text-primary)]"><AnimatedNumber value={wasteCost.totalLeftover} /></p>
                  <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase mt-1 tracking-wider">Meals</p>
                </div>
                <div className="p-3 rounded-2xl bg-[var(--surface-secondary)] text-center border border-[var(--border-strong)]">
                  <p className="text-xl font-black text-[var(--text-primary)]"><AnimatedNumber value={wasteCost.wastePercent} suffix="%" /></p>
                  <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase mt-1 tracking-wider">Rate</p>
                </div>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] font-semibold mt-3 uppercase">Unit Index Base: ₹{wasteCost.costPerMeal}/meal</p>
            </GlassCard>
          )}
        </div>
      </div>
      
      {/* Global Impact Dashboard */}
      {globalImpact && (
        <GlassCard className="overflow-hidden shadow-sm" data-testid="card-global-impact">
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-accent)] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--brand-accent)]">Global Synced Platform</span>
            </div>
            <h3 className="text-base font-black tracking-tight text-[var(--text-primary)] mt-1">Ecosystem Impact Matrix</h3>
            <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">Aggregated optimizations compiled across PGs and NGOs</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { value: globalImpact.totalMealsSaved, label: "Meals Saved", color: "text-[var(--brand-accent)] bg-[var(--brand-accent)]/5 border-[var(--brand-accent)]/10" },
              { value: globalImpact.totalMealsRedistributed, label: "Redistributed", color: "text-[var(--text-primary)] bg-[var(--surface-secondary)] border-[var(--border-strong)]" },
              { value: globalImpact.totalNgoPickups, label: "NGO Pickups", color: "text-[var(--text-primary)] bg-[var(--surface-secondary)] border-[var(--border-strong)]" },
              { value: globalImpact.totalWasteKg, label: "Waste Reduced (kg)", color: "text-[var(--text-primary)] bg-[var(--surface-secondary)] border-[var(--border-strong)]" },
              { value: globalImpact.co2Prevented, label: "CO₂ Avoided (kg)", color: "text-[var(--brand-accent)] bg-[var(--brand-accent)]/5 border-[var(--brand-accent)]/10" },
              { value: globalImpact.totalResidentResponses, label: "Confirmations", color: "text-[var(--text-primary)] bg-[var(--surface-secondary)] border-[var(--border-strong)]" },
            ].map(({ value, label, color }, i) => (
              <div key={i} className={`rounded-2xl p-4 text-center border ${color}`}>
                <p className="text-xl font-black tracking-tighter"><AnimatedNumber value={value} /></p>
                <p className="text-[10px] font-bold text-[var(--text-muted)] mt-1 uppercase tracking-wider leading-tight">{label}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </PageShell>
  );
}

function MealCard({ meal, onReport, onNotify, queryClient, onUpdate }: {
  meal: Meal; onReport: ReturnType<typeof useReportLeftover>; onNotify: ReturnType<typeof useNotifyNgo>;
  queryClient: ReturnType<typeof useQueryClient>; onUpdate: () => void;
}) {
  const [leftover, setLeftover] = useState(meal.leftoverMeals?.toString() ?? "");
  const [actual, setActual] = useState(meal.actualServed?.toString() ?? "");

  const handleReport = async () => {
    if (!leftover || !actual) { toast.error("Enter both values"); return; }
    try {
      const result: any = await onReport.mutateAsync({ id: meal.id, data: { leftoverMeals: Number(leftover), actualServed: Number(actual) } });
      toast.success(result?.autoNgoTriggered ? "💚 Saved! NGO auto-notified (≥10 meals)" : "✅ Leftover saved");
      queryClient.invalidateQueries({ queryKey: getListMealsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetOwnerStatsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetGreenScoreQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDailyTrendsQueryKey() });
      onUpdate();
    } catch { toast.error("Failed to save"); }
  };

  const handleNotify = async () => {
    try { await onNotify.mutateAsync({ id: meal.id }); toast.success("📱 NGO notified!"); queryClient.invalidateQueries({ queryKey: getListMealsQueryKey() }); }
    catch { toast.error("Failed"); }
  };

  const isCompleted = meal.status === "completed";

  return (
    <div className="p-4 rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-primary)] hover:bg-[var(--surface-secondary)] transition-colors animate-slide-up" data-testid={`card-meal-${meal.id}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="font-bold text-sm text-[var(--text-primary)]">{meal.menu}</p>
          <p className="text-[10px] text-[var(--text-secondary)] font-semibold mt-0.5">
            AI Target: <span className="text-[var(--text-primary)]">{meal.predictedMeals ?? "—"}</span> · Expected: <span className="text-[var(--text-primary)]">{meal.expectedPeople}</span>
          </p>
        </div>
        <StatusBadge status={meal.status === "served" ? "Processing" : meal.status === "completed" ? "Confirmed" : "Active"} />
      </div>
      {!isCompleted && (
        <div className="space-y-3 pt-3 border-t border-[var(--border-subtle)]">
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <Label className="text-[9px] uppercase tracking-wider font-black text-[var(--text-muted)]">Actual Served</Label>
              <input
                className="w-full h-8 rounded-lg text-xs bg-[var(--surface-secondary)] border border-[var(--border-strong)] px-2.5 font-bold focus:outline-none focus:border-[var(--brand-accent)]/50 text-[var(--text-primary)]"
                type="number" min="0" value={actual} onChange={e => setActual(e.target.value)}
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label className="text-[9px] uppercase tracking-wider font-black text-[var(--text-muted)]">Leftover</Label>
              <input
                className="w-full h-8 rounded-lg text-xs bg-[var(--surface-secondary)] border border-[var(--border-strong)] px-2.5 font-bold focus:outline-none focus:border-[var(--brand-accent)]/50 text-[var(--text-primary)]"
                type="number" min="0" value={leftover} onChange={e => setLeftover(e.target.value)}
              />
            </div>
          </div>
          {Number(leftover) >= 10 && !meal.ngoNotified && (
            <div className="text-[10px] font-bold text-[var(--status-warning-text)] bg-[var(--status-warning-bg)] rounded-lg px-3 py-2 border border-[var(--status-warning)]/20">
              ⚡ Auto-NGO notification will be triggered on save
            </div>
          )}
          <div className="flex gap-2">
            <GlowButton size="sm" variant="outline" className="flex-1 rounded-xl text-xs h-9 border-[var(--border-strong)] bg-[var(--surface-primary)]" onClick={handleReport} disabled={onReport.isPending}>Save Log</GlowButton>
            <GlowButton size="sm" className="flex-1 rounded-xl text-xs h-9 glow-primary" onClick={handleNotify} disabled={onNotify.isPending || !meal.leftoverMeals || meal.ngoNotified}>
              {meal.ngoNotified ? "Notified" : "Notify NGO"}
            </GlowButton>
          </div>
        </div>
      )}
    </div>
  );
}
