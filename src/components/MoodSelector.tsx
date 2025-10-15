import { Button } from "@/components/ui/button";
import { Sparkles, Briefcase, Heart, Smile } from "lucide-react";

const moods = [
  { value: "playful", label: "Playful", icon: Sparkles, color: "from-pink-500 to-purple-500" },
  { value: "professional", label: "Professional", icon: Briefcase, color: "from-blue-500 to-cyan-500" },
  { value: "inspirational", label: "Inspirational", icon: Heart, color: "from-orange-500 to-pink-500" },
  { value: "casual", label: "Casual", icon: Smile, color: "from-green-500 to-teal-500" },
];

interface MoodSelectorProps {
  selectedMood: string;
  onMoodChange: (mood: string) => void;
}

export const MoodSelector = ({ selectedMood, onMoodChange }: MoodSelectorProps) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">Select Mood</label>
      <div className="grid grid-cols-2 gap-3">
        {moods.map((mood) => {
          const Icon = mood.icon;
          const isSelected = selectedMood === mood.value;
          
          return (
            <Button
              key={mood.value}
              onClick={() => onMoodChange(mood.value)}
              variant={isSelected ? "default" : "outline"}
              className={`h-auto py-4 flex flex-col gap-2 transition-all ${
                isSelected 
                  ? `bg-gradient-to-r ${mood.color} text-white border-0 shadow-glow` 
                  : "hover:border-primary"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{mood.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};