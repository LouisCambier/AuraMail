import React, { useState } from "react";
import { Email } from "../../types";
import { TriageBadge } from "../ai/TriageBadge";
import { Search, Sparkles, Star, Paperclip, Filter } from "lucide-react";

interface MailListProps {
  emails: Email[];
  selectedEmailId: string | null;
  onSelectEmail: (id: string) => void;
  onTriageAll: () => void;
  isTriaging: boolean;
}

export const MailList: React.FC<MailListProps> = ({
  emails,
  selectedEmailId,
  onSelectEmail,
  onTriageAll,
  isTriaging,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "urgent">("all");

  const filteredEmails = emails.filter((mail) => {
    if (filter === "unread" && mail.isRead) return false;
    if (filter === "urgent" && mail.triage?.category !== "urgent") return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      mail.subject.toLowerCase().includes(q) ||
      mail.fromName.toLowerCase().includes(q) ||
      mail.fromAddress.toLowerCase().includes(q) ||
      mail.snippet.toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-96 h-screen flex flex-col bg-zen-bg border-r border-zen-border select-none">
      {/* Barre de recherche et actions */}
      <div className="p-3 border-b border-zen-border flex flex-col gap-2">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-zen-subtle absolute left-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Recherche instantanée (FTS5)..."
            className="w-full pl-9 pr-3 py-1.5 bg-zen-surface border border-zen-border rounded-lg text-sm text-zen-text placeholder-zen-subtle focus:outline-none focus:border-zen-accent transition"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilter("all")}
              className={`px-2 py-0.5 rounded text-xs font-medium transition ${
                filter === "all"
                  ? "bg-zen-elevated text-zen-text"
                  : "text-zen-muted hover:text-zen-text"
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-2 py-0.5 rounded text-xs font-medium transition ${
                filter === "unread"
                  ? "bg-zen-elevated text-zen-text"
                  : "text-zen-muted hover:text-zen-text"
              }`}
            >
              Non lus
            </button>
            <button
              onClick={() => setFilter("urgent")}
              className={`px-2 py-0.5 rounded text-xs font-medium transition ${
                filter === "urgent"
                  ? "bg-zen-elevated text-amber-400"
                  : "text-zen-muted hover:text-zen-text"
              }`}
            >
              Urgents
            </button>
          </div>

          <button
            onClick={onTriageAll}
            disabled={isTriaging}
            title="Analyser et trier la boîte avec l'IA"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-zen-accent/20 text-indigo-300 border border-zen-accent/30 hover:bg-zen-accent/30 transition disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isTriaging ? "animate-spin" : ""}`} />
            <span>{isTriaging ? "Triage en cours..." : "Trier par IA"}</span>
          </button>
        </div>
      </div>

      {/* Liste des emails */}
      <div className="flex-1 overflow-y-auto divide-y divide-zen-border/40">
        {filteredEmails.length === 0 ? (
          <div className="p-8 text-center text-zen-subtle text-sm">
            Aucun email trouvé.
          </div>
        ) : (
          filteredEmails.map((mail) => {
            const isSelected = mail.id === selectedEmailId;
            return (
              <div
                key={mail.id}
                onClick={() => onSelectEmail(mail.id)}
                className={`p-3.5 cursor-pointer transition-all duration-150 flex flex-col gap-1.5 ${
                  isSelected
                    ? "bg-zen-elevated border-l-2 border-l-zen-accent"
                    : "hover:bg-zen-surface"
                } ${!mail.isRead ? "font-semibold" : ""}`}
              >
                {/* Ligne Expéditeur & Date */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 truncate">
                    {!mail.isRead && (
                      <div className="w-1.5 h-1.5 rounded-full bg-zen-accent shrink-0" />
                    )}
                    <span className="text-zen-text truncate">{mail.fromName}</span>
                  </div>
                  <span className="text-zen-subtle text-[11px] shrink-0">
                    {mail.date}
                  </span>
                </div>

                {/* Sujet */}
                <div className="text-sm font-medium text-zen-text truncate">
                  {mail.subject}
                </div>

                {/* Badge IA & TL;DR (Smart Summary) */}
                {mail.triage && (
                  <div className="flex items-center gap-2 mt-0.5">
                    <TriageBadge triage={mail.triage} compact />
                    <span className="text-[11px] text-zen-muted truncate italic">
                      {mail.triage.summary}
                    </span>
                  </div>
                )}

                {/* Snippet si pas de triage */}
                {!mail.triage && (
                  <p className="text-xs text-zen-muted line-clamp-1">{mail.snippet}</p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
