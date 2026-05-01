import { useState, useEffect } from "react";
import { useConfirmMeal, useSubmitFeedback } from "@workspace/api-client-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
type Weekday = typeof WEEKDAYS[number];
type SlotSchedule = { lunch: boolean; dinner: boolean };
type Schedule = Record<Weekday, SlotSchedule>;

interface TodayMenuItem { id: number; menu: string; expectedPeople: number; date: string }
interface ImpactData { mealsContributed: number; foodSavedKg: number; co2SavedKg: number; thisWeekConfirmed: number; totalResponses: number }
interface PollOption { option: string; count: number }
interface Poll { id: number; question: string; options: string[]; tally: Record<string, number>; totalVotes: number; createdAt: string; expiresAt: string | null }

const DEFAULT_SCHEDULE: Schedule = WEEKDAYS.reduce((acc, d) => {
  acc[d] = { lunch: false, dinner: true };
  return acc;
}, {} as Schedule);

function getToday(): Weekday {
  const days: Weekday[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return days[new Date().getDay()];
}

function isBeforeReminder() {
  return new Date().getHours() < 18;
}

export default function ResidentDashboard() {
  const confirmMeal = useConfirmMeal();
  const submitFeedback = useSubmitFeedback();
  const todayStr = new Date().toISOString().split("T")[0];
  const today = getToday();

  const [todayMenu, setTodayMenu] = useState<TodayMenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [impact, setImpact] = useState<ImpactData | null>(null);
  const [poll, setPoll] = useState<Poll | null>(null);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<Schedule>(DEFAULT_SCHEDULE);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  const [confirmed, setConfirmed] = useState<boolean | null>(() => {
    const stored = localStorage.getItem(`mealsync_confirmed_${todayStr}`);
    return stored !== null ? JSON.parse(stored) : null;
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
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setSchedule(d as Schedule))
      .catch(() => {});

    const savedVote = localStorage.getItem(`mealsync_poll_vote_${todayStr}`);
    if (savedVote) setMyVote(savedVote);
  }, []);

  const autoConfirmFromSchedule = () => {
    if (confirmed !== null) return;
    const todayPref = schedule[today];
    if (todayPref?.dinner) {
      handleConfirm(true, true);
    }
  };

  const handleConfirm = async (willEat: boolean, silent = false) => {
    try {
      await confirmMeal.mutateAsync({ data: { willEat, mealDate: todayStr } });
      setConfirmed(willEat);
      localStorage.setItem(`mealsync_confirmed_${todayStr}`, JSON.stringify(willEat));
      if (!silent) {
        toast.success(willEat ? "Meal confirmed! See you at dinner." : "Noted. Thanks for letting us know.");
      }
    } catch {
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
      toast.success("Feedback submitted!");
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
        const newTally = { ...prev.tally };
        if (myVote) newTally[myVote] = Math.max(0, (newTally[myVote] ?? 0) - 1);
        newTally[option] = (newTally[option] ?? 0) + 1;
        return { ...prev, tally: newTally, totalVotes: prev.totalVotes + (myVote ? 0 : 1) };
      });
      toast.success(`Vote cast for "${option}"`);
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
      toast.success("Weekly schedule saved!");
      setShowSchedule(false);
    } catch { toast.error("Failed to save schedule."); }
    finally { setScheduleSaving(false); }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Resident Dashboard</h1>
        <p className="text-muted-foreground mt-2">Help us prepare the right amount of food and reduce waste.</p>
      </div>

      {/* Meal Reminder Banner */}
      {isBeforeReminder() && confirmed === null && (
        <div className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3" data-testid="banner-reminder">
          <div className="flex items-center gap-2">
            <span className="text-amber-600 text-sm font-medium">Reminder:</span>
            <span className="text-amber-700 text-sm">Confirm your meal before 6 PM to help reduce waste.</span>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="sm" className="h-7 text-xs" onClick={() => handleConfirm(true)}>Yes</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleConfirm(false)}>No</Button>
          </div>
        </div>
      )}

      {/* Today's Menu */}
      <Card className="border-primary/20 shadow-md">
        <CardHeader className="bg-primary/5 pb-4">
          <CardTitle className="flex justify-between items-center text-xl">
            <span>Today's Menu</span>
            <span className="text-sm font-normal text-muted-foreground bg-background px-3 py-1 rounded-full shadow-sm">
              {new Date().toLocaleDateString("en-IN", { weekday: "long" })}
            </span>
          </CardTitle>
          <CardDescription>Prepared fresh by your PG</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {menuLoading ? (
            <Skeleton className="h-16 w-full rounded-lg" />
          ) : todayMenu.length === 0 ? (
            <div className="text-center p-6 border border-dashed rounded-lg bg-muted/20 text-muted-foreground">
              No menu announced yet for today. Check back later.
            </div>
          ) : (
            <div className="space-y-3">
              {todayMenu.map((item) => (
                <div key={item.id} className="p-4 border rounded-lg bg-muted/20" data-testid={`card-menu-${item.id}`}>
                  <p className="text-base font-medium">{item.menu}</p>
                  <p className="text-sm text-muted-foreground mt-1">Planned for {item.expectedPeople} people</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendance */}
      <Card className={confirmed !== null ? "opacity-80" : ""}>
        <CardHeader>
          <CardTitle>Attendance</CardTitle>
          <CardDescription>Are you planning to eat today's meal?</CardDescription>
        </CardHeader>
        <CardContent>
          {confirmed === null ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <Button className="h-16 text-lg" onClick={() => handleConfirm(true)} disabled={confirmMeal.isPending} data-testid="button-confirm-yes">Yes, I will eat</Button>
                <Button variant="outline" className="h-16 text-lg hover:bg-destructive/10 hover:text-destructive" onClick={() => handleConfirm(false)} disabled={confirmMeal.isPending} data-testid="button-confirm-no">No, I'm out</Button>
              </div>
              {schedule[today]?.dinner && (
                <button onClick={autoConfirmFromSchedule} className="text-xs text-muted-foreground hover:text-primary transition-colors w-full text-center">
                  Auto-fill from my weekly schedule (dinner: yes)
                </button>
              )}
            </div>
          ) : (
            <div className="text-center p-6 bg-muted/30 rounded-lg" data-testid="text-confirmation-result">
              <div className="text-xl font-medium mb-2">
                {confirmed ? "You're confirmed for today's meal!" : "You've opted out of today's meal."}
              </div>
              <p className="text-muted-foreground text-sm">Thank you for helping us predict food quantities accurately.</p>
              <Button variant="link" onClick={() => { setConfirmed(null); localStorage.removeItem(`mealsync_confirmed_${todayStr}`); }} className="mt-4">
                Change response
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sustainability Profile */}
      {impact && (
        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20" data-testid="card-sustainability">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-green-800 dark:text-green-200">Your Sustainability Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{impact.mealsContributed}</p>
                <p className="text-xs text-muted-foreground mt-1">Meals tracked</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{impact.foodSavedKg}kg</p>
                <p className="text-xs text-muted-foreground mt-1">Food waste reduced</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{impact.co2SavedKg}kg</p>
                <p className="text-xs text-muted-foreground mt-1">CO2 prevented</p>
              </div>
            </div>
            {impact.thisWeekConfirmed > 0 && (
              <p className="text-sm text-center mt-4 text-green-700 dark:text-green-300 font-medium">
                You helped save {impact.thisWeekConfirmed} meals this week!
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Weekly Schedule */}
      <Card data-testid="card-schedule">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-base">Weekly Default Schedule</CardTitle>
              <CardDescription>Set recurring attendance so we can plan ahead</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowSchedule(!showSchedule)}>
              {showSchedule ? "Hide" : "Edit"}
            </Button>
          </div>
        </CardHeader>
        {showSchedule && (
          <CardContent className="space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left font-medium text-muted-foreground pb-2 w-24">Day</th>
                    <th className="text-center font-medium text-muted-foreground pb-2">Lunch</th>
                    <th className="text-center font-medium text-muted-foreground pb-2">Dinner</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {WEEKDAYS.map((day) => (
                    <tr key={day} className={day === today ? "bg-primary/5" : ""}>
                      <td className="py-2 capitalize font-medium">
                        {day} {day === today && <Badge variant="outline" className="ml-1 text-xs">Today</Badge>}
                      </td>
                      <td className="text-center py-2">
                        <input
                          type="checkbox"
                          checked={schedule[day]?.lunch ?? false}
                          onChange={(e) => setSchedule((s) => ({ ...s, [day]: { ...s[day], lunch: e.target.checked } }))}
                          className="h-4 w-4 accent-primary"
                          data-testid={`checkbox-${day}-lunch`}
                        />
                      </td>
                      <td className="text-center py-2">
                        <input
                          type="checkbox"
                          checked={schedule[day]?.dinner ?? true}
                          onChange={(e) => setSchedule((s) => ({ ...s, [day]: { ...s[day], dinner: e.target.checked } }))}
                          className="h-4 w-4 accent-primary"
                          data-testid={`checkbox-${day}-dinner`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button className="w-full" onClick={handleSaveSchedule} disabled={scheduleSaving}>
              {scheduleSaving ? "Saving..." : "Save Schedule"}
            </Button>
          </CardContent>
        )}
        {!showSchedule && (
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((day) => (
                <div key={day} className={`text-xs px-2 py-1 rounded border ${day === today ? "border-primary bg-primary/10" : "border-border"}`}>
                  <span className="capitalize font-medium">{day.slice(0, 3)}</span>
                  <span className="text-muted-foreground ml-1">
                    {schedule[day]?.lunch && schedule[day]?.dinner ? "L+D" : schedule[day]?.dinner ? "D" : schedule[day]?.lunch ? "L" : "—"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Poll / Voting */}
      {poll && (
        <Card data-testid="card-poll">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{poll.question}</CardTitle>
            <CardDescription>{poll.totalVotes} vote{poll.totalVotes !== 1 ? "s" : ""} so far</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {poll.options.map((option) => {
              const votes = poll.tally[option] ?? 0;
              const pct = poll.totalVotes > 0 ? Math.round((votes / poll.totalVotes) * 100) : 0;
              const isSelected = myVote === option;
              const isWinning = votes === Math.max(...Object.values(poll.tally));
              return (
                <button
                  key={option}
                  onClick={() => handleVote(option)}
                  className={`w-full text-left relative overflow-hidden rounded-lg border px-4 py-3 transition-all ${isSelected ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 hover:bg-muted/50"}`}
                  data-testid={`button-poll-${option}`}
                >
                  <div
                    className="absolute inset-y-0 left-0 bg-primary/10 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                  <div className="relative flex justify-between items-center">
                    <span className="font-medium text-sm">
                      {option}
                      {isWinning && poll.totalVotes > 0 && (
                        <Badge className="ml-2 text-xs" variant="secondary">Leading</Badge>
                      )}
                    </span>
                    <span className="text-sm text-muted-foreground">{pct}% ({votes})</span>
                  </div>
                </button>
              );
            })}
            {myVote && (
              <p className="text-xs text-center text-muted-foreground pt-1">
                Your vote: <span className="font-medium text-primary">{myVote}</span>
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Feedback */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Yesterday's Meal</CardTitle>
          <CardDescription>Your feedback helps improve the menu</CardDescription>
        </CardHeader>
        <CardContent>
          {feedbackSubmitted ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-feedback-thanks">
              Thank you for your feedback! It helps the team serve you better.
            </div>
          ) : (
            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Rating (1–5)</Label>
                <div className="flex gap-2 justify-center py-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`h-12 w-12 rounded-full flex items-center justify-center text-xl transition-all ${rating >= star ? "bg-amber-400 text-white font-bold scale-110 shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                      data-testid={`button-star-${star}`}
                    >{star}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="comment">Comments (Optional)</Label>
                <Textarea id="comment" placeholder="What did you like? What could be better?" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={submitFeedback.isPending} data-testid="button-submit-feedback">
                Submit Feedback
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
