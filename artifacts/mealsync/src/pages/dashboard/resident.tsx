import { useState, useEffect } from "react";
import { useConfirmMeal, useSubmitFeedback } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useCountUp } from "@/hooks/useCountUp";

const WEEKDAYS = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"] as const;
type Weekday = typeof WEEKDAYS[number];
type SlotSchedule = { lunch: boolean; dinner: boolean };
type Schedule = Record<Weekday, SlotSchedule>;

interface TodayMenuItem { id: number; menu: string; expectedPeople: number; date: string }
interface ImpactData { mealsContributed: number; foodSavedKg: number; co2SavedKg: number; thisWeekConfirmed: number; totalResponses: number }
interface Poll { id: number; question: string; options: string[]; tally: Record<string,number>; totalVotes: number; createdAt: string; expiresAt: string | null }

/* ─── Food helpers ──────────────────────────────────────────── */
const FOOD_EMOJIS: Record<string,string> = { rice:"🍚",dal:"🍲",roti:"🫓",sabji:"🥦",biryani:"🍛",paneer:"🧀",chole:"🫘",rajma:"🫘",khichdi:"🥘",curry:"🍛",naan:"🫓" };
function getFoodEmoji(menu: string) {
  const l = menu.toLowerCase();
  for (const [k,e] of Object.entries(FOOD_EMOJIS)) if (l.includes(k)) return e;
  return "🍽️";
}

const TAG_RULES: [string, string, string][] = [
  ["biryani","🌶️ Spicy","bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"],
  ["masala","🌶️ Spicy","bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"],
  ["dal","🌿 Vegan","bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300"],
  ["chole","🌿 Vegan","bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300"],
  ["rajma","🌿 Vegan","bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300"],
  ["paneer","🧀 Protein","bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"],
  ["chicken","🍗 Protein","bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"],
  ["rice","🍚 Comfort","bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"],
  ["khichdi","😊 Comfort","bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"],
];
function getMenuTags(menu: string) {
  const l = menu.toLowerCase();
  return TAG_RULES.filter(([k]) => l.includes(k)).map(([,label,cls]) => ({ label, cls })).slice(0,3);
}

/* ─── Eco levels ───────────────────────────────────────────── */
const ECO_LEVELS = [
  { label:"Seedling",    emoji:"🌱", min:0,  max:5,  color:"#84cc16", ring:"#bef264" },
  { label:"Eco Warrior", emoji:"🌿", min:6,  max:20, color:"#16a34a", ring:"#4ade80" },
  { label:"Waste Zero Hero", emoji:"♻️", min:21, max:999, color:"#0d9488", ring:"#2dd4bf" },
];
function getEcoLevel(meals: number) {
  return ECO_LEVELS.find(l => meals <= l.max) ?? ECO_LEVELS[ECO_LEVELS.length-1];
}
function getProgressToNext(meals: number) {
  const level = getEcoLevel(meals);
  if (level.max === 999) return 1;
  const span = level.max - level.min;
  return span <= 0 ? 1 : Math.min((meals - level.min) / span, 1);
}

function EcoRing({ meals }: { meals: number }) {
  const level = getEcoLevel(meals);
  const pct = getProgressToNext(meals);
  const r = 44, circ = 2 * Math.PI * r, dash = circ * pct;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative h-24 w-24">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
          <circle cx="50" cy="50" r={r} fill="none" stroke={level.ring} strokeWidth="8"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1.2s ease-out" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl">{level.emoji}</span>
        </div>
      </div>
      <p className="text-sm font-extrabold" style={{ color: level.color }}>{level.label}</p>
      <p className="text-xs text-muted-foreground">
        {level.max === 999 ? "Max level!" : `${meals}/${level.max+1} meals`}
      </p>
    </div>
  );
}

/* ─── Live countdown ───────────────────────────────────────── */
function useCountdown6PM() {
  const [remaining, setRemaining] = useState("");
  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const cutoff = new Date(); cutoff.setHours(18,0,0,0);
      const diff = cutoff.getTime() - now.getTime();
      if (diff <= 0) { setRemaining(""); return; }
      const h = Math.floor(diff/3600000);
      const m = Math.floor((diff%3600000)/60000);
      const s = Math.floor((diff%60000)/1000);
      setRemaining(h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`);
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, []);
  return remaining;
}

const DEFAULT_SCHEDULE: Schedule = WEEKDAYS.reduce((acc,d) => { acc[d]={lunch:false,dinner:true}; return acc; }, {} as Schedule);
function getToday(): Weekday { const days: Weekday[]=["sunday","monday","tuesday","wednesday","thursday","friday","saturday"]; return days[new Date().getDay()]; }
function isBeforeReminder() { return new Date().getHours() < 18; }

function AnimatedStat({ value, suffix="" }: { value: number; suffix?: string }) {
  const count = useCountUp(Math.round(value));
  return <span>{count}{suffix}</span>;
}

export default function ResidentDashboard() {
  const confirmMeal = useConfirmMeal();
  const submitFeedback = useSubmitFeedback();
  const todayStr = new Date().toISOString().split("T")[0];
  const today = getToday();
  const hour = new Date().getHours();
  const isEvening = hour >= 17;
  const countdown = useCountdown6PM();

  const [todayMenu, setTodayMenu] = useState<TodayMenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [impact, setImpact] = useState<ImpactData | null>(null);
  const [poll, setPoll] = useState<Poll | null>(null);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<Schedule>(DEFAULT_SCHEDULE);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [confirmAnim, setConfirmAnim] = useState<"idle"|"yes"|"no">("idle");

  const [confirmed, setConfirmed] = useState<boolean | null>(() => {
    const s = localStorage.getItem(`mealsync_confirmed_${todayStr}`);
    return s !== null ? JSON.parse(s) : null;
  });
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(() =>
    localStorage.getItem(`mealsync_feedback_${todayStr}`) === "true",
  );

  useEffect(() => {
    const creds = { credentials: "include" as const };
    fetch("/api/residents/today-menu", creds).then(r=>r.json()).then((d:TodayMenuItem[])=>{setTodayMenu(d);setMenuLoading(false);}).catch(()=>setMenuLoading(false));
    fetch("/api/intelligence/resident-impact", creds).then(r=>r.ok?r.json():null).then(d=>d&&setImpact(d)).catch(()=>{});
    fetch("/api/polls", creds).then(r=>r.json()).then((polls:Poll[])=>{if(polls.length>0)setPoll(polls[0]);}).catch(()=>{});
    fetch("/api/schedules/mine", creds).then(r=>r.ok?r.json():null).then(d=>d&&setSchedule(d as Schedule)).catch(()=>{});
    const sv = localStorage.getItem(`mealsync_poll_vote_${todayStr}`);
    if (sv) setMyVote(sv);
  }, []);

  const handleConfirm = async (willEat: boolean, silent = false) => {
    setConfirmAnim(willEat ? "yes" : "no");
    try {
      await confirmMeal.mutateAsync({ data: { willEat, mealDate: todayStr } });
      setConfirmed(willEat);
      localStorage.setItem(`mealsync_confirmed_${todayStr}`, JSON.stringify(willEat));
      if (!silent) toast.success(willEat ? "🍽️ Meal confirmed!" : "👍 Noted, thanks!");
    } catch { setConfirmAnim("idle"); toast.error("Failed. Please try again."); }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { toast.error("Please select a rating"); return; }
    try {
      await submitFeedback.mutateAsync({ data: { rating, comment, mealDate: todayStr } });
      setFeedbackSubmitted(true);
      localStorage.setItem(`mealsync_feedback_${todayStr}`, "true");
      toast.success("✨ Feedback submitted!");
    } catch { toast.error("Failed to submit feedback."); }
  };

  const handleVote = async (option: string) => {
    if (!poll) return;
    try {
      await fetch(`/api/polls/${poll.id}/vote`, { method:"POST", credentials:"include", headers:{"Content-Type":"application/json"}, body:JSON.stringify({option}) });
      setMyVote(option);
      localStorage.setItem(`mealsync_poll_vote_${todayStr}`, option);
      setPoll(prev => {
        if (!prev) return prev;
        const t = {...prev.tally};
        if (myVote) t[myVote] = Math.max(0, (t[myVote]??0)-1);
        t[option] = (t[option]??0)+1;
        return {...prev, tally:t, totalVotes:prev.totalVotes+(myVote?0:1)};
      });
      toast.success(`🗳️ Voted for "${option}"`);
    } catch { toast.error("Failed to submit vote."); }
  };

  const handleSaveSchedule = async () => {
    setScheduleSaving(true);
    try {
      await fetch("/api/schedules/mine", { method:"POST", credentials:"include", headers:{"Content-Type":"application/json"}, body:JSON.stringify({schedule}) });
      toast.success("📅 Schedule saved!");
      setShowSchedule(false);
    } catch { toast.error("Failed to save schedule."); }
    finally { setScheduleSaving(false); }
  };

  const themeAccent = isEvening ? "from-indigo-600 via-purple-600 to-blue-600" : "from-green-500 via-emerald-500 to-teal-500";

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
      {/* Hero header */}
      <div className={`rounded-2xl p-6 bg-gradient-to-r ${themeAccent} text-white shadow-lg`}>
        <h1 className="text-2xl font-bold">{isEvening ? "🌙 Good Evening!" : "☀️ Good Morning!"}</h1>
        <p className="text-white/80 mt-1 text-sm">
          {new Date().toLocaleDateString("en-IN", { weekday:"long", month:"long", day:"numeric" })} · Help reduce food waste today.
        </p>
      </div>

      {/* Live Countdown Reminder */}
      {isBeforeReminder() && confirmed === null && countdown && (
        <div className="flex items-center justify-between gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700 rounded-xl px-4 py-3 shadow-sm animate-slide-up" data-testid="banner-reminder">
          <div className="flex items-center gap-3">
            <span className="text-xl animate-pulse">⏰</span>
            <div>
              <p className="text-amber-800 dark:text-amber-300 text-sm font-bold">Confirm before 6:00 PM</p>
              <p className="text-amber-600 dark:text-amber-400 text-xs font-mono font-semibold tabular-nums">
                {countdown} remaining
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="sm" className="h-8 rounded-full bg-amber-500 hover:bg-amber-600 text-white border-0" onClick={() => handleConfirm(true)}>Yes</Button>
            <Button size="sm" variant="outline" className="h-8 rounded-full border-amber-300" onClick={() => handleConfirm(false)}>No</Button>
          </div>
        </div>
      )}

      {/* Today's Menu */}
      <Card className="overflow-hidden border-0 shadow-md">
        <CardHeader className={`bg-gradient-to-r ${isEvening ? "from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30" : "from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30"} pb-4`}>
          <div className="flex justify-between items-center">
            <div><CardTitle className="text-xl">Today's Menu</CardTitle><CardDescription>Prepared fresh by your PG</CardDescription></div>
            <span className="text-sm text-muted-foreground bg-background/80 px-3 py-1 rounded-full border">{new Date().toLocaleDateString("en-IN", {weekday:"long"})}</span>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          {menuLoading ? (
            <div className="space-y-3"><Skeleton className="h-20 w-full rounded-xl" /><Skeleton className="h-20 w-full rounded-xl" /></div>
          ) : todayMenu.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <div className="text-5xl mb-3">🍽️</div>
              <p className="font-semibold text-lg text-slate-800 dark:text-slate-200">No meals available today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayMenu.map((item, i) => {
                const tags = getMenuTags(item.menu);
                return (
                  <div key={item.id} className="flex items-start gap-4 p-4 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors animate-slide-up" style={{ animationDelay:`${i*80}ms` }} data-testid={`card-menu-${item.id}`}>
                    <div className="text-4xl shrink-0">{getFoodEmoji(item.menu)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{item.menu}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Planned for {item.expectedPeople} residents</p>
                      {tags.length > 0 && (
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          {tags.map(t => (
                            <span key={t.label} className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.cls}`}>{t.label}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0">Today</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendance */}
      <Card className="overflow-hidden border-0 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Tonight's Attendance</CardTitle>
              <CardDescription>Will you eat dinner today?</CardDescription>
            </div>
            {countdown && confirmed === null && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Cutoff in</p>
                <p className="text-sm font-mono font-bold text-amber-600 dark:text-amber-400 tabular-nums">{countdown}</p>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {confirmed === null ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => handleConfirm(true)} disabled={confirmMeal.isPending}
                  className={`relative overflow-hidden h-24 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white font-bold text-lg shadow-md hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all ${confirmAnim==="yes" ? "animate-bounce-in" : ""}`}
                  data-testid="button-confirm-yes">
                  <span className="text-3xl block mb-1">🍛</span>
                  Yes, I'll eat!
                </button>
                <button onClick={() => handleConfirm(false)} disabled={confirmMeal.isPending}
                  className={`h-24 rounded-2xl border-2 border-dashed text-muted-foreground font-semibold text-base hover:border-destructive hover:text-destructive hover:bg-destructive/5 active:scale-95 transition-all ${confirmAnim==="no" ? "animate-bounce-in" : ""}`}
                  data-testid="button-confirm-no">
                  <span className="text-3xl block mb-1">🚶</span>
                  I'm out today
                </button>
              </div>
              {schedule[today]?.dinner && (
                <button onClick={() => handleConfirm(true,true)} className="text-xs text-primary hover:underline w-full text-center py-1">
                  ⚡ Auto-fill from weekly schedule (dinner: ✓)
                </button>
              )}
            </div>
          ) : (
            <div className={`text-center p-6 rounded-2xl animate-bounce-in ${confirmed ? "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800" : "bg-muted/40 border border-border"}`} data-testid="text-confirmation-result">
              <div className="text-5xl mb-3">{confirmed ? "✅" : "👋"}</div>
              <p className="text-lg font-bold">{confirmed ? "You're confirmed!" : "Opted out for today"}</p>
              <p className="text-sm text-muted-foreground mt-1">Thank you for helping us reduce waste.</p>
              <Button variant="link" size="sm" className="mt-3 text-xs" onClick={() => { setConfirmed(null); setConfirmAnim("idle"); localStorage.removeItem(`mealsync_confirmed_${todayStr}`); }}>Change my answer</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sustainability Profile — with Eco Levels */}
      {impact && (
        <Card className="overflow-hidden border-0 shadow-md" data-testid="card-sustainability">
          <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4">
            <h3 className="text-white font-bold text-lg">🌱 Sustainability Profile</h3>
            <p className="text-green-100 text-sm">Every confirmation moves you up a level</p>
          </div>
          <CardContent className="pt-5">
            <div className="flex gap-5 items-center mb-5">
              <EcoRing meals={impact.mealsContributed} />
              <div className="flex-1 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {ECO_LEVELS.map((l, i) => {
                    const current = getEcoLevel(impact.mealsContributed);
                    const unlocked = i <= ECO_LEVELS.indexOf(current);
                    return (
                      <div key={l.label} className={`text-center p-2 rounded-xl border ${unlocked ? "border-green-200 bg-green-50 dark:bg-green-950/30" : "border-border bg-muted/20 opacity-50"}`}>
                        <div className="text-xl">{l.emoji}</div>
                        <p className="text-xs font-semibold mt-0.5 leading-tight">{l.label}</p>
                        <p className="text-xs text-muted-foreground">{l.min}+ meals</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-green-50 dark:bg-green-950/40">
                <p className="text-2xl font-extrabold text-green-700 dark:text-green-300"><AnimatedStat value={impact.mealsContributed} /></p>
                <p className="text-xs text-muted-foreground mt-1">Meals tracked</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
                <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300"><AnimatedStat value={Math.round(impact.foodSavedKg*10)/10} suffix="kg" /></p>
                <p className="text-xs text-muted-foreground mt-1">Food saved</p>
              </div>
              <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40">
                <p className="text-2xl font-extrabold text-teal-700 dark:text-teal-300"><AnimatedStat value={Math.round(impact.co2SavedKg*10)/10} suffix="kg" /></p>
                <p className="text-xs text-muted-foreground mt-1">CO₂ saved</p>
              </div>
            </div>
            {impact.thisWeekConfirmed > 0 && (
              <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-950/30 dark:to-teal-950/30 text-center border border-green-200 dark:border-green-800">
                <p className="text-sm font-semibold text-green-700 dark:text-green-300">🏆 You helped save {impact.thisWeekConfirmed} meals this week!</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Weekly Schedule */}
      <Card className="overflow-hidden border-0 shadow-md" data-testid="card-schedule">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div><CardTitle className="text-base">📅 Weekly Schedule</CardTitle><CardDescription>Your recurring meal preferences</CardDescription></div>
            <Button variant="outline" size="sm" className="rounded-full" onClick={() => setShowSchedule(!showSchedule)}>{showSchedule ? "Done" : "Edit"}</Button>
          </div>
        </CardHeader>
        {!showSchedule && (
          <CardContent className="pt-0">
            <div className="flex gap-2 flex-wrap">
              {WEEKDAYS.map(day => (
                <div key={day} className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${day===today ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>
                  {day.slice(0,3).toUpperCase()}<span className="ml-1 opacity-70">{schedule[day]?.lunch&&schedule[day]?.dinner?"L+D":schedule[day]?.dinner?"D":schedule[day]?.lunch?"L":"—"}</span>
                </div>
              ))}
            </div>
          </CardContent>
        )}
        {showSchedule && (
          <CardContent className="space-y-3">
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-muted/40"><th className="text-left font-medium text-muted-foreground py-2 px-3 w-28">Day</th><th className="text-center font-medium text-muted-foreground py-2">Lunch</th><th className="text-center font-medium text-muted-foreground py-2">Dinner</th></tr></thead>
                <tbody className="divide-y">
                  {WEEKDAYS.map(day => (
                    <tr key={day} className={day===today ? "bg-primary/5" : "hover:bg-muted/20 transition-colors"}>
                      <td className="py-2 px-3 capitalize font-semibold">{day.slice(0,3)} {day===today && <Badge variant="outline" className="ml-1 text-xs">Today</Badge>}</td>
                      <td className="text-center py-2"><input type="checkbox" checked={schedule[day]?.lunch??false} onChange={e=>setSchedule(s=>({...s,[day]:{...s[day],lunch:e.target.checked}}))} className="h-4 w-4 accent-primary" data-testid={`checkbox-${day}-lunch`} /></td>
                      <td className="text-center py-2"><input type="checkbox" checked={schedule[day]?.dinner??true} onChange={e=>setSchedule(s=>({...s,[day]:{...s[day],dinner:e.target.checked}}))} className="h-4 w-4 accent-primary" data-testid={`checkbox-${day}-dinner`} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button className="w-full rounded-xl" onClick={handleSaveSchedule} disabled={scheduleSaving}>{scheduleSaving?"Saving...":"Save Schedule"}</Button>
          </CardContent>
        )}
      </Card>

      {/* Community Poll */}
      {poll && (
        <Card className="overflow-hidden border-0 shadow-md" data-testid="card-poll">
          <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 pb-3">
            <CardTitle className="text-base text-violet-800 dark:text-violet-200">🗳️ {poll.question}</CardTitle>
            <CardDescription>{poll.totalVotes} vote{poll.totalVotes!==1?"s":""} so far</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-2">
            {poll.options.map(option => {
              const votes = poll.tally[option]??0;
              const pct = poll.totalVotes>0 ? Math.round((votes/poll.totalVotes)*100) : 0;
              const isSelected = myVote===option;
              const maxVotes = Math.max(...Object.values(poll.tally),1);
              const isWinning = votes===maxVotes && poll.totalVotes>0;
              return (
                <button key={option} onClick={() => handleVote(option)}
                  className={`w-full text-left relative overflow-hidden rounded-xl border-2 px-4 py-3 transition-all hover:scale-[1.01] active:scale-[0.99] ${isSelected ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30" : "border-border hover:border-violet-300 hover:bg-muted/40"}`}
                  data-testid={`button-poll-${option}`}>
                  <div className="absolute inset-y-0 left-0 bg-violet-100 dark:bg-violet-900/30 transition-all duration-700 ease-out" style={{width:`${pct}%`}} />
                  <div className="relative flex justify-between items-center">
                    <span className="font-medium text-sm">{isWinning && <span className="mr-1">🏆</span>}{option}</span>
                    <span className="text-xs text-muted-foreground font-semibold">{pct}%</span>
                  </div>
                </button>
              );
            })}
            {myVote && <p className="text-xs text-center text-muted-foreground pt-1">You voted: <span className="font-semibold text-violet-600 dark:text-violet-400">{myVote}</span></p>}
          </CardContent>
        </Card>
      )}

      {/* Feedback */}
      <Card className="overflow-hidden border-0 shadow-md">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 pb-3">
          <CardTitle className="text-base">⭐ Rate Yesterday's Meal</CardTitle>
          <CardDescription>Your feedback shapes tomorrow's menu</CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          {feedbackSubmitted ? (
            <div className="text-center py-10 animate-bounce-in" data-testid="text-feedback-thanks">
              <div className="text-5xl mb-3">🙏</div>
              <p className="font-bold text-lg">Thank you!</p>
              <p className="text-sm text-muted-foreground mt-1">Your feedback helps the team serve you better.</p>
            </div>
          ) : (
            <form onSubmit={handleFeedbackSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">How was the meal?</Label>
                <div className="flex gap-3 justify-center py-2">
                  {[1,2,3,4,5].map(star => (
                    <button key={star} type="button" onClick={() => setRating(star)}
                      className={`h-14 w-14 rounded-2xl flex items-center justify-center text-2xl transition-all duration-200 ${rating>=star ? "bg-amber-400 text-white shadow-lg scale-110" : "bg-muted/60 text-muted-foreground hover:bg-amber-100 hover:scale-105"}`}
                      data-testid={`button-star-${star}`}>⭐</button>
                  ))}
                </div>
                {rating>0 && <p className="text-center text-sm font-medium text-amber-600 animate-fade-in">{["","😞 Poor","😐 Fair","😊 Good","😄 Great","🤩 Excellent!"][rating]}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="comment">Any comments? (Optional)</Label>
                <Textarea id="comment" placeholder="What did you enjoy? What could be better?" rows={3} value={comment} onChange={e=>setComment(e.target.value)} className="resize-none rounded-xl" />
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl font-semibold text-base" disabled={submitFeedback.isPending} data-testid="button-submit-feedback">
                {submitFeedback.isPending ? "Submitting..." : "Submit Feedback"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
