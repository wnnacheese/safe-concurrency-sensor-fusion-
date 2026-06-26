//! Build script: inject missing esp-hal linker scripts
//!
//! xtensa-lx-rt v0.22.0's link.x include memory.x lalu define SECTIONS,
//! tapi alias.x butuh memory regions dari memory.x SEBELUM dia jalan.
//! Inject memory.x + alias.x + esp32s3.x + hal-defaults.x secara eksplisit.

fn main() {
    println!("cargo:rustc-link-arg=-Tmemory.x"); // define irom_seg, dram_seg, dll
    println!("cargo:rustc-link-arg=-Talias.x"); // REGION_ALIAS ROTEXT, RWDATA, dll
    println!("cargo:rustc-link-arg=-Tesp32s3.x"); // section layout + stack.x
    println!("cargo:rustc-link-arg=-Thal-defaults.x"); // device.x (USB_DEVICE, CORE0_DRAM0_PMS, dll)
    println!("cargo:rerun-if-changed=build.rs");
}
