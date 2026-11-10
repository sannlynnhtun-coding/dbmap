use serde::{Deserialize, Serialize};
use std::{
    collections::BTreeMap,
    fs,
    io::Write,
    path::{Path, PathBuf},
};

#[derive(Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Snapshot {
    pub id: String,
    pub name: String,
    pub content: String,
    pub dirty: bool,
    pub force_save_as: bool,
}

#[derive(Default)]
pub struct Document {
    pub snapshot: Snapshot,
    pub path: Option<PathBuf>,
    pub disk: Option<String>,
}

impl Document {
    pub fn open(path: PathBuf) -> Result<Self, String> {
        if !path
            .extension()
            .is_some_and(|ext| ext.eq_ignore_ascii_case("dbml"))
        {
            return Err("Choose a .dbml file.".into());
        }
        let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
        let name = path
            .file_name()
            .ok_or("Missing filename")?
            .to_string_lossy()
            .into_owned();
        Ok(Self {
            snapshot: Snapshot {
                name,
                content: content.clone(),
                ..Default::default()
            },
            path: Some(path),
            disk: Some(content),
        })
    }

    pub fn save_to(&mut self, path: &Path) -> Result<(), String> {
        if !path
            .extension()
            .is_some_and(|ext| ext.eq_ignore_ascii_case("dbml"))
        {
            return Err("Save with the .dbml extension.".into());
        }
        if self.path.as_deref() == Some(path) {
            let current = fs::read_to_string(path)
                .map_err(|e| format!("Cannot read original file: {e}. Use Save As."))?;
            if self.disk.as_deref() != Some(&current) {
                return Err("The file was changed by another application. Use Save As or reopen it; the original was not overwritten.".into());
            }
        }
        atomic_write(path, self.snapshot.content.as_bytes())?;
        self.path = Some(path.to_owned());
        self.disk = Some(self.snapshot.content.clone());
        self.snapshot.name = path.file_name().unwrap().to_string_lossy().into_owned();
        self.snapshot.dirty = false;
        self.snapshot.force_save_as = false;
        Ok(())
    }
}

fn atomic_write(path: &Path, content: &[u8]) -> Result<(), String> {
    let parent = path.parent().ok_or("Missing destination folder")?;
    let mut temporary = tempfile::NamedTempFile::new_in(parent).map_err(|e| e.to_string())?;
    temporary.write_all(content).map_err(|e| e.to_string())?;
    temporary.as_file().sync_all().map_err(|e| e.to_string())?;
    temporary.persist(path).map_err(|e| e.error.to_string())?;
    Ok(())
}

#[derive(Default)]
pub struct Workspace {
    pub documents: BTreeMap<String, Document>,
    pub pending: Option<Document>,
}

impl Workspace {
    pub fn update(&mut self, snapshot: Snapshot) {
        let id = snapshot.id.clone();
        self.documents.entry(id).or_default().snapshot = snapshot;
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn save_replaces_file_and_detects_external_changes() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("မြန်မာ schema.dbml");
        fs::write(&path, "original").unwrap();
        let mut document = Document::open(path.clone()).unwrap();
        document.snapshot.content = "edited".into();
        document.save_to(&path).unwrap();
        assert_eq!(fs::read_to_string(&path).unwrap(), "edited");
        fs::write(&path, "external").unwrap();
        assert!(document.save_to(&path).is_err());
        assert_eq!(fs::read_to_string(&path).unwrap(), "external");
        assert_eq!(document.snapshot.content, "edited");
    }
    #[test]
    fn failed_replace_keeps_destination_and_rejects_other_extensions() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("locked.dbml");
        fs::create_dir(&path).unwrap();
        assert!(atomic_write(&path, b"edited").is_err());
        assert!(path.is_dir());
        assert!(
            Document::default()
                .save_to(&dir.path().join("wrong.sql"))
                .is_err()
        );
    }
    #[test]
    fn read_only_original_is_not_destroyed() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("readonly.dbml");
        fs::write(&path, "original").unwrap();
        let mut doc = Document::open(path.clone()).unwrap();
        let original_permissions = fs::metadata(&path).unwrap().permissions();
        let mut permissions = original_permissions.clone();
        permissions.set_readonly(true);
        fs::set_permissions(&path, permissions).unwrap();
        doc.snapshot.content = "edited".into();
        assert!(doc.save_to(&path).is_err());
        assert_eq!(fs::read_to_string(&path).unwrap(), "original");
        fs::set_permissions(&path, original_permissions).unwrap();
    }
}
