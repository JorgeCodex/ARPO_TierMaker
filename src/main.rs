#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use serde::Serialize;
use std::{fs, path::Path};
use tauri::WebviewWindow;
#[derive(Serialize)]
#[serde(rename_all="camelCase")]
struct Reply { canceled: bool, ok: bool, file_path: Option<String>, file_name: Option<String>, text: Option<String>, error: Option<String> }
fn canceled() -> Reply { Reply { canceled:true, ok:false, file_path:None, file_name:None, text:None, error:None } }
fn result(path:&Path, text:Option<String>, error:Option<String>) -> Reply { Reply { canceled:false, ok:error.is_none(), file_path:Some(path.to_string_lossy().into_owned()), file_name:path.file_name().map(|s|s.to_string_lossy().into_owned()), text,error } }
#[tauri::command] async fn open_project() -> Reply {
 let Some(path)=rfd::FileDialog::new().set_title("Abrir plantilla A.R.P.O.").add_filter("Plantilla A.R.P.O.",&["json"]).pick_file() else { return canceled() };
 match fs::read_to_string(&path) { Ok(t)=>result(&path,Some(t.trim_start_matches('\u{feff}').to_string()),None), Err(e)=>result(&path,None,Some(e.to_string())) }
}
fn write(path:&Path,text:&str)->Reply { match fs::write(path,text) { Ok(())=>result(path,None,None), Err(e)=>result(path,None,Some(e.to_string())) } }
#[tauri::command] async fn save_project(file_path:String,text:String)->Reply { write(Path::new(&file_path),&text) }
#[tauri::command] async fn save_project_as(suggested_name:String,text:String)->Reply {
 let name=Path::new(&suggested_name).file_name().and_then(|s|s.to_str()).unwrap_or("tierlist.arpo.json");
 let Some(path)=rfd::FileDialog::new().set_title("Guardar plantilla A.R.P.O.").set_file_name(name).add_filter("Plantilla A.R.P.O.",&["json"]).save_file() else { return canceled() };
 let path=if path.extension().is_none(){path.with_extension("json")}else{path}; write(&path,&text)
}
#[tauri::command] fn minimize(window:WebviewWindow)->Result<(),String>{window.minimize().map_err(|e|e.to_string())}
#[tauri::command] fn toggle_maximize(window:WebviewWindow)->Result<bool,String>{if window.is_maximized().map_err(|e|e.to_string())? {window.unmaximize()}else{window.maximize()}.map_err(|e|e.to_string())?;window.is_maximized().map_err(|e|e.to_string())}
#[tauri::command] fn is_maximized(window:WebviewWindow)->Result<bool,String>{window.is_maximized().map_err(|e|e.to_string())}
#[tauri::command] fn close_window(window:WebviewWindow)->Result<(),String>{window.close().map_err(|e|e.to_string())}
#[tauri::command] fn drag_window(window:WebviewWindow)->Result<(),String>{window.start_dragging().map_err(|e|e.to_string())}
fn main(){tauri::Builder::default().invoke_handler(tauri::generate_handler![open_project,save_project,save_project_as,minimize,toggle_maximize,is_maximized,close_window,drag_window]).run(tauri::generate_context!()).expect("Error al iniciar ARPO TierMaker");}
