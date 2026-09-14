/** Maps a handful of catalogue products to real photography in
 * public/images/products (matched by product name/brand). Every other
 * product keeps rendering the sprite illustration via ProductIcon — there
 * is no photo for most of the 104-item catalogue. */
export const PRODUCT_IMAGES: Record<number, string> = {
  5: "Sapphire Pulse RX 9070 XT Display.webp",
  9: "Ryzen 7 9800X3D Product Showcase.webp",
  11: "AMD Ryzen 5 Processor Showcase.webp",
  12: "AMD Ryzen 7 7800X3D Hero Shot.webp",
  14: "Intel Core Ultra 7 Processor Showcase.webp",
  15: "Intel Core i5-14600K Product Showcase.webp",
  17: "ASUS ROG Strix B850-F Showcase.webp",
  23: "Vengeance DDR5 RGB Memory Modules.webp",
  44: "NZXT H5 Flow RGB Showcase.webp",
  49: "Noctua Chromax Black Fan Showcase.webp",
  52: "ARCTIC MX-6 Thermal Compound Kit.webp",
  63: "ASUS ROG Zephyrus G16 Gaming Setup.webp",
  64: "Lenovo Legion Pro 5 Gaming Setup.webp",
  65: "MSI Katana 15 Gaming Laptop Showcase.webp",
  66: "Dell Laptops with Intel Core Ultra Branding.webp",
  67: "ThinkPad X1 Carbon Aura Edition Showcase.webp",
  88: "Elgato Stream Deck MK.2 Product Display.webp",
  93: "TP-Link TL-SG1210MP PoE+ Switch Kit.webp",
};

export function productImageUrl(id: number): string | undefined {
  const file = PRODUCT_IMAGES[id];
  return file ? `/images/products/${encodeURIComponent(file)}` : undefined;
}
