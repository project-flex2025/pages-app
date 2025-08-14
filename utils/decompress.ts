// utils/decompress.ts
import { inflate } from "pako";
import { deflate } from "pako";

export function decompressJson(base64String: string): | null {
  try {
    const binaryString = atob(base64String);
    const charData = binaryString.split("").map((c) => c.charCodeAt(0));
    const binData = new Uint8Array(charData);

    try {
      const decompressed = inflate(binData, { to: "string" });
      return JSON.parse(decompressed);
    } catch (inflateError) {
      console.warn("Decompression failed, trying raw JSON parse...", inflateError);
      return JSON.parse(binaryString);
    }
  } catch (error) {
    console.error("Failed to decode permissions:", error);
    return null;
  }
}

// export function compressJson(data: string): string {
//   try {
//     const jsonString = JSON.stringify(data);
//     const compressed = deflate(jsonString);
//     const binaryString = Array.from(compressed)
//       .map((byte) => String.fromCharCode(byte))
//       .join("");
//     return btoa(binaryString);
//   } catch (error) {
//     console.error("Failed to compress JSON:", error);
//     return "";
//   }
// }

export function compressJson(data: string): string {
  try {
    const compressed = deflate(data); // no JSON.stringify here
    const binaryString = Array.from(compressed)
      .map((byte) => String.fromCharCode(byte))
      .join("");
    return btoa(binaryString);
  } catch (error) {
    console.error("Failed to compress JSON:", error);
    return "";
  }
}
