import { format, type BuiltInParserName } from "prettier";
import type { CodeSnippetLanguage } from "@/db/schema";

const PRETTIER_PARSER: Partial<Record<CodeSnippetLanguage, BuiltInParserName>> =
  {
    typescript: "typescript",
    javascript: "babel",
    html: "html",
    css: "css",
  };

/**
 * Best-effort format before save. Prettier covers TS/JS/HTML/CSS.
 * Python is normalized lightly (Prettier has no solid Python parser here).
 * If formatting fails, the original body is kept so sharing never blocks.
 */
export async function formatSnippetBody(
  language: CodeSnippetLanguage,
  body: string,
): Promise<string> {
  const trimmed = body.replace(/\r\n/g, "\n").trimEnd();
  if (!trimmed) return trimmed;

  const parser = PRETTIER_PARSER[language];
  if (parser) {
    try {
      return (
        await format(trimmed, {
          parser,
          semi: true,
          singleQuote: false,
          trailingComma: "all",
          printWidth: 80,
          tabWidth: 2,
          htmlWhitespaceSensitivity: "css",
        })
      ).replace(/\n$/, "");
    } catch {
      return trimmed;
    }
  }

  if (language === "python") {
    return normalizePython(trimmed);
  }

  return trimmed;
}

/** Light cleanup only — not a full Black/Ruff format. */
function normalizePython(source: string): string {
  return source
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}
