import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Phone, ExternalLink } from "lucide-react";

interface CrisisAlertProps {
  onDismiss?: () => void;
}

export function CrisisAlert({ onDismiss }: CrisisAlertProps) {
  const resources = [
    {
      name: "National Suicide Prevention Lifeline",
      phone: "988",
      description: "24/7 free and confidential support",
      url: "https://988lifeline.org/",
    },
    {
      name: "Crisis Text Line",
      phone: "Text HOME to 741741",
      description: "24/7 crisis support via text",
      url: "https://www.crisistextline.org/",
    },
    {
      name: "SAMHSA National Helpline",
      phone: "1-800-662-4357",
      description: "Treatment referral and information",
      url: "https://www.samhsa.gov/find-help/national-helpline",
    },
  ];

  return (
    <Card className="border-destructive/50 bg-destructive/5" data-testid="crisis-alert">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="w-5 h-5" />
          Crisis Support Resources
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">
          I'm concerned about your safety. Please know that you're not alone, and there are people who want to help.
          If you're in immediate danger, please call 911 or go to your nearest emergency room.
        </p>

        <div className="space-y-3">
          {resources.map((resource) => (
            <div
              key={resource.name}
              className="p-3 rounded-lg bg-background border"
              data-testid={`crisis-resource-${resource.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm mb-1">{resource.name}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{resource.description}</p>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Phone className="w-4 h-4" />
                    <span>{resource.phone}</span>
                  </div>
                </div>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80"
                  data-testid={`link-${resource.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t">
          <p className="text-xs text-muted-foreground">
            Remember: Reaching out for help is a sign of strength, not weakness. These resources are confidential and available 24/7.
          </p>
        </div>

        {onDismiss && (
          <Button
            variant="outline"
            size="sm"
            onClick={onDismiss}
            className="w-full"
            data-testid="button-dismiss-crisis"
          >
            I understand
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
