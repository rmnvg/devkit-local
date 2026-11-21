/** {{ variable }} templates: detect variables, render, report missing values. */
export const VAR_RE = /\{\{\s*([A-Za-z_][\w.-]*)\s*\}\}/g;

export interface Variable {
  name: string;
  count: number;
}

export function findVariables(template: string): Variable[] {
  const counts = new Map<string, number>();
  for (const m of template.matchAll(VAR_RE)) counts.set(m[1]!, (counts.get(m[1]!) ?? 0) + 1);
  return [...counts].map(([name, count]) => ({ name, count }));
}

export interface Rendered {
  text: string;
  missing: string[];
}

/** Replace {{var}}; unknown/empty variables are left in place and reported. `\{{` escapes. */
export function render(template: string, values: Record<string, string>): Rendered {
  const missing = new Set<string>();
  const text = template.replace(/(\\)?\{\{\s*([A-Za-z_][\w.-]*)\s*\}\}/g, (whole, esc: string | undefined, name: string) => {
    if (esc) return whole.slice(1);
    const v = values[name];
    if (v === undefined || v === '') {
      missing.add(name);
      return whole;
    }
    return v;
  });
  return { text, missing: [...missing] };
}

/** Find malformed braces like `{{ name }` or `{ name }}` that are probably typos. */
export function lintTemplate(template: string): string[] {
  const issues: string[] = [];
  const stripped = template.replace(VAR_RE, '');
  if (/\{\{/.test(stripped)) issues.push('Found "{{" without a matching variable name and "}}".');
  if (/\}\}/.test(stripped)) issues.push('Found "}}" without a matching "{{".');
  return issues;
}
