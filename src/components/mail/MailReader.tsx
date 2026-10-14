import React, { useState } from "react";
import { Email } from "../../types";
import { TriageBadge } from "../ai/TriageBadge";
import {
  Trash2,
  Archive,
  Sparkles,
  Send,
  CornerDownLeft,
} from "lucide-react";

interface MailReaderProps {
  email: Email | null;
  onGenerateAIReply: (email: Email, intent: string) => Promise<string>;
}

export const MailReader: React.FC<MailReaderProps> = ({ email, onGenerateAIReply }) => {
  const [replyText, setReplyText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  if (!email) {
    return (
      <div className="flex-1 h-screen flex flex-col items-center justify-center text-zen-subtle bg-zen-surface/30">
        <Sparkles className="w-8 h-8 mb-2 opacity-30 text-zen-accent" />
        <p className="text-sm">Sélectionnez un email pour commencer la lecture</p>
      </div>
    );
  }

  const handleQuickReplyClick = async (suggestion: string) => {
    setIsGenerating(true);
    try {
      const generated = await onGenerateAIReply(email, suggestion);
      setReplyText(generated);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 h-screen flex flex-col bg-zen-surface overflow-hidden">
      {/* Barre d'action supérieure */}
      <div className="h-14 border-b border-zen-border px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          {email.triage && <TriageBadge triage={email.triage} />}
        </div>
        <div className="flex items-center gap-1 text-zen-muted">
          <button
            title="Archiver"
            className="p-2 rounded-lg hover:bg-zen-hover hover:text-zen-text transition"
          >
            <Archive className="w-4 h-4" />
          </button>
          <button
            title="Supprimer"
            className="p-2 rounded-lg hover:bg-zen-hover hover:text-red-400 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Contenu de l'email */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        {/* Sujet et expéditeur */}
        <div>
          <h1 className="text-xl font-semibold text-zen-text tracking-tight mb-3">
            {email.subject}
          </h1>

          <div className="flex items-center justify-between text-sm border-b border-zen-border pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zen-elevated border border-zen-border flex items-center justify-center font-medium text-zen-text text-sm">
                {email.fromName[0]}
              </div>
              <div>
                <div className="font-medium text-zen-text">{email.fromName}</div>
                <div className="text-xs text-zen-subtle">{email.fromAddress}</div>
              </div>
            </div>
            <div className="text-xs text-zen-subtle">{email.date}</div>
          </div>
        </div>

        {/* Bloc Explication Transparent de l'IA */}
        {email.triage && (
          <div className="p-3.5 rounded-xl bg-zen-elevated/70 border border-zen-border/70 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zen-accent">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Analyse AuraMail IA :</span>
            </div>
            <p className="text-xs text-zen-muted leading-relaxed">
              {email.triage.reasoning}
            </p>
          </div>
        )}

        {/* Corps du message */}
        <div className="text-sm text-zen-text leading-relaxed whitespace-pre-wrap select-text">
          {email.bodyPlain}
        </div>

        {/* Suggestions de réponses rapides en 1 clic */}
        {email.triage?.suggestedQuickReplies && (
          <div className="pt-4 border-t border-zen-border">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zen-subtle block mb-2">
              Réponses rapides suggérées
            </span>
            <div className="flex flex-wrap gap-2">
              {email.triage.suggestedQuickReplies.map((reply, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickReplyClick(reply)}
                  disabled={isGenerating}
                  className="px-3 py-1.5 text-xs bg-zen-elevated hover:bg-zen-hover border border-zen-border rounded-lg text-zen-text flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  <Sparkles className="w-3 h-3 text-zen-accent" />
                  <span>{reply}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Éditeur de réponse Zen */}
        <div className="pt-2">
          <div className="border border-zen-border rounded-xl bg-zen-elevated focus-within:border-zen-accent transition p-3 flex flex-col gap-2">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Rédigez votre réponse ou cliquez sur une suggestion ci-dessus..."
              rows={4}
              className="w-full bg-transparent text-sm text-zen-text placeholder-zen-subtle focus:outline-none resize-none"
            />
            <div className="flex items-center justify-between pt-2 border-t border-zen-border/50">
              <div className="text-xs text-zen-subtle flex items-center gap-1">
                <CornerDownLeft className="w-3 h-3" />
                <span>Ctrl+Entrée pour envoyer</span>
              </div>
              <button
                disabled={!replyText.trim() || isGenerating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zen-accent hover:bg-zen-accentHover text-white transition disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Envoyer</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
