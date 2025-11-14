import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface TrendingHashtagsProps {
  niche: string;
  mood: string;
}

export const TrendingHashtags = ({ niche, mood }: TrendingHashtagsProps) => {
  const [trendingTags, setTrendingTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (niche) {
      fetchTrendingHashtags();
    }
  }, [niche, mood]);

  const fetchTrendingHashtags = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-trending-hashtags', {
        body: { niche, mood }
      });

      if (error) throw error;

      if (data?.hashtags) {
        setTrendingTags(data.hashtags);
      }
    } catch (error: any) {
      console.error('Error fetching trending hashtags:', error);
      toast({
        title: "Failed to fetch trending hashtags",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyAllHashtags = async () => {
    const hashtagText = trendingTags.join(' ');
    await navigator.clipboard.writeText(hashtagText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
    
    toast({
      title: "Copied!",
      description: "All trending hashtags copied to clipboard",
    });
  };

  if (!niche) return null;

  return (
    <Card className="p-4 space-y-3 bg-gradient-to-br from-background to-muted border-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Trending Hashtags</h3>
        </div>
        {trendingTags.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={copyAllHashtags}
            className="h-8"
          >
            {copiedAll ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex flex-wrap gap-2">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {trendingTags.map((tag, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer transition-all"
              onClick={async () => {
                await navigator.clipboard.writeText(tag);
                toast({
                  title: "Copied!",
                  description: `${tag} copied to clipboard`,
                });
              }}
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}
      
      {!isLoading && trendingTags.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Enter a niche to see trending hashtags
        </p>
      )}
    </Card>
  );
};
