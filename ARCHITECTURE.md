# 🌌 AuraMail — Architecture & Spécifications Techniques

> **AuraMail** est un client email desktop open-source (MIT), ultra-rapide, respectueux de la vie privée et doté d'une interface épurée inspirée de **Zen Browser**. Il intègre un moteur de triage IA universel capable d'exploiter aussi bien des modèles locaux (Ollama) que des modèles cloud (Claude, Gemini/Antigravity, OpenAI-compatible).

---

## 1. Principes Fondateurs & Philosophie

1. **Vie Privée Inconditionnelle (Zero-Cloud Intermediary)** :
   - Aucun serveur tiers ne lit, ne transite ou ne stocke les emails.
   - Les connexions s'établissent directement du poste client vers les serveurs IMAP/SMTP et vers le fournisseur d'IA configuré.
   - Possibilité de fonctionner à 100% en local via Ollama (zéro octet quittant la machine).
2. **Esthétique & Ergonomie "Zen"** :
   - Fin des interfaces mails surchargées type Outlook/Thunderbird.
   - Barre latérale pliable (mode icônes ou étendu), navigation par **Espaces de travail (Workspaces)** étanches, palette de commandes globale (`Ctrl+K`), affichage Split View.
3. **Bring Your Own Key (BYOK) & Modularité IA** :
   - Pas d'abonnement forcé à 30 $/mois. L'utilisateur utilise son modèle local préféré ou ses propres clés API.
4. **Performance & Légèreté** :
   - Socle **Tauri v2 + Rust** (< 30 Mo d'exécutable, ~40 Mo de RAM, démarrage instantané).

---

## 2. Vue d'Ensemble du Système (Core-Shell)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React 19 + Vite)                      │
│                                                                        │
│  [Zen Sidebar]  [Workspaces]  [Virtual Mail List]  [Zen Reader/Editor] │
│  - Folders      - Perso       - TanStack Virtual   - TipTap WYSIWYG    │
│  - Workspaces   - Pro         - AI Triage Badges   - Smart Replies     │
│  - Toggle Icon  - Freelance   - Instant FTS Search - Split View        │
│                                                                        │
│                         Command Palette (Ctrl+K)                       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Tauri v2 IPC (invoke / emit)
┌───────────────────────────────────▼────────────────────────────────────┐
│                         BACKEND (Rust / Tauri v2)                      │
│                                                                        │
│ ┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────┐ │
│ │     Mail Engine      │ │    Storage Engine    │ │   Keyring Store  │ │
│ │ - async-imap / lettre│ │ - SQLite 3 + FTS5    │ │ - OS Keychain    │ │
│ │ - OAuth2 PKCE Server │ │ - Vector Embeddings  │ │   (libsecret,    │ │
│ │ - Background Sync    │ │ - Incremental Cache  │ │    Keychain)     │ │
│ └──────────┬───────────┘ └──────────┬───────────┘ └─────────┬────────┘ │
│            │                        │                       │          │
│            └────────────────────────┼───────────────────────┘          │
│                                     ▼                                  │
│                       ┌───────────────────────────┐                    │
│                       │    AI Triage Pipeline     │                    │
│                       │ - Trait AuraLLM           │                    │
│                       │ - Local: Ollama (11434)   │                    │
│                       │ - Cloud: Claude, Gemini,  │                    │
│                       │   OpenAI-compatible       │                    │
│                       └───────────────────────────┘                    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Schéma de la Base de Données Locale (SQLite FTS5 + Vec)

Le stockage local est entièrement chiffrable et utilise **SQLite** avec **FTS5 (Full-Text Search)** pour garantir une recherche instantanée sur plus de 100 000 emails.

```sql
-- Comptes connectés
CREATE TABLE accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    provider TEXT NOT NULL, -- 'gmail', 'outlook', 'custom_imap'
    imap_host TEXT NOT NULL,
    imap_port INTEGER NOT NULL,
    smtp_host TEXT NOT NULL,
    smtp_port INTEGER NOT NULL,
    auth_type TEXT NOT NULL, -- 'oauth2', 'app_password'
    workspace_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Espaces de travail Zen (Workspaces)
CREATE TABLE workspaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    ai_prompt_override TEXT -- Instructions de triage spécifiques à ce workspace
);

-- Messages synchronisés
CREATE TABLE emails (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    folder TEXT NOT NULL,
    message_id TEXT NOT NULL,
    thread_id TEXT,
    from_name TEXT,
    from_address TEXT NOT NULL,
    to_addresses TEXT NOT NULL, -- JSON array
    cc_addresses TEXT,          -- JSON array
    subject TEXT,
    date TIMESTAMP NOT NULL,
    body_plain TEXT,
    body_html TEXT,
    snippet TEXT,
    is_read BOOLEAN DEFAULT 0,
    is_starred BOOLEAN DEFAULT 0,
    has_attachments BOOLEAN DEFAULT 0,
    raw_path TEXT
);

-- Indexation FTS5 Plein Texte ultra-rapide
CREATE VIRTUAL TABLE emails_fts USING fts5(
    subject,
    from_name,
    from_address,
    body_plain,
    content='emails',
    content_rowid='rowid'
);

-- Métadonnées de triage IA
CREATE TABLE ai_triage (
    email_id TEXT PRIMARY KEY REFERENCES emails(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- 'urgent', 'action_required', 'newsletter', 'receipt', 'low_priority'
    priority_score INTEGER NOT NULL, -- 1 à 5
    summary TEXT NOT NULL, -- TL;DR en 1 phrase
    reasoning TEXT, -- Justification transparente de la décision
    suggested_actions TEXT, -- JSON array de réponses courtes proposées
    model_used TEXT NOT NULL,
    triaged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Historique des corrections utilisateur pour l'apprentissage continu
CREATE TABLE ai_corrections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email_id TEXT NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
    sender TEXT NOT NULL,
    subject_keywords TEXT NOT NULL,
    original_category TEXT NOT NULL,
    corrected_category TEXT NOT NULL,
    original_priority INTEGER NOT NULL,
    corrected_priority INTEGER NOT NULL,
    user_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Synthèse des règles apprises par l'IA
CREATE TABLE ai_learned_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    sender TEXT,
    subject_pattern TEXT,
    forced_category TEXT NOT NULL,
    forced_priority INTEGER NOT NULL,
    rule_text TEXT NOT NULL,
    confidence REAL NOT NULL DEFAULT 0.85,
    sample_count INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vecteurs pour recherche sémantique / Q&A
CREATE TABLE email_embeddings (
    email_id TEXT PRIMARY KEY REFERENCES emails(id) ON DELETE CASCADE,
    embedding BLOB NOT NULL
);
```

---

## 4. Pipeline d'Intelligence Artificielle (BYOK)

### 4.1. Interface Abstraite `AuraLLM` (Rust)

```rust
#[async_trait]
pub trait AuraLLM: Send + Sync {
    async fn triage_email(&self, email: &EmailContent) -> Result<TriageResult, AuraError>;
    async fn generate_reply(&self, thread: &[EmailContent], user_intent: &str) -> Result<String, AuraError>;
    async fn summarize_thread(&self, thread: &[EmailContent]) -> Result<String, AuraError>;
}
```

### 4.2. Format JSON de Triage Déterministe

Chaque appel au LLM utilise le mode **Structured Output / JSON Schema** :

```json
{
  "category": "urgent | action_required | newsletter | receipt | low_priority",
  "priority_score": 1,
  "summary": "Résumé percutant en une seule phrase pour la vue liste",
  "reasoning": "Pourquoi cette classification (ex: Le client demande une validation avant 18h)",
  "suggested_quick_replies": [
    "C'est noté, je vous valide ça cet après-midi.",
    "Pourriez-vous me transmettre la pièce jointe manquante ?"
  ]
}
```

### 4.3. Fournisseurs Supportés
- **Local (Ollama)** : Endpoint par défaut `http://127.0.0.1:11434` (modèles recommandés : `llama3.2`, `mistral`, `gemma2`).
- **Anthropic Claude** : Modèles `claude-3-5-sonnet`, `claude-3-5-haiku`.
- **Google Gemini / Antigravity** : Modèles `gemini-1.5-flash`, `gemini-2.0-flash`.
- **OpenAI-Compatible Universel** : URL personnalisée + clé d'API (compatible Groq, DeepSeek, OpenRouter, Together, LM Studio, vLLM).

### 4.4. Moteur d'Apprentissage Continu (Continuous Few-Shot Learning)
Plutôt qu'un réentraînement lourd et coûteux de modèle :
1. **Enregistrement des corrections utilisateur** : Dès que l'utilisateur modifie la catégorie, la priorité (1-5) ou ajoute une note d'instruction via le bouton *« Corriger / Entraîner l'IA »*, un enregistrement est sauvegardé dans `ai_corrections`.
2. **Recherche de contexte similaire (Few-Shot Retrieval)** : Lors de chaque nouveau triage, AuraMail recherche les corrections passées associées au même expéditeur ou aux mots-clés du sujet.
3. **Injection dynamique dans le prompt système** : Les règles apprises sont insérées sous forme d'exemples explicites dans la requête LLM, forçant le modèle (qu'il soit un Llama 3B local ou un Claude Sonnet cloud) à respecter les choix antérieurs de l'utilisateur.
4. **Synthèse de règles et transparence** : Les règles agrégées sont consultables et réinitialisables à tout moment dans l'onglet *« Mémoire & Apprentissage »* des paramètres.

---

## 5. Ergonomie et Interface "Zen Browser"

1. **Barre Latérale Rétractable** :
   - Mode Compact (icônes seules 48px) ou étendu.
   - Pinned Threads : Épinglage des fils de discussion importants en haut de la sidebar comme les onglets épinglés de Zen Browser.
2. **Workspaces Contextuels** :
   - Bascule instantanée entre vos univers (ex: `Pro`, `Personnel`, `Open Source`).
   - Chaque workspace filtre automatiquement les comptes et applique un jeu de règles de triage personnalisé.
3. **Split View** :
   - Affichage côte-à-côte de deux boîtes ou d'un email de référence et de l'éditeur de réponse.
4. **Command Palette (`Ctrl+K`)** :
   - Navigation au clavier complète : rechercher n'importe quel mail en langage naturel, changer de workspace, trier par IA, vider les spams.

---

## 6. Distribution & Packaging Linux

Le dépôt intègre un workflow GitHub Actions (`release.yml`) basé sur `tauri-action` pour produire à chaque tag :
- **AppImage** (exécutable autonome universel)
- **.deb** (Ubuntu, Debian, Linux Mint, Pop!_OS)
- **.rpm** (Fedora, RHEL, openSUSE)
- **Auto-updater Tauri** : notification et mise à jour transparente dans l'application.
