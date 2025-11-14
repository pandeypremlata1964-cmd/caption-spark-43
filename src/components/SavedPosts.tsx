import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Copy, Download, Search, Filter, CheckSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SavedPostsSkeleton } from "@/components/LoadingSkeleton";
import { exportToCSV, exportToJSON } from "@/utils/exportUtils";
import emptyStateImage from "@/assets/empty-state.png";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SavedPost {
  id: string;
  caption: string;
  hashtags: string[];
  mood: string;
  created_at: string;
}

export const SavedPosts = () => {
  const [posts, setPosts] = useState<SavedPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<SavedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMood, setFilterMood] = useState("all");
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 6;
  const { toast } = useToast();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data, error } = await supabase
          .from('saved_posts')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPosts(data || []);
        setFilteredPosts(data || []);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  useEffect(() => {
    let filtered = posts;

    if (searchQuery) {
      filtered = filtered.filter(post =>
        post.caption.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.hashtags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (filterMood !== "all") {
      filtered = filtered.filter(post => post.mood === filterMood);
    }

    setFilteredPosts(filtered);
    setCurrentPage(1);
  }, [searchQuery, filterMood, posts]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPosts(posts.filter(post => post.id !== id));
      setSelectedPosts(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
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

  const handleBulkDelete = async () => {
    if (selectedPosts.size === 0) return;

    try {
      const { error } = await supabase
        .from('saved_posts')
        .delete()
        .in('id', Array.from(selectedPosts));

      if (error) throw error;

      setPosts(posts.filter(post => !selectedPosts.has(post.id)));
      setSelectedPosts(new Set());
      toast({
        title: "Deleted",
        description: `${selectedPosts.size} posts removed`,
      });
    } catch (error) {
      console.error('Error deleting posts:', error);
      toast({
        title: "Error",
        description: "Failed to delete posts",
        variant: "destructive",
      });
    }
  };

  const togglePostSelection = (id: string) => {
    setSelectedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedPosts.size === paginatedPosts.length) {
      setSelectedPosts(new Set());
    } else {
      setSelectedPosts(new Set(paginatedPosts.map(p => p.id)));
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

  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const paginatedPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

  if (isLoading) {
    return <SavedPostsSkeleton />;
  }

  if (posts.length === 0) {
    return (
      <Card className="p-12 text-center space-y-6 animate-fade-in">
        <img 
          src={emptyStateImage} 
          alt="No saved posts" 
          className="w-64 h-auto mx-auto opacity-80"
          loading="lazy"
        />
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-foreground">No saved posts yet</h3>
          <p className="text-muted-foreground">
            Generate and save some content to see them here!
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search captions or hashtags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 rounded-2xl"
          />
        </div>
        <Select value={filterMood} onValueChange={setFilterMood}>
          <SelectTrigger className="w-full md:w-48 h-12 rounded-2xl">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by mood" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Moods</SelectItem>
            <SelectItem value="playful">Playful</SelectItem>
            <SelectItem value="professional">Professional</SelectItem>
            <SelectItem value="inspirational">Inspirational</SelectItem>
            <SelectItem value="casual">Casual</SelectItem>
            <SelectItem value="energetic">Energetic</SelectItem>
            <SelectItem value="motivational">Motivational</SelectItem>
            <SelectItem value="educational">Educational</SelectItem>
            <SelectItem value="celebratory">Celebratory</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button
            onClick={() => exportToCSV(filteredPosts)}
            variant="outline"
            size="sm"
            className="h-12 rounded-2xl"
          >
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
          <Button
            onClick={() => exportToJSON(filteredPosts)}
            variant="outline"
            size="sm"
            className="h-12 rounded-2xl"
          >
            <Download className="w-4 h-4 mr-2" />
            JSON
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedPosts.size > 0 && (
        <div className="flex items-center gap-4 p-4 bg-primary/10 rounded-2xl animate-fade-in">
          <span className="text-sm font-medium">
            {selectedPosts.size} selected
          </span>
          <Button
            onClick={handleBulkDelete}
            variant="destructive"
            size="sm"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Selected
          </Button>
          <Button
            onClick={() => setSelectedPosts(new Set())}
            variant="ghost"
            size="sm"
          >
            Clear Selection
          </Button>
        </div>
      )}

      {/* Select All */}
      {paginatedPosts.length > 0 && (
        <div className="flex items-center gap-2">
          <Button
            onClick={toggleSelectAll}
            variant="ghost"
            size="sm"
            className="h-8"
          >
            <CheckSquare className="w-4 h-4 mr-2" />
            {selectedPosts.size === paginatedPosts.length ? "Deselect All" : "Select All"}
          </Button>
          <span className="text-sm text-muted-foreground">
            Showing {indexOfFirstPost + 1}-{Math.min(indexOfLastPost, filteredPosts.length)} of {filteredPosts.length}
          </span>
        </div>
      )}

      {/* Posts Grid */}
      <div className="space-y-4">
        {paginatedPosts.map((post) => (
        <Card 
          key={post.id} 
          className={`p-6 space-y-3 hover:shadow-lg transition-all duration-300 ${
            selectedPosts.has(post.id) ? 'ring-2 ring-primary' : ''
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <input
              type="checkbox"
              checked={selectedPosts.has(post.id)}
              onChange={() => togglePostSelection(post.id)}
              className="mt-1 w-4 h-4 rounded border-border cursor-pointer"
              aria-label="Select post"
            />
            <div className="flex-1 space-y-2">
              <span className="inline-block px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium uppercase">
                {post.mood}
              </span>
              <p className="text-foreground leading-relaxed">{post.caption}</p>
              <div className="flex flex-wrap gap-2">
                {post.hashtags.slice(0, 5).map((tag, index) => (
                  <span key={index} className="text-sm text-muted-foreground">
                    {tag}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            variant="outline"
            size="sm"
            className="rounded-xl"
          >
            Previous
          </Button>
          <div className="flex gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <Button
                key={page}
                onClick={() => setCurrentPage(page)}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                className="w-10 rounded-xl"
              >
                {page}
              </Button>
            ))}
          </div>
          <Button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            variant="outline"
            size="sm"
            className="rounded-xl"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};