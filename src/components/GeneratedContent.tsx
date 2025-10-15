import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Copy, Save, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface GeneratedContentProps {
  caption: string;
  hashtags: string[];
  mood: string;
  onSave?: () => void;
}

export const GeneratedContent = ({ caption, hashtags, mood, onSave }: GeneratedContentProps) => {
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedHashtags, setCopiedHashtags] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = async (text: string, type: 'caption' | 'hashtags') => {
    await navigator.clipboard.writeText(text);
    
    if (type === 'caption') {
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2000);
    } else {
      setCopiedHashtags(true);
      setTimeout(() => setCopiedHashtags(false), 2000);
    }

    toast({
      title: "Copied!",
      description: `${type === 'caption' ? 'Caption' : 'Hashtags'} copied to clipboard`,
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
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
      setIsSaving(false);
    }
  };

  const hashtagsText = hashtags.map(tag => `#${tag}`).join(' ');

  return (
    <Card className="p-6 space-y-4 bg-gradient-to-br from-background to-muted border-2 shadow-card animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Caption</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(caption, 'caption')}
            className="h-8"
          >
            {copiedCaption ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-foreground leading-relaxed">{caption}</p>
      </div>

      <div className="space-y-2">
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
              #{tag}
            </span>
          ))}
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
      >
        <Save className="w-4 h-4 mr-2" />
        {isSaving ? 'Saving...' : 'Save Post'}
      </Button>
    </Card>
  );
};