import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Copy, Save, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CharacterCounter } from "@/components/CharacterCounter";

interface GeneratedContentProps {
  captions: string[];
  hashtags: string[];
  mood: string;
  onSave?: () => void;
}

export const GeneratedContent = ({ captions, hashtags, mood, onSave }: GeneratedContentProps) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedHashtags, setCopiedHashtags] = useState(false);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const copyToClipboard = async (text: string, type: 'caption' | 'hashtags', index?: number) => {
    await navigator.clipboard.writeText(text);
    
    if (type === 'caption' && index !== undefined) {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } else {
      setCopiedHashtags(true);
      setTimeout(() => setCopiedHashtags(false), 2000);
    }

    toast({
      title: "Copied!",
      description: `${type === 'caption' ? 'Caption' : 'Hashtags'} copied to clipboard`,
    });
  };

  const handleSave = async (caption: string, index: number) => {
    setSavingIndex(index);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to save posts",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('saved_posts')
        .insert({
          user_id: user.id,
          caption,
          hashtags,
          mood,
        });

      if (error) throw error;

      toast({
        title: "Saved!",
        description: "Post saved to your collection",
      });

      onSave?.();
    } catch (error) {
      console.error('Error saving post:', error);
      toast({
        title: "Error",
        description: "Failed to save post",
        variant: "destructive",
      });
    } finally {
      setSavingIndex(null);
    }
  };

  const hashtagsText = hashtags.map(tag => `#${tag}`).join(' ');

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Caption Variations</h3>
        {captions.map((caption, index) => {
          const wordCount = caption.split(/\s+/).length;
          const length = wordCount <= 30 ? 'Short' : wordCount <= 60 ? 'Medium' : 'Long';
          const lengthColor = wordCount <= 30 ? 'text-green-500' : wordCount <= 60 ? 'text-blue-500' : 'text-purple-500';
          
          return (
            <Card key={index} className="p-4 space-y-3 bg-gradient-to-br from-background to-muted border-2 shadow-card animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-primary">Option {index + 1}</span>
                    <span className={`text-xs font-medium ${lengthColor}`}>• {length}</span>
                    <span className="text-xs text-muted-foreground">({wordCount} words)</span>
                  </div>
                  <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(caption, 'caption', index)}
                    className="h-8"
                  >
                    {copiedIndex === index ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <Button
                    onClick={() => handleSave(caption, index)}
                    disabled={savingIndex === index}
                    size="sm"
                    className="h-8 bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
                  >
                    <Save className="w-3 h-3 mr-1" />
                    {savingIndex === index ? 'Saving...' : 'Save'}
                  </Button>
                  </div>
                </div>
                <p className="text-foreground leading-relaxed">{caption}</p>
                <CharacterCounter text={caption} />
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-4 space-y-2 bg-gradient-to-br from-background to-muted border-2 shadow-card">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Hashtags</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(hashtagsText, 'hashtags')}
            className="h-8"
          >
            {copiedHashtags ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {hashtags.map((tag, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
};