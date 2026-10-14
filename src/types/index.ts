export type PriorityScore = 1 | 2 | 3 | 4 | 5;

export type EmailCategory =
  | "urgent"
  | "action_required"
  | "newsletter"
  | "receipt"
  | "low_priority";

export interface AITriage {
  category: EmailCategory;
  priorityScore: PriorityScore;
  summary: string;
  reasoning: string;
  suggestedQuickReplies: string[];
}

export interface Email {
  id: string;
  accountId: string;
  folder: string;
  fromName: string;
  fromAddress: string;
  subject: string;
  date: string;
  snippet: string;
  bodyPlain: string;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  triage?: AITriage;
}

export interface Workspace {
  id: string;
  name: string;
  icon: string;
  color: string;
  unreadCount: number;
}

export type AIProviderType = "ollama" | "claude" | "gemini" | "openai_compatible";

export interface AISettings {
  providerType: AIProviderType;
  baseUrl: string;
  apiKey: string;
  model: string;
  autoTriage: boolean;
}
