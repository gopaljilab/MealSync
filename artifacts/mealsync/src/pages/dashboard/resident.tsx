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

const FOOD_EMOJIS: Record<string, string> = {
  rice:"🍚", dal:"🍲", roti:"🫓", sabji:"🥦", biryani:"🍛", paneer:"🧀", chole:"🫘", rajma:"🫘", khichdi:"🥘", curry:"🍛", naan:"🫓"
};

function getFoodEmoji(menu: string) {
  const lower = menu.toLowerCase();
  for (const [key, emoji] of Object.entries(FOOD_EMOJIS)) {
    if (lower.includes(key)) return emoji;
  }
  return "🍽️";
}

const DEFAULT_SCHEDULE: Schedule = WEEKDAYS.reduce((acc, d) => { acc[d] = { lunch: false, dinner: true }; return acc; }, {} as Schedule);

function getToday(): Weekday {
  const days: Weekday[] = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
  return days[new Date().getDay()];
}

function isBeforeReminder() { return new Date().getHours() < 18; }

function AnimatedStat({ value, suffix = "", decimals = 0 }: { value: number; suffix?: string; decimals?: number }) {
  const raw = decimals === 0 ? Math.round(value) : value;
  const count = useCountUp(Math.round(raw));
  return <span>{decimals > 0 ? value.toFixed(decimals) : count}{suffix}</span>;
}

export default function ResidentDashboard() {
  const confirmMeal = useConfirmMeal();
  const submitFeedback = useSubmitFeedback();
  const todayStr = new Date().toISOString().split("T")[0];
  const today = getToday();
  const hour = new Date().getHours();
  const isEvening = hour >= 17;

  const [todayMenu, setTodayMenu] = useState<TodayMenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [impact, setImpact] = useState<ImpactData | null>(null);
  const [poll, setPoll] = useState<Poll | null>(null);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<Schedule>(DEFAULT_SCHEDULE);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [confirmAnim, setConfirmAnim] = useState<"idle" | "yes" | "no">("idle");

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
    fetch("/api/residents/today-menu", creds)
      .then((r) => r.json()).then((d: TodayMenuItem[]) => { setTodayMenu(d); setMenuLoading(false); })
      .catch(() => setMenuLoading(false));
    fetch("/api/intelligence/resident-impact", creds)
      .then((r) => r.ok ? r.json() : null).then((d) => d && setImpact(d)).catch(() => {});
    fetch("/api/polls", creds)
      .then((r) => r.json()).then((polls: Poll[]) => { if (polls.length > 0) setPoll(polls[0]); })
      .catch(() => {});
    fetch("/api/schedules/mine", creds)
      .then((r) => r.ok ? r.json() : null).then((d) => d && setSchedule(d as Schedule)).catch(() => {});
    const savedVote = localStorage.getItem(`mealsync_poll_vote_${todayStr}`);
    if (savedVote) setMyVote(savedVote);
  }, []);

  const handleConfirm = async (willEat: boolean, silent = false) => {
    setConfirmAnim(willEat ? "yes" : "no");
    try {
      await confirmMeal.mutateAsync({ data: { willEat, mealDate: todayStr } });
      setConfirmed(willEat);
      localStorage.setItem(`mealsync_confirmed_${todayStr}`, JSON.stringify(willEat));
      if (!silent) toast.success(willEat ? "🍽️ Meal confirmed! See you at dinner." : "👍 Noted. Thanks for letting us know.");
    } catch {
      setConfirmAnim("idle");
      toast.error("Failed to save confirmation. Please try again.");
    }
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
      await fetch(`/api/polls/${poll.id}/vote`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ option }),
      });
      setMyVote(option);
      localStorage.setItem(`mealsync_poll_vote_${todayStr}`, option);
      setPoll((prev) => {
        if (!prev) return prev;
        const t = { ...prev.tally };
        if (myVote) t[myVote] = Math.max(0, (t[myVote] ?? 0) - 1);
        t[option] = (t[option] ?? 0) + 1;
        return { ...prev, tally: t, totalVotes: prev.totalVotes + (myVote ? 0 : 1) };
      });
      toast.success(`🗳️ Voted for "${option}"`);
    } catch { toast.error("Failed to submit vote."); }
  };

  const handleSaveSchedule = async () => {
    setScheduleSaving(true);
    try {
      await fetch("/api/schedules/mine", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedule }),
      });
      toast.success("📅 Schedule saved!");
      setShowSchedule(false);
    } catch { toast.error("Failed to save schedule."); }
    finally { setScheduleSaving(false); }
  };

  const themeAccent = isEvening
    ? "from-indigo-600 via-purple-600 to-blue-600"
    : "from-green-500 via-emerald-500 to-teal-500";

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
      {/* Hero header */}
      <div className={`rounded-2xl p-6 bg-gradient-to-r ${themeAccent} text-white shadow-lg`}>
        <h1 className="text-2xl font-bold">
          {isEvening ? "🌙 Good Evening!" : "☀️ Good Morning!"}
        </h1>
        <p className="text-white/80 mt-1 text-sm">
          {new Date().toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })}
          {" · "}Help us reduce food waste today.
        </p>
      </div>

      {/* Reminder Banner */}
      {isBeforeReminder() && confirmed === null && (
        <div className="flex items-center justify-between gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700 rounded-xl px-4 py-3 shadow-sm animate-slide-up" data-testid="banner-reminder">
          <div className="flex items-center gap-2">
            <span className="text-xl">⏰</span>
            <div>
              <p className="text-amber-800 dark:text-amber-300 text-sm font-semibold">Confirm by 6 PM</p>
              <p className="text-amber-700 dark:text-amber-400 text-xs">Help us plan the right amount of food.</p>
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
            <div>
              <CardTitle className="text-xl">Today's Menu</CardTitle>
              <CardDescription>Prepared fresh by your PG</CardDescription>
            </div>
            <span className="text-sm text-muted-foreground bg-background/80 px-3 py-1 rounded-full border">
              {new Date().toLocaleDateString("en-IN", { weekday: "long" })}
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          {menuLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          ) : todayMenu.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <div className="text-5xl mb-3">🍽️</div>
              <p className="font-medium">Menu not announced yet</p>
              <p className="text-sm mt-1">Check back closer to meal time.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayMenu.map((item, i) => (
                <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors animate-slide-up" style={{ animationDelay: `${i * 80}ms` }} data-testid={`card-menu-${item.id}`}>
                  <div className="text-4xl">{getFoodEmoji(item.menu)}</div>
                  <div className="flex-1">
                    <p className="font-semibold">{item.menu}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Planned for {item.expectedPeople} residents</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">Today</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendance */}
      <Card className="overflow-hidden border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle>Tonight's Attendance</CardTitle>
          <CardDescription>Will you eat dinner today?</CardDescription>
        </CardHeader>
        <CardContent>
          {confirmed === null ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleConfirm(true)}
                  disabled={confirmMeal.isPending}
                  className={`relative overflow-hidden h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white font-bold text-lg shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all ${confirmAnim === "yes" ? "animate-bounce-in" : ""}`}
                  data-testid="button-confirm-yes"
                >
                  <span className="text-2xl block">🍛</span>
                  Yes, I'll eat!
                </button>
                <button
                  onClick={() => handleConfirm(false)}
                  disabled={confirmMeal.isPending}
                  className={`h-20 rounded-2xl border-2 border-dashed text-muted-foreground font-semibold text-base hover:border-destructive hover:text-destructive hover:bg-destructive/5 active:scale-95 transition-all ${confirmAnim === "no" ? "animate-bounce-in" : ""}`}
                  data-testid="button-confirm-no"
                >
                  <span className="text-2xl block">🚶</span>
                  I'm out today
                </button>
              </div>
              {schedule[today]?.dinner && (
                <button
                  onClick={() => handleConfirm(true, true)}
                  className="text-xs text-primary hover:underline w-full text-center py-1"
                >
                  ⚡ Auto-fill from weekly schedule (dinner: ✓)
                </button>
              )}
            </div>
          ) : (
            <div className={`text-center p-6 rounded-2xl animate-bounce-in ${confirmed ? "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800" : "bg-muted/40 border border-border"}`} data-testid="text-confirmation-result">
              <div className="text-4xl mb-3">{confirmed ? "✅" : "👋"}</div>
              <p className="text-lg font-bold">{confirmed ? "You're confirmed!" : "Opted out for today"}</p>
              <p className="text-sm text-muted-foreground mt-1">Thank you for helping us reduce waste.</p>
              <Button variant="link" size="sm" className="mt-3 text-xs" onClick={() => { setConfirmed(null); setConfirmAnim("idle"); localStorage.removeItem(`mealsync_confirmed_${todayStr}`); }}>
                Change my answer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sustainability Impact */}
      {impact && (
        <Card className="overflow-hidden border-0 shadow-md" data-testid="card-sustainability">
          <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4">
            <h3 className="text-white font-bold text-lg">🌱 Your Sustainability Profile</h3>
            <p className="text-green-100 text-sm">Every meal confirmed = less waste</p>
          </div>
          <CardContent className="pt-5">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-green-50 dark:bg-green-950/40">
                <p className="text-2xl font-extrabold text-green-700 dark:text-green-300">
                  <AnimatedStat value={impact.mealsContributed} />
                </p>
                <p className="text-xs text-muted-foreground mt-1">Meals tracked</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
                <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">
                  <AnimatedStat value={impact.foodSavedKg} suffix="kg" decimals={1} />
                </p>
                <p className="text-xs text-muted-foreground mt-1">Food saved</p>
              </div>
              <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40">
                <p className="text-2xl font-extrabold text-teal-700 dark:text-teal-300">
                  <AnimatedStat value={impact.co2SavedKg} suffix="kg" decimals={1} />
                </p>
                <p className="text-xs text-muted-foreground mt-1">CO₂ saved</p>
              </div>
            </div>
            {impact.thisWeekConfirmed > 0 && (
              <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-950/30 dark:to-teal-950/30 text-center border border-green-200 dark:border-green-800">
                <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                  🏆 You helped save {impact.thisWeekConfirmed} meals this week!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Weekly Schedule */}
      <Card className="overflow-hidden border-0 shadow-md" data-testid="card-schedule">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-base">📅 Weekly Schedule</CardTitle>
              <CardDescription>Your recurring meal preferences</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="rounded-full" onClick={() => setShowSchedule(!showSchedule)}>
              {showSchedule ? "Done" : "Edit"}
            </Button>
          </div>
        </CardHeader>

        {!showSchedule && (
          <CardContent className="pt-0">
            <div className="flex gap-2 flex-wrap">
              {WEEKDAYS.map((day) => (
                <div key={day} className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${day === today ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>
                  {day.slice(0,3).toUpperCase()}
                  <span className="ml-1 opacity-70">
                    {schedule[day]?.lunch && schedule[day]?.dinner ? "L+D" : schedule[day]?.dinner ? "D" : schedule[day]?.lunch ? "L" : "—"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        )}

        {showSchedule && (
          <CardContent className="space-y-3">
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40">
                    <th className="text-left font-medium text-muted-foreground py-2 px-3 w-28">Day</th>
                    <th className="text-center font-medium text-muted-foreground py-2">Lunch</th>
                    <th className="text-center font-medium text-muted-foreground py-2">Dinner</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {WEEKDAYS.map((day) => (
                    <tr key={day} className={day === today ? "bg-primary/5" : "hover:bg-muted/20 transition-colors"}>
                      <td className="py-2 px-3 capitalize font-semibold">
                        {day.slice(0,3)} {day === today && <Badge variant="outline" className="ml-1 text-xs">Today</Badge>}
                      </td>
                      <td className="text-center py-2">
                        <input type="checkbox" checked={schedule[day]?.lunch ?? false}
                          onChange={(e) => setSchedule((s) => ({ ...s, [day]: { ...s[day], lunch: e.target.checked } }))}
                          className="h-4 w-4 accent-primary" data-testid={`checkbox-${day}-lunch`} />
                      </td>
                      <td className="text-center py-2">
                        <input type="checkbox" checked={schedule[day]?.dinner ?? true}
                          onChange={(e) => setSchedule((s) => ({ ...s, [day]: { ...s[day], dinner: e.target.checked } }))}
                          className="h-4 w-4 accent-primary" data-testid={`checkbox-${day}-dinner`} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button className="w-full rounded-xl" onClick={handleSaveSchedule} disabled={scheduleSaving}>
              {scheduleSaving ? "Saving..." : "Save Schedule"}
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Community Poll */}
      {poll && (
        <Card className="overflow-hidden border-0 shadow-md" data-testid="card-poll">
          <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 pb-3">
            <CardTitle className="text-base text-violet-800 dark:text-violet-200">🗳️ {poll.question}</CardTitle>
            <CardDescription>{poll.totalVotes} vote{poll.totalVotes !== 1 ? "s" : ""} so far</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-2">
            {poll.options.map((option) => {
              const votes = poll.tally[option] ?? 0;
              const pct = poll.totalVotes > 0 ? Math.round((votes / poll.totalVotes) * 100) : 0;
              const isSelected = myVote === option;
              const maxVotes = Math.max(...Object.values(poll.tally), 1);
              const isWinning = votes === maxVotes && poll.totalVotes > 0;
              return (
                <button key={option} onClick={() => handleVote(option)}
                  className={`w-full text-left relative overflow-hidden rounded-xl border-2 px-4 py-3 transition-all hover:scale-[1.01] active:scale-[0.99] ${isSelected ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30" : "border-border hover:border-violet-300 hover:bg-muted/40"}`}
                  data-testid={`button-poll-${option}`}
                >
                  <div className="absolute inset-y-0 left-0 bg-violet-100 dark:bg-violet-900/30 transition-all duration-700 ease-out" style={{ width: `${pct}%` }} />
                  <div className="relative flex justify-between items-center">
                    <span className="font-medium text-sm">
                      {isWinning && <span className="mr-1">🏆</span>}
                      {option}
                    </span>
                    <span className="text-xs text-muted-foreground font-semibold">{pct}%</span>
                  </div>
                </button>
              );
            })}
            {myVote && (
              <p className="text-xs text-center text-muted-foreground pt-1">
                You voted: <span className="font-semibold text-violet-600 dark:text-violet-400">{myVote}</span>
              </p>
            )}
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
                  {[1,2,3,4,5].map((star) => (
                    <button key={star} type="button" onClick={() => setRating(star)}
                      className={`h-14 w-14 rounded-2xl flex items-center justify-center text-2xl transition-all duration-200 ${rating >= star ? "bg-amber-400 text-white shadow-lg scale-110" : "bg-muted/60 text-muted-foreground hover:bg-amber-100 hover:scale-105"}`}
                      data-testid={`button-star-${star}`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-center text-sm font-medium text-amber-600 animate-fade-in">
                    {["","😞 Poor","😐 Fair","😊 Good","😄 Great","🤩 Excellent!"][rating]}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="comment">Any comments? (Optional)</Label>
                <Textarea id="comment" placeholder="What did you enjoy? What could be better?" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} className="resize-none rounded-xl" />
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
