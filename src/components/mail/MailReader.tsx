import React, { useState } from "react";
import { Email, EmailCategory, PriorityScore } from "../../types";
import { TriageBadge } from "../ai/TriageBadge";
import {
  Trash2,
  Archive,
  Sparkles,
  Send,
  CornerDownLeft,
  SlidersHorizontal,
  Check,
} from "lucide-react";

interface MailReaderProps {
  email: Email | null;
  onGenerateAIReply: (email: Email, intent: string) => Promise<string>;
  onCorrectTriage?: (
    email: Email,
    newCategory: EmailCategory,
    newPriority: PriorityScore,
    userNote?: string
  ) => void;
}

export const MailReader: React.FC<MailReaderProps> = ({
  email,
  onGenerateAIReply,
  onCorrectTriage,
}) => {
  const [replyText, setReplyText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCorrectionOpen, setIsCorrectionOpen] = useState(false);
  const [selectedCat, setSelectedCat] = useState<EmailCategory>("action_required");
  const [selectedPrio, setSelectedPrio] = useState<PriorityScore>(3);
  const [note, setNote] = useState("");
  const [learnedNotice, setLearnedNotice] = useState<string | null>(null);

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

  const handleSaveCorrection = () => {
    if (onCorrectTriage) {
      onCorrectTriage(email, selectedCat, selectedPrio, note || undefined);
    }
    setIsCorrectionOpen(false);
    setLearnedNotice(
      `L'IA a mémorisé votre règle pour "${email.fromName}" (${selectedCat}).`
    );
    setTimeout(() => setLearnedNotice(null), 4000);
  };

  return (
    <div className="flex-1 h-screen flex flex-col bg-zen-surface overflow-hidden relative">
      {/* Toast d'apprentissage IA */}
      {learnedNotice && (
        <div className="absolute top-16 right-6 z-40 bg-zen-accent text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-medium animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          <span>{learnedNotice}</span>
        </div>
      )}

      {/* Barre d'action supérieure */}
      <div className="h-14 border-b border-zen-border px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 relative">
          {email.triage && <TriageBadge triage={email.triage} />}
          <button
            onClick={() => {
              if (email.triage) {
                setSelectedCat(email.triage.category);
                setSelectedPrio(email.triage.priorityScore);
              }
              setIsCorrectionOpen(!isCorrectionOpen);
            }}
            title="Apprendre à l'IA : corriger cette classification"
            className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-zen-elevated hover:bg-zen-hover border border-zen-border text-zen-muted hover:text-zen-text transition"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-zen-accent" />
            <span>Corriger / Entraîner l'IA</span>
          </button>

          {/* Popover de correction et d'apprentissage */}
          {isCorrectionOpen && (
            <div className="absolute top-10 left-0 z-50 w-80 bg-zen-elevated border border-zen-border rounded-xl shadow-2xl p-4 flex flex-col gap-3 text-xs">
              <div className="font-semibold text-zen-text flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-zen-accent" />
                <span>Apprendre à l'IA</span>
              </div>
              <p className="text-zen-subtle text-[11px]">
                En corrigeant, l'IA adapte ses prochains triages pour cet expéditeur et ce type d'email.
              </p>

              <div>
                <label className="block text-zen-muted mb-1 font-medium">Catégorie souhaitée</label>
                <select
                  value={selectedCat}
                  onChange={(e) => setSelectedCat(e.target.value as EmailCategory)}
                  className="w-full bg-zen-bg border border-zen-border rounded-md px-2 py-1 text-zen-text focus:outline-none focus:border-zen-accent"
                >
                  <option value="urgent">Urgent</option>
                  <option value="action_required">Action requise</option>
                  <option value="newsletter">Newsletter</option>
                  <option value="receipt">Reçu / Facture</option>
                  <option value="low_priority">Info / Basse priorité</option>
                </select>
              </div>

              <div>
                <label className="block text-zen-muted mb-1 font-medium">
                  Priorité ({selectedPrio}/5)
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      onClick={() => setSelectedPrio(score as PriorityScore)}
                      className={`flex-1 py-1 rounded border text-center font-bold ${
                        selectedPrio === score
                          ? "bg-zen-accent text-white border-zen-accent"
                          : "bg-zen-bg border-zen-border text-zen-muted hover:text-zen-text"
                      }`}
                    >
                      {score}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-zen-muted mb-1 font-medium">
                  Note d'instruction (Optionnel)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ex: Toujours prioriser ce client..."
                  className="w-full bg-zen-bg border border-zen-border rounded-md px-2 py-1 text-zen-text placeholder-zen-subtle focus:outline-none focus:border-zen-accent"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1 border-t border-zen-border/50">
                <button
                  onClick={() => setIsCorrectionOpen(false)}
                  className="px-2.5 py-1 rounded text-zen-muted hover:text-zen-text"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveCorrection}
                  className="flex items-center gap-1 px-3 py-1 rounded bg-zen-accent hover:bg-zen-accentHover text-white font-medium"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Enregistrer la règle</span>
                </button>
              </div>
            </div>
          )}
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
