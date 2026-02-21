import { createRequire } from "module";
import JSZip from "jszip";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

function base64ToBuffer(base64) {
  const cleaned = base64.replace(/^data:.*;base64,/, "");
  return Buffer.from(cleaned, "base64");
}

function normalizeWhitespace(s) {
  return String(s).replace(/\s+/g, " ").trim();
}

function decodeXmlEntities(input) {
  return input
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&#39;", "'");
}

export async function extractTextFromPdf(buffer) {
  const data = await pdfParse(buffer);
  return normalizeWhitespace(data?.text || "");
}

export async function extractTextFromPptx(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const slidePaths = Object.keys(zip.files)
    .filter((p) => /^ppt\/slides\/slide\d+\.xml$/i.test(p))
    .sort((a, b) => {
      const an = parseInt(a.match(/slide(\d+)\.xml/i)?.[1] ?? "0", 10);
      const bn = parseInt(b.match(/slide(\d+)\.xml/i)?.[1] ?? "0", 10);
      return an - bn;
    });

  const texts = [];
  for (const path of slidePaths) {
    const xml = await zip.files[path].async("string");
    const matches = [...xml.matchAll(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g)];
    for (const m of matches) {
      const t = decodeXmlEntities(m[1] ?? "");
      const cleaned = normalizeWhitespace(t);
      if (cleaned) texts.push(cleaned);
    }
    texts.push("\n");
  }
  return normalizeWhitespace(texts.join(" "));
}

export function getExtractor(fileName, mimeType) {
  const ext = (fileName || "").toLowerCase().split(".").pop() || "";
  if (ext === "pptx" || (mimeType || "").includes("presentation")) return extractTextFromPptx;
  if (ext === "pdf" || (mimeType || "").includes("pdf")) return extractTextFromPdf;
  return null;
}

export { base64ToBuffer };
