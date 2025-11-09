import { Button } from "@/components/ui/button";
import { Sparkles, Briefcase, Heart, Smile, Zap, Trophy, Lightbulb, PartyPopper } from "lucide-react";

const moods = [
  { value: "playful", label: "Playful", icon: Sparkles, color: "from-pink-500 to-purple-500" },
  { value: "professional", label: "Professional", icon: Briefcase, color: "from-blue-500 to-cyan-500" },
  { value: "inspirational", label: "Inspirational", icon: Heart, color: "from-orange-500 to-pink-500" },
  { value: "casual", label: "Casual", icon: Smile, color: "from-green-500 to-teal-500" },
  { value: "energetic", label: "Energetic", icon: Zap, color: "from-yellow-500 to-orange-500" },
  { value: "motivational", label: "Motivational", icon: Trophy, color: "from-purple-500 to-blue-500" },
  { value: "educational", label: "Educational", icon: Lightbulb, color: "from-indigo-500 to-purple-500" },
  { value: "celebratory", label: "Celebratory", icon: PartyPopper, color: "from-pink-500 to-red-500" },
];

interface MoodSelectorProps {
  selectedMood: string;
  onMoodChange: (mood: string) => void;
}

export const MoodSelector = ({ selectedMood, onMoodChange }: MoodSelectorProps) => {
  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-foreground">Select Mood</label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {moods.map((mood) => {
          const Icon = mood.icon;
          const isSelected = selectedMood === mood.value;
          
          return (
            <Button
              key={mood.value}
              onClick={() => onMoodChange(mood.value)}
              variant={isSelected ? "default" : "outline"}
              className={`h-auto py-4 px-3 flex flex-col gap-2 transition-all rounded-2xl ${
                isSelected 
                  ? `bg-gradient-to-r ${mood.color} text-white border-0 shadow-lg scale-105` 
                  : "hover:border-primary hover:scale-105 bg-muted/30"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-semibold">{mood.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};