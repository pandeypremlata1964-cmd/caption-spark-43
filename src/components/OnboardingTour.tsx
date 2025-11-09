import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";

interface OnboardingTourProps {
  onComplete: () => void;
}

export const OnboardingTour = ({ onComplete }: OnboardingTourProps) => {
  const [step, setStep] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("hasSeenOnboarding");
    if (!hasSeenTour) {
      setShow(true);
    }
  }, []);

  const steps = [
    {
      title: "Welcome to CaptionCraft! 🎉",
      description: "Let's take a quick tour to help you get started with creating amazing captions.",
    },
    {
      title: "Enter Your Niche",
      description: "Start by telling us your niche (e.g., Fitness, Travel, Food). This helps us create relevant captions.",
    },
    {
      title: "Choose Your Mood",
      description: "Select from 8 different moods to match your brand's voice - playful, professional, inspirational, and more!",
    },
    {
      title: "Generate & Save",
      description: "Click 'Generate Captions' to create 15 unique variations. Save your favorites for later use!",
    },
    {
      title: "You're All Set! 🚀",
      description: "That's it! You're ready to create captivating captions. Let's get started!",
    },
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    setShow(false);
    onComplete();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <Card className="max-w-md w-full p-8 space-y-6 relative animate-scale-in">
        <button
          onClick={handleComplete}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close onboarding"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  index <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">
              {steps[step].title}
            </h2>
            <p className="text-muted-foreground">
              {steps[step].description}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          {step > 0 && (
            <Button
              onClick={() => setStep(step - 1)}
              variant="outline"
              className="flex-1"
            >
              Back
            </Button>
          )}
          <Button
            onClick={handleNext}
            className="flex-1 bg-gradient-to-r from-primary to-accent"
          >
            {step === steps.length - 1 ? "Get Started" : "Next"}
          </Button>
        </div>
        
        <button
          onClick={handleComplete}
          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip tour
        </button>
      </Card>
    </div>
  );
};
