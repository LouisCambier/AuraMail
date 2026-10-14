import React from "react";
import {
  Inbox,
  Star,
  Send,
  Archive,
  Trash2,
  PanelLeftClose,
  PanelLeft,
  Settings,
  Sparkles,
  Bot,
} from "lucide-react";
import { Workspace } from "../../types";
import { WorkspaceSwitcher } from "../workspace/WorkspaceSwitcher";

interface ZenSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activeFolder: string;
  onSelectFolder: (folder: string) => void;
  workspaces: Workspace[];
  activeWorkspaceId: string;
  onSelectWorkspace: (id: string) => void;
  onOpenSettings: () => void;
}

export const ZenSidebar: React.FC<ZenSidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  activeFolder,
  onSelectFolder,
  workspaces,
  activeWorkspaceId,
  onSelectWorkspace,
  onOpenSettings,
}) => {
  const folders = [
    { id: "inbox", label: "Boîte de réception", icon: Inbox, count: 12 },
    { id: "starred", label: "Épinglés", icon: Star, count: 3 },
    { id: "sent", label: "Envoyés", icon: Send },
    { id: "archive", label: "Archives", icon: Archive },
    { id: "trash", label: "Corbeille", icon: Trash2 },
  ];

  const aiSmartViews = [
    { id: "ai_urgent", label: "Prioritaires IA", icon: Sparkles, color: "text-amber-400" },
    { id: "ai_action", label: "Actions requises", icon: Bot, color: "text-indigo-400" },
  ];

  return (
    <aside
      className={`h-screen flex flex-col bg-zen-surface border-r border-zen-border select-none transition-all duration-200 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Header avec Logo & Toggle Zen */}
      <div className="flex items-center justify-between px-3 h-14 border-b border-zen-border">
        {!isCollapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white text-sm shadow-md">
              A
            </div>
            <span className="font-semibold tracking-tight text-zen-text text-base">
              AuraMail
            </span>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          title={isCollapsed ? "Développer la barre latérale" : "Réduire la barre"}
          className={`p-1.5 rounded-lg text-zen-muted hover:text-zen-text hover:bg-zen-hover transition ${
            isCollapsed ? "mx-auto" : ""
          }`}
        >
          {isCollapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
        </button>
      </div>

      {/* Switcher de Workspaces */}
      <WorkspaceSwitcher
        workspaces={workspaces}
        activeId={activeWorkspaceId}
        onSelect={onSelectWorkspace}
        isCollapsed={isCollapsed}
      />

      {/* Navigation Principale */}
      <div className="flex-1 overflow-y-auto px-2 py-3 flex flex-col gap-1">
        {folders.map((folder) => {
          const Icon = folder.icon;
          const isActive = activeFolder === folder.id;
          return (
            <button
              key={folder.id}
              onClick={() => onSelectFolder(folder.id)}
              className={`flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition ${
                isActive
                  ? "bg-zen-elevated text-zen-text border border-zen-border"
                  : "text-zen-muted hover:text-zen-text hover:bg-zen-hover/60"
              } ${isCollapsed ? "justify-center px-0" : ""}`}
              title={folder.label}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!isCollapsed && (
                <>
                  <span className="truncate flex-1 text-left">{folder.label}</span>
                  {folder.count && (
                    <span className="text-xs text-zen-subtle">{folder.count}</span>
                  )}
                </>
              )}
            </button>
          );
        })}

        {/* Vues Intelligentes IA */}
        <div className="my-2 border-t border-zen-border/60 pt-2">
          {!isCollapsed && (
            <span className="px-2.5 text-[11px] font-semibold uppercase tracking-wider text-zen-subtle block mb-1">
              Filtres IA
            </span>
          )}
          {aiSmartViews.map((view) => {
            const Icon = view.icon;
            const isActive = activeFolder === view.id;
            return (
              <button
                key={view.id}
                onClick={() => onSelectFolder(view.id)}
                className={`flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? "bg-zen-elevated text-zen-text border border-zen-border"
                    : "text-zen-muted hover:text-zen-text hover:bg-zen-hover/60"
                } ${isCollapsed ? "justify-center px-0" : ""}`}
                title={view.label}
              >
                <Icon className={`w-4 h-4 shrink-0 ${view.color}`} />
                {!isCollapsed && (
                  <span className="truncate flex-1 text-left">{view.label}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer avec Paramètres */}
      <div className="p-2 border-t border-zen-border flex items-center justify-between">
        <button
          onClick={onOpenSettings}
          title="Paramètres IA & Comptes"
          className={`flex items-center gap-2.5 w-full p-2 rounded-lg text-sm text-zen-muted hover:text-zen-text hover:bg-zen-hover transition ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          <Settings className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Paramètres</span>}
        </button>
      </div>
    </aside>
  );
};
