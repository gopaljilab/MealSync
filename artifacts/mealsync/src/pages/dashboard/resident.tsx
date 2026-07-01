import { useState, useEffect } from "react";
import { useConfirmMeal, useSubmitFeedback } from "@workspace/api-client-react";
import { toast } from "sonner";
import { useCountUp } from "@/hooks/useCountUp";
import {
  SectionContainer,
  GlassCard,
  PremiumCard,
  GlowButton,
  StatusBadge,
  PremiumSkeleton,
  PageShell,
  ContentSection,
} from "@/components/ui/premium";
import {
  Award,
  Calendar,
  Utensils,
  TrendingUp,
  Sparkles,
  Clock,
  Star,
  Check,
} from "lucide-react";
import { Label } from "@/components/ui/label";

const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
type Weekday = typeof WEEKDAYS[number];
type SlotSchedule = { lunch: boolean; dinner: boolean };
type Schedule = Record<Weekday, SlotSchedule>;

interface TodayMenuItem { id: number; menu: string; expectedPeople: number; date: string }
interface ImpactData { mealsContributed: number; foodSavedKg: number; co2SavedKg: number; thisWeekConfirmed: number; totalResponses: number }
interface Poll { id: number; question: string; options: string[]; tally: Record<string, number>; totalVotes: number; createdAt: string; expiresAt: string | null }

/* ─── Food helpers ──────────────────────────────────────────── */
const FOOD_EMOJIS: Record<string, string> = { rice: "🍚", dal: "🍲", roti: "🫓", sabji: "🥦", biryani: "🍛", paneer: "🧀", chole: "🫘", rajma: "🫘", khichdi: "🥘", curry: "🍛", naan: "🫓" };
function getFoodEmoji(menu: string) {
  const l = menu.toLowerCase();
  for (const [k, e] of Object.entries(FOOD_EMOJIS)) if (l.includes(k)) return e;
  return "🍽️";
}

const TAG_RULES: [string, string, string][] = [
  ["biryani", "🌶️ Spicy", "bg-red-500/10 text-red-400 border-red-500/20"],
  ["masala", "🌶️ Spicy", "bg-red-500/10 text-red-400 border-red-500/20"],
  ["dal", "🌿 Vegan", "bg-emerald-500/10 text-primary border-primary/20"],
  ["chole", "🌿 Vegan", "bg-emerald-500/10 text-primary border-primary/20"],
  ["rajma", "🌿 Vegan", "bg-emerald-500/10 text-primary border-primary/20"],
  ["paneer", "🧀 Protein", "bg-amber-500/10 text-amber-400 border-amber-500/20"],
  ["chicken", "🍗 Protein", "bg-amber-500/10 text-amber-400 border-amber-500/20"],
  ["rice", "🍚 Comfort", "bg-blue-500/10 text-blue-400 border-blue-500/20"],
  ["khichdi", "😊 Comfort", "bg-blue-500/10 text-blue-400 border-blue-500/20"],
];
function getMenuTags(menu: string) {
  const l = menu.toLowerCase();
  return TAG_RULES.filter(([k]) => l.includes(k)).map(([, label, cls]) => ({ label, cls })).slice(0, 3);
}

/* ─── Eco levels ───────────────────────────────────────────── */
const ECO_LEVELS = [
  { label: "Seedling", emoji: "🌱", min: 0, max: 5, color: "#10b981", ring: "rgba(16, 185, 129, 0.2)" },
  { label: "Eco Warrior", emoji: "🌿", min: 6, max: 20, color: "#10b981", ring: "rgba(16, 185, 129, 0.4)" },
  { label: "Waste Zero Hero", emoji: "♻️", min: 21, max: 999, color: "#10b981", ring: "rgba(16, 185, 129, 0.8)" },
];
function getEcoLevel(meals: number) {
  return ECO_LEVELS.find(l => meals <= l.max) ?? ECO_LEVELS[ECO_LEVELS.length - 1];
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
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-24 w-24">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="6" />
          <circle cx="50" cy="50" r={r} fill="none" stroke="#10b981" strokeWidth="6"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1.2s ease-out" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl">{level.emoji}</span>
        </div>
      </div>
      <p className="text-xs font-black uppercase tracking-wider text-primary">{level.label}</p>
      <p className="text-[10px] font-bold text-muted-foreground">
        {level.max === 999 ? "MAX LEVEL" : `${meals} / ${level.max + 1} MEALS`}
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
      const cutoff = new Date(); cutoff.setHours(18, 0, 0, 0);
      const diff = cutoff.getTime() - now.getTime();
      if (diff <= 0) { setRemaining(""); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`);
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, []);
  return remaining;
}

const DEFAULT_SCHEDULE: Schedule = WEEKDAYS.reduce((acc, d) => { acc[d] = { lunch: false, dinner: true }; return acc; }, {} as Schedule);
function getToday(): Weekday { const days: Weekday[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]; return days[new Date().getDay()]; }
function isBeforeReminder() { return new Date().getHours() < 18; }

function AnimatedStat({ value, suffix = "" }: { value: number; suffix?: string }) {
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
    fetch("/api/residents/today-menu", creds).then(r => r.json()).then((d: TodayMenuItem[]) => { setTodayMenu(d); setMenuLoading(false); }).catch(() => setMenuLoading(false));
    fetch("/api/intelligence/resident-impact", creds).then(r => r.ok ? r.json() : null).then(d => d && setImpact(d)).catch(() => { });
    fetch("/api/polls", creds).then(r => r.json()).then((polls: Poll[]) => { if (polls.length > 0) setPoll(polls[0]); }).catch(() => { });
    fetch("/api/schedules/mine", creds).then(r => r.ok ? r.json() : null).then(d => d && setSchedule(d as Schedule)).catch(() => { });
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
      await fetch(`/api/polls/${poll.id}/vote`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ option }) });
      setMyVote(option);
      localStorage.setItem(`mealsync_poll_vote_${todayStr}`, option);
      setPoll(prev => {
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
      await fetch("/api/schedules/mine", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ schedule }) });
      toast.success("📅 Schedule saved!");
      setShowSchedule(false);
    } catch { toast.error("Failed to save schedule."); }
    finally { setScheduleSaving(false); }
  };

  return (
    <PageShell>
      <ContentSection 
        title={isEvening ? "Good Evening" : "Good Morning"} 
        description={`${new Date().toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })} · Track and optimize your meal footprint.`}
        action={
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--brand-accent)] animate-pulse-ring" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--brand-accent)]">Resident Portal</span>
          </div>
        }
      />

      {/* Live Countdown Reminder Banner */}
      {isBeforeReminder() && confirmed === null && countdown && (
        <div className="flex items-center justify-between gap-4 bg-[var(--status-warning-bg)] border border-[var(--status-warning)]/20 rounded-2xl p-5 shadow-sm animate-slide-up" data-testid="banner-reminder">
          <div className="flex items-start gap-3">
            <span className="text-xl shrink-0 mt-0.5 animate-pulse">⏰</span>
            <div>
              <p className="text-[var(--status-warning-text)] text-sm font-bold">Cutoff Looming</p>
              <p className="text-[var(--status-warning-text)]/80 text-xs font-mono font-bold mt-1 tracking-wider uppercase">
                Confirm dinner in {countdown}
              </p>
            </div>
          </div>
          <div className="flex gap-2.5 shrink-0">
            <GlowButton size="sm" className="h-9 rounded-xl bg-[var(--status-warning)] hover:bg-[var(--status-warning)]/90 text-white font-bold px-4 text-xs" onClick={() => handleConfirm(true)}>Confirm</GlowButton>
            <GlowButton size="sm" variant="outline" className="h-9 rounded-xl border-[var(--status-warning)]/20 font-bold px-4 text-xs text-[var(--status-warning-text)] hover:bg-[var(--status-warning-bg)]" onClick={() => handleConfirm(false)}>Opt-Out</GlowButton>
          </div>
        </div>
      )}

      {/* Balanced Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Core Actions & Menus (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tonight's Attendance */}
          <GlassCard>
            <div className="mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-black tracking-tight text-[var(--text-primary)]">Attendance Matrix</h3>
                  <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">Let the kitchen know if you'll be dining tonight</p>
                </div>
                {countdown && confirmed === null && (
                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Cutoff</span>
                    <p className="text-sm font-mono font-bold text-[var(--status-warning)] mt-0.5">{countdown}</p>
                  </div>
                )}
              </div>
            </div>

            {confirmed === null ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleConfirm(true)}
                    disabled={confirmMeal.isPending}
                    className={`relative overflow-hidden h-24 rounded-2xl bg-[var(--surface-secondary)] hover:bg-[var(--border-subtle)] border border-[var(--border-strong)] text-[var(--text-primary)] hover:border-[var(--brand-accent)]/30 font-black text-sm tracking-wide uppercase transition-all duration-300 shadow-sm active:scale-[0.98] ${confirmAnim === "yes" ? "animate-bounce-in" : ""}`}
                    data-testid="button-confirm-yes"
                  >
                    <span className="text-3xl block mb-2">🍛</span>
                    Yes, I'll Eat
                  </button>
                  <button
                    onClick={() => handleConfirm(false)}
                    disabled={confirmMeal.isPending}
                    className={`h-24 rounded-2xl bg-[var(--surface-secondary)] hover:bg-[var(--border-subtle)] border border-[var(--border-strong)] text-[var(--text-secondary)] hover:text-[var(--status-danger)] hover:border-[var(--status-danger)]/20 font-bold text-sm tracking-wide uppercase transition-all duration-300 shadow-sm active:scale-[0.98] ${confirmAnim === "no" ? "animate-bounce-in" : ""}`}
                    data-testid="button-confirm-no"
                  >
                    <span className="text-3xl block mb-2">🚶</span>
                    Opt-Out
                  </button>
                </div>
                {schedule[today]?.dinner && (
                  <button onClick={() => handleConfirm(true, true)} className="text-[10px] font-black uppercase tracking-widest text-[var(--brand-accent)] hover:text-[var(--brand-accent)]/80 transition-colors w-full text-center py-1">
                    ⚡ Auto-fill via weekly schedule (dinner: ✓)
                  </button>
                )}
              </div>
            ) : (
              <div className={`text-center p-6 rounded-2xl border ${confirmed ? "border-[var(--status-success)]/20 bg-[var(--status-success-bg)]" : "border-[var(--border-strong)] bg-[var(--surface-secondary)]"} animate-bounce-in`} data-testid="text-confirmation-result">
                <div className="text-5xl mb-3">{confirmed ? "✅" : "👋"}</div>
                <p className="text-lg font-black tracking-tight text-[var(--text-primary)]">{confirmed ? "Attendance Confirmed!" : "Opted Out For Today"}</p>
                <p className="text-xs text-[var(--text-secondary)] font-semibold mt-1">Thank you for preventing kitchen food waste.</p>
                <GlowButton variant="link" size="sm" className="mt-3 text-xs font-bold text-[var(--brand-accent)]" onClick={() => { setConfirmed(null); setConfirmAnim("idle"); localStorage.removeItem(`mealsync_confirmed_${todayStr}`); }}>
                  Change Response
                </GlowButton>
              </div>
            )}
          </GlassCard>

          {/* Today's Menu */}
          <GlassCard>
            <div className="mb-4 flex justify-between items-center">
              <div>
                <h3 className="text-base font-black tracking-tight text-[var(--text-primary)]">Today's Menu</h3>
                <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">Prepared fresh in the PG facility</p>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest bg-[var(--surface-secondary)] px-3 py-1 rounded-full border border-[var(--border-strong)] text-[var(--text-muted)]">{new Date().toLocaleDateString("en-IN", { weekday: "long" })}</span>
            </div>
            {menuLoading ? (
              <div className="space-y-3">
                <PremiumSkeleton className="h-20 w-full rounded-2xl" />
                <PremiumSkeleton className="h-20 w-full rounded-2xl" />
              </div>
            ) : todayMenu.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-[var(--border-strong)] rounded-2xl text-[var(--text-muted)]">
                <p className="text-xs font-semibold uppercase tracking-wider">No active menu scheduled</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayMenu.map((item, i) => {
                  const tags = getMenuTags(item.menu);
                  return (
                    <div key={item.id} className="flex items-start gap-4 p-4 rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-secondary)] hover:bg-[var(--border-subtle)] transition-colors animate-slide-up" style={{ animationDelay: `${i * 80}ms` }} data-testid={`card-menu-${item.id}`}>
                      <div className="text-3xl shrink-0 mt-0.5">{getFoodEmoji(item.menu)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-[var(--text-primary)]">{item.menu}</p>
                        <p className="text-[10px] text-[var(--text-muted)] font-semibold mt-0.5">Planned for {item.expectedPeople} residents</p>
                        {tags.length > 0 && (
                          <div className="flex gap-1.5 mt-2.5 flex-wrap">
                            {tags.map(t => (
                              <span key={t.label} className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${t.cls}`}>{t.label}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-wider bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] border border-[var(--brand-accent)]/20 px-2 py-0.5 rounded-full self-start">Today</span>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>

          {/* Community Poll */}
          {poll && (
            <GlassCard data-testid="card-poll">
              <div className="mb-4">
                <h3 className="text-base font-black tracking-tight text-[var(--text-primary)] flex items-center gap-2">
                  <span>🗳️</span>
                  <span>{poll.question}</span>
                </h3>
                <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">{poll.totalVotes} vote{poll.totalVotes !== 1 ? "s" : ""} recorded</p>
              </div>
              <div className="space-y-2">
                {poll.options.map(option => {
                  const votes = poll.tally[option] ?? 0;
                  const pct = poll.totalVotes > 0 ? Math.round((votes / poll.totalVotes) * 100) : 0;
                  const isSelected = myVote === option;
                  const maxVotes = Math.max(...Object.values(poll.tally), 1);
                  const isWinning = votes === maxVotes && poll.totalVotes > 0;
                  return (
                    <button key={option} onClick={() => handleVote(option)}
                      className={`w-full text-left relative overflow-hidden rounded-xl border px-4 py-3 transition-all hover:scale-[1.01] active:scale-[0.99] ${isSelected ? "border-[var(--brand-accent)]/40 bg-[var(--brand-accent)]/5" : "border-[var(--border-strong)] hover:border-[var(--border-subtle)] hover:bg-[var(--surface-secondary)]"}`}
                      data-testid={`button-poll-${option}`}>
                      <div className="absolute inset-y-0 left-0 bg-[var(--brand-accent)]/10 transition-all duration-700 ease-out" style={{ width: `${pct}%` }} />
                      <div className="relative flex justify-between items-center">
                        <span className="font-semibold text-xs text-[var(--text-primary)]">{isWinning && <span className="mr-1">🏆</span>}{option}</span>
                        <span className="text-[10px] font-black text-[var(--text-muted)]">{pct}%</span>
                      </div>
                    </button>
                  );
                })}
                {myVote && <p className="text-[10px] text-center text-[var(--text-muted)] font-semibold uppercase tracking-wider pt-2">You voted: <span className="text-[var(--brand-accent)]">{myVote}</span></p>}
              </div>
            </GlassCard>
          )}

          {/* Feedback Form */}
          <GlassCard>
            <div className="mb-4">
              <h3 className="text-base font-black tracking-tight text-[var(--text-primary)]">Feedback Loop</h3>
              <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">Rate yesterday's meal to shape tomorrow's recipe</p>
            </div>
            {feedbackSubmitted ? (
              <div className="text-center py-10 border border-[var(--border-strong)] bg-[var(--surface-secondary)] rounded-2xl animate-bounce-in" data-testid="text-feedback-thanks">
                <div className="text-5xl mb-3">🙏</div>
                <p className="font-black text-lg text-[var(--text-primary)]">Thank You!</p>
                <p className="text-xs text-[var(--text-secondary)] font-semibold mt-1">Your feedback was dispatched to the kitchen logs.</p>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">Select Rating</Label>
                  <div className="flex gap-3 justify-center py-2 flex-wrap">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star} type="button" onClick={() => setRating(star)}
                        className={`h-11 w-11 rounded-xl flex items-center justify-center text-lg transition-all duration-200 border ${rating >= star ? "bg-[var(--status-warning-bg)] border-[var(--status-warning)]/30 text-[var(--status-warning)] scale-105" : "bg-[var(--surface-secondary)] border-[var(--border-strong)] text-[var(--text-muted)] hover:bg-[var(--border-subtle)]"}`}
                        data-testid={`button-star-${star}`}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                  {rating > 0 && <p className="text-center text-[11px] font-black uppercase tracking-wider text-[var(--status-warning)] animate-fade-in">{["", "😞 Poor", "😐 Fair", "😊 Good", "😄 Great", "🤩 Excellent!"][rating]}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="comment" className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">Optional Comments</Label>
                  <textarea
                    id="comment"
                    placeholder="Provide constructive feedback..."
                    rows={3}
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl bg-[var(--surface-primary)] border border-[var(--border-strong)] focus:outline-none focus:border-[var(--brand-accent)] text-[var(--text-primary)] resize-none"
                  />
                </div>
                <GlowButton type="submit" className="w-full h-11 rounded-xl font-black text-xs uppercase tracking-wider bg-[var(--brand-accent)] text-white hover:bg-[var(--brand-accent)]/90" disabled={submitFeedback.isPending} data-testid="button-submit-feedback">
                  {submitFeedback.isPending ? "Submitting..." : "Submit Feedback"}
                </GlowButton>
              </form>
            )}
          </GlassCard>
        </div>

        {/* Right Column: Sustainability Stats & Schedule (Span 1) */}
        <div className="space-y-6">
          {/* Sustainability Profile */}
          {impact && (
            <GlassCard data-testid="card-sustainability">
              <div className="mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--brand-accent)]">Eco Ledger</span>
                <h3 className="text-base font-black tracking-tight text-[var(--text-primary)] mt-1">Sustainability Profile</h3>
              </div>
              <div className="flex flex-col items-center py-4 border-b border-[var(--border-subtle)] mb-4">
                <EcoRing meals={impact.mealsContributed} />
              </div>
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-strong)]">
                  <p className="text-lg font-black text-[var(--text-primary)]"><AnimatedStat value={impact.mealsContributed} /></p>
                  <p className="text-[9px] font-bold text-[var(--text-muted)] mt-1 uppercase tracking-wider leading-none">Meals Tracked</p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-strong)]">
                  <p className="text-lg font-black text-[var(--text-primary)]"><AnimatedStat value={Math.round(impact.foodSavedKg * 10) / 10} suffix="kg" /></p>
                  <p className="text-[9px] font-bold text-[var(--text-muted)] mt-1 uppercase tracking-wider leading-none">Food Saved</p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-strong)]">
                  <p className="text-lg font-black text-[var(--brand-accent)]"><AnimatedStat value={Math.round(impact.co2SavedKg * 10) / 10} suffix="kg" /></p>
                  <p className="text-[9px] font-bold text-[var(--text-muted)] mt-1 uppercase tracking-wider leading-none">CO₂ Prevented</p>
                </div>
              </div>
              {impact.thisWeekConfirmed > 0 && (
                <div className="mt-4 p-3 rounded-xl bg-[var(--status-success-bg)] text-center border border-[var(--status-success)]/10">
                  <p className="text-[10px] font-black uppercase tracking-wider text-[var(--status-success-text)]">🏆 Saved {impact.thisWeekConfirmed} meals this cycle!</p>
                </div>
              )}
            </GlassCard>
          )}

          {/* Weekly Schedule */}
          <GlassCard data-testid="card-schedule">
            <div className="mb-4 flex justify-between items-center">
              <div>
                <h3 className="text-base font-black tracking-tight text-[var(--text-primary)]">Weekly Schedule</h3>
                <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">Recurring meal preferences</p>
              </div>
              <GlowButton variant="outline" size="sm" className="rounded-lg h-8 text-[10px] font-bold border-[var(--border-strong)] bg-[var(--surface-primary)]" onClick={() => setShowSchedule(!showSchedule)}>
                {showSchedule ? "Done" : "Edit"}
              </GlowButton>
            </div>
            {!showSchedule && (
              <div className="flex gap-2 flex-wrap pt-2">
                {WEEKDAYS.map(day => (
                  <div key={day} className={`text-[10px] px-2.5 py-1.5 rounded-lg border font-bold uppercase transition-colors select-none ${day === today ? "bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] border-[var(--brand-accent)]/20" : "border-[var(--border-strong)] bg-[var(--surface-secondary)] text-[var(--text-muted)]"}`}>
                    {day.slice(0, 3)}<span className="ml-1 opacity-70">{schedule[day]?.lunch && schedule[day]?.dinner ? "L+D" : schedule[day]?.dinner ? "D" : schedule[day]?.lunch ? "L" : "—"}</span>
                  </div>
                ))}
              </div>
            )}
            {showSchedule && (
              <div className="space-y-4 pt-2">
                <div className="rounded-xl border border-[var(--border-strong)] overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[var(--surface-secondary)] border-b border-[var(--border-strong)] text-[var(--text-muted)] font-bold uppercase text-[9px] tracking-wider">
                        <th className="text-left py-2 px-3">Day</th>
                        <th className="text-center py-2">Lunch</th>
                        <th className="text-center py-2">Dinner</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-strong)] font-semibold text-[var(--text-primary)]">
                      {WEEKDAYS.map(day => (
                        <tr key={day} className={day === today ? "bg-[var(--brand-accent)]/5" : "hover:bg-[var(--surface-secondary)] transition-colors"}>
                          <td className="py-2.5 px-3 capitalize font-bold flex items-center gap-1.5">
                            {day.slice(0, 3)}
                            {day === today && <span className="text-[9px] font-black uppercase tracking-wider text-[var(--brand-accent)]">Today</span>}
                          </td>
                          <td className="text-center py-2">
                            <input
                              type="checkbox"
                              checked={schedule[day]?.lunch ?? false}
                              onChange={e => setSchedule(s => ({ ...s, [day]: { ...s[day], lunch: e.target.checked } }))}
                              className="h-4 w-4 rounded bg-[var(--surface-primary)] border-[var(--border-strong)] accent-[var(--brand-accent)] cursor-pointer focus:ring-0 focus:ring-offset-0"
                              data-testid={`checkbox-${day}-lunch`}
                            />
                          </td>
                          <td className="text-center py-2">
                            <input
                              type="checkbox"
                              checked={schedule[day]?.dinner ?? true}
                              onChange={e => setSchedule(s => ({ ...s, [day]: { ...s[day], dinner: e.target.checked } }))}
                              className="h-4 w-4 rounded bg-[var(--surface-primary)] border-[var(--border-strong)] accent-[var(--brand-accent)] cursor-pointer focus:ring-0 focus:ring-offset-0"
                              data-testid={`checkbox-${day}-dinner`}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <GlowButton className="w-full h-10 rounded-xl text-xs font-black uppercase tracking-wider bg-[var(--brand-accent)] text-white hover:bg-[var(--brand-accent)]/90" onClick={handleSaveSchedule} disabled={scheduleSaving}>
                  {scheduleSaving ? "Saving..." : "Save Preferences"}
                </GlowButton>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </PageShell>
  );
}
