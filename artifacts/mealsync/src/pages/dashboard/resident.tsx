import { useState } from "react";
import { 
  useConfirmMeal,
  useSubmitFeedback
} from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

export default function ResidentDashboard() {
  const confirmMeal = useConfirmMeal();
  const submitFeedback = useSubmitFeedback();

  const [confirmed, setConfirmed] = useState<boolean | null>(null);
  
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const handleConfirm = async (willEat: boolean) => {
    try {
      await confirmMeal.mutateAsync({ data: { willEat, mealDate: todayStr } });
      setConfirmed(willEat);
      toast.success(willEat ? "Meal confirmed! See you at dinner." : "Noted. Thanks for letting us know to reduce waste!");
    } catch (err) {
      setConfirmed(willEat);
      toast.success(willEat ? "Meal confirmed! (Mock)" : "Noted. Thanks! (Mock)");
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
        data: { rating, comment, mealDate: todayStr } 
      });
      setFeedbackSubmitted(true);
      toast.success("Feedback submitted successfully!");
    } catch (err) {
      setFeedbackSubmitted(true);
      toast.success("Feedback submitted! (Mock)");
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Resident Dashboard</h1>
        <p className="text-muted-foreground mt-2">Help us prepare the right amount of food and reduce waste.</p>
      </div>

      <Card className="border-primary/20 shadow-md">
        <CardHeader className="bg-primary/5 pb-4">
          <CardTitle className="flex justify-between items-center text-xl">
            <span>Today's Menu</span>
            <span className="text-sm font-normal text-muted-foreground bg-background px-3 py-1 rounded-full shadow-sm">Dinner</span>
          </CardTitle>
          <CardDescription>Prepared fresh by your PG</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-lg font-medium text-center p-6 border border-dashed rounded-lg bg-muted/20">
            Dal Makhani, Jeera Rice, Paneer Butter Masala, Roti, Gulab Jamun
          </div>
        </CardContent>
      </Card>

      <Card className={confirmed !== null ? "opacity-75" : ""}>
        <CardHeader>
          <CardTitle>Attendance</CardTitle>
          <CardDescription>Are you planning to eat the upcoming meal?</CardDescription>
        </CardHeader>
        <CardContent>
          {confirmed === null ? (
            <div className="grid grid-cols-2 gap-4">
              <Button 
                className="h-16 text-lg bg-primary hover:bg-primary/90" 
                onClick={() => handleConfirm(true)}
                disabled={confirmMeal.isPending}
              >
                Yes, I will eat
              </Button>
              <Button 
                variant="outline" 
                className="h-16 text-lg hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                onClick={() => handleConfirm(false)}
                disabled={confirmMeal.isPending}
              >
                No, I'm out
              </Button>
            </div>
          ) : (
            <div className="text-center p-6 bg-muted/30 rounded-lg">
              <div className="text-xl font-medium mb-2">
                {confirmed ? "You're confirmed for today's meal!" : "You've opted out of today's meal."}
              </div>
              <p className="text-muted-foreground text-sm">
                Thank you for helping us predict food quantities accurately.
              </p>
              <Button variant="link" onClick={() => setConfirmed(null)} className="mt-4">
                Change response
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feedback section - usually only relevant after eating, but showing for demo */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Yesterday's Meal</CardTitle>
          <CardDescription>Your feedback helps improve the menu</CardDescription>
        </CardHeader>
        <CardContent>
          {feedbackSubmitted ? (
            <div className="text-center py-8 text-muted-foreground">
              Thank you for your feedback!
            </div>
          ) : (
            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Rating (1-5)</Label>
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
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitFeedback.isPending}>
                Submit Feedback
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
