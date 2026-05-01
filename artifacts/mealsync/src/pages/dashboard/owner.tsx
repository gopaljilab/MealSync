import { useState } from "react";
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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

export default function OwnerDashboard() {
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useGetOwnerStats({
    query: { queryKey: getGetOwnerStatsQueryKey() },
  });
  const { data: greenScore, isLoading: greenLoading } = useGetGreenScore({
    query: { queryKey: getGetGreenScoreQueryKey() },
  });
  const { data: trends, isLoading: trendsLoading } = useGetDailyTrends({
    query: { queryKey: getGetDailyTrendsQueryKey() },
  });
  const { data: meals, isLoading: mealsLoading } = useListMeals({
    query: { queryKey: getListMealsQueryKey() },
  });

  const createMeal = useCreateMeal();
  const predictMeal = usePredictMeal();
  const reportLeftover = useReportLeftover();
  const notifyNgo = useNotifyNgo();

  const [menu, setMenu] = useState("");
  const [expectedPeople, setExpectedPeople] = useState("");

  const handlePredictMeals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menu || !expectedPeople) {
      toast.error("Please fill all fields");
      return;
    }
    try {
      const meal = await createMeal.mutateAsync({
        data: { menu, expectedPeople: Number(expectedPeople) },
      });
      const prediction = await predictMeal.mutateAsync({ id: meal.id });
      toast.success(`Meals predicted successfully! ${prediction.predictedMeals} meals for today.`);
      queryClient.invalidateQueries({ queryKey: getListMealsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetOwnerStatsQueryKey() });
      setMenu("");
      setExpectedPeople("");
    } catch {
      toast.error("Failed to predict meals. Please try again.");
    }
  };

  const todayMeals = meals?.filter((m) => {
    const d = new Date(m.date);
    const today = new Date();
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
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
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Green Score</CardTitle>
          </CardHeader>
          <CardContent>
            {greenLoading ? (
              <Skeleton className="h-8 w-16 bg-primary-foreground/20" />
            ) : (
              <>
                <div className="text-3xl font-bold" data-testid="text-green-score">
                  {greenScore?.score ?? 0}%
                </div>
                <p className="text-xs mt-1 text-primary-foreground/80">
                  {greenScore?.message ?? "No data yet — start tracking meals!"}
                </p>
                <div className="text-sm mt-4 font-medium">
                  Saved today: {greenScore?.mealsSavedToday ?? 0} meals
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Meals Today</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold" data-testid="text-total-meals">
                {stats?.totalMealsToday ?? 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Predicted Needs</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold" data-testid="text-predicted-meals">
                {stats?.predictedMeals ?? 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Leftover Meals</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold text-destructive" data-testid="text-leftover-meals">
                {stats?.leftoverMeals ?? 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Plan Next Meal</CardTitle>
              <CardDescription>Enter menu and expected attendance to get a prediction</CardDescription>
            </CardHeader>
            <form onSubmit={handlePredictMeals}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="menu">Menu</Label>
                  <Input
                    id="menu"
                    placeholder="e.g. Dal, Rice, Roti, Sabji"
                    value={menu}
                    onChange={(e) => setMenu(e.target.value)}
                    data-testid="input-menu"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expected">Expected People</Label>
                  <Input
                    id="expected"
                    type="number"
                    min="1"
                    placeholder="e.g. 120"
                    value={expectedPeople}
                    onChange={(e) => setExpectedPeople(e.target.value)}
                    data-testid="input-expected-people"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createMeal.isPending || predictMeal.isPending}
                  data-testid="button-predict-meals"
                >
                  {createMeal.isPending || predictMeal.isPending ? "Processing..." : "Predict Meals"}
                </Button>
              </CardFooter>
            </form>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Today's Meals</CardTitle>
              <CardDescription>Manage status and leftovers</CardDescription>
            </CardHeader>
            <CardContent>
              {mealsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : todayMeals.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground border border-dashed rounded-md">
                  No meals planned for today yet. Use the form above to add one.
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
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Chart */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Weekly Trends</CardTitle>
              <CardDescription>Predicted vs Actual vs Leftover meals</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] w-full">
              {trendsLoading ? (
                <Skeleton className="h-full w-full" />
              ) : !trends || trends.length === 0 ? (
                <div className="flex h-full items-center justify-center text-muted-foreground border border-dashed rounded-md">
                  No trend data yet. Start adding meals to see your weekly analytics.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trends} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="predicted" name="Predicted" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="actual" name="Actual Served" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="leftover" name="Leftover" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MealCard({
  meal,
  onReport,
  onNotify,
  queryClient,
}: {
  meal: Meal;
  onReport: ReturnType<typeof useReportLeftover>;
  onNotify: ReturnType<typeof useNotifyNgo>;
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  const [leftover, setLeftover] = useState(meal.leftoverMeals?.toString() ?? "");
  const [actual, setActual] = useState(meal.actualServed?.toString() ?? "");

  const handleReport = async () => {
    if (!leftover || !actual) {
      toast.error("Please enter both actual served and leftover amounts");
      return;
    }
    try {
      await onReport.mutateAsync({
        id: meal.id,
        data: { leftoverMeals: Number(leftover), actualServed: Number(actual) },
      });
      toast.success("Leftover reported successfully");
      queryClient.invalidateQueries({ queryKey: getListMealsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetOwnerStatsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetGreenScoreQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDailyTrendsQueryKey() });
    } catch {
      toast.error("Failed to save leftover data");
    }
  };

  const handleNotify = async () => {
    try {
      await onNotify.mutateAsync({ id: meal.id });
      toast.success("NGO notified successfully!");
      queryClient.invalidateQueries({ queryKey: getListMealsQueryKey() });
    } catch {
      toast.error("Failed to notify NGO");
    }
  };

  return (
    <div
      className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm"
      data-testid={`card-meal-${meal.id}`}
    >
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
              <Input
                size={1}
                className="h-8 text-sm"
                type="number"
                min="0"
                value={actual}
                onChange={(e) => setActual(e.target.value)}
                data-testid={`input-actual-${meal.id}`}
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label className="text-xs">Leftover</Label>
              <Input
                size={1}
                className="h-8 text-sm"
                type="number"
                min="0"
                value={leftover}
                onChange={(e) => setLeftover(e.target.value)}
                data-testid={`input-leftover-${meal.id}`}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={handleReport}
              disabled={onReport.isPending}
              data-testid={`button-save-leftover-${meal.id}`}
            >
              Save
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={handleNotify}
              disabled={onNotify.isPending || !meal.leftoverMeals || meal.ngoNotified}
              data-testid={`button-notify-ngo-${meal.id}`}
            >
              {meal.ngoNotified ? "NGO Notified" : "Notify NGO"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
