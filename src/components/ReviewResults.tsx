import { AlertCircle, AlertTriangle, Info, XCircle, Lightbulb, FileCode } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface ReviewIssue {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  suggestion: string;
}

interface ReviewResultsProps {
  issues: ReviewIssue[];
  isLoading: boolean;
  reviewAttempted?: boolean;
}

const severityConfig = {
  critical: {
    icon: XCircle,
    label: "Critical",
    tooltip: "Critical — Bugs or security flaws that must be fixed immediately",
    className: "severity-critical",
    dotColor: "bg-red-500",
  },
  high: {
    icon: AlertCircle,
    label: "High",
    tooltip: "High — Significant issues that could cause failures or vulnerabilities",
    className: "severity-high",
    dotColor: "bg-orange-500",
  },
  medium: {
    icon: AlertTriangle,
    label: "Medium",
    tooltip: "Medium — Code quality or performance issues worth addressing",
    className: "severity-medium",
    dotColor: "bg-yellow-500",
  },
  low: {
    icon: Info,
    label: "Low",
    tooltip: "Low — Minor suggestions for style, readability, or best practices",
    className: "severity-low",
    dotColor: "bg-blue-500",
  },
};

const ReviewResults = ({ issues, isLoading, reviewAttempted = false }: ReviewResultsProps) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse">
            <FileCode className="w-8 h-8 text-primary" />
          </div>
          <div className="absolute -inset-2 rounded-3xl border-2 border-primary/20 animate-ping" />
        </div>
        <div className="text-center">
          <p className="text-foreground font-medium">Analyzing your code...</p>
          <p className="text-sm text-muted-foreground mt-1">
            Checking for bugs, security issues, and best practices
          </p>
        </div>
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center">
          <Lightbulb className="w-8 h-8 text-green-500" />
        </div>
        <div>
          <p className="text-foreground font-medium">
            {reviewAttempted ? "Perfect code!" : "No issues found yet"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {reviewAttempted 
              ? "The input code is correct, nothing to optimize." 
              : "Paste your code and click 'Review Code' to get started"
            }
          </p>
        </div>
      </div>
    );
  }

  const sortedIssues = [...issues].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.severity] - order[b.severity];
  });

  const severityCounts = issues.reduce(
    (acc, issue) => {
      acc[issue.severity]++;
      return acc;
    },
    { critical: 0, high: 0, medium: 0, low: 0 }
  );

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between pb-4 border-b border-border/50">
        <h3 className="font-semibold text-foreground">Review Results</h3>
        <div className="flex items-center gap-3">
          {Object.entries(severityCounts).map(([severity, count]) => {
            if (count === 0) return null;
            const config = severityConfig[severity as keyof typeof severityConfig];
            return (
              <Tooltip key={severity}>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 text-xs cursor-help">
                    <div className={cn("w-2 h-2 rounded-full", config.dotColor)} />
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs max-w-[220px]">
                  {config.tooltip}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>

      {/* Issues List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin pr-2">
        {sortedIssues.map((issue) => {
          const config = severityConfig[issue.severity];
          const Icon = config.icon;

          return (
            <div
              key={issue.id}
              className={cn(
                "rounded-xl p-4 border transition-all hover:scale-[1.01]",
                config.className
              )}
            >
              <div className="flex items-start gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex-shrink-0 mt-0.5 cursor-help">
                      <Icon className="w-5 h-5" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs max-w-[220px]">
                    {config.tooltip}
                  </TooltipContent>
                </Tooltip>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground leading-snug mb-1.5">
                    {issue.title}
                  </h4>
                  <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-background/50 border border-border/50">
                    <Lightbulb className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-foreground/80 leading-relaxed">{issue.suggestion}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReviewResults;
