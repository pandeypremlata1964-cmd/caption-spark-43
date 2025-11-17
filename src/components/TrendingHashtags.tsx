import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Copy, Check, Eye, Heart, BarChart3, Sparkles, ArrowUpDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Platform = "all" | "instagram" | "tiktok" | "twitter";
type SortOption = "trending" | "reach" | "engagement";

interface HashtagMetrics {
  tag: string;
  estimatedReach: number;
  engagementRate: number;
  trendingScore: number;
}

interface TrendingHashtagsProps {
  niche: string;
  mood: string;
}

export const TrendingHashtags = ({ niche, mood }: TrendingHashtagsProps) => {
  const [trendingTags, setTrendingTags] = useState<HashtagMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedOptimal, setCopiedOptimal] = useState(false);
  const [platform, setPlatform] = useState<Platform>("all");
  const [sortBy, setSortBy] = useState<SortOption>("trending");
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [optimalSet, setOptimalSet] = useState<Array<HashtagMetrics & { reason: string }>>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (niche) {
      fetchTrendingHashtags();
    }
  }, [niche, mood, platform]);

  const fetchTrendingHashtags = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-trending-hashtags', {
        body: { niche, mood, platform }
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
    const hashtagText = trendingTags.map(h => h.tag).join(' ');
    await navigator.clipboard.writeText(hashtagText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
    
    toast({
      title: "Copied!",
      description: "All trending hashtags copied to clipboard",
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getSortedHashtags = () => {
    const sorted = [...trendingTags];
    switch (sortBy) {
      case "reach":
        return sorted.sort((a, b) => b.estimatedReach - a.estimatedReach);
      case "engagement":
        return sorted.sort((a, b) => b.engagementRate - a.engagementRate);
      case "trending":
      default:
        return sorted.sort((a, b) => b.trendingScore - a.trendingScore);
    }
  };

  const suggestOptimalSet = () => {
    if (trendingTags.length === 0) return;

    // Algorithm: Pick 5-10 hashtags with balanced performance
    const byReach = [...trendingTags].sort((a, b) => b.estimatedReach - a.estimatedReach).slice(0, 3);
    const byEngagement = [...trendingTags].sort((a, b) => b.engagementRate - a.engagementRate).slice(0, 3);
    const byTrending = [...trendingTags].sort((a, b) => b.trendingScore - a.trendingScore).slice(0, 3);
    
    // Track which hashtags were selected for which reason
    const hashtagReasons = new Map<string, string>();
    byReach.forEach(h => hashtagReasons.set(h.tag, "High Reach"));
    byEngagement.forEach(h => {
      const existing = hashtagReasons.get(h.tag);
      hashtagReasons.set(h.tag, existing ? `${existing} + High Engagement` : "High Engagement");
    });
    byTrending.forEach(h => {
      const existing = hashtagReasons.get(h.tag);
      hashtagReasons.set(h.tag, existing ? `${existing} + Trending` : "Trending");
    });
    
    // Combine and remove duplicates
    const uniqueHashtags = Array.from(
      new Map(
        [...byReach, ...byEngagement, ...byTrending].map(item => [item.tag, item])
      ).values()
    ).slice(0, 10);

    const optimalWithReasons = uniqueHashtags.map(h => ({
      ...h,
      reason: hashtagReasons.get(h.tag) || "Selected"
    }));
    
    setOptimalSet(optimalWithReasons);
    setShowAnalytics(true);
  };

  const copyOptimalSet = () => {
    const optimalText = optimalSet.map(h => h.tag).join(' ');
    navigator.clipboard.writeText(optimalText);
    setCopiedOptimal(true);
    setTimeout(() => setCopiedOptimal(false), 2000);
    
    toast({
      title: "Optimal Set Copied!",
      description: `${optimalSet.length} hashtags copied to clipboard`,
    });
  };

  const sortedHashtags = getSortedHashtags();

  const calculateCombinedMetrics = () => {
    if (optimalSet.length === 0) return { totalReach: 0, avgEngagement: 0, avgTrending: 0 };
    
    const totalReach = optimalSet.reduce((sum, h) => sum + h.estimatedReach, 0);
    const avgEngagement = optimalSet.reduce((sum, h) => sum + h.engagementRate, 0) / optimalSet.length;
    const avgTrending = optimalSet.reduce((sum, h) => sum + h.trendingScore, 0) / optimalSet.length;
    
    return { totalReach, avgEngagement, avgTrending };
  };

  if (!niche) return null;

  const combinedMetrics = calculateCombinedMetrics();

  return (
    <>
    <Card className="p-4 space-y-3 bg-gradient-to-br from-background to-muted border-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Trending Hashtags</h3>
        </div>
        {trendingTags.length > 0 && (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={suggestOptimalSet}
              className="h-8 gap-1"
            >
              {copiedOptimal ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              <span className="hidden sm:inline">Optimal Set</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyAllHashtags}
              className="h-8"
            >
              {copiedAll ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["all", "instagram", "tiktok", "twitter"] as Platform[]).map((p) => (
          <Button
            key={p}
            variant={platform === p ? "default" : "outline"}
            size="sm"
            onClick={() => setPlatform(p)}
            className="h-8 text-xs capitalize"
          >
            {p}
          </Button>
        ))}
      </div>

      {trendingTags.length > 0 && (
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
          <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
            <SelectTrigger className="h-8 w-[160px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="trending">Sort by Trending</SelectItem>
              <SelectItem value="reach">Sort by Reach</SelectItem>
              <SelectItem value="engagement">Sort by Engagement</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      
      {isLoading ? (
        <div className="flex flex-wrap gap-2">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <TooltipProvider>
          <div className="space-y-2">
            {sortedHashtags.map((hashtag, index) => (
              <div
                key={index}
                className="group p-3 rounded-lg border bg-card hover:bg-accent/5 transition-all cursor-pointer"
                onClick={async () => {
                  await navigator.clipboard.writeText(hashtag.tag);
                  toast({
                    title: "Copied!",
                    description: `${hashtag.tag} copied to clipboard`,
                  });
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-semibold text-primary">{hashtag.tag}</p>
                    <div className="flex items-center gap-4 mt-1.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Eye className="w-3.5 h-3.5" />
                            <span>{formatNumber(hashtag.estimatedReach)}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Estimated Reach</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Heart className="w-3.5 h-3.5" />
                            <span>{hashtag.engagementRate.toFixed(1)}%</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Engagement Rate</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <BarChart3 className="w-3.5 h-3.5" />
                            <span>{hashtag.trendingScore}/100</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Trending Score</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="secondary" 
                      className={
                        hashtag.trendingScore >= 90 
                          ? "bg-primary/20 text-primary" 
                          : hashtag.trendingScore >= 75 
                          ? "bg-accent/20 text-accent-foreground"
                          : "bg-muted"
                      }
                    >
                      {hashtag.trendingScore >= 90 ? "🔥 Hot" : hashtag.trendingScore >= 75 ? "📈 Rising" : "💡 Good"}
                    </Badge>
                    <Copy className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TooltipProvider>
      )}
      
      {!isLoading && trendingTags.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Enter a niche to see trending hashtags
        </p>
      )}
    </Card>

    <Dialog open={showAnalytics} onOpenChange={setShowAnalytics}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Optimal Hashtag Set Analytics
          </DialogTitle>
          <DialogDescription>
            {optimalSet.length} hashtags selected for maximum performance
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Combined Metrics Summary */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Eye className="w-3.5 h-3.5" />
                <span>Total Reach</span>
              </div>
              <p className="text-lg font-bold text-foreground">{formatNumber(combinedMetrics.totalReach)}</p>
            </Card>
            <Card className="p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Heart className="w-3.5 h-3.5" />
                <span>Avg Engagement</span>
              </div>
              <p className="text-lg font-bold text-foreground">{combinedMetrics.avgEngagement.toFixed(1)}%</p>
            </Card>
            <Card className="p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mb-1">
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Avg Trending</span>
              </div>
              <p className="text-lg font-bold text-foreground">{combinedMetrics.avgTrending.toFixed(0)}/100</p>
            </Card>
          </div>

          {/* Hashtag List with Reasons */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">Selected Hashtags</h4>
            <div className="space-y-2">
              {optimalSet.map((hashtag, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-primary">{hashtag.tag}</p>
                        <Badge variant="secondary" className="text-xs">
                          {hashtag.reason}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Eye className="w-3 h-3" />
                          <span>{formatNumber(hashtag.estimatedReach)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Heart className="w-3 h-3" />
                          <span>{hashtag.engagementRate.toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <BarChart3 className="w-3 h-3" />
                          <span>{hashtag.trendingScore}/100</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Why This Combination Works */}
          <Card className="p-3 bg-primary/5 border-primary/20">
            <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Why This Combination Works
            </h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Balanced mix of high-reach hashtags for maximum visibility</li>
              <li>• High-engagement tags to boost interaction rates</li>
              <li>• Trending hashtags to ride current social media waves</li>
              <li>• No duplicate selections ensures diverse audience targeting</li>
            </ul>
          </Card>

          {/* Copy Button */}
          <Button
            onClick={copyOptimalSet}
            className="w-full"
            size="lg"
          >
            {copiedOptimal ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied to Clipboard
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy All Hashtags
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};
