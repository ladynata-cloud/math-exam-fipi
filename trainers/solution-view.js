(() => {
  const toText = (value) => {
    if (value === null || value === undefined) return "";
    return String(value);
  };

  const extractParts = (input) => {
    const empty = { answer: "", short: "", details: "" };
    if (!input) return empty;

    if (typeof input === "object" && !Array.isArray(input)) {
      const answer = toText(input.answer ?? input.Answer ?? "");
      const short = toText(input.short ?? input.brief ?? input.summary ?? "");
      const details = toText(input.details ?? input.explanation ?? input.solution ?? "");
      if (answer || short || details) {
        return { answer, short, details };
      }
      return empty;
    }

    const text = toText(input).trim();
    if (!text) return empty;

    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return extractParts(parsed);
      }
    } catch (e) {
      // fall through to plain-text fallback
    }

    return { answer: "", short: "", details: text };
  };

  const mergeParts = (base, override) => {
    if (!override) return base;
    return {
      answer: base.answer || toText(override.answer),
      short: base.short || toText(override.short),
      details: base.details || toText(override.details),
    };
  };

  const renderSolutionView = (container, payload = {}) => {
    if (!container) return;
    const parsed = extractParts(payload.text ?? payload);
    const parts = mergeParts(parsed, payload.parts);

    container.innerHTML = `
      <div class="solution-view">
        <div class="solution-view__row"><b>Ответ:</b> <span class="solution-view__answer"></span></div>
        <div class="solution-view__row"><b>Коротко:</b> <span class="solution-view__short"></span></div>
        <details class="solution-view__details">
          <summary><b>Разбор</b></summary>
          <div class="solution-view__details-body">
            ${payload.intro ? `<div class="solution-view__intro"></div>` : ""}
            <div class="solution-view__details-text"></div>
          </div>
        </details>
      </div>
    `;

    const answerEl = container.querySelector(".solution-view__answer");
    const shortEl = container.querySelector(".solution-view__short");
    const detailsTextEl = container.querySelector(".solution-view__details-text");
    const introEl = container.querySelector(".solution-view__intro");

    if (answerEl) answerEl.textContent = parts.answer.trim() || "—";
    if (shortEl) shortEl.textContent = parts.short.trim() || "—";
    if (detailsTextEl) detailsTextEl.textContent = parts.details.trim() || "—";
    if (introEl && payload.intro) introEl.textContent = toText(payload.intro).trim();

    return parts;
  };

  window.renderSolutionView = renderSolutionView;
})();
