// chooses the safe initial rail state for each responsive Mission Control layout
export function initialRailState(isDesktop: boolean): { leftOpen: boolean; rightOpen: boolean } {
  return { leftOpen: isDesktop, rightOpen: isDesktop };
}
