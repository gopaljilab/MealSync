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

interface TodayMenuItem {
  id: number;
  menu: string;
  expectedPeople: number;
  date: string;
}

export default function ResidentDashboard() {
  const confirmMeal = useConfirmMeal();
  const submitFeedback = useSubmitFeedback();

  const todayStr = new Date().toISOString().split("T")[0];

  const [todayMenu, setTodayMenu] = useState<TodayMenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);

  const [confirmed, setConfirmed] = useState<boolean | null>(() => {
    const stored = localStorage.getItem(`mealsync_confirmed_${todayStr}`);
    return stored !== null ? JSON.parse(stored) : null;
  });

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(() => {
    return localStorage.getItem(`mealsync_feedback_${todayStr}`) === "true";
  });

  useEffect(() => {
    fetch("/api/residents/today-menu", { credentials: "include" })
      .then((r) => r.json())
      .then((data: TodayMenuItem[]) => {
        setTodayMenu(data);
        setMenuLoading(false);
      })
      .catch(() => {
        setMenuLoading(false);
      });
  }, []);

  const handleConfirm = async (willEat: boolean) => {
    try {
      await confirmMeal.mutateAsync({ data: { willEat, mealDate: todayStr } });
      setConfirmed(willEat);
      localStorage.setItem(`mealsync_confirmed_${todayStr}`, JSON.stringify(willEat));
      toast.success(
        willEat
          ? "Meal confirmed! See you at dinner."
          : "Noted. Thanks for letting us know.",
      );
    } catch {
      toast.error("Failed to save confirmation. Please try again.");
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    try {
      await submitFeedback.mutateAsync({
        data: { rating, comment, mealDate: todayStr },
      });
      setFeedbackSubmitted(true);
      localStorage.setItem(`mealsync_feedback_${todayStr}`, "true");
      toast.success("Feedback submitted successfully!");
    } catch {
      toast.error("Failed to submit feedback. Please try again.");
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Resident Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Help us prepare the right amount of food and reduce waste.
        </p>
      </div>

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
                <div
                  key={item.id}
                  className="p-4 border rounded-lg bg-muted/20"
                  data-testid={`card-menu-item-${item.id}`}
                >
                  <p className="text-base font-medium">{item.menu}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Planned for {item.expectedPeople} people
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendance */}
      <Card className={confirmed !== null ? "opacity-75" : ""}>
        <CardHeader>
          <CardTitle>Attendance</CardTitle>
          <CardDescription>Are you planning to eat today's meal?</CardDescription>
        </CardHeader>
        <CardContent>
          {confirmed === null ? (
            <div className="grid grid-cols-2 gap-4">
              <Button
                className="h-16 text-lg bg-primary hover:bg-primary/90"
                onClick={() => handleConfirm(true)}
                disabled={confirmMeal.isPending}
                data-testid="button-confirm-yes"
              >
                Yes, I will eat
              </Button>
              <Button
                variant="outline"
                className="h-16 text-lg hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                onClick={() => handleConfirm(false)}
                disabled={confirmMeal.isPending}
                data-testid="button-confirm-no"
              >
                No, I'm out
              </Button>
            </div>
          ) : (
            <div className="text-center p-6 bg-muted/30 rounded-lg">
              <div className="text-xl font-medium mb-2" data-testid="text-confirmation-status">
                {confirmed
                  ? "You're confirmed for today's meal!"
                  : "You've opted out of today's meal."}
              </div>
              <p className="text-muted-foreground text-sm">
                Thank you for helping us predict food quantities accurately.
              </p>
              <Button
                variant="link"
                onClick={() => {
                  setConfirmed(null);
                  localStorage.removeItem(`mealsync_confirmed_${todayStr}`);
                }}
                className="mt-4"
                data-testid="button-change-response"
              >
                Change response
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

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
                      className={`h-12 w-12 rounded-full flex items-center justify-center text-xl transition-all ${
                        rating >= star
                          ? "bg-amber-400 text-white font-bold scale-110 shadow-sm"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                      data-testid={`button-star-${star}`}
                    >
                      {star}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="comment">Comments (Optional)</Label>
                <Textarea
                  id="comment"
                  placeholder="What did you like? What could be better?"
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  data-testid="input-comment"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={submitFeedback.isPending}
                data-testid="button-submit-feedback"
              >
                Submit Feedback
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
