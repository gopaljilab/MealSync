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

export default function NgoDashboard() {
  const queryClient = useQueryClient();

  const { data: requests, isLoading: requestsLoading } = useListNgoRequests({
    query: { queryKey: getListNgoRequestsQueryKey() },
  });
  const { data: history, isLoading: historyLoading } = useGetNgoHistory({
    query: { queryKey: getGetNgoHistoryQueryKey() },
  });

  const acceptRequest = useAcceptNgoRequest();
  const rejectRequest = useRejectNgoRequest();

  const handleAccept = async (id: number) => {
    try {
      await acceptRequest.mutateAsync({ id });
      toast.success("Pickup accepted. PG has been notified.");
      queryClient.invalidateQueries({ queryKey: getListNgoRequestsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetNgoHistoryQueryKey() });
    } catch {
      toast.error("Failed to accept pickup request");
    }
  };

  const handleReject = async (id: number) => {
    try {
      await rejectRequest.mutateAsync({ id });
      toast.success("Request declined");
      queryClient.invalidateQueries({ queryKey: getListNgoRequestsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetNgoHistoryQueryKey() });
    } catch {
      toast.error("Failed to reject request");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">NGO Dashboard</h1>
        <p className="text-muted-foreground mt-2">Connect with PGs and collect surplus meals for redistribution.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Requests */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Available Pickups</h2>

          {requestsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : !requests || requests.length === 0 ? (
            <Card className="border-dashed shadow-none">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                <p className="font-medium">No pending requests right now.</p>
                <p className="text-sm mt-1">
                  PG owners will notify you here when surplus meals are available.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <Card
                  key={req.id}
                  className="overflow-hidden border-l-4 border-l-primary"
                  data-testid={`card-ngo-request-${req.id}`}
                >
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
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1">
                          MENU
                        </p>
                        <p>{req.mealMenu ?? "Mixed Items"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1">
                          POSTED
                        </p>
                        <p>{format(new Date(req.createdAt), "h:mm a")}</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="gap-3 pt-0 pb-4">
                    <Button
                      className="w-full"
                      onClick={() => handleAccept(req.id)}
                      disabled={acceptRequest.isPending}
                      data-testid={`button-accept-${req.id}`}
                    >
                      Accept Pickup
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
                      onClick={() => handleReject(req.id)}
                      disabled={rejectRequest.isPending}
                      data-testid={`button-reject-${req.id}`}
                    >
                      Decline
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* History */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Recent Activity</h2>

          <Card>
            <CardContent className="p-0">
              {historyLoading ? (
                <div className="p-6 space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : !history || history.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <p>No pickup history yet.</p>
                  <p className="text-sm mt-1">Accepted and completed pickups will appear here.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                      data-testid={`row-history-${item.id}`}
                    >
                      <div>
                        <p className="font-medium">{item.pgName}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(item.createdAt), "MMM d, yyyy")} &bull;{" "}
                          {item.availableMeals} meals
                        </p>
                      </div>
                      <Badge
                        variant={
                          item.status === "completed" || item.status === "accepted"
                            ? "default"
                            : "secondary"
                        }
                      >
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
