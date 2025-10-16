import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Chrome } from "lucide-react";

export const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast({
          title: "Welcome back!",
          description: "You've successfully logged in.",
        });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (error) throw error;
        toast({
          title: "Account created!",
          description: "You can now start generating content.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md p-8 md:p-10 space-y-8 bg-card shadow-card rounded-3xl border-0">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-3xl flex items-center justify-center shadow-elegant">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              CaptionCraft
            </h1>
            <p className="text-muted-foreground text-base">
              AI-powered captions & hashtags for creators
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-3">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-14 rounded-2xl border-border bg-muted/30 text-base"
            />
          </div>
          <div className="space-y-3">
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-14 rounded-2xl border-border bg-muted/30 text-base"
              minLength={6}
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all rounded-2xl text-lg font-semibold shadow-elegant"
          >
            {isLoading ? "Loading..." : isLogin ? "Sign In" : "Sign Up"}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-card px-3 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <Button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          variant="outline"
          className="w-full h-14 rounded-2xl border-border hover:bg-muted/50"
        >
          <Chrome className="w-5 h-5 mr-2" />
          Google
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </Card>
    </div>
  );
};