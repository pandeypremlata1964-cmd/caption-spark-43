import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface Template {
  id: string;
  name: string;
  niche: string;
  topic: string;
  mood: string;
  description: string;
}

const templates: Template[] = [
  {
    id: "1",
    name: "Fitness Motivation",
    niche: "Fitness",
    topic: "Morning workout motivation",
    mood: "motivational",
    description: "Perfect for fitness influencers sharing workout inspiration"
  },
  {
    id: "2",
    name: "Food Photography",
    niche: "Food",
    topic: "Delicious homemade dish",
    mood: "playful",
    description: "Ideal for food bloggers showcasing culinary creations"
  },
  {
    id: "3",
    name: "Travel Adventure",
    niche: "Travel",
    topic: "Exploring new destinations",
    mood: "inspirational",
    description: "Great for travel enthusiasts sharing journey experiences"
  },
  {
    id: "4",
    name: "Tech Review",
    niche: "Technology",
    topic: "Latest gadget review",
    mood: "professional",
    description: "Perfect for tech reviewers and gadget enthusiasts"
  },
  {
    id: "5",
    name: "Fashion Style",
    niche: "Fashion",
    topic: "Today's outfit inspiration",
    mood: "playful",
    description: "Ideal for fashion influencers and style creators"
  },
  {
    id: "6",
    name: "Business Tips",
    niche: "Business",
    topic: "Entrepreneurship advice",
    mood: "professional",
    description: "Great for business coaches and entrepreneurs"
  }
];

interface CaptionTemplatesProps {
  onUseTemplate: (template: Template) => void;
}

export const CaptionTemplates = ({ onUseTemplate }: CaptionTemplatesProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Quick Start Templates</h3>
        <span className="text-sm text-muted-foreground">{templates.length} templates</span>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="p-4 space-y-3 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">{template.name}</h4>
              <p className="text-sm text-muted-foreground">{template.description}</p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                  {template.niche}
                </span>
                <span className="text-xs px-2 py-1 bg-accent/10 text-accent rounded-full">
                  {template.mood}
                </span>
              </div>
            </div>
            <Button 
              onClick={() => onUseTemplate(template)}
              variant="outline"
              className="w-full"
              size="sm"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Use Template
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};
