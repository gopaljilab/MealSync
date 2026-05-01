import { useState, useEffect } from "react";
import {
  useListNgoRequests,
  getListNgoRequestsQueryKey,
  useAcceptNgoRequest,
  useRejectNgoRequest,
  useGetNgoHistory,
  getGetNgoHistoryQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface NgoImpact {
  totalMealsCollected: number;
  totalPickups: number;
  weekMeals: number;
  weekPickups: number;
  pendingRequests: number;
  co2Prevented: number;
}

function getFoodType(menu: string | undefined): string {
  if (!menu) return "Mixed";
  const lower = menu.toLowerCase();
  if (lower.includes("rice") || lower.includes("biryani") || lower.includes("roti") || lower.includes("naan")) return "Dry";
  if (lower.includes("dal") || lower.includes("curry") || lower.includes("masala") || lower.includes("chole") || lower.includes("rajma")) return "Gravy";
  return "Mixed";
}

function getPrepTime(menu: string | undefined): string {
  if (!menu) return "~30 min";
  const lower = menu.toLowerCase();
  if (lower.includes("biryani")) return "~60 min";
  if (lower.includes("paneer") || lower.includes("butter masala")) return "~45 min";
  return "~30 min";
}

function sortRequestsByTime(requests: any[]) {
  return [...requests].sort((a, b) => new Date(a.pickupTime).getTime() - new Date(b.pickupTime).getTime());
}

export default function NgoDashboard() {
  const queryClient = useQueryClient();

  const { data: requests, isLoading: requestsLoading } = useListNgoRequests({ query: { queryKey: getListNgoRequestsQueryKey() } });
  const { data: history, isLoading: historyLoading } = useGetNgoHistory({ query: { queryKey: getGetNgoHistoryQueryKey() } });

  const acceptRequest = useAcceptNgoRequest();
  const rejectRequest = useRejectNgoRequest();

  const [impact, setImpact] = useState<NgoImpact | null>(null);
  const [completing, setCompleting] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/intelligence/ngo-impact", { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setImpact(d))
      .catch(() => {});
  }, []);

  const refreshImpact = () => {
    fetch("/api/intelligence/ngo-impact", { credentials: "include" })
      .then((r) => r.ok ? r.json() : null).then((d) => d && setImpact(d)).catch(() => {});
  };

  const handleAccept = async (id: number) => {
    try {
      await acceptRequest.mutateAsync({ id });
      toast.success("Pickup accepted. PG has been notified.");
      queryClient.invalidateQueries({ queryKey: getListNgoRequestsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetNgoHistoryQueryKey() });
      refreshImpact();
    } catch { toast.error("Failed to accept pickup request"); }
  };

  const handleReject = async (id: number) => {
    try {
      await rejectRequest.mutateAsync({ id });
      toast.success("Request declined");
      queryClient.invalidateQueries({ queryKey: getListNgoRequestsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetNgoHistoryQueryKey() });
    } catch { toast.error("Failed to reject request"); }
  };

  const handleComplete = async (id: number) => {
    setCompleting(id);
    try {
      await fetch(`/api/ngo/requests/${id}/complete`, { method: "POST", credentials: "include" });
      toast.success("Pickup confirmed as completed!");
      queryClient.invalidateQueries({ queryKey: getListNgoRequestsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetNgoHistoryQueryKey() });
      refreshImpact();
    } catch { toast.error("Failed to confirm pickup."); }
    finally { setCompleting(null); }
  };

  const sortedRequests = requests ? sortRequestsByTime(requests) : null;
  const acceptedRequests = history?.filter((r) => r.status === "accepted") ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">NGO Dashboard</h1>
        <p className="text-muted-foreground mt-2">Connect with PGs and collect surplus meals for redistribution.</p>
      </div>

      {/* Impact Metrics */}
      {impact && (
        <Card className="border-green-200 bg-green-50/40 dark:bg-green-950/20" data-testid="card-ngo-impact">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-green-800 dark:text-green-200">Your Impact</CardTitle>
            <CardDescription>Meals redistributed and lives impacted</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{impact.totalMealsCollected}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Meals Collected</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{impact.totalPickups}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Pickups</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{impact.weekMeals}</p>
                <p className="text-xs text-muted-foreground mt-1">This Week's Meals</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{impact.weekPickups}</p>
                <p className="text-xs text-muted-foreground mt-1">This Week's Pickups</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{impact.co2Prevented}kg</p>
                <p className="text-xs text-muted-foreground mt-1">CO2 Prevented</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{impact.pendingRequests}</p>
                <p className="text-xs text-muted-foreground mt-1">Pending Requests</p>
              </div>
            </div>
            {impact.weekMeals > 0 && (
              <p className="text-sm text-center mt-4 text-green-700 dark:text-green-300 font-medium">
                You redistributed {impact.weekMeals} meals this week!
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Route Suggestion */}
      {sortedRequests && sortedRequests.length > 1 && (
        <Card className="border-blue-200 bg-blue-50/30 dark:bg-blue-950/10" data-testid="card-route-suggestion">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-blue-800 dark:text-blue-200">Suggested Pickup Order</CardTitle>
            <CardDescription>Sorted by pickup time for optimal routing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 flex-wrap">
              {sortedRequests.map((req, i) => (
                <div key={req.id} className="flex items-center gap-2">
                  <div className="text-sm font-medium px-3 py-1.5 bg-blue-100 dark:bg-blue-900 rounded-full border border-blue-200">
                    {req.pgName}
                    <span className="text-xs text-blue-600 dark:text-blue-300 ml-1">({req.availableMeals} meals)</span>
                  </div>
                  {i < sortedRequests.length - 1 && <span className="text-muted-foreground">→</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Requests */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Available Pickups</h2>
          {requestsLoading ? (
            <div className="space-y-4"><Skeleton className="h-48 w-full" /><Skeleton className="h-48 w-full" /></div>
          ) : !sortedRequests || sortedRequests.length === 0 ? (
            <Card className="border-dashed shadow-none">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                <p className="font-medium">No pending requests right now.</p>
                <p className="text-sm mt-1">PG owners will notify you here when surplus meals are available.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sortedRequests.map((req) => (
                <Card key={req.id} className="overflow-hidden border-l-4 border-l-primary" data-testid={`card-ngo-request-${req.id}`}>
                  <CardHeader className="pb-3 bg-muted/30">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{req.pgName}</CardTitle>
                        <CardDescription>{req.pgLocation}</CardDescription>
                      </div>
                      <Badge>{req.availableMeals} Meals</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 pb-2">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1">MENU</p>
                        <p>{req.mealMenu ?? "Mixed Items"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1">PICKUP TIME</p>
                        <p>{format(new Date(req.pickupTime), "h:mm a")}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1">FOOD TYPE</p>
                        <Badge variant="outline">{getFoodType(req.mealMenu)}</Badge>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1">PREP TIME</p>
                        <p>{getPrepTime(req.mealMenu)}</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="gap-3 pt-0 pb-4">
                    <Button className="w-full" onClick={() => handleAccept(req.id)} disabled={acceptRequest.isPending} data-testid={`button-accept-${req.id}`}>
                      Accept Pickup
                    </Button>
                    <Button variant="outline" className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20" onClick={() => handleReject(req.id)} disabled={rejectRequest.isPending} data-testid={`button-reject-${req.id}`}>
                      Decline
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* History + Confirm Pickups */}
        <div className="space-y-6">
          {/* Accepted — awaiting confirmation */}
          {acceptedRequests.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">Awaiting Confirmation</h2>
              <div className="space-y-3">
                {acceptedRequests.map((item) => (
                  <Card key={item.id} className="border-l-4 border-l-amber-400" data-testid={`card-accepted-${item.id}`}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium">{item.pgName}</p>
                        <p className="text-sm text-muted-foreground">{item.availableMeals} meals · {item.mealMenu ?? "Mixed"}</p>
                      </div>
                      <Button size="sm" onClick={() => handleComplete(item.id)} disabled={completing === item.id} data-testid={`button-complete-${item.id}`}>
                        {completing === item.id ? "Confirming..." : "Confirm Pickup"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <h2 className="text-xl font-semibold">Recent Activity</h2>
          <Card>
            <CardContent className="p-0">
              {historyLoading ? (
                <div className="p-6 space-y-4"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
              ) : !history || history.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <p>No pickup history yet.</p>
                  <p className="text-sm mt-1">Accepted and completed pickups will appear here.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {history.map((item) => (
                    <div key={item.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors" data-testid={`row-history-${item.id}`}>
                      <div>
                        <p className="font-medium">{item.pgName}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(item.createdAt), "MMM d, yyyy")} &bull; {item.availableMeals} meals
                          {item.mealMenu && <span className="text-muted-foreground"> · {item.mealMenu}</span>}
                        </p>
                      </div>
                      <Badge variant={item.status === "completed" ? "default" : item.status === "accepted" ? "secondary" : "outline"}>
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
