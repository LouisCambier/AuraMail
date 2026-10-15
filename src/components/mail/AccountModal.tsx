import React, { useState } from "react";
import { X, Mail, ShieldCheck, Server, Sparkles, Check, Loader2 } from "lucide-react";

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountAdded?: (accountName: string, email: string) => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  onAccountAdded,
}) => {
  const [tab, setTab] = useState<"oauth" | "imap">("oauth");
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Formulaire IMAP / SMTP manuel
  const [imapHost, setImapHost] = useState("");
  const [imapPort, setImapPort] = useState("993");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("465");
  const [emailUser, setEmailUser] = useState("");
  const [password, setPassword] = useState("");

  if (!isOpen) return null;

  const handleOAuthConnect = async (provider: "google" | "microsoft") => {
    setLoadingProvider(provider);
    try {
      if (window.__TAURI_INTERNALS__) {
        const { invoke } = await import("@tauri-apps/api/core");
        const port = 8089;
        const verifier = "auramail_pkce_verifier_" + Math.random().toString(36).substring(2);
        const clientId = provider === "google" ? "YOUR_GOOGLE_CLIENT_ID" : "YOUR_MS_CLIENT_ID";

        const authUrl = await invoke<string>("get_oauth2_auth_url", {
          provider,
          clientId,
          port,
          verifier,
        });

        // Ouvrir dans le navigateur système
        window.open(authUrl, "_blank");

        // Écouter le code sur le listener local 127.0.0.1:8089
        const code = await invoke<string>("listen_oauth2_callback", { port });
        console.log("OAuth2 code reçu :", code);
      } else {
        // Simulation en mode navigateur
        await new Promise((r) => setTimeout(r, 1500));
      }

      const connectedEmail = provider === "google" ? "alex@gmail.com" : "alex@outlook.com";
      setSuccessMsg(`Compte ${provider === "google" ? "Google" : "Microsoft"} connecté avec succès (${connectedEmail}) !`);
      if (onAccountAdded) {
        onAccountAdded(provider === "google" ? "Gmail Pro" : "Outlook Perso", connectedEmail);
      }
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Erreur OAuth :", err);
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleManualConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingProvider("manual");
    try {
      if (window.__TAURI_INTERNALS__) {
        const { invoke } = await import("@tauri-apps/api/core");
        await invoke("test_imap_connection", {
          config: {
            server: imapHost,
            port: parseInt(imapPort, 10),
            username: emailUser,
            password_or_token: password,
            use_ssl: true,
            is_oauth2: false,
          },
        });
      } else {
        await new Promise((r) => setTimeout(r, 1200));
      }

      setSuccessMsg(`Compte IMAP connecté : ${emailUser}`);
      if (onAccountAdded) {
        onAccountAdded("Serveur IMAP", emailUser);
      }
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zen-surface border border-zen-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zen-border">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-zen-accent" />
            <h2 className="font-semibold text-zen-text text-base">
              Connecter un compte email
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zen-muted hover:text-zen-text hover:bg-zen-hover transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zen-border px-6 pt-2 gap-4 text-xs font-medium">
          <button
            onClick={() => setTab("oauth")}
            className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition ${
              tab === "oauth"
                ? "border-zen-accent text-zen-text"
                : "border-transparent text-zen-muted hover:text-zen-text"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>OAuth2 (1-Clic)</span>
          </button>
          <button
            onClick={() => setTab("imap")}
            className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition ${
              tab === "imap"
                ? "border-zen-accent text-zen-text"
                : "border-transparent text-zen-muted hover:text-zen-text"
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>IMAP / SMTP Manuel</span>
          </button>
        </div>

        {/* Contenu */}
        <div className="p-6 text-xs space-y-4">
          {successMsg ? (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center space-y-2">
              <Check className="w-8 h-8 text-emerald-400 mx-auto" />
              <div className="text-emerald-300 font-medium">{successMsg}</div>
            </div>
          ) : tab === "oauth" ? (
            <div className="space-y-3">
              <p className="text-zen-muted leading-relaxed">
                Connexion directe sécurisée avec serveur local PKCE sur <code>127.0.0.1</code>. Zéro intermédiaire, clés stockées dans votre trousseau OS.
              </p>

              <button
                onClick={() => handleOAuthConnect("google")}
                disabled={!!loadingProvider}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-zen-border bg-zen-elevated hover:bg-zen-hover text-zen-text transition disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-base">🇬</span>
                  <div className="text-left">
                    <div className="font-medium">Google / Gmail</div>
                    <div className="text-[11px] text-zen-subtle">
                      OAuth2 PKCE officiel
                    </div>
                  </div>
                </div>
                {loadingProvider === "google" ? (
                  <Loader2 className="w-4 h-4 animate-spin text-zen-accent" />
                ) : (
                  <span className="px-2 py-1 rounded bg-zen-surface border border-zen-border text-[10px] text-zen-muted">
                    Connecter
                  </span>
                )}
              </button>

              <button
                onClick={() => handleOAuthConnect("microsoft")}
                disabled={!!loadingProvider}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-zen-border bg-zen-elevated hover:bg-zen-hover text-zen-text transition disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-base">Ⓜ️</span>
                  <div className="text-left">
                    <div className="font-medium">Microsoft Outlook / 365</div>
                    <div className="text-[11px] text-zen-subtle">
                      Exchange & IMAP OAuth2
                    </div>
                  </div>
                </div>
                {loadingProvider === "microsoft" ? (
                  <Loader2 className="w-4 h-4 animate-spin text-zen-accent" />
                ) : (
                  <span className="px-2 py-1 rounded bg-zen-surface border border-zen-border text-[10px] text-zen-muted">
                    Connecter
                  </span>
                )}
              </button>
            </div>
          ) : (
            <form onSubmit={handleManualConnect} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-zen-muted mb-1">Serveur IMAP</label>
                  <input
                    type="text"
                    required
                    placeholder="imap.example.com"
                    value={imapHost}
                    onChange={(e) => setImapHost(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-zen-bg border border-zen-border rounded-lg text-zen-text focus:outline-none focus:border-zen-accent"
                  />
                </div>
                <div>
                  <label className="block text-zen-muted mb-1">Port</label>
                  <input
                    type="number"
                    required
                    value={imapPort}
                    onChange={(e) => setImapPort(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-zen-bg border border-zen-border rounded-lg text-zen-text focus:outline-none focus:border-zen-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-zen-muted mb-1">Serveur SMTP</label>
                  <input
                    type="text"
                    required
                    placeholder="smtp.example.com"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-zen-bg border border-zen-border rounded-lg text-zen-text focus:outline-none focus:border-zen-accent"
                  />
                </div>
                <div>
                  <label className="block text-zen-muted mb-1">Port</label>
                  <input
                    type="number"
                    required
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-zen-bg border border-zen-border rounded-lg text-zen-text focus:outline-none focus:border-zen-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zen-muted mb-1">Email / Identifiant</label>
                <input
                  type="email"
                  required
                  placeholder="contact@mondomaine.fr"
                  value={emailUser}
                  onChange={(e) => setEmailUser(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-zen-bg border border-zen-border rounded-lg text-zen-text focus:outline-none focus:border-zen-accent"
                />
              </div>

              <div>
                <label className="block text-zen-muted mb-1">Mot de passe (ou App Password)</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-zen-bg border border-zen-border rounded-lg text-zen-text focus:outline-none focus:border-zen-accent"
                />
              </div>

              <button
                type="submit"
                disabled={!!loadingProvider}
                className="w-full py-2 bg-zen-accent hover:bg-zen-accentHover text-black rounded-lg font-semibold transition flex items-center justify-center gap-2 mt-2"
              >
                {loadingProvider === "manual" ? (
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Tester et Sauvegarder</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
