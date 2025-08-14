import { inflate } from "pako";

export function decompressJson(base64String: string): | null {
  try {
    const binaryString = atob(base64String);
    const charData = binaryString.split("").map(c => c.charCodeAt(0));
    const binData = new Uint8Array(charData);

    try {
      const decompressed = inflate(binData, { to: "string", windowBits: -15 }); // raw deflate
      return JSON.parse(decompressed);
    } catch (inflateError) {
      console.warn("Decompression failed, trying raw JSON parse...", inflateError);
      return null;
    }
  } catch (error) {
    console.error("Failed to decode base64 or parse JSON:", error);
    return null;
  }
}
