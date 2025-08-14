// src/utils/base64Utils.ts

export const encodeBase64 = (data: string): string => {
  return typeof window !== "undefined"
    ? btoa(data)
    : Buffer.from(data).toString("base64");
};

export const decodeBase64 = (encoded: string): string => {
  return typeof window !== "undefined"
    ? atob(encoded)
    : Buffer.from(encoded, "base64").toString("utf-8");
};
