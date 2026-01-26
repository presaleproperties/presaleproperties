import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ReviewCardProps {
  author: string;
  rating: number;
  text: string;
  date?: string;
  location?: string;
  verified?: boolean;
}

export function ReviewCard({ 
  author, 
  rating, 
  text, 
  date, 
  location,
  verified = false 
}: ReviewCardProps) {
  const initials = author
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="border-border/50 bg-card hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        {/* Rating Stars */}
        <div className="flex gap-0.5 mb-3">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${i < rating ? "fill-primary text-primary" : "fill-muted text-muted"}`}
            />
          ))}
        </div>

        {/* Review Text */}
        <blockquote className="text-foreground leading-relaxed mb-4 line-clamp-4">
          "{text}"
        </blockquote>

        {/* Author Info */}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground truncate">{author}</span>
              {verified && (
                <span className="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                  Verified
                </span>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {location && <span>{location}</span>}
              {location && date && <span className="mx-1">•</span>}
              {date && <span>{date}</span>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
