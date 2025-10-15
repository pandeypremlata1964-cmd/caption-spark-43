import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MoodSelector } from "@/components/MoodSelector";
import { GeneratedContent } from "@/components/GeneratedContent";
import { SavedPosts } from "@/components/SavedPosts";
import { AuthForm } from "@/components/AuthForm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, LogOut, Loader2 } from "lucide-react";
import { User, Session } from "@supabase/supabase-js";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [selectedMood, setSelectedMood] = useState("playful");
  const [niche, setNiche] = useState("");
  const [topic, setTopic] = useState("");
  const [generatedContent, setGeneratedContent] = useState<{captions: string[]; hashtags: string[]} | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [refreshSaved, setRefreshSaved] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleGenerate = async () => {
    if (!niche.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter your niche",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          topic: topic.trim(),
          mood: selectedMood,
          niche: niche.trim(),
        }
      });

      if (error) {
        if (error.message.includes('429')) {
          throw new Error('Rate limit exceeded. Please try again in a moment.');
        }
        if (error.message.includes('402')) {
          throw new Error('AI credits depleted. Please add credits to continue.');
        }
        throw error;
      }

      setGeneratedContent(data);
      toast({
        title: "Generated!",
        description: "5 caption variations and hashtags are ready",
      });
    } catch (error: any) {
      console.error('Error generating content:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate content",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You've been successfully logged out",
    });
  };

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      <div className="container max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                CaptionCraft
              </h1>
              <p className="text-sm text-muted-foreground">AI-powered social media content</p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </header>

        <Tabs defaultValue="generate" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate">Generate</TabsTrigger>
            <TabsTrigger value="saved">Saved Posts</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-6">
            <Card className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Your Niche *</label>
                  <Input
                    placeholder="e.g., Fitness, Travel, Food, Tech..."
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Topic (Optional)</label>
                  <Textarea
                    placeholder="What's your post about? Leave blank for general suggestions..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="min-h-[100px] resize-none"
                  />
                </div>

                <MoodSelector selectedMood={selectedMood} onMoodChange={setSelectedMood} />

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !niche.trim()}
                  className="w-full h-12 bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity text-lg font-semibold"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate Content
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {generatedContent && (
              <GeneratedContent
                captions={generatedContent.captions}
                hashtags={generatedContent.hashtags}
                mood={selectedMood}
                onSave={() => setRefreshSaved(prev => prev + 1)}
              />
            )}
          </TabsContent>

          <TabsContent value="saved" className="space-y-4">
            <SavedPosts key={refreshSaved} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;