import React from "react";
import { AITriage } from "../../types";
import { AlertCircle, CheckCircle2, Newspaper, Receipt, Sparkles } from "lucide-react";

interface TriageBadgeProps {
  triage?: AITriage;
  compact?: boolean;
}

export const TriageBadge: React.FC<TriageBadgeProps> = ({ triage, compact = false }) => {
  if (!triage) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-zen-border/50 text-zen-muted">
        <Sparkles className="w-3 h-3 text-zen-subtle" />
        Non trié
      </span>
    );
  }

  const categoryConfig: Record<
    string,
    { label: string; bg: string; text: string; icon: React.ReactNode }
  > = {
    urgent: {
      label: "Urgent",
      bg: "bg-red-500/15 border-red-500/30",
      text: "text-red-400",
      icon: <AlertCircle className="w-3 h-3 text-red-400" />,
    },
    action_required: {
      label: "Action",
      bg: "bg-amber-500/15 border-amber-500/30",
      text: "text-amber-400",
      icon: <CheckCircle2 className="w-3 h-3 text-amber-400" />,
    },
    newsletter: {
      label: "Newsletter",
      bg: "bg-blue-500/15 border-blue-500/30",
      text: "text-blue-400",
      icon: <Newspaper className="w-3 h-3 text-blue-400" />,
    },
    receipt: {
      label: "Reçu",
      bg: "bg-emerald-500/15 border-emerald-500/30",
      text: "text-emerald-400",
      icon: <Receipt className="w-3 h-3 text-emerald-400" />,
    },
    low_priority: {
      label: "Info",
      bg: "bg-gray-500/15 border-gray-500/30",
      text: "text-gray-400",
      icon: <Sparkles className="w-3 h-3 text-gray-400" />,
    },
  };

  const current = categoryConfig[triage.category] || categoryConfig.low_priority;

  if (compact) {
    return (
      <span
        title={`${current.label} (Score: ${triage.priorityScore}/5) - ${triage.reasoning}`}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-medium border rounded-md ${current.bg} ${current.text}`}
      >
        {current.icon}
        <span>{current.label}</span>
      </span>
    );
  }

  return (
    <div
      title={triage.reasoning}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border rounded-full ${current.bg} ${current.text} transition-all hover:scale-105`}
    >
      {current.icon}
      <span>{current.label}</span>
      <span className="opacity-60 text-[10px] ml-0.5">({triage.priorityScore}/5)</span>
    </div>
  );
};
