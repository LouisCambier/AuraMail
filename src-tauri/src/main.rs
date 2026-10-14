// Empêche l'ouverture d'une fenêtre console supplémentaire sur Windows en release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    auramail_lib::run();
}
