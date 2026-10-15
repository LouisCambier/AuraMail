import React, { useState } from "react";
import { AISettings, AIProviderType, LearnedRule } from "../../types";
import { X, Sparkles, Key, Server, Cpu, Check, Brain, RotateCcw, Palette } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AISettings;
  onSave: (newSettings: AISettings) => void;
  learnedRules?: LearnedRule[];
  onResetLearning?: () => void;
  initialTab?: "byok" | "learning" | "theme";
}

const DEFAULT_CSS = `/* AuraMail — Thème Personnalisé */
:root {
  --zen-bg: #000000;
  --zen-surface: #0a0a0a;
  --zen-elevated: #141414;
  --zen-border: #262626;
  --zen-hover: #1f1f1f;
  --zen-accent: #ffffff;
  --zen-accent-hover: #e5e5e5;
  --zen-text: #ffffff;
  --zen-muted: #a3a3a3;
  --zen-subtle: #737373;
  --zen-radius: 12px;
}`;

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  learnedRules = [],
  onResetLearning,
  initialTab = "byok",
}) => {
  const [activeTab, setActiveTab] = useState<"byok" | "learning" | "theme">(initialTab);
  const [current, setCurrent] = useState<AISettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [customCss, setCustomCss] = useState(() => {
    return localStorage.getItem("auramail_custom_css") || DEFAULT_CSS;
  });

  // Mettre à jour l'onglet actif lors de l'ouverture
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(current);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const handleApplyCustomCss = (newCss: string) => {
    setCustomCss(newCss);
    localStorage.setItem("auramail_custom_css", newCss);
    let styleTag = document.getElementById("auramail-custom-theme");
    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = "auramail-custom-theme";
      document.head.appendChild(styleTag);
    }
    styleTag.textContent = newCss;
  };

  const handleResetCss = () => {
    handleApplyCustomCss(DEFAULT_CSS);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-zen-surface border border-zen-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header Modal & Tabs */}
        <div className="flex items-center justify-between px-6 pt-4 pb-2 border-b border-zen-border">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-zen-accent" />
            <h2 className="font-semibold text-zen-text text-base">
              Paramètres AuraMail
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zen-muted hover:text-zen-text hover:bg-zen-hover transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-zen-border px-6 pt-2 gap-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab("byok")}
            className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition ${
              activeTab === "byok"
                ? "border-zen-accent text-zen-text"
                : "border-transparent text-zen-muted hover:text-zen-text"
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Fournisseurs (BYOK)</span>
          </button>
          <button
            onClick={() => setActiveTab("learning")}
            className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition ${
              activeTab === "learning"
                ? "border-zen-accent text-zen-text"
                : "border-transparent text-zen-muted hover:text-zen-text"
            }`}
          >
            <Brain className="w-3.5 h-3.5 text-zen-accent" />
            <span>Mémoire ({learnedRules.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("theme")}
            className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition ${
              activeTab === "theme"
                ? "border-zen-accent text-zen-text"
                : "border-transparent text-zen-muted hover:text-zen-text"
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-zen-accent" />
            <span>Thème & CSS</span>
          </button>
        </div>

        {/* Corps des Paramètres */}
        <div className="p-6 space-y-5 text-sm max-h-[480px] overflow-y-auto">
          {activeTab === "byok" ? (
            <>
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
                            ? "border-zen-accent bg-zen-elevated text-zen-text font-medium"
                            : "border-zen-border bg-zen-surface text-zen-muted hover:text-zen-text"
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
            </>
          ) : activeTab === "learning" ? (
            /* Onglet Apprentissage & Mémoire */
            <div className="space-y-4">
              <div className="p-3.5 bg-zen-elevated rounded-xl border border-zen-border text-xs leading-relaxed text-zen-muted">
                <span className="font-semibold text-zen-text block mb-1">
                  🧠 Comment l'IA apprend-elle ?
                </span>
                À chaque fois que vous modifiez la note ou la catégorie d'un email via le bouton <em>« Corriger / Entraîner l'IA »</em>, AuraMail enregistre votre correction. Lors des prochains tris, ces exemples sont injectés en temps réel dans le contexte de votre modèle pour qu'il ne reproduise plus jamais la même erreur.
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase text-zen-subtle">
                    Règles Actives Apprises ({learnedRules.length})
                  </span>
                  {learnedRules.length > 0 && onResetLearning && (
                    <button
                      onClick={onResetLearning}
                      className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 transition"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Réinitialiser la mémoire</span>
                    </button>
                  )}
                </div>

                {learnedRules.length === 0 ? (
                  <div className="p-6 text-center text-xs text-zen-subtle border border-dashed border-zen-border rounded-xl">
                    Aucune règle apprise pour l'instant. Corrigez un email pour voir l'IA apprendre vos préférences !
                  </div>
                ) : (
                  <div className="space-y-2">
                    {learnedRules.map((rule) => (
                      <div
                        key={rule.id}
                        className="p-3 bg-zen-elevated border border-zen-border rounded-xl text-xs flex items-center justify-between"
                      >
                        <div>
                          <div className="font-medium text-zen-text">{rule.ruleText}</div>
                          <div className="text-[11px] text-zen-subtle">
                            {rule.sampleCount} exemple(s) enregistré(s)
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-zen-elevated border border-zen-border text-zen-text text-[10px] font-semibold">
                          {Math.round(rule.confidence * 100)}% confiance
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Onglet Thème & Personnalisation CSS */
            <div className="space-y-4">
              <div className="p-3.5 bg-zen-elevated rounded-xl border border-zen-border text-xs leading-relaxed text-zen-muted">
                <span className="font-semibold text-zen-text block mb-1">
                  🎨 Personnalisation Intégrale du CSS
                </span>
                AuraMail est conçu avec des variables CSS directes. Modifiez les couleurs, polices ou arrondis ci-dessous en temps réel.
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-zen-subtle">
                  Éditeur de Variables CSS
                </span>
                <button
                  onClick={handleResetCss}
                  className="flex items-center gap-1 text-[11px] text-zen-muted hover:text-zen-text transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Réinitialiser Noir & Blanc</span>
                </button>
              </div>

              <div className="border border-zen-border rounded-xl overflow-hidden bg-zen-bg">
                <textarea
                  value={customCss}
                  onChange={(e) => handleApplyCustomCss(e.target.value)}
                  rows={10}
                  className="w-full p-3 bg-transparent text-xs text-zen-text font-mono focus:outline-none resize-none leading-relaxed"
                  placeholder="/* Saisissez vos styles CSS ici */"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() =>
                    handleApplyCustomCss(`:root {
  --zen-bg: #000000;
  --zen-surface: #0a0a0a;
  --zen-elevated: #141414;
  --zen-border: #262626;
  --zen-hover: #1f1f1f;
  --zen-accent: #ffffff;
  --zen-accent-hover: #e5e5e5;
  --zen-text: #ffffff;
  --zen-muted: #a3a3a3;
  --zen-subtle: #737373;
  --zen-radius: 12px;
}`)
                  }
                  className="p-2.5 rounded-lg border border-zen-border bg-zen-elevated text-left hover:border-zen-accent transition"
                >
                  <div className="font-semibold text-zen-text">⚫ Pure Black & White</div>
                  <div className="text-[10px] text-zen-subtle">Contraste absolu OLED</div>
                </button>

                <button
                  onClick={() =>
                    handleApplyCustomCss(`:root {
  --zen-bg: #0f1115;
  --zen-surface: #181b20;
  --zen-elevated: #21252d;
  --zen-border: #2e3440;
  --zen-hover: #3b4252;
  --zen-accent: #88c0d0;
  --zen-accent-hover: #81a1c1;
  --zen-text: #eceff4;
  --zen-muted: #d8dee9;
  --zen-subtle: #4c566a;
  --zen-radius: 12px;
}`)
                  }
                  className="p-2.5 rounded-lg border border-zen-border bg-zen-elevated text-left hover:border-zen-accent transition"
                >
                  <div className="font-semibold text-zen-text">❄️ Nord Frost Minimal</div>
                  <div className="text-[10px] text-zen-subtle">Gris ardoise & cyan</div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-zen-border flex items-center justify-end gap-2 bg-zen-surface">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs text-zen-muted hover:text-zen-text transition"
          >
            Fermer
          </button>
          {activeTab === "byok" && (
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-zen-accent hover:bg-zen-accentHover text-black font-semibold transition"
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
          )}
        </div>
      </div>
    </div>
  );
};
