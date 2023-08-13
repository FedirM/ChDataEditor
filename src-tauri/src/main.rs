// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{State, Manager, Size, LogicalSize};
use urlencoding::encode;
use std::sync::{Arc, Mutex};
use std::collections::HashMap;

mod bkrs;
use bkrs::BKRS;

const BKRS_VOCA_PATH: &str = ".\\data\\bkrs.json";
// const BKRS_FORMS_PATH: &str = "data/bkrsForms.json";

const GT_HI: &str = "tr_to_si";
const GT_UA: &str = "tr_to_ua";
const GT_VOCA: &str = "tr_voca";


struct Store {
    bkrs_voca: Arc<Mutex<HashMap<String, Option<BKRS::Nest>>>>,
}

impl Default for Store {
    fn default() -> Self {
        Store {
            bkrs_voca: Arc::new(Mutex::new(BKRS::read_dic(BKRS_VOCA_PATH).unwrap())),
        }
    }
}

struct Storage {
    store: Store
}

#[tauri::command]
async fn vocabulary(chunks: Vec<String>, storage: State<'_, Storage>) -> Result<HashMap<String, BKRS::Nest>, ()> {
    let store = &storage.store;
    let dictionary = store.bkrs_voca.lock().unwrap();
    let mut hash = HashMap::new();

    for chunk in chunks {
        hash.extend(BKRS::voca_list(&dictionary, &chunk))
    }
    Ok(hash)
}

#[tauri::command]
async fn close_all_text_win(app: tauri::AppHandle) {
    let wins = app.windows();
    let v = vec![GT_HI, GT_UA, GT_VOCA];
    for w in wins {
        if v.iter().any(|s| w.0.eq(s)) {
            w.1.close().unwrap();
        }
    }
}

#[tauri::command]
async fn google_translator_ua(text: String, app: tauri::AppHandle) {
    let window = tauri::WindowBuilder::new(
        &app,
        GT_UA,
        tauri::WindowUrl::External(format!("https://translate.google.com.ua/?hl=ru&sl=zh-TW&tl=uk&text={}&op=translate", encode(&text)).parse().unwrap())
    )
    .initialization_script(INIT_SCRIPT_HI)
    .build()
    .unwrap();

    window.set_size(Size::Logical(LogicalSize { width: 1280.0, height: 800.0 })).unwrap();
}

#[tauri::command]
async fn google_translator_hi(text: String, app: tauri::AppHandle) {
    let window = tauri::WindowBuilder::new(
        &app,
        GT_HI,
        tauri::WindowUrl::External(format!("https://translate.google.com.ua/?hl=ru&sl=zh-TW&tl=zh-CN&text={}&op=translate", encode(&text)).parse().unwrap())
    )
    .initialization_script(INIT_SCRIPT_HI)
    .build()
    .unwrap();

    window.set_size(Size::Logical(LogicalSize { width: 1280.0, height: 800.0 })).unwrap();
}

#[tauri::command]
async fn google_voca(list: String, app: tauri::AppHandle) {
    let window = tauri::WindowBuilder::new(
        &app,
        GT_VOCA,
        tauri::WindowUrl::External(format!("https://translate.google.com.ua/?hl=ru&sl=zh-TW&tl=uk&text={}&op=translate", encode(&list)).parse().unwrap())
    )
    .build()
    .unwrap();

    window.set_size(Size::Logical(LogicalSize { width: 1280.0, height: 800.0 })).unwrap();
}

#[tauri::command]
async fn google_voca_close(app: tauri::AppHandle) {
    match app.get_window(GT_VOCA) {
        Some(win) => {
            match win.is_closable() {
                Ok(_) => { win.close().unwrap() },
                Err(_) => {}
            }
        },
        None => {}
    }
}



fn main() {
    tauri::Builder::default()
        .manage(Storage { store: Default::default() })
        .invoke_handler(tauri::generate_handler![
            google_translator_hi,
            google_translator_ua,
            close_all_text_win,
            google_voca_close,
            google_voca,
            vocabulary
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}


const INIT_SCRIPT_HI: &str = r#"
    const interval = setInterval(() => {
        const spans = document.getElementsByTagName('span');
        console.log(spans.length);
        if(spans.length > 400) {
            for(let i = 0; i < spans.length; i++){
                console.log(`span #${i}: ${spans[i].innerText}`);
            }
            clearInterval(interval);
            interval = null;
        }
    }, 600);
"#;