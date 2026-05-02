import { useState, useEffect, useCallback } from "react";
import {
  useListNgoRequests, getListNgoRequestsQueryKey,
  useAcceptNgoRequest, useRejectNgoRequest,
  useGetNgoHistory, getGetNgoHistoryQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow, differenceInMinutes } from "date-fns";
import { useCountUp } from "@/hooks/useCountUp";

interface NgoImpact { totalMealsCollected: number; totalPickups: number; weekMeals: number; weekPickups: number; pendingRequests: number; co2Prevented: number }

function getFoodType(menu: string | undefined) {
  if (!menu) return "Mixed";
  const l = menu.toLowerCase();
  if (l.includes("rice")||l.includes("biryani")||l.includes("roti")||l.includes("naan")) return "Dry";
  if (l.includes("dal")||l.includes("curry")||l.includes("masala")||l.includes("chole")||l.includes("rajma")) return "Gravy";
  return "Mixed";
}

function getPrepTime(menu: string | undefined) {
  if (!menu) return "~30 min";
  const l = menu.toLowerCase();
  if (l.includes("biryani")) return "~60 min";
  if (l.includes("paneer")||l.includes("butter masala")) return "~45 min";
  return "~30 min";
}

function getUrgency(pickupTime: string) {
  const mins = differenceInMinutes(new Date(pickupTime), new Date());
  if (mins > 60) return { level:"fresh" as const, label:"Fresh", border:"border-l-green-500", dot:"bg-green-500", badge:"bg-green-500" };
  if (mins > 20) return { level:"moderate" as const, label:"Moderate", border:"border-l-amber-500", dot:"bg-amber-500", badge:"bg-amber-500" };
  return { level:"urgent" as const, label:"Urgent", border:"border-l-red-500", dot:"bg-red-500 animate-pulse-ring", badge:"bg-red-500" };
}

function PickupTimer({ pickupTime }: { pickupTime: string }) {
  const [, setTick] = useState(0);
  useEffect(() => { const id=setInterval(()=>setTick(t=>t+1),30000); return ()=>clearInterval(id); }, []);
  const mins = differenceInMinutes(new Date(pickupTime), new Date());
  if (mins < 0) return <span className="text-destructive text-xs font-semibold">Overdue</span>;
  return <span className="text-xs font-semibold">{mins>60?`in ${Math.floor(mins/60)}h ${mins%60}m`:`in ${mins}m`}</span>;
}

/* ─── Status Timeline ───────────────────────────────────────── */
const TIMELINE_STEPS = ["Requested","Accepted","En Route","Collected"];
const STATUS_IDX: Record<string,number> = { pending:0, accepted:1, "en-route":2, completed:3 };

function StatusTimeline({ status }: { status: string }) {
  const current = STATUS_IDX[status] ?? 0;
  return (
    <div className="flex items-start mt-4 pt-3 border-t border-dashed">
      {TIMELINE_STEPS.map((step, i) => (
        <div key={step} className="flex items-center flex-1 min-w-0">
          <div className="flex flex-col items-center">
            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i<=current?"bg-primary text-primary-foreground shadow-sm":"bg-muted text-muted-foreground"}`}>
              {i < current ? "✓" : i+1}
            </div>
            <span className={`text-xs mt-1 text-center leading-tight ${i<=current?"text-primary font-semibold":"text-muted-foreground"}`}>{step}</span>
          </div>
          {i < TIMELINE_STEPS.length-1 && (
            <div className={`flex-1 h-0.5 mb-4 mx-0.5 transition-all ${i<current?"bg-primary":"bg-border"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Activity Feed ─────────────────────────────────────────── */
function ActivityFeed({ history }: { history: any[] }) {
  const recent = [...history].sort((a,b) => new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()).slice(0,8);

  function getActivity(item: any) {
    if (item.status==="completed") return { emoji:"✅", text:"Pickup completed", color:"text-green-600 bg-green-50 dark:bg-green-950/30" };
    if (item.status==="accepted") return { emoji:"🤝", text:"Pickup accepted", color:"text-blue-600 bg-blue-50 dark:bg-blue-950/30" };
    if (item.status==="rejected") return { emoji:"❌", text:"Request declined", color:"text-red-600 bg-red-50 dark:bg-red-950/30" };
    return { emoji:"📋", text:"New request created", color:"text-amber-600 bg-amber-50 dark:bg-amber-950/30" };
  }

  if (recent.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <div className="text-4xl mb-3">📡</div>
        <p className="font-medium">No activity yet</p>
        <p className="text-sm mt-1">Actions will appear here in real time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {recent.map((item, i) => {
        const act = getActivity(item);
        return (
          <div key={item.id} className={`flex items-start gap-3 p-3 rounded-xl ${act.color} animate-slide-up`} style={{animationDelay:`${i*60}ms`}}>
            <span className="text-xl shrink-0">{act.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-snug">{act.text}</p>
              <p className="text-xs opacity-70 mt-0.5">{item.pgName} · {item.availableMeals} meals{item.mealMenu?` · ${item.mealMenu}`:""}</p>
            </div>
            <span className="text-xs opacity-60 shrink-0 whitespace-nowrap">
              {formatDistanceToNow(new Date(item.createdAt), {addSuffix:true})}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── QR Modal ──────────────────────────────────────────────── */
function QrPickupModal({ onCollect, onClose }: { onCollect: () => void; onClose: () => void }) {
  const [scanned, setScanned] = useState(false);
  const handleScan = () => { setScanned(true); setTimeout(() => { onCollect(); onClose(); }, 1200); };
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-card rounded-2xl p-6 w-80 shadow-2xl animate-bounce-in" onClick={e=>e.stopPropagation()}>
        <h3 className="font-bold text-lg text-center mb-2">📱 QR Pickup</h3>
        <p className="text-sm text-muted-foreground text-center mb-5">Show this QR to the PG owner to verify pickup</p>
        <div className="aspect-square bg-muted rounded-xl flex items-center justify-center mb-5 border-2 border-primary/20">
          {scanned ? (
            <div className="text-center animate-bounce-in"><div className="text-6xl">✅</div><p className="text-sm font-semibold text-green-600 mt-2">Verified!</p></div>
          ) : (
            <div className="grid grid-cols-7 grid-rows-7 gap-0.5 p-4">
              {Array.from({length:49},(_,i)=>(
                <div key={i} className={`aspect-square rounded-sm ${(i%3===0||i%7===1||i%11===2)?"bg-foreground":"bg-background"}`} />
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={handleScan} disabled={scanned}>{scanned?"Verifying...":"Simulate Scan"}</Button>
        </div>
      </div>
    </div>
  );
}

function AnimatedNumber({ value, suffix="" }: { value: number; suffix?: string }) {
  const count = useCountUp(value);
  return <span>{count}{suffix}</span>;
}

function sortByTime(reqs: any[]) { return [...reqs].sort((a,b)=>new Date(a.pickupTime).getTime()-new Date(b.pickupTime).getTime()); }

export default function NgoDashboard() {
  const queryClient = useQueryClient();
  const { data: requests, isLoading: reqLoading } = useListNgoRequests({ query: { queryKey: getListNgoRequestsQueryKey() } });
  const { data: history, isLoading: histLoading } = useGetNgoHistory({ query: { queryKey: getGetNgoHistoryQueryKey() } });
  const acceptReq = useAcceptNgoRequest();
  const rejectReq = useRejectNgoRequest();

  const [impact, setImpact] = useState<NgoImpact | null>(null);
  const [completing, setCompleting] = useState<number | null>(null);
  const [qrModal, setQrModal] = useState<{ id: number } | null>(null);
  const [mapView, setMapView] = useState(false);

  const refreshImpact = useCallback(() => {
    fetch("/api/intelligence/ngo-impact", { credentials:"include" }).then(r=>r.ok?r.json():null).then(d=>d&&setImpact(d)).catch(()=>{});
  }, []);

  useEffect(() => { refreshImpact(); }, [refreshImpact]);

  const handleAccept = async (id: number) => {
    try { await acceptReq.mutateAsync({ id }); toast.success("✅ Pickup accepted!"); queryClient.invalidateQueries({ queryKey:getListNgoRequestsQueryKey() }); queryClient.invalidateQueries({ queryKey:getGetNgoHistoryQueryKey() }); refreshImpact(); }
    catch { toast.error("Failed to accept request"); }
  };

  const handleReject = async (id: number) => {
    try { await rejectReq.mutateAsync({ id }); toast.success("Request declined"); queryClient.invalidateQueries({ queryKey:getListNgoRequestsQueryKey() }); queryClient.invalidateQueries({ queryKey:getGetNgoHistoryQueryKey() }); }
    catch { toast.error("Failed to reject"); }
  };

  const handleComplete = async (id: number) => {
    setCompleting(id);
    try { await fetch(`/api/ngo/requests/${id}/complete`,{method:"POST",credentials:"include"}); toast.success("🎉 Pickup completed!"); queryClient.invalidateQueries({ queryKey:getListNgoRequestsQueryKey() }); queryClient.invalidateQueries({ queryKey:getGetNgoHistoryQueryKey() }); refreshImpact(); }
    catch { toast.error("Failed to confirm."); }
    finally { setCompleting(null); }
  };

  const sorted = requests ? sortByTime(requests) : null;
  const accepted = history?.filter(r=>r.status==="accepted") ?? [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">🚚 NGO Dashboard</h1>
          <p className="text-muted-foreground mt-1">Connect with PGs and redistribute surplus meals.</p>
        </div>
        <Button variant={mapView?"default":"outline"} className="gap-2 rounded-xl" onClick={()=>setMapView(v=>!v)}>
          🗺️ {mapView?"List View":"Map View"}
        </Button>
      </div>

      {/* Map View */}
      {mapView && sorted && sorted.length > 0 && (
        <Card className="overflow-hidden animate-slide-up" data-testid="card-map-view">
          <CardHeader className="pb-3 bg-blue-50 dark:bg-blue-950/30"><CardTitle className="text-base text-blue-800 dark:text-blue-200">📍 Pickup Locations</CardTitle><CardDescription>Simulated map of available pickups</CardDescription></CardHeader>
          <CardContent className="p-0">
            <div className="relative bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-950/40 dark:to-blue-950/40 h-52 overflow-hidden">
              <div className="absolute inset-0 grid grid-cols-8 grid-rows-4 opacity-10">{Array.from({length:32}).map((_,i)=><div key={i} className="border border-gray-400" />)}</div>
              {sorted.map((req,i) => {
                const u=getUrgency(req.pickupTime);
                const x=10+(i%4)*22+Math.sin(i)*5, y=20+Math.floor(i/4)*30;
                return (
                  <div key={req.id} className="absolute flex flex-col items-center animate-bounce-in" style={{left:`${x}%`,top:`${y}%`,animationDelay:`${i*100}ms`}}>
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-white ${u.level==="urgent"?"bg-red-500":u.level==="moderate"?"bg-amber-500":"bg-green-500"}`}>{req.availableMeals}</div>
                    <div className="text-xs font-semibold mt-1 bg-white/90 dark:bg-black/80 px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">{req.pgName}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Impact Metrics */}
      {impact && (
        <Card className="overflow-hidden border-green-200 dark:border-green-800" data-testid="card-ngo-impact">
          <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4">
            <h3 className="text-white font-bold">🌱 Your Impact</h3><p className="text-green-100 text-sm">Every pickup changes lives</p>
          </div>
          <CardContent className="pt-5">
            <div className="grid grid-cols-3 gap-3">
              {[{value:impact.totalMealsCollected,label:"Total Collected"},{value:impact.totalPickups,label:"Total Pickups"},{value:impact.weekMeals,label:"This Week"}].map(({value,label},i)=>(
                <div key={i} className="text-center p-3 rounded-xl bg-green-50 dark:bg-green-950/40">
                  <p className="text-2xl font-extrabold text-green-700 dark:text-green-300"><AnimatedNumber value={value} /></p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div className="text-center p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40"><p className="text-2xl font-extrabold text-blue-700 dark:text-blue-300"><AnimatedNumber value={impact.weekPickups} /></p><p className="text-xs text-muted-foreground mt-0.5">Week Pickups</p></div>
              <div className="text-center p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40"><p className="text-2xl font-extrabold text-teal-700 dark:text-teal-300"><AnimatedNumber value={impact.co2Prevented} suffix="kg" /></p><p className="text-xs text-muted-foreground mt-0.5">CO₂ Prevented</p></div>
              <div className="text-center p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40"><p className="text-2xl font-extrabold text-amber-600"><AnimatedNumber value={impact.pendingRequests} /></p><p className="text-xs text-muted-foreground mt-0.5">Pending</p></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Route Suggestion */}
      {sorted && sorted.length > 1 && (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/10" data-testid="card-route-suggestion">
          <CardHeader className="pb-3"><CardTitle className="text-base text-blue-800 dark:text-blue-200">🗺️ Optimal Pickup Route</CardTitle><CardDescription>Sorted by pickup time</CardDescription></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 flex-wrap">
              {sorted.map((req,i)=>(
                <div key={req.id} className="flex items-center gap-2">
                  <div className="text-sm font-semibold px-3 py-1.5 bg-blue-100 dark:bg-blue-900 rounded-full border border-blue-200 dark:border-blue-700 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />{req.pgName}<span className="text-xs text-blue-600 dark:text-blue-300">({req.availableMeals})</span>
                  </div>
                  {i<sorted.length-1 && <span className="text-muted-foreground font-bold">→</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Available Pickups */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Available Pickups</h2>
          {reqLoading ? (
            <div className="space-y-4"><Skeleton className="h-56 w-full rounded-2xl" /><Skeleton className="h-56 w-full rounded-2xl" /></div>
          ) : !sorted || sorted.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center p-14 text-center text-muted-foreground">
                <div className="text-5xl mb-4">📭</div>
                <p className="font-semibold">No pending requests</p>
                <p className="text-sm mt-1">PG owners will notify you when surplus is ready.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sorted.map((req, idx) => {
                const urgency = getUrgency(req.pickupTime);
                return (
                  <Card key={req.id} className={`overflow-hidden border-l-4 ${urgency.border} ${urgency.level==="urgent"?"shadow-lg":""} animate-slide-up`} style={{animationDelay:`${idx*80}ms`}} data-testid={`card-ngo-request-${req.id}`}>
                    <CardHeader className="pb-3 bg-muted/20">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`h-2.5 w-2.5 rounded-full ${urgency.dot}`} />
                            <CardTitle className="text-lg">{req.pgName}</CardTitle>
                          </div>
                          <CardDescription>{req.pgLocation}</CardDescription>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge className={`${urgency.badge} text-white border-0`}>{urgency.label}</Badge>
                          <span className="text-xs text-muted-foreground">{req.availableMeals} meals</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-3 pb-2">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                        <div><p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Menu</p><p className="font-medium">{req.mealMenu??"Mixed Items"}</p></div>
                        <div><p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Pickup</p>
                          <div className="flex items-center gap-1.5"><span>{format(new Date(req.pickupTime),"h:mm a")}</span><span className="text-muted-foreground">·</span><PickupTimer pickupTime={req.pickupTime} /></div>
                        </div>
                        <div><p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Type</p><Badge variant="outline">{getFoodType(req.mealMenu)}</Badge></div>
                        <div><p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Prep</p><p>{getPrepTime(req.mealMenu)}</p></div>
                      </div>
                    </CardContent>
                    <CardFooter className="gap-2 pt-2 pb-4">
                      <Button className="flex-1 rounded-xl" onClick={()=>handleAccept(req.id)} disabled={acceptReq.isPending} data-testid={`button-accept-${req.id}`}>✅ Accept</Button>
                      <Button variant="outline" className="rounded-xl" onClick={()=>toast.info("Navigate to "+req.pgLocation)}>🧭 Navigate</Button>
                      <Button variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/10 rounded-xl" onClick={()=>handleReject(req.id)} disabled={rejectReq.isPending} data-testid={`button-reject-${req.id}`}>✕</Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Awaiting + Activity Feed */}
        <div className="space-y-6">
          {/* Awaiting confirmation with timeline */}
          {accepted.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xl font-bold">Awaiting Confirmation</h2>
              {accepted.map(item => (
                <Card key={item.id} className="border-l-4 border-l-amber-400 animate-slide-up" data-testid={`card-accepted-${item.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div><p className="font-semibold">{item.pgName}</p><p className="text-sm text-muted-foreground">{item.availableMeals} meals · {item.mealMenu??"Mixed"}</p></div>
                      <Badge variant="secondary">Accepted</Badge>
                    </div>
                    <StatusTimeline status={item.status} />
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" className="flex-1 rounded-lg" onClick={()=>setQrModal({id:item.id})}>📱 QR Scan</Button>
                      <Button size="sm" className="flex-1 rounded-lg" onClick={()=>handleComplete(item.id)} disabled={completing===item.id} data-testid={`button-complete-${item.id}`}>{completing===item.id?"Confirming...":"Confirm Pickup"}</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Activity Feed */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Activity Feed</h2>
              <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 dark:bg-green-950/30 px-2.5 py-1 rounded-full border border-green-200 dark:border-green-800">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                Live
              </div>
            </div>
            <Card>
              <CardContent className="p-4">
                {histLoading ? (
                  <div className="space-y-3"><Skeleton className="h-14 w-full rounded-xl" /><Skeleton className="h-14 w-full rounded-xl" /></div>
                ) : (
                  <ActivityFeed history={history ?? []} />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* QR Modal */}
      {qrModal && <QrPickupModal onCollect={()=>handleComplete(qrModal.id)} onClose={()=>setQrModal(null)} />}
    </div>
  );
}
