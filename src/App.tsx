import React, { useState } from "react";
import { ZenSidebar } from "./components/layout/ZenSidebar";
import { MailList } from "./components/mail/MailList";
import { MailReader } from "./components/mail/MailReader";
import { SettingsModal } from "./components/ai/SettingsModal";
import { Email, Workspace, AISettings } from "./types";

const INITIAL_WORKSPACES: Workspace[] = [
  { id: "personal", name: "Personnel", icon: "user", color: "#6366f1", unreadCount: 3 },
  { id: "work", name: "Travail & Clients", icon: "work", color: "#10b981", unreadCount: 5 },
  { id: "opensource", name: "Open Source", icon: "tech", color: "#f59e0b", unreadCount: 1 },
];

const INITIAL_EMAILS: Email[] = [
  {
    id: "mail-1",
    accountId: "acc-1",
    folder: "inbox",
    fromName: "Alexandre Martin",
    fromAddress: "alexandre.martin@client-corp.fr",
    subject: "🚨 Urgent : Validation du contrat de prestation avant 17h",
    date: "14:25",
    snippet: "Bonjour, nous devons impérativement valider les clauses de confidentialité...",
    bodyPlain: `Bonjour,\n\nNous devons impérativement valider les clauses de confidentialité de l'annexe B du contrat avant 17h aujourd'hui pour débloquer le versement de l'acompte.\n\nPeux-tu me confirmer ton accord ou me renvoyer le document signé ?\n\nMerci,\nAlexandre Martin\nDirecteur des Opérations`,
    isRead: false,
    isStarred: true,
    hasAttachments: true,
    triage: {
      category: "urgent",
      priorityScore: 5,
      summary: "Validation urgente du contrat et signature demandées avant 17h.",
      reasoning: "Échéance courte (aujourd'hui 17h) conditionnant le versement financier.",
      suggestedQuickReplies: [
        "J'examine l'annexe B et je te renvoie le contrat signé sous 1 heure.",
        "Bien reçu Alexandre, tout est conforme, je signe et te renvoie l'annexe.",
        "J'ai une réserve sur la clause 4, pouvons-nous faire un point téléphonique rapide ?"
      ],
    },
  },
  {
    id: "mail-2",
    accountId: "acc-1",
    folder: "inbox",
    fromName: "GitHub Notifications",
    fromAddress: "notifications@github.com",
    subject: "[AuraMail] Pull Request #12 : Add OAuth2 PKCE callback for Google",
    date: "11:10",
    snippet: "contributor-42 opened a pull request: Add OAuth2 PKCE callback...",
    bodyPlain: `contributor-42 wants to merge 3 commits into main from feature/oauth2-pkce.\n\nReviewers requested: @louwi.\n\nThis PR implements a local lightweight HTTP server on 127.0.0.1 to intercept OAuth2 code redirects cleanly without needing external hosted auth proxies.`,
    isRead: true,
    isStarred: false,
    hasAttachments: false,
    triage: {
      category: "action_required",
      priorityScore: 3,
      summary: "Nouvelle PR #12 sur AuraMail à relire (OAuth2 PKCE local).",
      reasoning: "Demande de revue de code directe sur votre dépôt open-source.",
      suggestedQuickReplies: [
        "Thanks for the PR! Reviewing your changes right now.",
        "Looks very clean, merging after the CI passes."
      ],
    },
  },
  {
    id: "mail-3",
    accountId: "acc-1",
    folder: "inbox",
    fromName: "Stripe Invoicing",
    fromAddress: "invoice+statements@stripe.com",
    subject: "Reçu de paiement pour votre abonnement serveur cloud (78,40 €)",
    date: "Hier",
    snippet: "Votre paiement a été traité avec succès. Téléchargez votre reçu fiscal...",
    bodyPlain: `Bonjour,\n\nVotre carte bancaire a été débitée de 78,40 € pour votre instance serveur haute performance.\n\nNuméro de facture : INV-2026-90412\nStatut : Payé`,
    isRead: true,
    isStarred: false,
    hasAttachments: true,
    triage: {
      category: "receipt",
      priorityScore: 1,
      summary: "Reçu de prélèvement serveur cloud de 78,40 € acquitté.",
      reasoning: "Transaction comptable standard ne nécessitant aucune intervention.",
      suggestedQuickReplies: [
        "Transférer au comptable",
        "Télécharger le PDF"
      ],
    },
  },
  {
    id: "mail-4",
    accountId: "acc-1",
    folder: "inbox",
    fromName: "TLDR Tech",
    fromAddress: "dan@tldrnewsletter.com",
    subject: "TLDR Tech : Les nouveautés Rust 2026 et l'IA en local",
    date: "Hier",
    snippet: "L'actualité tech en 5 minutes : Rust passe une étape majeure...",
    bodyPlain: `Au sommaire aujourd'hui :\n1. Rust et la gestion de mémoire asynchrone simplifiée\n2. Pourquoi les clients lourds locaux détrônent le tout-SaaS\n3. Les nouveaux modèles d'embedding ultralégers de 30 Mo`,
    isRead: true,
    isStarred: false,
    hasAttachments: false,
    triage: {
      category: "newsletter",
      priorityScore: 2,
      summary: "Newsletter tech : actualités Rust 2026 et essor de l'IA locale.",
      reasoning: "Contenu informatif périodique sans urgence.",
      suggestedQuickReplies: [
        "Marquer comme lu",
        "Archiver dans Veille"
      ],
    },
  },
];

export const App: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [workspaces] = useState<Workspace[]>(INITIAL_WORKSPACES);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState("personal");
  const [activeFolder, setActiveFolder] = useState("inbox");
  const [emails, setEmails] = useState<Email[]>(INITIAL_EMAILS);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>("mail-1");
  const [isTriaging, setIsTriaging] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [aiSettings, setAiSettings] = useState<AISettings>({
    providerType: "ollama",
    baseUrl: "http://127.0.0.1:11434",
    apiKey: "",
    model: "llama3.2",
    autoTriage: true,
  });

  const selectedEmail = emails.find((e) => e.id === selectedEmailId) || null;

  const handleTriageAll = async () => {
    setIsTriaging(true);
    setTimeout(() => {
      setEmails((prev) =>
        prev.map((m) =>
          m.triage
            ? m
            : {
                ...m,
                triage: {
                  category: "low_priority",
                  priorityScore: 2,
                  summary: "Email trié et classé automatiquement.",
                  reasoning: "Classification par défaut.",
                  suggestedQuickReplies: ["Merci, bien reçu."],
                },
              }
        )
      );
      setIsTriaging(false);
    }, 1200);
  };

  const handleGenerateReply = async (email: Email, intent: string): Promise<string> => {
    // Si exécuté dans Tauri
    if (window.__TAURI_INTERNALS__) {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const reply = await invoke<string>("generate_reply_direct", {
          email: {
            id: email.id,
            from: email.fromAddress,
            subject: email.subject,
            body_plain: email.bodyPlain,
            date: email.date,
          },
          intent,
          config: {
            provider_type: aiSettings.providerType,
            base_url: aiSettings.baseUrl,
            api_key: aiSettings.apiKey,
            model: aiSettings.model,
          },
        });
        return reply;
      } catch (e) {
        console.warn("Échec Tauri IPC direct, fallback simulation :", e);
      }
    }

    // Réponse immédiate de fallback pour tester sans backend compilé
    return `Bonjour Alexandre,\n\nJ'ai bien pris connaissance de votre message concernant l'annexe B du contrat.\n\n${intent}\n\nBien cordialement,\nLouwi`;
  };

  return (
    <div className="flex w-screen h-screen bg-zen-bg text-zen-text overflow-hidden">
      {/* 1. Barre latérale rétractable façon Zen Browser */}
      <ZenSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        activeFolder={activeFolder}
        onSelectFolder={setActiveFolder}
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        onSelectWorkspace={setActiveWorkspaceId}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* 2. Liste des emails avec badges IA et filtres */}
      <MailList
        emails={emails}
        selectedEmailId={selectedEmailId}
        onSelectEmail={setSelectedEmailId}
        onTriageAll={handleTriageAll}
        isTriaging={isTriaging}
      />

      {/* 3. Lecteur Zen & Éditeur de réponse avec suggestions IA */}
      <MailReader
        email={selectedEmail}
        onGenerateAIReply={handleGenerateReply}
      />

      {/* 4. Modale de configuration BYOK IA */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={aiSettings}
        onSave={setAiSettings}
      />
    </div>
  );
};
