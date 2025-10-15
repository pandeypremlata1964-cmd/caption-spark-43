import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SavedPost {
  id: string;
  caption: string;
  hashtags: string[];
  mood: string;
  created_at: string;
}

export const SavedPosts = () => {
  const [posts, setPosts] = useState<SavedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPosts(posts.filter(post => post.id !== id));
      toast({
        title: "Deleted",
        description: "Post removed from your collection",
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
    }
  };

  const copyPost = async (post: SavedPost) => {
    const text = `${post.caption}\n\n${post.hashtags.map(tag => `#${tag}`).join(' ')}`;
    await navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Post copied to clipboard",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-3" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </Card>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No saved posts yet. Generate and save some content to see them here!</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Card key={post.id} className="p-6 space-y-3 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <span className="inline-block px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium uppercase">
                {post.mood}
              </span>
              <p className="text-foreground leading-relaxed">{post.caption}</p>
              <div className="flex flex-wrap gap-2">
                {post.hashtags.slice(0, 5).map((tag, index) => (
                  <span key={index} className="text-sm text-muted-foreground">
                    #{tag}
                  </span>
                ))}
                {post.hashtags.length > 5 && (
                  <span className="text-sm text-muted-foreground">
                    +{post.hashtags.length - 5} more
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyPost(post)}
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(post.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};