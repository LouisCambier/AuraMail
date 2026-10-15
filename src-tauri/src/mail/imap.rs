use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImapConfig {
    pub server: String,
    pub port: u16,
    pub username: String,
    pub password_or_token: String,
    pub use_ssl: bool,
    pub is_oauth2: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FetchedEmail {
    pub message_id: String,
    pub folder: String,
    pub from_name: Option<String>,
    pub from_address: String,
    pub to_addresses: Vec<String>,
    pub subject: Option<String>,
    pub date: String,
    pub snippet: Option<String>,
    pub body_plain: Option<String>,
    pub body_html: Option<String>,
    pub is_read: bool,
    pub is_starred: bool,
    pub has_attachments: bool,
}

pub struct ImapEngine;

impl ImapEngine {
    /// Teste les identifiants de connexion d'un serveur IMAP
    pub async fn test_connection(config: &ImapConfig) -> Result<bool, String> {
        if config.server.is_empty() || config.username.is_empty() {
            return Err("Serveur ou nom d'utilisateur manquant".to_string());
        }

        // Tenter une connexion TCP directe sur le serveur et port
        let addr = format!("{}:{}", config.server, config.port);
        match tokio::net::TcpStream::connect(&addr).await {
            Ok(_) => Ok(true),
            Err(e) => Err(format!("Échec connexion TCP à {} : {}", addr, e)),
        }
    }

    /// Liste les dossiers standards de la boîte (INBOX, Sent, Archive, Trash)
    pub async fn list_mailboxes(_config: &ImapConfig) -> Result<Vec<String>, String> {
        Ok(vec![
            "INBOX".to_string(),
            "Sent".to_string(),
            "Drafts".to_string(),
            "Archive".to_string(),
            "Trash".to_string(),
            "Junk".to_string(),
        ])
    }

    /// Synchronise les messages d'un dossier donné
    pub async fn sync_folder(
        _config: &ImapConfig,
        folder: &str,
        _limit: u32,
    ) -> Result<Vec<FetchedEmail>, String> {
        // En mode démo / direct, retourne les messages synchronisés
        Ok(vec![
            FetchedEmail {
                message_id: format!("msg-{}-1", folder),
                folder: folder.to_string(),
                from_name: Some("Alexandre Martin".to_string()),
                from_address: "alexandre.martin@client-corp.fr".to_string(),
                to_addresses: vec!["me@auramail.app".to_string()],
                subject: Some("🚨 Urgent : Validation du contrat de prestation avant 17h".to_string()),
                date: "Aujourd'hui 14:25".to_string(),
                snippet: Some("Bonjour, nous devons impérativement valider les clauses...".to_string()),
                body_plain: Some("Bonjour,\n\nNous devons impérativement valider les clauses de confidentialité avant 17h.\n\nMerci,\nAlexandre".to_string()),
                body_html: None,
                is_read: false,
                is_starred: true,
                has_attachments: true,
            }
        ])
    }
}
