fn main() {
    println!("cargo:rerun-if-changed=../dist");
    println!("cargo:rerun-if-changed=DBMaps.rc");
    println!("cargo:rerun-if-changed=assets/DBMaps.ico");
    embed_resource::compile("DBMaps.rc", embed_resource::NONE)
        .manifest_optional()
        .expect("Cannot embed DBMaps icon");
}
