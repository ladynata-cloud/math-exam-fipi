/* Number or fraction as written in a pupil's answer. Empty fields are distinct from invalid input. */
function parseParameterNumber(value) {
  const text = String(value == null ? '' : value).trim().replace(/−/g, '-').replace(/,/g, '.');
  if (!text) return null;
  const parts = text.split('/').map(part => part.trim());
  if (parts.length > 2 || !parts.every(part => /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(part))) return NaN;
  const numbers = parts.map(Number);
  if (!numbers.every(Number.isFinite) || numbers[1] === 0) return NaN;
  const result = numbers.length === 1 ? numbers[0] : numbers[0] / numbers[1];
  return Number.isFinite(result) ? result : NaN;
}
