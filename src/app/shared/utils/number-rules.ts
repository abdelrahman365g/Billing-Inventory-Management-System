const NUMBER = /^-?\d+(\.\d+)?$/;

export interface NumberRules {
  required?: boolean; // blank is an error
  positive?: boolean; // must be > 0 (otherwise >= 0)
  max?: number;
}

// returns the SRS-style message, or null when the text is fine
export function numberError(label: string, raw: string, rules: NumberRules = {}): string | null {
  const text = raw.trim();

  if (text === '') return rules.required ? `${label} is Required` : null;
  if (!NUMBER.test(text)) return `${label} must be a valid number`;

  const value = Number(text);
  if (rules.positive) {
    if (value <= 0) return `${label} Must be Greater than Zero`;
  } else if (value < 0) {
    return `${label} Must be Greater than or equal Zero`;
  }
  if (rules.max !== undefined && value > rules.max) {
    return `${label} cannot exceed ${rules.max}`;
  }
  return null;
}

// blank or invalid text counts as 0 (used for live totals)
export function parseNumber(raw: string): number {
  const text = raw.trim();
  return NUMBER.test(text) ? Number(text) : 0;
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// shape returned from a Signal Forms validate() callback
export function asValidationError(message: string | null) {
  return message ? { kind: 'invalid', message } : null;
}
