import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
  const [website, setWebsite] = useState("");
  const [topic, setTopic] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [language, setLanguage] = useState("en");
  const [captionLengths, setCaptionLengths] = useState({
    short: true,
    medium: true,
    long: true,
  });
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image (JPG, PNG, GIF, WEBP) or video (MP4, MOV)",
          variant: "destructive",
        });
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 20MB",
          variant: "destructive",
        });
        return;
      }
      setUploadedFile(file);
    }
  };

  const handleGenerate = async () => {
    if (!niche.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter your niche",
        variant: "destructive",
      });
      return;
    }

    if (!captionLengths.short && !captionLengths.medium && !captionLengths.long) {
      toast({
        title: "Select caption length",
        description: "Please select at least one caption length",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      let imageData = null;
      if (uploadedFile) {
        const reader = new FileReader();
        imageData = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(uploadedFile);
        });
      }

      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          topic: topic.trim(),
          mood: selectedMood,
          niche: niche.trim(),
          website: website.trim(),
          imageData,
          language,
          captionLengths,
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
      const totalCaptions = data.captions.length;
      toast({
        title: "Generated!",
        description: `${totalCaptions} caption${totalCaptions !== 1 ? 's' : ''} and hashtags are ready`,
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
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto p-4 md:p-8">
        <header className="mb-8 md:mb-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-elegant">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  CaptionCraft
                </h1>
                <p className="text-sm text-muted-foreground">AI-powered caption generator</p>
              </div>
            </div>
            <Button onClick={handleLogout} variant="outline" size="sm" className="rounded-full">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </header>

        <Tabs defaultValue="generate" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 bg-card rounded-2xl p-1.5 shadow-card">
            <TabsTrigger value="generate" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Generate
            </TabsTrigger>
            <TabsTrigger value="saved" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Saved Posts
            </TabsTrigger>
          </TabsList>


          <TabsContent value="generate" className="space-y-6">
            <Card className="p-6 md:p-8 space-y-6 bg-card shadow-card rounded-3xl border-0">
              <div className="space-y-5">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    Your Niche <span className="text-accent">*</span>
                  </label>
                  <Input
                    placeholder="e.g., Fitness, Travel, Food, Tech..."
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    className="h-14 rounded-2xl border-border bg-muted/30 text-base"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground">Website (Optional)</label>
                  <Input
                    placeholder="e.g., yourwebsite.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="h-14 rounded-2xl border-border bg-muted/30 text-base"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground">Upload Photo/Video (Optional)</label>
                  <div className="relative">
                    <Input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                      className="h-14 rounded-2xl border-border bg-muted/30 text-base file:mr-4 file:rounded-xl file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
                    />
                    {uploadedFile && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Selected: {uploadedFile.name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground">Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="h-14 w-full rounded-2xl border border-border bg-muted/30 px-4 text-base focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="bn">Bengali</option>
                    <option value="te">Telugu</option>
                    <option value="mr">Marathi</option>
                    <option value="ta">Tamil</option>
                    <option value="gu">Gujarati</option>
                    <option value="kn">Kannada</option>
                    <option value="ml">Malayalam</option>
                    <option value="pa">Punjabi</option>
                    <option value="or">Odia</option>
                    <option value="as">Assamese</option>
                    <option value="ur">Urdu</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="it">Italian</option>
                    <option value="pt">Portuguese</option>
                    <option value="ja">Japanese</option>
                    <option value="ko">Korean</option>
                    <option value="zh">Chinese</option>
                    <option value="ar">Arabic</option>
                    <option value="ru">Russian</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground">Topic (Optional)</label>
                  <Textarea
                    placeholder="What's your post about? Leave blank for general suggestions..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="min-h-[120px] resize-none rounded-2xl border-border bg-muted/30 text-base"
                  />
                </div>

                <MoodSelector selectedMood={selectedMood} onMoodChange={setSelectedMood} />

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground">Caption Lengths</label>
                  <div className="flex flex-wrap gap-4 p-4 bg-muted/30 rounded-2xl">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="short"
                        checked={captionLengths.short}
                        onCheckedChange={(checked) => 
                          setCaptionLengths(prev => ({ ...prev, short: checked as boolean }))
                        }
                      />
                      <label
                        htmlFor="short"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        Short (5 captions, 10-30 words each)
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="medium"
                        checked={captionLengths.medium}
                        onCheckedChange={(checked) => 
                          setCaptionLengths(prev => ({ ...prev, medium: checked as boolean }))
                        }
                      />
                      <label
                        htmlFor="medium"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        Medium (5 captions, 30-60 words each)
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="long"
                        checked={captionLengths.long}
                        onCheckedChange={(checked) => 
                          setCaptionLengths(prev => ({ ...prev, long: checked as boolean }))
                        }
                      />
                      <label
                        htmlFor="long"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        Long (5 captions, 60-100 words each)
                      </label>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !niche.trim()}
                  className="w-full h-14 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all text-lg font-semibold rounded-2xl shadow-elegant"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                      Generating Magic...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-6 h-6 mr-2" />
                      Generate Captions
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