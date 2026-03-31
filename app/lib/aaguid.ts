// Maps AAGUIDs to human readable device names
// Source: github.com/passkeydeveloper/passkey-authenticator-aaguids
// This covers the most common consumer devices

const AAGUID_MAP: Record<string, { name: string; emoji: string }> = {
  // Apple
  "fbfc3007-154e-4ecc-8c0b-6e020557d7bd": { name: "Apple iCloud Keychain", emoji: "🍎" },
  "adce0002-35bc-c60a-648b-0b25f1f05503": { name: "Apple iCloud Keychain", emoji: "🍎" },

  // Google
  "b93fd961-f2e6-462f-b122-82002247de78": { name: "Google Password Manager", emoji: "🔵" },
  "ea9b8d66-4d01-1d21-3ce4-b6b48cb575d4": { name: "Google Password Manager", emoji: "🔵" },

  // Samsung
  "53414d53-554e-4700-0000-000000000000": { name: "Samsung Pass", emoji: "🤖" },

  // Windows Hello
  "08987058-cadc-4b81-b6e1-30de50dcbe96": { name: "Windows Hello", emoji: "🪟" },
  "9ddd1817-af5a-4672-a2b9-3e3dd95000a9": { name: "Windows Hello", emoji: "🪟" },
  "6028b017-b1d4-4c02-b4b3-afcdafc96bb2": { name: "Windows Hello", emoji: "🪟" },

  // 1Password
  "bada5566-a7aa-401f-bd96-45619a55120d": { name: "1Password", emoji: "🔑" },

  // Dashlane
  "d548826e-79b4-db40-a3d8-11116f7e8349": { name: "Dashlane", emoji: "🔑" },

  
  // YubiKey hardware keys
  "2fc0579f-8113-47ea-b116-bb5a8db9202a": { name: "YubiKey 5", emoji: "🔐" },
  "73bb0cd4-e502-49b8-9c6f-b59445bf720b": { name: "YubiKey 5 NFC", emoji: "🔐" },
};

const TRANSPORT_FALLBACK: Record<string, { name: string; emoji: string }> = {
  internal: { name: "This device (biometric)", emoji: "📱" },
  hybrid:   { name: "Phone or tablet passkey", emoji: "📲" },
  usb:      { name: "USB security key", emoji: "🔐" },
  nfc:      { name: "NFC security key", emoji: "🔐" },
  ble:      { name: "Bluetooth security key", emoji: "🔐" },
};
// Note: Some authenticators (like 1Password) reuse the same AAGUID for multiple platforms, so we can use transport hints to provide a better fallback name/emoji in those cases.
export function lookupDevice(
  aaguid: string | undefined,
  transports: string[] = []
): { name: string; emoji: string } {
  // Try AAGUID lookup first
  if (aaguid && aaguid !== "00000000-0000-0000-0000-000000000000") {
    const match = AAGUID_MAP[aaguid.toLowerCase()];
    if (match) return match;
  }

  // Fall back to transport hints
  for (const transport of transports) {
    const match = TRANSPORT_FALLBACK[transport];
    if (match) return match;
  }

  // Unknown device
  return { name: "Unknown device", emoji: "🔑" };
}

// Converts the raw AAGUID bytes from WebAuthn into a UUID string
// Format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
export function formatAaguid(aaguid: Uint8Array | undefined): string {
  if (!aaguid || aaguid.length !== 16) {
    return "00000000-0000-0000-0000-000000000000";
  }
  const hex = Array.from(aaguid)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}