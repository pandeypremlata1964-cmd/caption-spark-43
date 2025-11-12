import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Crown, 
  Calendar, 
  CreditCard, 
  ArrowLeft, 
  Sparkles,
  Zap,
  Infinity
} from "lucide-react";
import { toast } from "sonner";

interface Subscription {
  id: string;
  tier: string;
  started_at: string;
  expires_at: string;
  status: string;
  razorpay_subscription_id: string | null;
}

interface PaymentHistory {
  id: string;
  amount: number;
  currency: string;
  tier: string;
  duration_months: number;
  status: string;
  payment_method: string | null;
  created_at: string;
  razorpay_payment_id: string | null;
}

const tierIcons = {
  freemium: Sparkles,
  monthly: Zap,
  six_months: Crown,
  yearly: Infinity
};

const tierNames = {
  freemium: "Freemium",
  monthly: "Monthly Plan",
  six_months: "6 Months Plan",
  yearly: "Yearly Plan"
};

const tierColors = {
  freemium: "bg-gray-500",
  monthly: "bg-blue-500",
  six_months: "bg-purple-500",
  yearly: "bg-orange-500"
};

export default function Subscription() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchUserAndData();
  }, []);

  const fetchUserAndData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/");
        return;
      }
      
      setUser(user);
      await Promise.all([fetchSubscription(user.id), fetchPaymentHistory(user.id)]);
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to load subscription data");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscription = async (userId: string) => {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (error) {
      console.error("Error fetching subscription:", error);
      return;
    }

    setSubscription(data);
  };

  const fetchPaymentHistory = async (userId: string) => {
    const { data, error } = await supabase
      .from("payment_history")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching payment history:", error);
      return;
    }

    setPaymentHistory(data || []);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const formatCurrency = (amount: number, currency: string = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency
    }).format(amount);
  };

  const getDaysRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="container max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-48 w-full rounded-3xl" />
          <div className="grid md:grid-cols-3 gap-4">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
          <Skeleton className="h-96 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  const currentTier = subscription?.tier || "freemium";
  const TierIcon = tierIcons[currentTier as keyof typeof tierIcons];
  const daysRemaining = subscription?.expires_at ? getDaysRemaining(subscription.expires_at) : null;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="container max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Subscription Management
          </h1>
          <div className="w-32" /> {/* Spacer for alignment */}
        </div>

        {/* Current Plan Card */}
        <Card className="p-8 bg-gradient-to-br from-card to-muted/20">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className={`w-16 h-16 ${tierColors[currentTier as keyof typeof tierColors]} rounded-2xl flex items-center justify-center`}>
                <TierIcon className="w-8 h-8 text-white" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-foreground">
                    {tierNames[currentTier as keyof typeof tierNames]}
                  </h2>
                  <Badge variant={subscription?.status === "active" ? "default" : "secondary"}>
                    {subscription?.status || "Active"}
                  </Badge>
                </div>
                {subscription?.started_at && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      Started on {formatDate(subscription.started_at)}
                    </span>
                  </div>
                )}
                {subscription?.expires_at && daysRemaining !== null && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      {daysRemaining > 0 
                        ? `${daysRemaining} days remaining`
                        : "Expired"
                      }
                    </span>
                  </div>
                )}
              </div>
            </div>
            <Button
              onClick={() => navigate("/pricing")}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              {currentTier === "freemium" ? "Upgrade Plan" : "Change Plan"}
            </Button>
          </div>
        </Card>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Current Tier</p>
              <p className="text-2xl font-bold text-foreground">
                {tierNames[currentTier as keyof typeof tierNames]}
              </p>
            </div>
          </Card>
          <Card className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="text-2xl font-bold text-foreground capitalize">
                {subscription?.status || "Active"}
              </p>
            </div>
          </Card>
          <Card className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Payments</p>
              <p className="text-2xl font-bold text-foreground">
                {paymentHistory.length}
              </p>
            </div>
          </Card>
        </div>

        {/* Payment History */}
        <Card className="p-8">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Payment History</h2>
            </div>

            {paymentHistory.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg text-muted-foreground">No payment history yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Your payment transactions will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {paymentHistory.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-muted/30 rounded-xl gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 ${tierColors[payment.tier as keyof typeof tierColors]} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        {(() => {
                          const Icon = tierIcons[payment.tier as keyof typeof tierIcons];
                          return <Icon className="w-6 h-6 text-white" />;
                        })()}
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground">
                          {tierNames[payment.tier as keyof typeof tierNames]}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {payment.duration_months} month{payment.duration_months > 1 ? 's' : ''} subscription
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(payment.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-foreground">
                          {formatCurrency(payment.amount, payment.currency)}
                        </p>
                        <Badge 
                          variant={payment.status === "success" ? "default" : payment.status === "pending" ? "secondary" : "destructive"}
                          className="mt-1"
                        >
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Help Section */}
        <Card className="p-6 bg-muted/30">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-2">Need Help?</h3>
              <p className="text-sm text-muted-foreground">
                If you have any questions about your subscription or billing, please contact our support team.
              </p>
            </div>
            <Button variant="outline">Contact Support</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
