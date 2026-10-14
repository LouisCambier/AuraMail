use crate::db::learning::CorrectionEntry;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct TriageResult {
    pub category: String, // 'urgent' | 'action_required' | 'newsletter' | 'receipt' | 'low_priority'
    pub priority_score: u8, // 1 to 5
    pub summary: String, // One-line TL;DR
    pub reasoning: String, // Transparent reason
    pub suggested_quick_replies: Vec<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct EmailContent {
    pub id: String,
    pub from: String,
    pub subject: String,
    pub body_plain: String,
    pub date: String,
}

#[async_trait]
pub trait AuraLLM: Send + Sync {
    async fn triage_email(
        &self,
        email: &EmailContent,
        learning_context: &[CorrectionEntry],
    ) -> Result<TriageResult, String>;
    async fn generate_reply(&self, email: &EmailContent, intent: &str) -> Result<String, String>;
}

fn build_few_shot_instructions(learning_context: &[CorrectionEntry]) -> String {
    if learning_context.is_empty() {
        return String::new();
    }

    let mut instructions = String::from(
        "\n\n🚨 RÈGLES ET EXEMPLES APPRIS DE L'UTILISATEUR (Respecte impérativement ces préférences) :\n"
    );
    for (i, c) in learning_context.iter().enumerate() {
        instructions.push_str(&format!(
            "- Exemple {}: Expéditeur '{}' (mots-clés sujet: '{}') => Corrigé en catégorie '{}' avec priorité {}/5.{}\n",
            i + 1,
            c.sender,
            c.subject_keywords,
            c.corrected_category,
            c.corrected_priority,
            c.user_note.as_ref().map(|n| format!(" Note utilisateur: '{}'", n)).unwrap_or_default()
        ));
    }
    instructions
}

/// Fournisseur Local Ollama (zéro fuite de données, localhost:11434)
pub struct OllamaProvider {
    pub base_url: String,
    pub model: String,
}

impl OllamaProvider {
    pub fn new(base_url: Option<String>, model: Option<String>) -> Self {
        Self {
            base_url: base_url.unwrap_or_else(|| "http://127.0.0.1:11434".to_string()),
            model: model.unwrap_or_else(|| "llama3.2".to_string()),
        }
    }
}

#[async_trait]
impl AuraLLM for OllamaProvider {
    async fn triage_email(
        &self,
        email: &EmailContent,
        learning_context: &[CorrectionEntry],
    ) -> Result<TriageResult, String> {
        let client = reqwest::Client::new();
        let few_shot = build_few_shot_instructions(learning_context);
        let prompt = format!(
            "Tu es l'assistant de tri d'AuraMail. Analyse cet email et réponds UNIQUEMENT en JSON avec la structure exacte :\n\
            {{\"category\": \"urgent|action_required|newsletter|receipt|low_priority\", \"priority_score\": 1-5, \"summary\": \"résumé en 1 phrase\", \"reasoning\": \"pourquoi cette note\", \"suggested_quick_replies\": [\"réponse 1\", \"réponse 2\"]}}\n\
            {}\n\n\
            De : {}\nSujet : {}\nDate : {}\nCorps :\n{}",
            few_shot, email.from, email.subject, email.date, email.body_plain
        );

        let body = serde_json::json!({
            "model": self.model,
            "messages": [
                {"role": "system", "content": "You are a precise email triage assistant. Output valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            "format": "json",
            "stream": false
        });

        let res = client
            .post(format!("{}/api/chat", self.base_url))
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Erreur de connexion Ollama : {}", e))?;

        let val: serde_json::Value = res
            .json()
            .await
            .map_err(|e| format!("Erreur parsing réponse Ollama : {}", e))?;

        let content_str = val["message"]["content"]
            .as_str()
            .ok_or_else(|| "Champ content manquant dans la réponse Ollama".to_string())?;

        let triage: TriageResult = serde_json::from_str(content_str)
            .map_err(|e| format!("Échec du décodage du JSON de triage : {}. Contenu brut : {}", e, content_str))?;

        Ok(triage)
    }

    async fn generate_reply(&self, email: &EmailContent, intent: &str) -> Result<String, String> {
        let client = reqwest::Client::new();
        let prompt = format!(
            "Rédige une réponse d'email professionnelle et soignée basée sur cette consigne utilisateur : '{}'.\n\nEmail reçu :\nDe : {}\nSujet : {}\nCorps :\n{}",
            intent, email.from, email.subject, email.body_plain
        );

        let body = serde_json::json!({
            "model": self.model,
            "messages": [
                {"role": "system", "content": "Tu es un rédacteur d'email concis, élégant et professionnel. Rédige uniquement le corps de l'email sans formule de méta-commentaire."},
                {"role": "user", "content": prompt}
            ],
            "stream": false
        });

        let res = client
            .post(format!("{}/api/chat", self.base_url))
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Erreur Ollama : {}", e))?;

        let val: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
        Ok(val["message"]["content"].as_str().unwrap_or("").to_string())
    }
}

/// Fournisseur universel compatible OpenAI (Claude via proxy, Gemini via compat, Groq, DeepSeek, vLLM)
pub struct OpenAICompatibleProvider {
    pub base_url: String,
    pub api_key: String,
    pub model: String,
}

impl OpenAICompatibleProvider {
    pub fn new(base_url: String, api_key: String, model: String) -> Self {
        Self { base_url, api_key, model }
    }
}

#[async_trait]
impl AuraLLM for OpenAICompatibleProvider {
    async fn triage_email(
        &self,
        email: &EmailContent,
        learning_context: &[CorrectionEntry],
    ) -> Result<TriageResult, String> {
        let client = reqwest::Client::new();
        let few_shot = build_few_shot_instructions(learning_context);
        let prompt = format!(
            "Analyse cet email et réponds UNIQUEMENT en JSON avec la structure exacte :\n\
            {{\"category\": \"urgent|action_required|newsletter|receipt|low_priority\", \"priority_score\": 1-5, \"summary\": \"résumé en 1 phrase\", \"reasoning\": \"pourquoi\", \"suggested_quick_replies\": [\"réponse 1\", \"réponse 2\"]}}\n\
            {}\n\n\
            De : {}\nSujet : {}\nCorps :\n{}",
            few_shot, email.from, email.subject, email.body_plain
        );

        let body = serde_json::json!({
            "model": self.model,
            "messages": [
                {"role": "system", "content": "You are a precise email triage assistant. Output valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            "response_format": { "type": "json_object" }
        });

        let url = format!("{}/chat/completions", self.base_url.trim_end_matches('/'));
        let res = client
            .post(&url)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Erreur appel API : {}", e))?;

        let val: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
        let content_str = val["choices"][0]["message"]["content"]
            .as_str()
            .ok_or_else(|| "Pas de message de l'IA".to_string())?;

        let triage: TriageResult = serde_json::from_str(content_str)
            .map_err(|e| format!("Échec décodage JSON : {}. Contenu : {}", e, content_str))?;

        Ok(triage)
    }

    async fn generate_reply(&self, email: &EmailContent, intent: &str) -> Result<String, String> {
        let client = reqwest::Client::new();
        let prompt = format!(
            "Rédige une réponse d'email concise basée sur : '{}'.\n\nEmail reçu :\nDe : {}\nSujet : {}\nCorps :\n{}",
            intent, email.from, email.subject, email.body_plain
        );

        let body = serde_json::json!({
            "model": self.model,
            "messages": [
                {"role": "system", "content": "Rédige uniquement le corps de l'email sans bla-bla d'introduction."},
                {"role": "user", "content": prompt}
            ]
        });

        let url = format!("{}/chat/completions", self.base_url.trim_end_matches('/'));
        let res = client
            .post(&url)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Erreur appel API : {}", e))?;

        let val: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
        Ok(val["choices"][0]["message"]["content"].as_str().unwrap_or("").to_string())
    }
}
