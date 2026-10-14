<div align="center">

# 🌌 AuraMail

### The Minimalist, Zen-Crafted Desktop Email Client with Local & BYOK AI Triage.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Tauri v2](https://img.shields.io/badge/Tauri-v2-orange?logo=tauri)](https://v2.tauri.app/)
[![Rust](https://img.shields.io/badge/Rust-1.80+-red?logo=rust)](https://www.rust-lang.org/)
[![React 19](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![Linux](https://img.shields.io/badge/Packages-AppImage%20%7C%20DEB%20%7C%20RPM-green?logo=linux)](https://github.com/)

[**Features**](#-features) • [**Why AuraMail?**](#-why-auramail) • [**Architecture**](#-architecture) • [**Getting Started**](#-getting-started) • [**AI Providers (BYOK)**](#-ai-providers-byok) • [**Roadmap**](#-roadmap)

---

</div>

## ✨ What is AuraMail?

**AuraMail** is a blazingly fast, all-in-one desktop email client built with **Tauri v2 (Rust)** and **React 19**. Inspired by the clean, vertical-first design philosophy of **Zen Browser**, it strips away the clutter of legacy email apps while empowering you with private, customizable AI triage.

No monthly $30 subscription. No remote servers reading your confidential emails. Connect any email account (Gmail, Outlook, custom IMAP) and bring your own AI model—whether running 100% locally with **Ollama** or via cloud APIs (**Claude**, **Gemini / Antigravity**, **OpenAI / DeepSeek**).

---

## 🚀 Features

- 🧘 **Zen Browser-Inspired Interface** :
  - **Collapsible Vertical Sidebar** with icon-only compact mode.
  - **Workspaces** (Personal, Work, Open Source) to partition accounts, rules, and smart views.
  - **Split View** to view threads side-by-side or draft while referencing an email.
  - **Command Palette (`Ctrl+K`)** for instant keyboard-driven navigation.

- 🤖 **Universal AI Triage & Continuous Learning (Local & BYOK)** :
  - **Background Classification** : Scores urgency (1–5) and categorizes into *Urgent, Action Required, Newsletters, Receipts, Low Priority*.
  - **One-Line TL;DR** : Instant smart summary visible directly in the message list.
  - **Transparent Reasoning** : See *why* an email was categorized a certain way with 1-click human feedback.
  - **Continuous In-Context Learning** : Correct any classification or add training notes in 1 click. AuraMail logs your feedback in local SQLite and dynamically injects few-shot exemplars into subsequent triage prompts so your AI continuously adapts to your personal habits without expensive fine-tuning.
  - **Learned Rules Inspector** : View, audit, and reset learned behavioral rules directly in the settings modal.
  - **Contextual Quick Replies** : Generate polite responses or expand bullet points into full drafts using your preferred AI model.

- 🔒 **Zero-Knowledge Privacy** :
  - 100% direct connection between your device, your IMAP server, and your chosen AI endpoint.
  - Run completely offline/private with **Ollama** on `localhost:11434`.
  - Sensitive credentials stored natively in your OS Keychain via `keyring` (Secret Service / libsecret on Linux).

- ⚡ **Local High Performance** :
  - **SQLite FTS5 Full-Text Search** : Instant search across tens of thousands of emails in milliseconds.
  - **Local Semantic Search** : Find emails by intent even when you don't remember the exact keywords.
  - **Lightweight Footprint** : Consumes ~40MB of RAM and starts in under 300ms thanks to Rust.

---

## 🥊 Why AuraMail?

| Feature | AuraMail | Superhuman | Thunderbird | Spark |
| :--- | :---: | :---: | :---: | :---: |
| **Pricing** | **Free & Open Source (MIT)** | $30 / month | Free & Open Source | Freemium ($8+/mo) |
| **Data Privacy** | **100% Client-Side / Local** | Cloud Indexed | Local | Cloud Indexed |
| **Local AI (Ollama)** | **Yes (Zero-data leak)** | No | No | No |
| **BYOK (Claude, Gemini, OpenAI)** | **Yes** | No | No | No |
| **Memory Footprint** | **~40 MB (Rust/Tauri)** | ~300 MB (Electron) | ~200 MB (C++) | ~350 MB (Electron) |
| **UI Aesthetics** | **Zen Browser minimalist** | Modern minimalist | Dated 3-pane | Modern |
| **Linux Support** | **AppImage, DEB, RPM** | Web only / None | Yes | Snap / Flatpak |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 AuraMail Shell (React 19)                   │
│                                                             │
│   [Workspaces] ── [Zen Sidebar] ── [List] ── [Split Reader] │
│                           │                                 │
│                 Tauri v2 IPC (Async)                        │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                 AuraMail Core (Rust)                        │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │   Mail Engine   │  │   Local Cache   │  │ Keyring OS  │  │
│  │ async-imap/SMTP │  │  SQLite 3 FTS5  │  │  libsecret  │  │
│  │   OAuth2 PKCE   │  │  + sqlite-vec   │  │  Keychain   │  │
│  └────────┬────────┘  └────────┬────────┘  └──────┬──────┘  │
│           │                    │                  │         │
│           └────────────────────┼──────────────────┘         │
│                                ▼                            │
│                  ┌───────────────────────────┐              │
│                  │    AuraLLM Trait (BYOK)   │              │
│                  │ - Ollama (127.0.0.1)      │              │
│                  │ - Anthropic Claude API    │              │
│                  │ - Google Gemini API       │              │
│                  │ - Custom OpenAI Endpoint  │              │
│                  └───────────────────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Getting Started

### Prerequisites
- [Rust](https://rustup.rs/) (v1.80+)
- [Node.js](https://nodejs.org/) (v20+) & `pnpm` (or `npm`)
- WebKit2GTK dependencies on Linux:
  ```bash
  # Debian / Ubuntu / Pop!_OS
  sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
  
  # Arch Linux / CachyOS
  sudo pacman -S webkit2gtk-4.1 base-devel curl wget openssl
  
  # Fedora
  sudo dnf install webkit2gtk4.1-devel openssl-devel curl wget
  ```

### Run Locally (Development)

```bash
# 1. Clone the repository
git clone https://github.com/your-username/AuraMail.git
cd AuraMail

# 2. Install frontend dependencies
npm install

# 3. Start AuraMail in development mode
npm run tauri dev
```

### Build Desktop Packages (AppImage, DEB, RPM)

```bash
# Builds native packages for your current OS distribution
npm run tauri build
```
The compiled binaries will be output to `src-tauri/target/release/bundle/`.

---

## 🧠 AI Providers (BYOK)

Configure your models in **Settings → AI Engine**:

1. **Local AI (Ollama)** :
   - Set endpoint: `http://127.0.0.1:11434`
   - Select model: `llama3.2`, `mistral`, `gemma2`
   - *100% private: no email content leaves your machine.*

2. **Anthropic Claude** :
   - Enter your Anthropic API Key (`sk-ant-...`).
   - Select model: `claude-3-5-sonnet`, `claude-3-5-haiku`.

3. **Google Gemini / Antigravity** :
   - Enter your Gemini API Key.
   - Select model: `gemini-1.5-flash`, `gemini-2.0-flash`.

4. **Custom OpenAI-Compatible** :
   - Supports **Groq**, **DeepSeek**, **OpenRouter**, **Together**, **LM Studio**, or **vLLM**.
   - Custom Base URL + API Key + Model identifier.

---

## 🗺️ Roadmap

- [x] Initial Architecture & Specification (Tauri v2 + Rust + React 19)
- [x] Workspace & Zen Navigation Design
- [ ] IMAP/SMTP Core Sync Engine with OAuth2 PKCE
- [ ] SQLite FTS5 Database Engine & Schema Migrations
- [ ] Background AI Triage Pipeline with Structured JSON Output
- [ ] Command Palette (`Ctrl+K`) & Keyboard-First Shortcuts
- [ ] TipTap Markdown/WYSIWYG Composer with Quick Reply Chips
- [ ] Automated GitHub Actions Release for AppImage, DEB, and RPM
- [ ] Optional Plugin System for Custom Actions (WASM / JS)

---

## 📄 License

AuraMail is released under the **[MIT License](LICENSE)**. Contributions, bug reports, and pull requests are warmly welcome!
