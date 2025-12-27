(function (global) {
  const toText = (value) => {
    if (value == null) return "";
    return String(value).trim();
  };

  const normalizeParts = (parts) => ({
    final: toText(parts.final),
    short: toText(parts.short),
    full: toText(parts.full),
  });

  const tryParseJson = (raw) => {
    const first = raw.indexOf("{");
    const last = raw.lastIndexOf("}");
    if (first === -1 || last <= first) return null;
    const candidate = raw.slice(first, last + 1);
    try {
      const parsed = JSON.parse(candidate);
      if (!parsed || typeof parsed !== "object") return null;
      if (
        typeof parsed.final !== "string" &&
        typeof parsed.short !== "string" &&
        typeof parsed.full !== "string"
      ) {
        return null;
      }
      return normalizeParts(parsed);
    } catch (e) {
      return null;
    }
  };

  const tryParseMarkers = (raw) => {
    const markerRe = /(?:^|\n)\s*(ANSWER|FINAL|ОТВЕТ|SHORT|КРАТКО|FULL|РАЗБОР|ОБЪЯСНЕНИЕ)\s*:\s*/gi;
    const matches = Array.from(raw.matchAll(markerRe));
    if (matches.length === 0) return null;

    const result = { final: "", short: "", full: "" };
    for (let i = 0; i < matches.length; i += 1) {
      const label = matches[i][1].toLowerCase();
      const start = matches[i].index + matches[i][0].length;
      const end = i + 1 < matches.length ? matches[i + 1].index : raw.length;
      const value = raw.slice(start, end).trim();

      if (label === "answer" || label === "final" || label === "ответ") {
        result.final = value;
      } else if (label === "short" || label === "кратко") {
        result.short = value;
      } else if (label === "full" || label === "разбор" || label === "объяснение") {
        result.full = value;
      }
    }

    if (!result.final && !result.short && !result.full) return null;
    return result;
  };

  function parseSolution(text) {
    const raw = toText(text);
    if (!raw) return { final: "", short: "", full: "" };

    const jsonParsed = tryParseJson(raw);
    if (jsonParsed) return jsonParsed;

    const markerParsed = tryParseMarkers(raw);
    if (markerParsed) return markerParsed;

    return { final: "", short: "", full: raw };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { parseSolution };
  }

  if (global) {
    global.parseSolution = parseSolution;
  }
})(typeof window !== "undefined" ? window : globalThis);
