// captures canvas styling once from the shared css token system
export interface MapTheme {
  background: string;
  foreground: string;
  line: string;
  lineStrong: string;
  foregroundTertiary: string;
  observed: string;
  forecast: string;
  risk: string;
  fontSans: string;
  fontMono: string;
}

// reads the design tokens used by imperative map drawing
export function readMapTheme(element: Element): MapTheme {
  const styles = getComputedStyle(element);
  return {
    background: styles.getPropertyValue("--color-bg").trim(),
    foreground: styles.getPropertyValue("--color-fg").trim(),
    line: styles.getPropertyValue("--color-line").trim(),
    lineStrong: styles.getPropertyValue("--color-line-strong").trim(),
    foregroundTertiary: styles.getPropertyValue("--color-fg-3").trim(),
    observed: styles.getPropertyValue("--color-observed").trim(),
    forecast: styles.getPropertyValue("--color-forecast").trim(),
    risk: styles.getPropertyValue("--color-risk").trim(),
    fontSans: styles.getPropertyValue("--font-sans").trim(),
    fontMono: styles.getPropertyValue("--font-mono").trim(),
  };
}
