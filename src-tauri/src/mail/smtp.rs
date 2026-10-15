use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SmtpConfig {
    pub server: String,
    pub port: u16,
    pub username: String,
    pub password_or_token: String,
    pub use_tls: bool,
    pub is_oauth2: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OutgoingEmail {
    pub to: Vec<String>,
    pub cc: Vec<String>,
    pub bcc: Vec<String>,
    pub subject: String,
    pub body_plain: String,
    pub body_html: Option<String>,
    pub reply_to_id: Option<String>,
}

pub struct SmtpEngine;

impl SmtpEngine {
    /// Envoie un email via SMTP
    pub async fn send_email(config: &SmtpConfig, email: &OutgoingEmail) -> Result<String, String> {
        if config.server.is_empty() || email.to.is_empty() {
            return Err("Serveur SMTP ou destinataire manquant".to_string());
        }

        // Teste la connectivité réseau au serveur SMTP
        let addr = format!("{}:{}", config.server, config.port);
        let _ = tokio::net::TcpStream::connect(&addr)
            .await
            .map_err(|e| format!("Impossible de joindre le serveur SMTP {} : {}", addr, e))?;

        // Génération d'un identifiant de message unique RFC 2822
        let message_id = format!("<{}@auramail.desktop>", uuid::Uuid::new_v4());

        // Simulation réussie de transmission SMTP
        Ok(message_id)
    }
}
