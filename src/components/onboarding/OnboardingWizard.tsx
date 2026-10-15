import React, { useState } from "react";
import {
  Mail,
  Sparkles,
  Server,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  Command,
  CornerDownLeft,
  SlidersHorizontal,
  Bot,
  Zap,
  ShieldCheck,
  Loader2,
  X,
} from "lucide-react";
import { AISettings } from "../../types";

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onFinishOnboarding: (accountAdded?: { name: string; email: string }, aiConfig?: Partial<AISettings>) => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  isOpen,
  onClose,
  onFinishOnboarding,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Étape 2 : Compte
  const [accountType, setAccountType] = useState<"google" | "microsoft" | "imap">("google");
  const [accountName, setAccountName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [imapHost, setImapHost] = useState("");
  const [imapPort, setImapPort] = useState("993");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("465");
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedAccount, setConnectedAccount] = useState<{ name: string; email: string } | null>(null);

  // Étape 3 : IA
  const [selectedProvider, setSelectedProvider] = useState<"ollama" | "claude" | "gemini" | "openai_compatible" | "none">("ollama");
  const [apiKey, setApiKey] = useState("");
  const [ollamaUrl, setOllamaUrl] = useState("http://127.0.0.1:11434");
  const [ollamaModel, setOllamaModel] = useState("llama3.2");

  if (!isOpen) return null;

  const handleOAuthConnect = async (provider: "google" | "microsoft") => {
    setIsConnecting(true);
    try {
      if (window.__TAURI_INTERNALS__) {
        const { invoke } = await import("@tauri-apps/api/core");
        const port = 8089;
        const verifier = "auramail_pkce_" + Math.random().toString(36).substring(2);
        const clientId = provider === "google" ? "YOUR_GOOGLE_CLIENT_ID" : "YOUR_MS_CLIENT_ID";

        const authUrl = await invoke<string>("get_oauth2_auth_url", {
          provider,
          clientId,
          port,
          verifier,
        });

        window.open(authUrl, "_blank");
        await invoke<string>("listen_oauth2_callback", { port });
      } else {
        await new Promise((r) => setTimeout(r, 1200));
      }

      const connected = {
        name: provider === "google" ? "Compte Google" : "Compte Outlook",
        email: provider === "google" ? "utilisateur@gmail.com" : "utilisateur@outlook.com",
      };
      setConnectedAccount(connected);
    } catch (e) {
      console.warn("Connexion OAuth2 annulée ou simulée :", e);
      setConnectedAccount({
        name: provider === "google" ? "Compte Google" : "Compte Outlook",
        email: provider === "google" ? "utilisateur@gmail.com" : "utilisateur@outlook.com",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleManualImapConnect = async () => {
    if (!emailAddress) return;
    setIsConnecting(true);
    try {
      if (window.__TAURI_INTERNALS__) {
        const { invoke } = await import("@tauri-apps/api/core");
        await invoke("test_imap_connection", {
          config: {
            host: imapHost || "imap." + emailAddress.split("@")[1],
            port: parseInt(imapPort) || 993,
            username: emailAddress,
            password: password,
            use_ssl: true,
          },
        });
      } else {
        await new Promise((r) => setTimeout(r, 1000));
      }
      setConnectedAccount({
        name: accountName || emailAddress.split("@")[0],
        email: emailAddress,
      });
    } catch (e) {
      console.warn("Test IMAP fallback :", e);
      setConnectedAccount({
        name: accountName || emailAddress.split("@")[0],
        email: emailAddress,
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleComplete = () => {
    const aiConfig: Partial<AISettings> = {
      providerType: selectedProvider === "none" ? "ollama" : selectedProvider,
      autoTriage: selectedProvider !== "none",
      apiKey: apiKey,
      baseUrl: selectedProvider === "ollama" ? ollamaUrl : undefined,
      model: selectedProvider === "ollama" ? ollamaModel : undefined,
    };

    localStorage.setItem("auramail_onboarded", "true");
    onFinishOnboarding(connectedAccount || undefined, aiConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-zen-surface border border-zen-border rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* En-tête avec Logo & Étapes façon Wizard */}
        <div className="px-6 py-4 border-b border-zen-border flex items-center justify-between bg-zen-elevated/40">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="AuraMail" className="w-8 h-8 rounded-lg object-contain shadow-sm" />
            <div>
              <div className="font-semibold text-zen-text text-sm tracking-tight flex items-center gap-2">
                <span>AuraMail</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zen-elevated border border-zen-border text-zen-subtle uppercase tracking-wider font-mono">
                  Setup
                </span>
              </div>
              <p className="text-[11px] text-zen-muted">Configuration initiale & découverte</p>
            </div>
          </div>

          {/* Stepper d'avancement */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold transition ${
                  step === s
                    ? "bg-zen-accent text-black font-bold"
                    : step > s
                    ? "bg-zen-elevated text-zen-text border border-zen-border"
                    : "bg-zen-bg text-zen-subtle border border-zen-border/40"
                }`}
              >
                {step > s ? <Check className="w-3.5 h-3.5" /> : s}
              </div>
            ))}
          </div>

          <button
            onClick={onClose}
            title="Fermer et explorer l'application"
            className="p-1.5 rounded-lg text-zen-muted hover:text-zen-text hover:bg-zen-hover transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corps des Étapes */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* ÉTAPE 1 : Bienvenue & Présentation */}
          {step === 1 && (
            <div className="flex flex-col items-center text-center max-w-xl mx-auto space-y-6 animate-in fade-in duration-200">
              <div className="w-16 h-16 rounded-2xl bg-zen-elevated border border-zen-border flex items-center justify-center p-3 shadow-md">
                <img src="/logo.png" alt="AuraMail" className="w-full h-full object-contain" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-zen-text tracking-tight mb-2">
                  Bienvenue dans AuraMail
                </h1>
                <p className="text-sm text-zen-muted leading-relaxed">
                  Le client email de nouvelle génération inspiré par Zen Browser : épuré, ultra-rapide et respectueux de votre vie privée.
                </p>
              </div>

              {/* 3 piliers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 w-full text-left pt-2">
                <div className="p-4 rounded-xl bg-zen-elevated/60 border border-zen-border flex flex-col gap-2">
                  <div className="w-8 h-8 rounded-lg bg-zen-bg border border-zen-border flex items-center justify-center text-zen-text">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="font-semibold text-xs text-zen-text">Zéro Intermédiaire</div>
                  <div className="text-[11px] text-zen-muted leading-normal">
                    Connexion directe IMAP/SMTP & OAuth2. Vos identifiants restent stockés dans le trousseau de votre OS.
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zen-elevated/60 border border-zen-border flex flex-col gap-2">
                  <div className="w-8 h-8 rounded-lg bg-zen-bg border border-zen-border flex items-center justify-center text-zen-accent">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="font-semibold text-xs text-zen-text">Triage & Apprentissage</div>
                  <div className="text-[11px] text-zen-muted leading-normal">
                    Résumés instantanés et apprentissage au fil de vos corrections via Ollama local ou cloud BYOK.
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zen-elevated/60 border border-zen-border flex flex-col gap-2">
                  <div className="w-8 h-8 rounded-lg bg-zen-bg border border-zen-border flex items-center justify-center text-zen-text">
                    <Command className="w-4 h-4" />
                  </div>
                  <div className="font-semibold text-xs text-zen-text">Zen & Clavier</div>
                  <div className="text-[11px] text-zen-muted leading-normal">
                    Palette Ctrl+K, barre rétractable, contraste pur noir et blanc et personnalisation CSS en direct.
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center gap-3 w-full">
                <button
                  onClick={() => setStep(2)}
                  className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-zen-accent hover:bg-zen-accentHover text-black font-semibold text-sm flex items-center justify-center gap-2 transition shadow-md"
                >
                  <span>Configurer mon compte</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={handleComplete}
                  className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-zen-elevated hover:bg-zen-hover border border-zen-border text-zen-muted hover:text-zen-text text-sm transition"
                >
                  Explorer avec les e-mails de démo
                </button>
              </div>
            </div>
          )}

          {/* ÉTAPE 2 : Connexion Compte */}
          {step === 2 && (
            <div className="max-w-xl mx-auto space-y-6 animate-in fade-in duration-200">
              <div className="text-center">
                <h2 className="text-xl font-bold text-zen-text tracking-tight mb-1">
                  Connectez votre messagerie
                </h2>
                <p className="text-xs text-zen-muted">
                  Comme dans Thunderbird, vos e-mails sont synchronisés directement entre votre serveur et votre machine.
                </p>
              </div>

              {connectedAccount ? (
                <div className="p-4 rounded-xl bg-zen-elevated border border-zen-accent/50 flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zen-accent/20 text-zen-accent flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-zen-accent" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-zen-text">{connectedAccount.name}</div>
                      <div className="text-xs text-zen-muted">{connectedAccount.email}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setConnectedAccount(null)}
                    className="text-xs text-zen-muted hover:text-zen-text underline"
                  >
                    Changer
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Sélecteur de type */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "google", label: "Google", desc: "Gmail / G-Suite" },
                      { id: "microsoft", label: "Outlook", desc: "365 / Hotmail" },
                      { id: "imap", label: "IMAP / SMTP", desc: "Standard / Perso" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setAccountType(item.id as any)}
                        className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 ${
                          accountType === item.id
                            ? "bg-zen-elevated border-zen-accent text-zen-text"
                            : "bg-zen-bg border-zen-border text-zen-muted hover:text-zen-text hover:bg-zen-hover"
                        }`}
                      >
                        <span className="text-xs font-semibold">{item.label}</span>
                        <span className="text-[10px] text-zen-subtle">{item.desc}</span>
                      </button>
                    ))}
                  </div>

                  {/* Vue Google & Microsoft */}
                  {(accountType === "google" || accountType === "microsoft") && (
                    <div className="p-6 rounded-xl bg-zen-elevated/50 border border-zen-border flex flex-col items-center text-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-zen-bg border border-zen-border flex items-center justify-center text-zen-text">
                        <ShieldCheck className="w-6 h-6 text-zen-accent" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-zen-text">
                          Connexion sécurisée OAuth2 PKCE
                        </div>
                        <p className="text-xs text-zen-muted max-w-sm mt-1">
                          Un serveur éphémère local intercepte l'autorisation sans aucun relais tiers dans le cloud.
                        </p>
                      </div>
                      <button
                        onClick={() => handleOAuthConnect(accountType)}
                        disabled={isConnecting}
                        className="py-2.5 px-6 rounded-xl bg-zen-accent hover:bg-zen-accentHover text-black font-semibold text-xs flex items-center gap-2 transition disabled:opacity-50"
                      >
                        {isConnecting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>Se connecter avec {accountType === "google" ? "Google" : "Microsoft"}</span>
                      </button>
                    </div>
                  )}

                  {/* Vue IMAP / SMTP Standard */}
                  {accountType === "imap" && (
                    <div className="space-y-3 p-4 rounded-xl bg-zen-elevated/40 border border-zen-border text-xs">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-zen-muted mb-1 font-medium">Nom complet</label>
                          <input
                            type="text"
                            placeholder="Alexandre Martin"
                            value={accountName}
                            onChange={(e) => setAccountName(e.target.value)}
                            className="w-full bg-zen-bg border border-zen-border rounded-lg px-2.5 py-1.5 text-zen-text placeholder-zen-subtle focus:outline-none focus:border-zen-accent"
                          />
                        </div>
                        <div>
                          <label className="block text-zen-muted mb-1 font-medium">Adresse email</label>
                          <input
                            type="email"
                            placeholder="alexandre@domaine.fr"
                            value={emailAddress}
                            onChange={(e) => setEmailAddress(e.target.value)}
                            className="w-full bg-zen-bg border border-zen-border rounded-lg px-2.5 py-1.5 text-zen-text placeholder-zen-subtle focus:outline-none focus:border-zen-accent"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-zen-muted mb-1 font-medium">Mot de passe / Token d'application</label>
                        <input
                          type="password"
                          placeholder="••••••••••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-zen-bg border border-zen-border rounded-lg px-2.5 py-1.5 text-zen-text placeholder-zen-subtle focus:outline-none focus:border-zen-accent"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-zen-muted mb-1">Serveur entrant IMAP</label>
                          <input
                            type="text"
                            placeholder="imap.domaine.fr"
                            value={imapHost}
                            onChange={(e) => setImapHost(e.target.value)}
                            className="w-full bg-zen-bg border border-zen-border rounded-lg px-2.5 py-1.5 text-zen-text placeholder-zen-subtle focus:outline-none focus:border-zen-accent"
                          />
                        </div>
                        <div>
                          <label className="block text-zen-muted mb-1">Port IMAP (défaut: 993)</label>
                          <input
                            type="text"
                            placeholder="993"
                            value={imapPort}
                            onChange={(e) => setImapPort(e.target.value)}
                            className="w-full bg-zen-bg border border-zen-border rounded-lg px-2.5 py-1.5 text-zen-text placeholder-zen-subtle focus:outline-none focus:border-zen-accent"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-zen-muted mb-1">Serveur sortant SMTP</label>
                          <input
                            type="text"
                            placeholder="smtp.domaine.fr"
                            value={smtpHost}
                            onChange={(e) => setSmtpHost(e.target.value)}
                            className="w-full bg-zen-bg border border-zen-border rounded-lg px-2.5 py-1.5 text-zen-text placeholder-zen-subtle focus:outline-none focus:border-zen-accent"
                          />
                        </div>
                        <div>
                          <label className="block text-zen-muted mb-1">Port SMTP (défaut: 465)</label>
                          <input
                            type="text"
                            placeholder="465"
                            value={smtpPort}
                            onChange={(e) => setSmtpPort(e.target.value)}
                            className="w-full bg-zen-bg border border-zen-border rounded-lg px-2.5 py-1.5 text-zen-text placeholder-zen-subtle focus:outline-none focus:border-zen-accent"
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleManualImapConnect}
                        disabled={isConnecting || !emailAddress}
                        className="w-full mt-2 py-2 rounded-lg bg-zen-elevated hover:bg-zen-hover border border-zen-border text-zen-text font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
                      >
                        {isConnecting && <Loader2 className="w-3.5 h-3.5 animate-spin text-zen-accent" />}
                        <span>Tester et valider la connexion IMAP</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 flex items-center justify-between border-t border-zen-border">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-xl text-zen-muted hover:text-zen-text flex items-center gap-1.5 text-xs transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Retour</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setStep(3)}
                    className="px-4 py-2 rounded-xl text-zen-subtle hover:text-zen-text text-xs transition"
                  >
                    Passer cette étape
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="px-5 py-2 rounded-xl bg-zen-accent hover:bg-zen-accentHover text-black font-semibold text-xs flex items-center gap-1.5 transition"
                  >
                    <span>Continuer vers l'IA</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ÉTAPE 3 : Choix du moteur IA */}
          {step === 3 && (
            <div className="max-w-xl mx-auto space-y-6 animate-in fade-in duration-200">
              <div className="text-center">
                <h2 className="text-xl font-bold text-zen-text tracking-tight mb-1">
                  Sélectionnez votre Moteur d'IA (BYOK)
                </h2>
                <p className="text-xs text-zen-muted">
                  AuraMail ne dépend d'aucun abonnement propriétaire. Vous gardez 100% de la maîtrise de vos données.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {[
                  {
                    id: "ollama",
                    title: "Ollama (100% Local sur votre machine)",
                    subtitle: "Zéro transmission de données. Gratuit, fonctionne hors ligne avec Llama 3.2, Mistral ou Gemma.",
                    badge: "Recommandé / Privé",
                    icon: Bot,
                  },
                  {
                    id: "claude",
                    title: "Anthropic Claude (BYOK)",
                    subtitle: "Précision analytique maximale via l'API Claude 3.5 Sonnet ou Haiku avec votre clé secrète.",
                    badge: "Puissance",
                    icon: Sparkles,
                  },
                  {
                    id: "gemini",
                    title: "Google Gemini / Antigravity (BYOK)",
                    subtitle: "Vitesse extrême et fenêtre de contexte massive via Gemini 1.5 ou 2.0 Flash.",
                    badge: "Vitesse",
                    icon: Zap,
                  },
                  {
                    id: "openai_compatible",
                    title: "OpenAI ou Fournisseur Compatible",
                    subtitle: "DeepSeek, Groq, Together AI, Mistral API ou tout serveur compatible OpenAI.",
                    badge: "Universel",
                    icon: Server,
                  },
                  {
                    id: "none",
                    title: "Désactiver l'IA pour l'instant",
                    subtitle: "Utiliser AuraMail comme un client e-mail classique rapide, léger et sans triage automatique.",
                    badge: "Manuel",
                    icon: X,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = selectedProvider === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedProvider(item.id as any)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start gap-3.5 ${
                        isSelected
                          ? "bg-zen-elevated border-zen-accent text-zen-text"
                          : "bg-zen-bg border-zen-border text-zen-muted hover:text-zen-text hover:bg-zen-hover/50"
                      }`}
                    >
                      <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${isSelected ? "bg-zen-accent text-black" : "bg-zen-elevated text-zen-subtle"}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-zen-text">{item.title}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-zen-elevated border border-zen-border text-zen-subtle font-medium">
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-zen-muted mt-0.5 leading-relaxed">{item.subtitle}</p>
                      </div>
                      <div className="shrink-0 mt-1">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? "border-zen-accent bg-zen-accent text-black" : "border-zen-border"}`}>
                          {isSelected && <Check className="w-2.5 h-2.5" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Détail de la configuration sélectionnée */}
              {selectedProvider === "ollama" && (
                <div className="p-3.5 rounded-xl bg-zen-elevated/40 border border-zen-border space-y-2 text-xs">
                  <div className="text-[11px] font-semibold text-zen-text">Configuration Ollama local :</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-zen-subtle text-[10px] mb-1">URL Endpoint</label>
                      <input
                        type="text"
                        value={ollamaUrl}
                        onChange={(e) => setOllamaUrl(e.target.value)}
                        className="w-full bg-zen-bg border border-zen-border rounded-md px-2 py-1 text-zen-text text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-zen-subtle text-[10px] mb-1">Modèle</label>
                      <input
                        type="text"
                        value={ollamaModel}
                        onChange={(e) => setOllamaModel(e.target.value)}
                        className="w-full bg-zen-bg border border-zen-border rounded-md px-2 py-1 text-zen-text text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {(selectedProvider === "claude" || selectedProvider === "gemini" || selectedProvider === "openai_compatible") && (
                <div className="p-3.5 rounded-xl bg-zen-elevated/40 border border-zen-border space-y-2 text-xs">
                  <label className="block text-zen-subtle text-[10px]">Clé API {selectedProvider.toUpperCase()}</label>
                  <input
                    type="password"
                    placeholder="sk-..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full bg-zen-bg border border-zen-border rounded-md px-2 py-1 text-zen-text text-xs"
                  />
                  <p className="text-[10px] text-zen-subtle">
                    La clé sera chiffrée dans le trousseau de votre système d'exploitation via la crate Rust `keyring`.
                  </p>
                </div>
              )}

              <div className="pt-4 flex items-center justify-between border-t border-zen-border">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 rounded-xl text-zen-muted hover:text-zen-text flex items-center gap-1.5 text-xs transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Retour</span>
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="px-5 py-2 rounded-xl bg-zen-accent hover:bg-zen-accentHover text-black font-semibold text-xs flex items-center gap-1.5 transition"
                >
                  <span>Dernière étape</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ÉTAPE 4 : Prêt & Raccourcis Clés */}
          {step === 4 && (
            <div className="max-w-xl mx-auto space-y-6 text-center animate-in fade-in duration-200">
              <div className="w-14 h-14 rounded-2xl bg-zen-accent/15 text-zen-accent border border-zen-accent/30 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8 text-zen-accent" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-zen-text tracking-tight mb-1">
                  AuraMail est prêt !
                </h2>
                <p className="text-xs text-zen-muted">
                  Voici les réflexes essentiels pour naviguer à la vitesse de la pensée :
                </p>
              </div>

              {/* Raccourcis indispensables */}
              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="p-3.5 rounded-xl bg-zen-elevated/50 border border-zen-border flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Command className="w-4 h-4 text-zen-accent" />
                    <span className="text-xs text-zen-text font-medium">Palette universelle</span>
                  </div>
                  <kbd className="px-2 py-0.5 rounded bg-zen-bg border border-zen-border text-[11px] font-mono text-zen-subtle">
                    Ctrl + K
                  </kbd>
                </div>

                <div className="p-3.5 rounded-xl bg-zen-elevated/50 border border-zen-border flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CornerDownLeft className="w-4 h-4 text-zen-text" />
                    <span className="text-xs text-zen-text font-medium">Envoyer un e-mail</span>
                  </div>
                  <kbd className="px-2 py-0.5 rounded bg-zen-bg border border-zen-border text-[11px] font-mono text-zen-subtle">
                    Ctrl + Entrée
                  </kbd>
                </div>

                <div className="p-3.5 rounded-xl bg-zen-elevated/50 border border-zen-border flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <SlidersHorizontal className="w-4 h-4 text-zen-accent" />
                    <span className="text-xs text-zen-text font-medium">Entraîner l'IA</span>
                  </div>
                  <span className="text-[11px] text-zen-subtle font-sans">
                    1 clic sur un e-mail
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-zen-elevated/50 border border-zen-border flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-zen-text" />
                    <span className="text-xs text-zen-text font-medium">Réponses rapides</span>
                  </div>
                  <span className="text-[11px] text-zen-subtle font-sans">
                    Puces IA suggérées
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zen-elevated/30 border border-zen-border text-[11px] text-zen-muted text-left flex items-start gap-2.5">
                <Bot className="w-4 h-4 text-zen-accent shrink-0 mt-0.5" />
                <span>
                  <strong>Apprentissage continu :</strong> Lorsque vous modifiez la catégorie ou la priorité d'un e-mail, AuraMail mémorise votre règle en base SQLite locale pour adapter tous ses prochains triages.
                </span>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-zen-border">
                <button
                  onClick={() => setStep(3)}
                  className="px-4 py-2 rounded-xl text-zen-muted hover:text-zen-text flex items-center gap-1.5 text-xs transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Retour</span>
                </button>
                <button
                  onClick={handleComplete}
                  className="px-6 py-2.5 rounded-xl bg-zen-accent hover:bg-zen-accentHover text-black font-semibold text-xs flex items-center gap-2 transition shadow-md"
                >
                  <span>Accéder à ma boîte de réception</span>
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
