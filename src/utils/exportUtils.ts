interface SavedPost {
  id: string;
  caption: string;
  hashtags: string[];
  mood: string;
  created_at: string;
}

export const exportToCSV = (posts: SavedPost[]) => {
  const headers = ["Caption", "Hashtags", "Mood", "Created At"];
  const rows = posts.map(post => [
    `"${post.caption.replace(/"/g, '""')}"`,
    `"${post.hashtags.map(h => `#${h}`).join(' ').replace(/"/g, '""')}"`,
    post.mood,
    new Date(post.created_at).toLocaleDateString()
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `captioncraft-export-${Date.now()}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToJSON = (posts: SavedPost[]) => {
  const jsonContent = JSON.stringify(posts, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `captioncraft-export-${Date.now()}.json`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
