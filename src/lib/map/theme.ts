// captures the canvas palette once at engine creation so layers never query styles while drawing
export interface MapTheme {
  bg: string;
  line: string;
  lineStrong: string;
  fg3: string;
}

// reads the existing design tokens without duplicating colour values in imperative map code
export function readMapTheme(element: Element): MapTheme {
  const styles = getComputedStyle(element);
  return {
    bg: styles.getPropertyValue("--color-bg").trim(),
    line: styles.getPropertyValue("--color-line").trim(),
    lineStrong: styles.getPropertyValue("--color-line-strong").trim(),
    fg3: styles.getPropertyValue("--color-fg-3").trim(),
  };
}
