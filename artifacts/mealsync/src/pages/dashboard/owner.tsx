import { useState, useEffect } from "react";
import {
  useGetOwnerStats,
  getGetOwnerStatsQueryKey,
  useGetGreenScore,
  getGetGreenScoreQueryKey,
  useGetDailyTrends,
  getGetDailyTrendsQueryKey,
  useListMeals,
  getListMealsQueryKey,
  useCreateMeal,
  usePredictMeal,
  useReportLeftover,
  useNotifyNgo,
  Meal,
} from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from "recharts";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

interface RawMaterial { ingredient: string; quantity: number; unit: string }
interface RawMaterialsData { items: RawMaterial[]; basedOnMeals: number }
interface WasteCostData { costPerMeal: number; totalLeftover: number; totalCostLost: number; wastePercent: number; weeklyBreakdown: { date: string; menu: string; leftover: number; costLost: number }[]; currency: string }
interface Suggestion { type: "warning" | "tip" | "info"; message: string }
interface SuggestionsData { suggestions: Suggestion[]; weatherNote: string; weekend: boolean; rainy: boolean }
interface GlobalImpact { totalMealsSaved: number; totalWasteKg: number; totalNgoPickups: number; totalMealsRedistributed: number; totalResidentResponses: number; co2Prevented: number }

const SUGGESTION_COLORS = {
  warning: "text-amber-700 bg-amber-50 border-amber-200",
  tip: "text-blue-700 bg-blue-50 border-blue-200",
  info: "text-green-700 bg-green-50 border-green-200",
};

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

  const createMeal = useCreateMeal();
  const predictMeal = usePredictMeal();
  const reportLeftover = useReportLeftover();
  const notifyNgo = useNotifyNgo();

  const [menu, setMenu] = useState("");
  const [expectedPeople, setExpectedPeople] = useState("");

  const fetchIntelligence = () => {
    const creds = { credentials: "include" as const };
    fetch("/api/intelligence/raw-materials", creds).then((r) => r.ok ? r.json() : null).then((d) => d && setRawMaterials(d)).catch(() => {});
    fetch("/api/intelligence/waste-cost", creds).then((r) => r.ok ? r.json() : null).then((d) => d && setWasteCost(d)).catch(() => {});
    fetch("/api/intelligence/suggestions", creds).then((r) => r.ok ? r.json() : null).then((d) => d && setSuggestions(d)).catch(() => {});
    fetch("/api/intelligence/global-impact", creds).then((r) => r.ok ? r.json() : null).then((d) => d && setGlobalImpact(d)).catch(() => {});
  };

  useEffect(() => { fetchIntelligence(); }, []);

  const handlePredictMeals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menu || !expectedPeople) { toast.error("Please fill all fields"); return; }
    try {
      const meal = await createMeal.mutateAsync({ data: { menu, expectedPeople: Number(expectedPeople) } });
      const prediction = await predictMeal.mutateAsync({ id: meal.id });
      toast.success(`Meals predicted successfully! ${prediction.predictedMeals} meals planned.`);
      queryClient.invalidateQueries({ queryKey: getListMealsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetOwnerStatsQueryKey() });
      fetchIntelligence();
      setMenu("");
      setExpectedPeople("");
    } catch { toast.error("Failed to predict meals. Please try again."); }
  };

  const todayMeals = meals?.filter((m) => {
    const d = new Date(m.date);
    const today = new Date();
    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
  }) ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Owner Dashboard</h1>
        <p className="text-muted-foreground mt-2">Manage your PG's meals and reduce waste.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-primary text-primary-foreground border-none">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Green Score</CardTitle></CardHeader>
          <CardContent>
            {greenLoading ? <Skeleton className="h-8 w-16 bg-primary-foreground/20" /> : (
              <>
                <div className="text-3xl font-bold" data-testid="text-green-score">{greenScore?.score ?? 0}%</div>
                <p className="text-xs mt-1 text-primary-foreground/80">{greenScore?.message ?? "Start tracking meals!"}</p>
                <div className="text-sm mt-4 font-medium">Saved today: {greenScore?.mealsSavedToday ?? 0} meals</div>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Meals Today</CardTitle></CardHeader>
          <CardContent>{statsLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-3xl font-bold" data-testid="text-total-meals">{stats?.totalMealsToday ?? 0}</div>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Predicted Needs</CardTitle></CardHeader>
          <CardContent>{statsLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-3xl font-bold" data-testid="text-predicted">{stats?.predictedMeals ?? 0}</div>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Leftover Meals</CardTitle></CardHeader>
          <CardContent>{statsLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-3xl font-bold text-destructive" data-testid="text-leftover">{stats?.leftoverMeals ?? 0}</div>}</CardContent>
        </Card>
      </div>

      {/* Smart Suggestions + Weather Banner */}
      {suggestions && (
        <Card data-testid="card-suggestions">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Smart Suggestions</CardTitle>
            <CardDescription>{suggestions.weatherNote}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {suggestions.suggestions.map((s, i) => (
              <div key={i} className={`flex gap-3 items-start text-sm px-3 py-2 rounded-lg border ${SUGGESTION_COLORS[s.type]}`}>
                <span className="font-bold mt-0.5">{s.type === "warning" ? "!" : s.type === "tip" ? ">" : "i"}</span>
                <span>{s.message}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Meal input + Today's meals */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Plan Next Meal</CardTitle>
              <CardDescription>Enter menu and attendance to get a prediction</CardDescription>
            </CardHeader>
            <form onSubmit={handlePredictMeals}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="menu">Menu</Label>
                  <Input id="menu" placeholder="e.g. Dal, Rice, Roti, Sabji" value={menu} onChange={(e) => setMenu(e.target.value)} data-testid="input-menu" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expected">Expected People</Label>
                  <Input id="expected" type="number" min="1" placeholder="e.g. 120" value={expectedPeople} onChange={(e) => setExpectedPeople(e.target.value)} data-testid="input-expected" />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={createMeal.isPending || predictMeal.isPending} data-testid="button-predict">
                  {createMeal.isPending || predictMeal.isPending ? "Processing..." : "Predict Meals"}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Raw Material Calculator */}
          <Card data-testid="card-raw-materials">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Raw Material Requirements</CardTitle>
              <CardDescription>
                {rawMaterials?.basedOnMeals ? `Based on ${rawMaterials.basedOnMeals} meal plan(s) today` : "Add meals to see requirements"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!rawMaterials || rawMaterials.items.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-3">No meals planned yet for today.</p>
              ) : (
                <div className="divide-y">
                  {rawMaterials.items.map((item) => (
                    <div key={item.ingredient} className="flex justify-between py-2 text-sm">
                      <span className="font-medium">{item.ingredient}</span>
                      <span className="text-muted-foreground">{item.quantity} {item.unit}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Meals */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Meals</CardTitle>
              <CardDescription>Manage status and leftovers</CardDescription>
            </CardHeader>
            <CardContent>
              {mealsLoading ? (
                <div className="space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>
              ) : todayMeals.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground border border-dashed rounded-md">No meals planned yet. Use the form above.</div>
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

        {/* Right Column: Chart + Waste Cost */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="h-auto">
            <CardHeader>
              <CardTitle>Weekly Trends</CardTitle>
              <CardDescription>Predicted vs Actual vs Leftover meals</CardDescription>
            </CardHeader>
            <CardContent className="h-[320px] w-full">
              {trendsLoading ? <Skeleton className="h-full w-full" /> :
              !trends || trends.length === 0 ? (
                <div className="flex h-full items-center justify-center text-muted-foreground border border-dashed rounded-md">
                  No trend data yet. Start adding meals to see your weekly analytics.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trends} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="predicted" name="Predicted" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="actual" name="Actual" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="leftover" name="Leftover" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Waste to Cost Analytics */}
          {wasteCost && (
            <Card data-testid="card-waste-cost">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Waste-to-Cost Analytics</CardTitle>
                <CardDescription>This week's food waste in monetary terms</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center mb-4">
                  <div className="p-3 rounded-lg bg-destructive/10">
                    <p className="text-xl font-bold text-destructive">₹{wasteCost.totalCostLost}</p>
                    <p className="text-xs text-muted-foreground mt-1">Cost lost to waste</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xl font-bold">{wasteCost.totalLeftover}</p>
                    <p className="text-xs text-muted-foreground mt-1">Meals wasted</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xl font-bold">{wasteCost.wastePercent}%</p>
                    <p className="text-xs text-muted-foreground mt-1">Waste rate</p>
                  </div>
                </div>
                {wasteCost.weeklyBreakdown.length > 0 && (
                  <div className="divide-y max-h-40 overflow-y-auto">
                    {wasteCost.weeklyBreakdown.filter((b) => b.leftover > 0).map((b, i) => (
                      <div key={i} className="flex justify-between py-2 text-sm">
                        <span className="text-muted-foreground">{b.date} — {b.menu}</span>
                        <span className="font-medium text-destructive">₹{b.costLost}</span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-3">Cost per meal: ₹{wasteCost.costPerMeal}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Global Impact Dashboard */}
      {globalImpact && (
        <Card className="border-green-200 bg-green-50/30 dark:bg-green-950/10" data-testid="card-global-impact">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-green-800 dark:text-green-200">Global Impact Dashboard</CardTitle>
            <CardDescription>Combined impact across all PGs and NGOs on MealSync</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{globalImpact.totalMealsSaved}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Meals Saved</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{globalImpact.totalMealsRedistributed}</p>
                <p className="text-xs text-muted-foreground mt-1">Meals Redistributed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{globalImpact.totalNgoPickups}</p>
                <p className="text-xs text-muted-foreground mt-1">NGO Pickups</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{globalImpact.totalWasteKg}kg</p>
                <p className="text-xs text-muted-foreground mt-1">Waste Reduced</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{globalImpact.co2Prevented}kg</p>
                <p className="text-xs text-muted-foreground mt-1">CO2 Prevented</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{globalImpact.totalResidentResponses}</p>
                <p className="text-xs text-muted-foreground mt-1">Resident Confirmations</p>
              </div>
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
    if (!leftover || !actual) { toast.error("Please enter both actual served and leftover amounts"); return; }
    try {
      const result: any = await onReport.mutateAsync({ id: meal.id, data: { leftoverMeals: Number(leftover), actualServed: Number(actual) } });
      if (result?.autoNgoTriggered) {
        toast.success("Leftover saved. NGO automatically notified — surplus exceeds 10 meals!");
      } else {
        toast.success("Leftover reported successfully");
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
      toast.success("NGO notified successfully!");
      queryClient.invalidateQueries({ queryKey: getListMealsQueryKey() });
    } catch { toast.error("Failed to notify NGO"); }
  };

  return (
    <div className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm" data-testid={`card-meal-${meal.id}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="font-medium">{meal.menu}</div>
        <Badge variant={meal.status === "completed" ? "default" : "secondary"}>{meal.status}</Badge>
      </div>
      <div className="text-sm text-muted-foreground mb-4">
        Predicted: {meal.predictedMeals ?? "N/A"} | Expected: {meal.expectedPeople}
      </div>
      {meal.status !== "completed" && (
        <div className="space-y-3 pt-3 border-t">
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <Label className="text-xs">Actual Served</Label>
              <Input size={1} className="h-8 text-sm" type="number" min="0" value={actual} onChange={(e) => setActual(e.target.value)} />
            </div>
            <div className="flex-1 space-y-1">
              <Label className="text-xs">Leftover</Label>
              <Input size={1} className="h-8 text-sm" type="number" min="0" value={leftover} onChange={(e) => setLeftover(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1" onClick={handleReport} disabled={onReport.isPending}>Save</Button>
            <Button size="sm" className="flex-1" onClick={handleNotify} disabled={onNotify.isPending || !meal.leftoverMeals || meal.ngoNotified}>
              {meal.ngoNotified ? "NGO Notified" : "Notify NGO"}
            </Button>
          </div>
          {Number(leftover) >= 10 && !meal.ngoNotified && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded px-2 py-1 border border-amber-200">
              Saving will auto-notify NGO (surplus exceeds 10 meals)
            </p>
          )}
        </div>
      )}
    </div>
  );
}
