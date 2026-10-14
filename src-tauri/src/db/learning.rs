use serde::{Deserialize, Serialize};
use sqlx::{Pool, Sqlite};

pub type DbPool = Pool<Sqlite>;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct CorrectionEntry {
    pub id: Option<i64>,
    pub email_id: String,
    pub sender: String,
    pub subject_keywords: String,
    pub original_category: String,
    pub corrected_category: String,
    pub original_priority: u8,
    pub corrected_priority: u8,
    pub user_note: Option<String>,
    pub created_at: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct LearnedRule {
    pub id: i64,
    pub workspace_id: String,
    pub rule_text: String,
    pub confidence: f64,
    pub sample_count: i32,
}

/// Enregistre une correction manuelle apportée par l'utilisateur
pub async fn save_correction(pool: &DbPool, c: &CorrectionEntry) -> Result<(), String> {
    sqlx::query!(
        r#"
        INSERT INTO ai_corrections (
            email_id, sender, subject_keywords,
            original_category, corrected_category,
            original_priority, corrected_priority,
            user_note
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
        "#,
        c.email_id,
        c.sender,
        c.subject_keywords,
        c.original_category,
        c.corrected_category,
        c.original_priority,
        c.corrected_priority,
        c.user_note
    )
    .execute(pool)
    .await
    .map_err(|e| format!("Erreur enregistrement correction IA : {}", e))?;

    // Mettre à jour ou créer une règle apprise si des corrections similaires s'accumulent
    let count = sqlx::query_scalar!(
        "SELECT COUNT(*) FROM ai_corrections WHERE sender = ?1 AND corrected_category = ?2",
        c.sender,
        c.corrected_category
    )
    .fetch_one(pool)
    .await
    .unwrap_or(0);

    if count >= 2 {
        let rule_desc = format!(
            "Toujours classer les emails de '{}' en '{}' (Priorité {}/5)",
            c.sender, c.corrected_category, c.corrected_priority
        );
        let confidence = (count as f64 / (count + 1) as f64).min(0.99);

        let _ = sqlx::query!(
            r#"
            INSERT INTO ai_learned_rules (workspace_id, rule_text, confidence, sample_count)
            VALUES ('default', ?1, ?2, ?3)
            "#,
            rule_desc,
            confidence,
            count
        )
        .execute(pool)
        .await;
    }

    Ok(())
}

/// Recherche les corrections passées les plus pertinentes pour un nouvel email
pub async fn get_relevant_corrections(
    pool: &DbPool,
    sender: &str,
    subject: &str,
    limit: i64,
) -> Result<Vec<CorrectionEntry>, String> {
    let rows = sqlx::query!(
        r#"
        SELECT 
            id, email_id, sender, subject_keywords,
            original_category, corrected_category,
            original_priority, corrected_priority,
            user_note, created_at
        FROM ai_corrections
        WHERE sender = ?1 OR ?2 LIKE '%' || subject_keywords || '%'
        ORDER BY (sender = ?1) DESC, id DESC
        LIMIT ?3
        "#,
        sender,
        subject,
        limit
    )
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Erreur recherche corrections : {}", e))?;

    let corrections = rows
        .into_iter()
        .map(|r| CorrectionEntry {
            id: Some(r.id),
            email_id: r.email_id,
            sender: r.sender,
            subject_keywords: r.subject_keywords.unwrap_or_default(),
            original_category: r.original_category,
            corrected_category: r.corrected_category,
            original_priority: r.original_priority as u8,
            corrected_priority: r.corrected_priority as u8,
            user_note: r.user_note,
            created_at: Some(r.created_at),
        })
        .collect();

    Ok(corrections)
}

/// Récupère toutes les règles apprises pour un workspace
pub async fn get_all_learned_rules(
    pool: &DbPool,
    workspace_id: &str,
) -> Result<Vec<LearnedRule>, String> {
    let rows = sqlx::query!(
        r#"
        SELECT id, workspace_id, rule_text, confidence, sample_count
        FROM ai_learned_rules
        WHERE workspace_id = ?1
        ORDER BY sample_count DESC, confidence DESC
        "#,
        workspace_id
    )
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Erreur récupération règles : {}", e))?;

    let rules = rows
        .into_iter()
        .map(|r| LearnedRule {
            id: r.id,
            workspace_id: r.workspace_id,
            rule_text: r.rule_text,
            confidence: r.confidence,
            sample_count: r.sample_count,
        })
        .collect();

    Ok(rules)
}

/// Réinitialise l'apprentissage (remise à zéro de l'expérience IA)
pub async fn clear_learning_data(pool: &DbPool) -> Result<(), String> {
    sqlx::query("DELETE FROM ai_corrections")
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;

    sqlx::query("DELETE FROM ai_learned_rules")
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}
