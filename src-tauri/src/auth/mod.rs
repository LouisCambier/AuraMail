use keyring::Entry;

pub struct SecretStore;

impl SecretStore {
    const SERVICE_NAME: &'static str = "com.auramail.desktop";

    /// Enregistre une clé secrète ou mot de passe dans le trousseau de l'OS
    pub fn store_secret(key_name: &str, secret: &str) -> Result<(), String> {
        let entry = Entry::new(Self::SERVICE_NAME, key_name)
            .map_err(|e| format!("Erreur initialisation Keyring : {}", e))?;
        entry
            .set_password(secret)
            .map_err(|e| format!("Échec d'enregistrement du secret : {}", e))?;
        Ok(())
    }

    /// Récupère un secret depuis le trousseau de l'OS
    pub fn get_secret(key_name: &str) -> Result<String, String> {
        let entry = Entry::new(Self::SERVICE_NAME, key_name)
            .map_err(|e| format!("Erreur initialisation Keyring : {}", e))?;
        entry
            .get_password()
            .map_err(|e| format!("Secret introuvable ou inaccessible : {}", e))?;
        Ok(entry.get_password().unwrap_or_default())
    }

    /// Supprime un secret du trousseau
    pub fn delete_secret(key_name: &str) -> Result<(), String> {
        let entry = Entry::new(Self::SERVICE_NAME, key_name)
            .map_err(|e| format!("Erreur initialisation Keyring : {}", e))?;
        let _ = entry.delete_password();
        Ok(())
    }
}
