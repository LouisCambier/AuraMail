use serde::{Deserialize, Serialize};
use sqlx::{FromRow, Pool, Row, Sqlite};

pub type DbPool = Pool<Sqlite>;

#[derive(Serialize, Deserialize, Clone, Debug, FromRow)]
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

#[derive(Serialize, Deserialize, Clone, Debug, FromRow)]
pub struct LearnedRule {
    pub id: i64,
    pub workspace_id: String,
    pub rule_text: String,
    pub confidence: f64,
    pub sample_count: i32,
}

/// Enregistre une correction manuelle apportée par l'utilisateur
pub async fn save_correction(pool: &DbPool, c: &CorrectionEntry) -> Result<(), String> {
    sqlx::query(
        r#"
        INSERT INTO ai_corrections (
            email_id, sender, subject_keywords,
            original_category, corrected_category,
            original_priority, corrected_priority,
            user_note
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
        "#,
    )
    .bind(&c.email_id)
    .bind(&c.sender)
    .bind(&c.subject_keywords)
    .bind(&c.original_category)
    .bind(&c.corrected_category)
    .bind(c.original_priority as i32)
    .bind(c.corrected_priority as i32)
    .bind(&c.user_note)
    .execute(pool)
    .await
    .map_err(|e| format!("Erreur enregistrement correction IA : {}", e))?;

    // Mettre à jour ou créer une règle apprise si des corrections similaires s'accumulent
    let count_row = sqlx::query("SELECT COUNT(*) FROM ai_corrections WHERE sender = ?1 AND corrected_category = ?2")
        .bind(&c.sender)
        .bind(&c.corrected_category)
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;

    let count: i64 = count_row.get(0);

    if count >= 2 {
        let rule_desc = format!(
            "Toujours classer les emails de '{}' en '{}' (Priorité {}/5)",
            c.sender, c.corrected_category, c.corrected_priority
        );
        let confidence = (count as f64 / (count + 1) as f64).min(0.99);

        let _ = sqlx::query(
            r#"
            INSERT INTO ai_learned_rules (workspace_id, rule_text, confidence, sample_count)
            VALUES ('default', ?1, ?2, ?3)
            "#,
        )
        .bind(rule_desc)
        .bind(confidence)
        .bind(count as i32)
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
    let rows = sqlx::query(
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
    )
    .bind(sender)
    .bind(subject)
    .bind(limit)
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Erreur recherche corrections : {}", e))?;

    let corrections = rows
        .into_iter()
        .map(|r| CorrectionEntry {
            id: Some(r.get("id")),
            email_id: r.get("email_id"),
            sender: r.get("sender"),
            subject_keywords: r.get::<Option<String>, _>("subject_keywords").unwrap_or_default(),
            original_category: r.get("original_category"),
            corrected_category: r.get("corrected_category"),
            original_priority: r.get::<i32, _>("original_priority") as u8,
            corrected_priority: r.get::<i32, _>("corrected_priority") as u8,
            user_note: r.get("user_note"),
            created_at: Some(r.get("created_at")),
        })
        .collect();

    Ok(corrections)
}

/// Récupère toutes les règles apprises pour un workspace
pub async fn get_all_learned_rules(
    pool: &DbPool,
    workspace_id: &str,
) -> Result<Vec<LearnedRule>, String> {
    let rows = sqlx::query(
        r#"
        SELECT id, workspace_id, rule_text, confidence, sample_count
        FROM ai_learned_rules
        WHERE workspace_id = ?1
        ORDER BY sample_count DESC, confidence DESC
        "#,
    )
    .bind(workspace_id)
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Erreur récupération règles : {}", e))?;

    let rules = rows
        .into_iter()
        .map(|r| LearnedRule {
            id: r.get("id"),
            workspace_id: r.get("workspace_id"),
            rule_text: r.get("rule_text"),
            confidence: r.get("confidence"),
            sample_count: r.get("sample_count"),
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
