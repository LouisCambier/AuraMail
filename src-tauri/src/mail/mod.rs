pub mod imap;
pub mod smtp;

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct EmailItem {
    pub id: String,
    pub account_id: String,
    pub folder: String,
    pub from_name: Option<String>,
    pub from_address: String,
    pub subject: Option<String>,
    pub date: String,
    pub snippet: Option<String>,
    pub is_read: bool,
    pub is_starred: bool,
    pub has_attachments: bool,
    // Triage IA associé (s'il existe)
    pub ai_category: Option<String>,
    pub ai_priority: Option<u8>,
    pub ai_summary: Option<String>,
    pub ai_reasoning: Option<String>,
    pub ai_quick_replies: Option<Vec<String>>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct WorkspaceItem {
    pub id: String,
    pub name: String,
    pub icon: String,
    pub color: String,
    pub unread_count: u32,
}
