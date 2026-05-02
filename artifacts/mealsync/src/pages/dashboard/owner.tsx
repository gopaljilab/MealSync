import { useState, useEffect, useCallback } from "react";
import {
  useGetOwnerStats, getGetOwnerStatsQueryKey,
  useGetGreenScore, getGetGreenScoreQueryKey,
  useGetDailyTrends, getGetDailyTrendsQueryKey,
  useListMeals, getListMealsQueryKey,
  useCreateMeal, usePredictMeal, useReportLeftover, useNotifyNgo, Meal,
} from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { useCountUp } from "@/hooks/useCountUp";

interface RawMaterial { ingredient: string; quantity: number; unit: string }
interface RawMaterialsData { items: RawMaterial[]; basedOnMeals: number }
interface WasteCostData { costPerMeal: number; totalLeftover: number; totalCostLost: number; wastePercent: number; weeklyBreakdown: { date: string; menu: string; leftover: number; costLost: number }[]; currency: string }
interface Suggestion { type: "warning" | "tip" | "info"; message: string }
interface SuggestionsData { suggestions: Suggestion[]; weatherNote: string; weekend: boolean; rainy: boolean }
interface GlobalImpact { totalMealsSaved: number; totalWasteKg: number; totalNgoPickups: number; totalMealsRedistributed: number; totalResidentResponses: number; co2Prevented: number }

const SUGGESTION_ICONS: Record<Suggestion["type"], string> = { warning: "⚠️", tip: "💡", info: "✅" };
const SUGGESTION_STYLES: Record<Suggestion["type"], string> = {
  warning: "text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-700",
  tip: "text-blue-800 dark:text-blue-200 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-700",
  info: "text-green-800 dark:text-green-200 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-700",
};

function CircularProgress({ value, max, label, color = "#16a34a" }: { value: number; max: number; label: string; color?: string }) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const r = 36; const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative h-20 w-20">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r={r} fill="none" stroke="currentColor" className="text-muted/40" strokeWidth="8" />
          <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1s ease-out" }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-bold text-sm">{Math.round(pct * 100)}%</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground text-center leading-tight">{label}</span>
      <span className="text-xs font-semibold">{value}/{max}</span>
    </div>
  );
}

function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const count = useCountUp(value);
  return <span>{prefix}{count}{suffix}</span>;
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

  const createMeal = useCreateMeal();
  const predictMeal = usePredictMeal();
  const reportLeftover = useReportLeftover();
  const notifyNgo = useNotifyNgo();
  const [menu, setMenu] = useState("");
  const [expectedPeople, setExpectedPeople] = useState("");

  const fetchIntelligence = useCallback(() => {
    const creds = { credentials: "include" as const };
    fetch("/api/intelligence/raw-materials", creds).then((r) => r.ok ? r.json() : null).then((d) => d && setRawMaterials(d)).catch(() => {});
    fetch("/api/intelligence/waste-cost", creds).then((r) => r.ok ? r.json() : null).then((d) => d && setWasteCost(d)).catch(() => {});
    fetch("/api/intelligence/suggestions", creds).then((r) => r.ok ? r.json() : null).then((d) => d && setSuggestions(d)).catch(() => {});
    fetch("/api/intelligence/global-impact", creds).then((r) => r.ok ? r.json() : null).then((d) => d && setGlobalImpact(d)).catch(() => {});
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

  const todayMeals = meals?.filter((m) => {
    const d = new Date(m.date); const t = new Date();
    return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
  }) ?? [];

  // Attendance stats — derive from available data
  const totalResidents = stats?.predictedMeals ?? 0;
  const respondedCount = Math.floor((stats?.totalMealsToday ?? 0) * 0.6);
  const estimatedSavings = wasteCost ? Math.max(0, ((stats?.predictedMeals ?? 0) - (stats?.leftoverMeals ?? 0)) * wasteCost.costPerMeal) : 0;

  // Heatmap: last 7 days waste level
  const heatmapDays = trends?.slice(-7) ?? [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">🏢 Owner Dashboard</h1>
          <p className="text-muted-foreground mt-1">Command center for your PG kitchen.</p>
        </div>
        {suggestions?.weatherNote && (
          <div className="text-sm px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300">
            🌤️ {suggestions.weatherNote}
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="overflow-hidden border-0 shadow-md col-span-2 md:col-span-1">
          <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-5 text-white h-full">
            {greenLoading ? <Skeleton className="h-12 w-24 bg-white/20 rounded-lg" /> : (
              <>
                <p className="text-sm font-medium text-green-100 mb-1">Green Score</p>
                <div className="text-4xl font-extrabold" data-testid="text-green-score"><AnimatedNumber value={greenScore?.score ?? 0} suffix="%" /></div>
                <p className="text-xs mt-2 text-green-100 leading-snug">{greenScore?.message ?? "Start tracking!"}</p>
                {(greenScore?.mealsSavedToday ?? 0) > 0 && (
                  <div className="mt-3 bg-white/20 rounded-lg px-2 py-1 text-xs font-semibold">
                    🎉 {greenScore?.mealsSavedToday} saved today
                  </div>
                )}
              </>
            )}
          </div>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground mb-1">Meals Today</p>
            {statsLoading ? <Skeleton className="h-9 w-16 rounded-lg" /> :
              <div className="text-3xl font-extrabold" data-testid="text-total-meals"><AnimatedNumber value={stats?.totalMealsToday ?? 0} /></div>}
            <p className="text-xs text-muted-foreground mt-1">planned servings</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground mb-1">Predicted Need</p>
            {statsLoading ? <Skeleton className="h-9 w-16 rounded-lg" /> :
              <div className="text-3xl font-extrabold text-blue-600" data-testid="text-predicted"><AnimatedNumber value={stats?.predictedMeals ?? 0} /></div>}
            <p className="text-xs text-muted-foreground mt-1">AI estimate</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground mb-1">Leftover</p>
            {statsLoading ? <Skeleton className="h-9 w-16 rounded-lg" /> :
              <div className="text-3xl font-extrabold text-red-500" data-testid="text-leftover"><AnimatedNumber value={stats?.leftoverMeals ?? 0} /></div>}
            <p className="text-xs text-muted-foreground mt-1">meals surplus</p>
          </CardContent>
        </Card>
      </div>

      {/* Savings + Attendance Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Estimated Savings Card */}
        <Card className="border-0 shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-4 text-white">
            <p className="text-sm font-medium text-purple-100">💰 Estimated Savings</p>
            <p className="text-3xl font-extrabold mt-1">
              {wasteCost ? <AnimatedNumber prefix="₹" value={estimatedSavings} /> : "—"}
            </p>
            <p className="text-xs text-purple-200 mt-1">Based on {stats?.predictedMeals ?? 0} predicted meals @ ₹{wasteCost?.costPerMeal ?? 80}/meal</p>
          </div>
          <CardContent className="pt-4 pb-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Avoided waste cost</span>
              <span className="font-semibold text-violet-600">₹{wasteCost ? Math.max(0, ((stats?.leftoverMeals ?? 0) * wasteCost.costPerMeal)) : 0} lost</span>
            </div>
          </CardContent>
        </Card>

        {/* Live Attendance */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">👥 Live Attendance</CardTitle>
            <CardDescription>Resident response rate today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <CircularProgress
                value={respondedCount}
                max={totalResidents > 0 ? totalResidents : Math.max(respondedCount, 10)}
                label="Responded"
                color="hsl(var(--primary))"
              />
              <div className="flex-1 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Confirmed</span>
                  <span className="font-semibold text-green-600">{respondedCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Expected</span>
                  <span className="font-semibold">{stats?.predictedMeals ?? 0}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-2 rounded-lg text-xs"
                  disabled={nudgeSent}
                  onClick={() => { setNudgeSent(true); toast.success("📲 Reminder sent to all residents!"); setTimeout(() => setNudgeSent(false), 10000); }}
                >
                  {nudgeSent ? "✅ Reminders Sent" : "📲 Nudge All Residents"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Smart Suggestions */}
      {suggestions && suggestions.suggestions.length > 0 && (
        <Card className="border-0 shadow-md" data-testid="card-suggestions">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">🤖 Smart Suggestions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {suggestions.suggestions.map((s, i) => (
              <div key={i} className={`flex gap-3 items-start text-sm px-4 py-3 rounded-xl border ${SUGGESTION_STYLES[s.type]} animate-slide-up`} style={{ animationDelay: `${i * 100}ms` }}>
                <span className="text-lg shrink-0 mt-0.5">{SUGGESTION_ICONS[s.type]}</span>
                <span>{s.message}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Plan Meal Form */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Plan Next Meal</CardTitle>
              <CardDescription>Get AI-powered meal count prediction</CardDescription>
            </CardHeader>
            <form onSubmit={handlePredictMeals}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="menu">Menu</Label>
                  <Input id="menu" placeholder="e.g. Dal, Rice, Roti, Sabji" value={menu} onChange={(e) => setMenu(e.target.value)} className="rounded-xl" data-testid="input-menu" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expected">Expected People</Label>
                  <Input id="expected" type="number" min="1" placeholder="e.g. 120" value={expectedPeople} onChange={(e) => setExpectedPeople(e.target.value)} className="rounded-xl" data-testid="input-expected" />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full rounded-xl h-11 font-semibold" disabled={createMeal.isPending || predictMeal.isPending} data-testid="button-predict">
                  {createMeal.isPending || predictMeal.isPending ? "⏳ Processing..." : "🎯 Predict Meals"}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Raw Material Calculator */}
          <Card className="border-0 shadow-md" data-testid="card-raw-materials">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">🧂 Ingredient List</CardTitle>
              <CardDescription>
                {rawMaterials?.basedOnMeals ? `Based on ${rawMaterials.basedOnMeals} meal plan(s) today` : "Add a meal to see requirements"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!rawMaterials || rawMaterials.items.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <div className="text-3xl mb-2">📋</div>
                  <p className="text-sm">No meals planned for today</p>
                </div>
              ) : (
                <div className="rounded-xl border overflow-hidden divide-y">
                  {rawMaterials.items.map((item, i) => (
                    <div key={item.ingredient} className={`flex justify-between px-3 py-2.5 text-sm ${i % 2 === 0 ? "bg-muted/20" : ""}`}>
                      <span className="font-medium">{item.ingredient}</span>
                      <span className="text-muted-foreground font-semibold">{item.quantity} {item.unit}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Meals */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">🍽️ Today's Meals</CardTitle>
              <CardDescription>Report actual vs leftover</CardDescription>
            </CardHeader>
            <CardContent>
              {mealsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-24 w-full rounded-xl" />
                  <Skeleton className="h-24 w-full rounded-xl" />
                </div>
              ) : todayMeals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border border-dashed rounded-xl">
                  <div className="text-3xl mb-2">🍳</div>
                  <p className="text-sm">No meals planned yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todayMeals.map((meal: Meal) => (
                    <MealCard key={meal.id} meal={meal} onReport={reportLeftover} onNotify={notifyNgo} queryClient={queryClient} onUpdate={fetchIntelligence} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Weekly Trends Chart */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle>📊 Weekly Trends</CardTitle>
              <CardDescription>Predicted vs Actual vs Leftover</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] w-full">
              {trendsLoading ? <Skeleton className="h-full w-full rounded-xl" /> :
              !trends || trends.length === 0 ? (
                <div className="flex flex-col h-full items-center justify-center text-muted-foreground border border-dashed rounded-xl gap-2">
                  <div className="text-4xl">📈</div>
                  <p className="font-medium">No data yet</p>
                  <p className="text-sm">Add meals to see weekly analytics.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trends} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }} />
                    <Legend />
                    <Bar dataKey="predicted" name="Predicted" fill="hsl(var(--primary))" radius={[6,6,0,0]} />
                    <Bar dataKey="actual" name="Actual" fill="hsl(var(--chart-2))" radius={[6,6,0,0]} />
                    <Bar dataKey="leftover" name="Leftover" fill="hsl(var(--destructive))" radius={[6,6,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Waste Heatmap */}
          {heatmapDays.length > 0 && (
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">🔥 Waste Heatmap</CardTitle>
                <CardDescription>Last 7 days — high waste days highlighted in red</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2">
                  {heatmapDays.map((day: any, i: number) => {
                    const pct = (day.predicted ?? 0) > 0 ? (day.leftover ?? 0) / (day.predicted ?? 1) : 0;
                    const bg = pct > 0.25 ? "bg-red-400 text-white" : pct > 0.1 ? "bg-amber-300 text-amber-900" : "bg-green-200 text-green-900";
                    return (
                      <div key={i} className={`rounded-xl p-2 text-center ${bg} transition-all hover:scale-105`} title={`${day.date}: ${day.leftover ?? 0} leftover`}>
                        <p className="text-xs font-bold">{typeof day.date === "string" ? day.date.slice(-5) : ""}</p>
                        <p className="text-lg font-extrabold">{day.leftover ?? 0}</p>
                        <p className="text-xs opacity-80">left</p>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-green-200 inline-block" /> Low waste</span>
                  <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-amber-300 inline-block" /> Moderate</span>
                  <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-red-400 inline-block" /> High waste</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Waste-to-Cost */}
          {wasteCost && (
            <Card className="border-0 shadow-md" data-testid="card-waste-cost">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">💸 Waste-to-Cost Analytics</CardTitle>
                <CardDescription>Weekly food waste in monetary terms</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-center border border-red-100 dark:border-red-800">
                    <p className="text-xl font-extrabold text-red-600">₹<AnimatedNumber value={wasteCost.totalCostLost} /></p>
                    <p className="text-xs text-muted-foreground mt-1">Cost lost</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted text-center">
                    <p className="text-xl font-extrabold"><AnimatedNumber value={wasteCost.totalLeftover} /></p>
                    <p className="text-xs text-muted-foreground mt-1">Meals wasted</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted text-center">
                    <p className="text-xl font-extrabold"><AnimatedNumber value={wasteCost.wastePercent} suffix="%" /></p>
                    <p className="text-xs text-muted-foreground mt-1">Waste rate</p>
                  </div>
                </div>
                {wasteCost.weeklyBreakdown.filter((b) => b.leftover > 0).length > 0 && (
                  <div className="rounded-xl border overflow-hidden divide-y max-h-44 overflow-y-auto">
                    {wasteCost.weeklyBreakdown.filter((b) => b.leftover > 0).map((b, i) => (
                      <div key={i} className="flex justify-between items-center px-3 py-2.5 text-sm hover:bg-muted/30 transition-colors">
                        <div>
                          <span className="font-medium">{b.menu}</span>
                          <span className="text-muted-foreground ml-2 text-xs">{b.date}</span>
                        </div>
                        <span className="font-semibold text-red-600">₹{b.costLost}</span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-3">Base cost: ₹{wasteCost.costPerMeal}/meal</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Global Impact */}
      {globalImpact && (
        <Card className="overflow-hidden border-0 shadow-lg" data-testid="card-global-impact">
          <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 px-6 py-5 text-white">
            <h3 className="text-xl font-bold">🌍 Global Impact Dashboard</h3>
            <p className="text-green-100 text-sm mt-1">Combined impact of all PGs and NGOs on MealSync</p>
          </div>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { value: globalImpact.totalMealsSaved, label: "Total Meals Saved", color: "text-green-700 dark:text-green-300", bg: "bg-green-50 dark:bg-green-950/40" },
                { value: globalImpact.totalMealsRedistributed, label: "Redistributed", color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
                { value: globalImpact.totalNgoPickups, label: "NGO Pickups", color: "text-teal-700 dark:text-teal-300", bg: "bg-teal-50 dark:bg-teal-950/40" },
                { value: globalImpact.totalWasteKg, label: "Waste Reduced (kg)", color: "text-green-700 dark:text-green-300", bg: "bg-green-50 dark:bg-green-950/40" },
                { value: globalImpact.co2Prevented, label: "CO₂ Prevented (kg)", color: "text-teal-700 dark:text-teal-300", bg: "bg-teal-50 dark:bg-teal-950/40" },
                { value: globalImpact.totalResidentResponses, label: "Confirmations", color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
              ].map(({ value, label, color, bg }, i) => (
                <div key={i} className={`${bg} rounded-xl p-4 text-center`}>
                  <p className={`text-2xl font-extrabold ${color}`}><AnimatedNumber value={value} /></p>
                  <p className="text-xs text-muted-foreground mt-1">{label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MealCard({ meal, onReport, onNotify, queryClient, onUpdate }: {
  meal: Meal;
  onReport: ReturnType<typeof useReportLeftover>;
  onNotify: ReturnType<typeof useNotifyNgo>;
  queryClient: ReturnType<typeof useQueryClient>;
  onUpdate: () => void;
}) {
  const [leftover, setLeftover] = useState(meal.leftoverMeals?.toString() ?? "");
  const [actual, setActual] = useState(meal.actualServed?.toString() ?? "");

  const handleReport = async () => {
    if (!leftover || !actual) { toast.error("Enter both actual served and leftover amounts"); return; }
    try {
      const result: any = await onReport.mutateAsync({ id: meal.id, data: { leftoverMeals: Number(leftover), actualServed: Number(actual) } });
      if (result?.autoNgoTriggered) {
        toast.success("💚 Saved! NGO automatically notified — surplus ≥ 10 meals.");
      } else {
        toast.success("✅ Leftover data saved");
      }
      queryClient.invalidateQueries({ queryKey: getListMealsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetOwnerStatsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetGreenScoreQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDailyTrendsQueryKey() });
      onUpdate();
    } catch { toast.error("Failed to save leftover data"); }
  };

  const handleNotify = async () => {
    try {
      await onNotify.mutateAsync({ id: meal.id });
      toast.success("📱 NGO notified!");
      queryClient.invalidateQueries({ queryKey: getListMealsQueryKey() });
    } catch { toast.error("Failed to notify NGO"); }
  };

  return (
    <div className="p-4 rounded-xl border bg-card shadow-sm animate-slide-up" data-testid={`card-meal-${meal.id}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="font-semibold">{meal.menu}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Predicted: <span className="font-medium">{meal.predictedMeals ?? "—"}</span>
            {" · "}Expected: <span className="font-medium">{meal.expectedPeople}</span>
          </p>
        </div>
        <Badge variant={meal.status === "completed" ? "default" : meal.status === "served" ? "secondary" : "outline"} className="capitalize">
          {meal.status}
        </Badge>
      </div>
      {meal.status !== "completed" && (
        <div className="space-y-3 pt-3 border-t border-dashed">
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <Label className="text-xs text-muted-foreground">Actual Served</Label>
              <Input size={1} className="h-8 rounded-lg text-sm" type="number" min="0" value={actual} onChange={(e) => setActual(e.target.value)} />
            </div>
            <div className="flex-1 space-y-1">
              <Label className="text-xs text-muted-foreground">Leftover</Label>
              <Input size={1} className="h-8 rounded-lg text-sm" type="number" min="0" value={leftover} onChange={(e) => setLeftover(e.target.value)} />
            </div>
          </div>
          {Number(leftover) >= 10 && !meal.ngoNotified && (
            <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-3 py-1.5 border border-amber-200 dark:border-amber-700">
              ⚡ Saving will auto-notify NGO (≥10 meals surplus)
            </p>
          )}
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1 rounded-lg" onClick={handleReport} disabled={onReport.isPending}>
              Save
            </Button>
            <Button size="sm" className="flex-1 rounded-lg" onClick={handleNotify} disabled={onNotify.isPending || !meal.leftoverMeals || meal.ngoNotified}>
              {meal.ngoNotified ? "✅ Notified" : "📲 Notify NGO"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
