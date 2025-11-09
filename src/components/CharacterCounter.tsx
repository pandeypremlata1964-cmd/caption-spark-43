import { Badge } from "@/components/ui/badge";

interface CharacterCounterProps {
  text: string;
}

const PLATFORM_LIMITS = {
  instagram: { caption: 2200, bio: 150 },
  twitter: { post: 280 },
  facebook: { post: 63206 },
  linkedin: { post: 3000 },
  tiktok: { caption: 2200 }
};

export const CharacterCounter = ({ text }: CharacterCounterProps) => {
  const length = text.length;
  
  const getStatus = (limit: number) => {
    const percentage = (length / limit) * 100;
    if (percentage > 100) return { color: "destructive", text: "Over limit" };
    if (percentage > 90) return { color: "warning", text: "Near limit" };
    return { color: "success", text: "Good" };
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Character Count: {length}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge 
          variant={length <= PLATFORM_LIMITS.instagram.caption ? "outline" : "destructive"}
          className="text-xs"
        >
          Instagram: {length}/{PLATFORM_LIMITS.instagram.caption}
        </Badge>
        <Badge 
          variant={length <= PLATFORM_LIMITS.twitter.post ? "outline" : "destructive"}
          className="text-xs"
        >
          Twitter: {length}/{PLATFORM_LIMITS.twitter.post}
        </Badge>
        <Badge 
          variant={length <= PLATFORM_LIMITS.linkedin.post ? "outline" : "destructive"}
          className="text-xs"
        >
          LinkedIn: {length}/{PLATFORM_LIMITS.linkedin.post}
        </Badge>
        <Badge 
          variant={length <= PLATFORM_LIMITS.tiktok.caption ? "outline" : "destructive"}
          className="text-xs"
        >
          TikTok: {length}/{PLATFORM_LIMITS.tiktok.caption}
        </Badge>
      </div>
    </div>
  );
};
