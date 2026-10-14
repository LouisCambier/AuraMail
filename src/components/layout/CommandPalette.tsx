import React, { useState, useEffect, useRef } from "react";
import { Email, Workspace } from "../../types";
import {
  Search,
  Sparkles,
  Inbox,
  Send,
  FileText,
  Archive,
  Trash2,
  Sliders,
  Brain,
  PanelLeft,
  Mail,
  CornerDownLeft,
} from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  emails: Email[];
  workspaces: Workspace[];
  activeWorkspaceId: string;
  onSelectWorkspace: (id: string) => void;
  onSelectFolder: (folder: string) => void;
  onSelectEmail: (id: string) => void;
  onTriageAll: () => void;
  onOpenSettings: (tab?: "byok" | "learning") => void;
  onToggleSidebar: () => void;
}

interface CommandAction {
  id: string;
  title: string;
  subtitle?: string;
  category: "Actions IA" | "Espaces de travail" | "Dossiers" | "Emails" | "Navigation";
  icon: React.ReactNode;
  perform: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  emails,
  workspaces,
  activeWorkspaceId,
  onSelectWorkspace,
  onSelectFolder,
  onSelectEmail,
  onTriageAll,
  onOpenSettings,
  onToggleSidebar,
}) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input automatically on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Build command list based on state and query
  const allActions: CommandAction[] = [
    // 1. Actions IA
    {
      id: "ai-triage",
      title: "Trier tous les emails avec l'IA",
      subtitle: "Attribuer catégories, urgence 1-5 et TL;DR en arrière-plan",
      category: "Actions IA",
      icon: <Sparkles className="w-4 h-4 text-zen-accent" />,
      perform: () => {
        onTriageAll();
        onClose();
      },
    },
    {
      id: "ai-learning",
      title: "Inspecter la mémoire et les règles apprises",
      subtitle: "Consulter les corrections et l'apprentissage in-context de l'IA",
      category: "Actions IA",
      icon: <Brain className="w-4 h-4 text-zen-accent" />,
      perform: () => {
        onOpenSettings("learning");
        onClose();
      },
    },
    {
      id: "ai-settings",
      title: "Configurer l'IA (BYOK & Modèles)",
      subtitle: "Ollama local, Claude, Gemini ou OpenAI-Compatible",
      category: "Actions IA",
      icon: <Sliders className="w-4 h-4 text-zen-accent" />,
      perform: () => {
        onOpenSettings("byok");
        onClose();
      },
    },

    // 2. Navigation
    {
      id: "toggle-sidebar",
      title: "Basculer la barre latérale Zen",
      subtitle: "Mode compact ou étendu",
      category: "Navigation",
      icon: <PanelLeft className="w-4 h-4 text-zen-muted" />,
      perform: () => {
        onToggleSidebar();
        onClose();
      },
    },

    // 3. Espaces de travail
    ...workspaces.map((ws) => ({
      id: `ws-${ws.id}`,
      title: `Espace : ${ws.name}`,
      subtitle: ws.id === activeWorkspaceId ? "Espace actif" : "Basculer vers cet espace",
      category: "Espaces de travail" as const,
      icon: (
        <span
          className="w-3.5 h-3.5 rounded-full inline-block shrink-0"
          style={{ backgroundColor: ws.color }}
        />
      ),
      perform: () => {
        onSelectWorkspace(ws.id);
        onClose();
      },
    })),

    // 4. Dossiers
    {
      id: "folder-inbox",
      title: "Aller à la Boîte de réception",
      category: "Dossiers",
      icon: <Inbox className="w-4 h-4 text-zen-muted" />,
      perform: () => {
        onSelectFolder("inbox");
        onClose();
      },
    },
    {
      id: "folder-sent",
      title: "Aller aux Messages envoyés",
      category: "Dossiers",
      icon: <Send className="w-4 h-4 text-zen-muted" />,
      perform: () => {
        onSelectFolder("sent");
        onClose();
      },
    },
    {
      id: "folder-drafts",
      title: "Aller aux Brouillons",
      category: "Dossiers",
      icon: <FileText className="w-4 h-4 text-zen-muted" />,
      perform: () => {
        onSelectFolder("drafts");
        onClose();
      },
    },
    {
      id: "folder-archive",
      title: "Aller aux Archives",
      category: "Dossiers",
      icon: <Archive className="w-4 h-4 text-zen-muted" />,
      perform: () => {
        onSelectFolder("archive");
        onClose();
      },
    },
    {
      id: "folder-trash",
      title: "Aller à la Corbeille",
      category: "Dossiers",
      icon: <Trash2 className="w-4 h-4 text-zen-muted" />,
      perform: () => {
        onSelectFolder("trash");
        onClose();
      },
    },

    // 5. Emails directs
    ...emails.map((mail) => ({
      id: `mail-${mail.id}`,
      title: mail.subject,
      subtitle: `${mail.fromName} • ${mail.triage ? `[${mail.triage.category}] ` + mail.triage.summary : mail.snippet}`,
      category: "Emails" as const,
      icon: <Mail className="w-4 h-4 text-zen-accent" />,
      perform: () => {
        onSelectEmail(mail.id);
        onClose();
      },
    })),
  ];

  const filteredActions = allActions.filter((action) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      action.title.toLowerCase().includes(q) ||
      (action.subtitle && action.subtitle.toLowerCase().includes(q)) ||
      action.category.toLowerCase().includes(q)
    );
  });

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredActions.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev <= 0 ? filteredActions.length - 1 : prev - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredActions[selectedIndex]) {
        filteredActions[selectedIndex].perform();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  // Keep selected item visible during scroll
  useEffect(() => {
    if (listRef.current) {
      const activeElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-zen-surface border border-zen-border rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
      >
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-zen-border gap-3 bg-zen-surface">
          <Search className="w-5 h-5 text-zen-subtle shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher une action, un email, un espace (ou taper pour filtrer)..."
            className="w-full bg-transparent text-sm text-zen-text placeholder-zen-subtle focus:outline-none"
          />
          <kbd className="px-2 py-0.5 rounded bg-zen-elevated border border-zen-border text-[10px] text-zen-muted font-mono">
            ESC
          </kbd>
        </div>

        {/* Action List */}
        <div
          ref={listRef}
          className="max-h-[380px] overflow-y-auto p-2 space-y-1 divide-y divide-zen-border/20"
        >
          {filteredActions.length === 0 ? (
            <div className="py-8 text-center text-xs text-zen-subtle">
              Aucun résultat pour "{query}".
            </div>
          ) : (
            filteredActions.map((action, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={action.id}
                  onClick={action.perform}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition text-xs ${
                    isSelected
                      ? "bg-zen-elevated text-zen-text font-medium"
                      : "text-zen-muted hover:text-zen-text hover:bg-zen-hover"
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className="shrink-0">{action.icon}</div>
                    <div className="truncate">
                      <div className="text-zen-text font-medium truncate">
                        {action.title}
                      </div>
                      {action.subtitle && (
                        <div className="text-[11px] text-zen-subtle truncate">
                          {action.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-zen-surface border border-zen-border text-zen-subtle">
                      {action.category}
                    </span>
                    {isSelected && (
                      <CornerDownLeft className="w-3.5 h-3.5 text-zen-accent shrink-0" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-zen-elevated/40 border-t border-zen-border flex items-center justify-between text-[11px] text-zen-subtle">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-zen-surface border border-zen-border text-[10px] font-mono mr-1">
                ↑↓
              </kbd>
              Naviguer
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-zen-surface border border-zen-border text-[10px] font-mono mr-1">
                ↵
              </kbd>
              Sélectionner
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-zen-accent font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AuraMail Command Bar</span>
          </div>
        </div>
      </div>
    </div>
  );
};
