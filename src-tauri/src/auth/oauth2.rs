use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpListener;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OAuthAccountResult {
    pub email: String,
    pub provider: String,
    pub access_token: String,
    pub refresh_token: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthUrlResponse {
    pub auth_url: String,
    pub port: u16,
    pub state: String,
    pub verifier: String,
}

pub struct OAuthManager;

impl OAuthManager {
    /// Prépare l'URL d'autorisation et lance le serveur local éphémère pour Google
    pub fn build_google_auth(client_id: &str, port: u16, verifier: &str) -> String {
        let redirect_uri = format!("http://127.0.0.1:{}/callback", port);
        let scope = "https://mail.google.com/ https://www.googleapis.com/auth/userinfo.email openid email";
        format!(
            "https://accounts.google.com/o/oauth2/v2/auth?client_id={}&redirect_uri={}&response_type=code&scope={}&access_type=offline&prompt=consent&code_challenge={}&code_challenge_method=plain",
            client_id,
            urlencoding(&redirect_uri),
            urlencoding(scope),
            verifier
        )
    }

    /// Prépare l'URL d'autorisation et lance le serveur local éphémère pour Microsoft Outlook
    pub fn build_microsoft_auth(client_id: &str, port: u16, verifier: &str) -> String {
        let redirect_uri = format!("http://127.0.0.1:{}/callback", port);
        let scope = "https://outlook.office.com/IMAP.AccessAsUser.All https://outlook.office.com/SMTP.Send offline_access email openid profile";
        format!(
            "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id={}&redirect_uri={}&response_type=code&scope={}&response_mode=query&code_challenge={}&code_challenge_method=plain",
            client_id,
            urlencoding(&redirect_uri),
            urlencoding(scope),
            verifier
        )
    }

    /// Démarre un listener TCP local sur 127.0.0.1, attend le callback HTTP avec le code, renvoie une page HTML et ferme le serveur
    pub async fn listen_for_code(port: u16) -> Result<String, String> {
        let addr = SocketAddr::from(([127, 0, 0, 1], port));
        let listener = TcpListener::bind(addr)
            .await
            .map_err(|e| format!("Impossible de lier le port 127.0.0.1:{} : {}", port, e))?;

        // Timeout de 120 secondes pour laisser l'utilisateur s'authentifier
        let timeout_fut = tokio::time::sleep(std::time::Duration::from_secs(120));
        tokio::pin!(timeout_fut);

        tokio::select! {
            accept_res = listener.accept() => {
                let (mut socket, _) = accept_res.map_err(|e| format!("Erreur socket : {}", e))?;
                let mut buffer = [0u8; 2048];
                let n = socket.read(&mut buffer).await.unwrap_or(0);
                let request = String::from_utf8_lossy(&buffer[..n]);

                // Parser l'URL pour extraire le paramètre "code="
                let code = if let Some(code_pos) = request.find("code=") {
                    let after_code = &request[code_pos + 5..];
                    let end_pos = after_code.find('&').or_else(|| after_code.find(' ')).unwrap_or(after_code.len());
                    after_code[..end_pos].to_string()
                } else {
                    return Err("Aucun code OAuth trouvé dans la requête de callback".to_string());
                };

                // Répondre au navigateur avec une page de confirmation épurée façon Zen Browser
                let response_body = r#"<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>AuraMail — Authentification Réussie</title>
    <style>
        body { background: #0d0f12; color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .card { background: #161a1f; border: 1px solid #282f38; padding: 2.5rem; border-radius: 1rem; text-align: center; max-width: 400px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
        .icon { font-size: 3rem; margin-bottom: 1rem; color: #6366f1; }
        h1 { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem; }
        p { font-size: 0.875rem; color: #9ca3af; line-height: 1.5; }
    </style>
</head>
<body>
    <div class="card">
        <div class="icon">🌌</div>
        <h1>Connexion Réussie</h1>
        <p>Votre compte a été connecté à AuraMail avec succès.<br>Vous pouvez fermer cet onglet et revenir dans l'application.</p>
    </div>
</body>
</html>"#;

                let http_response = format!(
                    "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                    response_body.len(),
                    response_body
                );

                let _ = socket.write_all(http_response.as_bytes()).await;
                let _ = socket.flush().await;

                Ok(code)
            }
            _ = &mut timeout_fut => {
                Err("Délai d'attente d'authentification dépassé (120s)".to_string())
            }
        }
    }
}

fn urlencoding(input: &str) -> String {
    let mut encoded = String::new();
    for byte in input.bytes() {
        match byte {
            b'a'..=b'z' | b'A'..=b'Z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                encoded.push(byte as char);
            }
            _ => {
                encoded.push_str(&format!("%{:02X}", byte));
            }
        }
    }
    encoded
}
