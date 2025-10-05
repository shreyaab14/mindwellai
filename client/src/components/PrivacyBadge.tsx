import { Shield, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function PrivacyBadge() {
  return (
    <div className="flex items-center gap-2 text-xs">
      <Badge variant="outline" className="gap-2 bg-muted/50">
        <Shield className="h-3 w-3 text-green-600 dark:text-green-400" />
        <span className="text-muted-foreground">Processing locally</span>
      </Badge>
      <Badge variant="outline" className="gap-2 bg-muted/50">
        <Lock className="h-3 w-3 text-green-600 dark:text-green-400" />
        <span className="text-muted-foreground">Your privacy protected</span>
      </Badge>
    </div>
  );
}
