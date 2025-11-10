import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Sparkles, Zap, Crown, Infinity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PricingTier {
  name: string;
  price: number;
  period: string;
  tier: "freemium" | "monthly" | "six_months" | "yearly";
  icon: any;
  gradient: string;
  features: string[];
  popular?: boolean;
  durationMonths: number;
}

const pricingTiers: PricingTier[] = [
  {
    name: "Freemium",
    price: 0,
    period: "Forever",
    tier: "freemium",
    icon: Sparkles,
    gradient: "from-gray-500 to-gray-600",
    features: [
      "3 caption generations per day",
      "Basic mood selection",
      "8-12 hashtags per caption",
      "Multi-language support",
      "Save favorite captions"
    ],
    durationMonths: 0
  },
  {
    name: "Monthly",
    price: 99,
    period: "1 Month",
    tier: "monthly",
    icon: Zap,
    gradient: "from-blue-500 to-cyan-500",
    features: [
      "Unlimited caption generations",
      "All mood selections",
      "Priority AI processing",
      "8-12 trending hashtags",
      "Multi-language support",
      "Save unlimited captions",
      "Export to CSV/JSON",
      "No daily limits"
    ],
    popular: true,
    durationMonths: 1
  },
  {
    name: "6 Months",
    price: 549,
    period: "6 Months",
    tier: "six_months",
    icon: Crown,
    gradient: "from-purple-500 to-pink-500",
    features: [
      "Everything in Monthly",
      "Save ₹45 (₹91.50/month)",
      "Extended validity",
      "Priority support",
      "Early access to new features"
    ],
    durationMonths: 6
  },
  {
    name: "Yearly",
    price: 999,
    period: "12 Months",
    tier: "yearly",
    icon: Infinity,
    gradient: "from-orange-500 to-red-500",
    features: [
      "Everything in Monthly",
      "Save ₹189 (₹83.25/month)",
      "Best value for money",
      "VIP support",
      "Exclusive features",
      "Lifetime updates for the year"
    ],
    durationMonths: 12
  }
];

export const PricingPage = () => {
  const [loading, setLoading] = useState<string | null>(null);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubscribe = async (tier: PricingTier) => {
    if (tier.tier === "freemium") {
      toast.info("You're already on the free plan!");
      return;
    }

    setLoading(tier.tier);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please login to subscribe");
        setLoading(null);
        return;
      }

      // Load Razorpay script
      const res = await loadRazorpayScript();
      if (!res) {
        toast.error("Failed to load payment gateway");
        setLoading(null);
        return;
      }

      // Create order via edge function
      const { data, error } = await supabase.functions.invoke("create-razorpay-order", {
        body: { 
          amount: tier.price,
          tier: tier.tier,
          durationMonths: tier.durationMonths
        }
      });

      if (error) throw error;

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: "INR",
        name: "CaptionCraft",
        description: `${tier.name} Plan - ${tier.period}`,
        order_id: data.orderId,
        handler: async function (response: any) {
          try {
            // Verify payment
            const { error: verifyError } = await supabase.functions.invoke("verify-razorpay-payment", {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                tier: tier.tier,
                durationMonths: tier.durationMonths
              }
            });

            if (verifyError) throw verifyError;

            toast.success("Payment successful! Your subscription is now active.");
            setTimeout(() => window.location.reload(), 2000);
          } catch (err: any) {
            console.error("Payment verification error:", err);
            toast.error("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          email: user.email,
        },
        theme: {
          color: "#8B5CF6"
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      setLoading(null);

    } catch (error: any) {
      console.error("Subscription error:", error);
      toast.error(error.message || "Failed to initialize payment");
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background py-16 px-4">
      <div className="container max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground">
            Start free, upgrade when you're ready to unlock unlimited creativity
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pricingTiers.map((tier, index) => (
            <Card 
              key={index}
              className={`p-6 space-y-6 relative ${
                tier.popular 
                  ? "border-2 border-primary shadow-elegant scale-105" 
                  : "border-border"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
              )}

              <div className={`w-12 h-12 bg-gradient-to-br ${tier.gradient} rounded-xl flex items-center justify-center`}>
                <tier.icon className="w-6 h-6 text-white" />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-foreground">{tier.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">₹{tier.price}</span>
                  {tier.price > 0 && (
                    <span className="text-muted-foreground">/{tier.period}</span>
                  )}
                </div>
              </div>

              <ul className="space-y-3">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSubscribe(tier)}
                disabled={loading === tier.tier}
                className={`w-full ${
                  tier.popular
                    ? "bg-gradient-to-r from-primary to-accent hover:opacity-90"
                    : ""
                }`}
                variant={tier.popular ? "default" : "outline"}
              >
                {loading === tier.tier ? "Processing..." : tier.price === 0 ? "Current Plan" : "Subscribe Now"}
              </Button>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            All plans include our core AI features. Upgrade or downgrade anytime.
          </p>
        </div>
      </div>
    </div>
  );
};
