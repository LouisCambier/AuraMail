import React, { useState } from "react";
import { AISettings, AIProviderType } from "../../types";
import { X, Sparkles, Key, Server, Cpu, Check } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AISettings;
  onSave: (newSettings: AISettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [current, setCurrent] = useState<AISettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(current);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-zen-surface border border-zen-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zen-border">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-zen-accent" />
            <h2 className="font-semibold text-zen-text text-base">
              Configuration Moteur IA (BYOK)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zen-muted hover:text-zen-text hover:bg-zen-hover transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corps des Paramètres */}
        <div className="p-6 space-y-5 text-sm">
          {/* Choix du fournisseur */}
          <div>
            <label className="block text-xs font-semibold uppercase text-zen-subtle mb-2">
              Fournisseur IA Actif
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "ollama", label: "Ollama (Local 100% Privé)", icon: Cpu },
                { id: "claude", label: "Anthropic Claude", icon: Sparkles },
                { id: "gemini", label: "Google Gemini", icon: Server },
                { id: "openai_compatible", label: "OpenAI-Compatible", icon: Key },
              ].map((prov) => {
                const Icon = prov.icon;
                const isSelected = current.providerType === prov.id;
                return (
                  <button
                    key={prov.id}
                    onClick={() =>
                      setCurrent({
                        ...current,
                        providerType: prov.id as AIProviderType,
                      })
                    }
                    className={`flex items-center gap-2 p-3 rounded-xl border text-left transition ${
                      isSelected
                        ? "border-zen-accent bg-zen-accent/15 text-zen-text font-medium"
                        : "border-zen-border bg-zen-elevated text-zen-muted hover:text-zen-text"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0 text-zen-accent" />
                    <span className="text-xs truncate">{prov.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Configuration spécifique selon fournisseur */}
          {current.providerType === "ollama" ? (
            <div className="space-y-3 bg-zen-elevated p-4 rounded-xl border border-zen-border">
              <div>
                <label className="block text-xs text-zen-muted mb-1">
                  URL du serveur Ollama
                </label>
                <input
                  type="text"
                  value={current.baseUrl || "http://127.0.0.1:11434"}
                  onChange={(e) =>
                    setCurrent({ ...current, baseUrl: e.target.value })
                  }
                  className="w-full px-3 py-1.5 bg-zen-bg border border-zen-border rounded-lg text-xs text-zen-text focus:outline-none focus:border-zen-accent"
                />
              </div>
              <div>
                <label className="block text-xs text-zen-muted mb-1">
                  Modèle Local
                </label>
                <input
                  type="text"
                  value={current.model || "llama3.2"}
                  onChange={(e) =>
                    setCurrent({ ...current, model: e.target.value })
                  }
                  placeholder="llama3.2, mistral, gemma2..."
                  className="w-full px-3 py-1.5 bg-zen-bg border border-zen-border rounded-lg text-xs text-zen-text focus:outline-none focus:border-zen-accent"
                />
              </div>
              <p className="text-[11px] text-zen-subtle">
                🛡️ Aucun email ne quitte votre machine. Le tri est exécuté en local.
              </p>
            </div>
          ) : (
            <div className="space-y-3 bg-zen-elevated p-4 rounded-xl border border-zen-border">
              <div>
                <label className="block text-xs text-zen-muted mb-1">Clé API (BYOK)</label>
                <input
                  type="password"
                  value={current.apiKey}
                  onChange={(e) =>
                    setCurrent({ ...current, apiKey: e.target.value })
                  }
                  placeholder="sk-..."
                  className="w-full px-3 py-1.5 bg-zen-bg border border-zen-border rounded-lg text-xs text-zen-text focus:outline-none focus:border-zen-accent font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-zen-muted mb-1">Modèle</label>
                <input
                  type="text"
                  value={current.model}
                  onChange={(e) =>
                    setCurrent({ ...current, model: e.target.value })
                  }
                  placeholder="claude-3-5-sonnet, gemini-1.5-flash, etc."
                  className="w-full px-3 py-1.5 bg-zen-bg border border-zen-border rounded-lg text-xs text-zen-text focus:outline-none focus:border-zen-accent"
                />
              </div>
              {current.providerType === "openai_compatible" && (
                <div>
                  <label className="block text-xs text-zen-muted mb-1">
                    Base URL API
                  </label>
                  <input
                    type="text"
                    value={current.baseUrl}
                    onChange={(e) =>
                      setCurrent({ ...current, baseUrl: e.target.value })
                    }
                    placeholder="https://api.groq.com/openai/v1"
                    className="w-full px-3 py-1.5 bg-zen-bg border border-zen-border rounded-lg text-xs text-zen-text focus:outline-none focus:border-zen-accent"
                  />
                </div>
              )}
            </div>
          )}

          {/* Triage en fond automatique */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-zen-elevated border border-zen-border">
            <div>
              <div className="font-medium text-xs text-zen-text">
                Triage automatique en tâche de fond
              </div>
              <div className="text-[11px] text-zen-subtle">
                Analyser et attribuer le score d'urgence dès réception d'un mail
              </div>
            </div>
            <input
              type="checkbox"
              checked={current.autoTriage}
              onChange={(e) =>
                setCurrent({ ...current, autoTriage: e.target.checked })
              }
              className="accent-zen-accent w-4 h-4 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-zen-border flex items-center justify-end gap-2 bg-zen-surface">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs text-zen-muted hover:text-zen-text transition"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-zen-accent hover:bg-zen-accentHover text-white transition"
          >
            {savedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Enregistré !</span>
              </>
            ) : (
              <span>Sauvegarder</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
