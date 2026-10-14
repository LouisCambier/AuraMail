import React from "react";
import { Workspace } from "../../types";
import { Briefcase, FolderHeart, Laptop, Plus } from "lucide-react";

interface WorkspaceSwitcherProps {
  workspaces: Workspace[];
  activeId: string;
  onSelect: (id: string) => void;
  isCollapsed: boolean;
}

export const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = ({
  workspaces,
  activeId,
  onSelect,
  isCollapsed,
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "work":
        return <Briefcase className="w-4 h-4 shrink-0" />;
      case "tech":
        return <Laptop className="w-4 h-4 shrink-0" />;
      default:
        return <FolderHeart className="w-4 h-4 shrink-0" />;
    }
  };

  return (
    <div className="flex flex-col gap-1 p-2 border-b border-zen-border">
      {!isCollapsed && (
        <div className="flex items-center justify-between px-2 mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zen-subtle">
            Workspaces
          </span>
          <button
            title="Ajouter un workspace"
            className="text-zen-muted hover:text-zen-text p-0.5 rounded hover:bg-zen-hover transition"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex flex-col gap-0.5">
        {workspaces.map((ws) => {
          const isActive = ws.id === activeId;
          return (
            <button
              key={ws.id}
              onClick={() => onSelect(ws.id)}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-zen-accent text-white shadow-sm"
                  : "text-zen-muted hover:text-zen-text hover:bg-zen-hover"
              } ${isCollapsed ? "justify-center px-0 py-2" : ""}`}
              title={ws.name}
            >
              <div className="relative flex items-center justify-center">
                {getIcon(ws.icon)}
                <div
                  className="w-1.5 h-1.5 rounded-full absolute -top-0.5 -right-0.5 ring-1 ring-zen-surface"
                  style={{ backgroundColor: ws.color }}
                />
              </div>
              {!isCollapsed && (
                <>
                  <span className="truncate flex-1 text-left">{ws.name}</span>
                  {ws.unreadCount > 0 && (
                    <span
                      className={`text-xs px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-zen-elevated text-zen-muted"
                      }`}
                    >
                      {ws.unreadCount}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
