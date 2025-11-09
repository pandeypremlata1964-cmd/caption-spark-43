import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const GenerateFormSkeleton = () => (
  <Card className="p-6 md:p-8 space-y-6 bg-card shadow-card rounded-3xl border-0">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-14 w-full rounded-2xl" />
      </div>
    ))}
    <Skeleton className="h-14 w-full rounded-2xl" />
  </Card>
);

export const SavedPostsSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <Card key={i} className="p-6 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3 w-full">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </Card>
    ))}
  </div>
);

export const GeneratedContentSkeleton = () => (
  <div className="space-y-4 animate-fade-in">
    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
      Caption Variations
    </h3>
    {[1, 2, 3].map((i) => (
      <Card key={i} className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </Card>
    ))}
    <Card className="p-4 space-y-3">
      <Skeleton className="h-4 w-24" />
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-6 w-20 rounded-full" />
        ))}
      </div>
    </Card>
  </div>
);
