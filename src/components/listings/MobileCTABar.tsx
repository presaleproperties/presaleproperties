import { Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileCTABarProps {
  price: string;
  onContactClick: () => void;
  phoneNumber?: string;
}

export function MobileCTABar({ price, onContactClick, phoneNumber }: MobileCTABarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t p-3 lg:hidden z-50">
      <div className="container flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">Price</p>
          <p className="text-lg font-bold text-primary truncate">{price}</p>
        </div>
        <div className="flex gap-2">
          {phoneNumber && (
            <Button size="sm" variant="outline" asChild className="h-10 px-3">
              <a href={`tel:${phoneNumber}`}>
                <Phone className="h-4 w-4" />
              </a>
            </Button>
          )}
          <Button size="sm" onClick={onContactClick} className="h-10 px-4">
            <Mail className="h-4 w-4 mr-2" />
            Inquire
          </Button>
        </div>
      </div>
    </div>
  );
}
