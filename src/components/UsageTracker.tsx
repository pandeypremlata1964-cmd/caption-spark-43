import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Zap, Crown, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface UsageData {
  tier: string;
  daily_limit: number;
  used_today: number;
  remaining: number;
}

export const UsageTracker = () => {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc('get_user_quota', {
        user_id_param: user.id
      });

      if (error) throw error;
      if (data && data.length > 0) {
        setUsage(data[0]);
      }
    } catch (error) {
      console.error('Error fetching usage:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !usage) return null;

  const isFreemium = usage.tier === 'freemium';
  const usagePercent = (usage.used_today / usage.daily_limit) * 100;
  const isLimitReached = usage.remaining <= 0;

  const tierConfig = {
    freemium: { icon: Sparkles, color: "text-gray-500", gradient: "from-gray-500 to-gray-600" },
    monthly: { icon: Zap, color: "text-blue-500", gradient: "from-blue-500 to-cyan-500" },
    six_months: { icon: Crown, color: "text-purple-500", gradient: "from-purple-500 to-pink-500" },
    yearly: { icon: Crown, color: "text-orange-500", gradient: "from-orange-500 to-red-500" },
  };

  const config = tierConfig[usage.tier as keyof typeof tierConfig] || tierConfig.freemium;
  const TierIcon = config.icon;

  return (
    <Card className="p-4 bg-gradient-to-br from-card/50 to-card border-border/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 bg-gradient-to-br ${config.gradient} rounded-lg flex items-center justify-center`}>
            <TierIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground capitalize">
              {usage.tier.replace('_', ' ')} Plan
            </p>
            {isFreemium && (
              <p className="text-xs text-muted-foreground">
                {usage.used_today}/{usage.daily_limit} generations today
              </p>
            )}
          </div>
        </div>
        
        {isFreemium && (
          <Badge 
            variant={isLimitReached ? "destructive" : "secondary"}
            className="text-xs"
          >
            {usage.remaining} left
          </Badge>
        )}
      </div>

      {isFreemium && (
        <>
          <Progress value={usagePercent} className="h-2 mb-3" />
          
          {isLimitReached ? (
            <Button
              onClick={() => navigate('/pricing')}
              className="w-full h-9 bg-gradient-to-r from-primary to-accent hover:opacity-90"
              size="sm"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade for Unlimited
            </Button>
          ) : usage.remaining <= 1 && (
            <p className="text-xs text-center text-muted-foreground">
              Upgrade for unlimited generations! 
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto ml-1 text-primary"
                onClick={() => navigate('/pricing')}
              >
                View Plans
              </Button>
            </p>
          )}
        </>
      )}

      {!isFreemium && (
        <div className="text-center">
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            ✨ Unlimited Generations
          </Badge>
        </div>
      )}
    </Card>
  );
};
