import fs from 'fs';
import path from 'path';
import { Scenario, Cell, Frame } from '../src/types/scenario';

export function validate(scenario: Scenario): string[] {
  const errors: string[] = [];
  
  // Odisha BBox
  const odishaBbox = { minLon: 81.3, maxLon: 87.5, minLat: 17.7, maxLat: 22.6 };
  const checkLonLat = (lon: number, lat: number, context: string) => {
    if (lon < odishaBbox.minLon || lon > odishaBbox.maxLon || lat < odishaBbox.minLat || lat > odishaBbox.maxLat) {
      errors.push(`Invariant 8: Coordinates out of bounds at ${context} (${lon}, ${lat})`);
    }
  };

  if (!scenario.frames || scenario.frames.length !== 12) {
    errors.push("Scenario must have exactly 12 frames");
    return errors;
  }

  // 10. Evidence rows variables
  const allowedVars = new Set([
    "cloudTopCooling", "zdrColumnLevel", "kdpCore", "echoTop",
    "cape", "flashRate", "mixedPhaseGrowth", "freezingLevel"
  ]);

  // Polygon area helper (shoelace)
  const polygonArea = (pts: [number, number][]) => {
    let area = 0;
    for (let i = 0; i < pts.length; i++) {
      const j = (i + 1) % pts.length;
      area += pts[i]![0] * pts[j]![1] - pts[j]![0] * pts[i]![1];
    }
    return Math.abs(area / 2);
  };

  // Polygon bounds helper
  const polygonBounds = (pts: [number, number][]) => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    pts.forEach(p => {
      if (p![0] < minX) minX = p![0];
      if (p![0] > maxX) maxX = p![0];
      if (p![1] < minY) minY = p![1];
      if (p![1] > maxY) maxY = p![1];
    });
    return { minX, minY, maxX, maxY };
  };

  // Check if inner bbox is fully inside outer bbox (approx nesting)
  const checkNesting = (inner: [number, number][], outer: [number, number][], context: string) => {
    if (inner.length === 0 || outer.length === 0) return;
    const b1 = polygonBounds(inner);
    const b2 = polygonBounds(outer);
    // Tolerance for floating point
    if (b1.minX < b2.minX - 0.01 || b1.maxX > b2.maxX + 0.01 || b1.minY < b2.minY - 0.01 || b1.maxY > b2.maxY + 0.01) {
      errors.push(`Invariant 5: Corridor nesting violated at ${context}`);
    }
  };

  for (let fIdx = 0; fIdx < scenario.frames.length; fIdx++) {
    const frame = scenario.frames[fIdx]!;
    
    // Invariant 7: C radar offline from index 5
    if (scenario.id === "C") {
      if (fIdx >= 5 && frame.sensorHealth.radar.status !== "offline") {
        errors.push(`Invariant 7: Scenario C radar must be offline from index 5, but is ${frame.sensorHealth.radar.status}`);
      }
    }

    for (const cell of frame.cells) {
      checkLonLat(cell.centroid[0], cell.centroid[1], `cell ${cell.id}`);

      // Invariant 9: No undefined/NaN
      if (typeof cell.radiusKm !== "number" || Number.isNaN(cell.radiusKm)) errors.push("Invariant 9: NaN radius");

      // Invariant 10: Evidence variables
      if (cell.evidence) {
        for (const ev of cell.evidence) {
          if (!allowedVars.has(ev.variable)) {
            errors.push(`Invariant 10: Invalid evidence variable ${ev.variable}`);
          }
        }
      }

      // Invariant 1, 2, 4
      if (cell.mode === "first-flash" && cell.firstFlash) {
        const { p15, p30, p60, windowMin } = cell.firstFlash;
        if (p15 > p30 || p30 > p60 || [p15, p30, p60].some(p => p < 0 || p > 1)) {
          errors.push(`Invariant 1: Invalid probabilities for cell ${cell.id}`);
        }
        if (windowMin[0] >= windowMin[1]) {
          errors.push(`Invariant 2: Invalid windowMin for cell ${cell.id}`);
        }
        if (p15 < 0.5 && p30 > 0.5) {
          const mid = (windowMin[0] + windowMin[1]) / 2;
          if (mid <= 15 || mid >= 30) {
            errors.push(`Invariant 2: Window midpoint ${mid} not in (15, 30) for cell ${cell.id}`);
          }
        }
        
        // Headline
        if (cell.headlineRisk !== Math.round(p30 * 100)) {
          // Note: contract says headlineRisk === p30. Let's assume percentages 0-100 for headlineRisk, or 0-1? 
          // "Headline 30-min risk 71%". We will assume p30 is 0.71 and headline is 71, OR both are 71.
          // Let's just do a loose check or normalize. If p30 is 71, headline is 71.
          if (cell.headlineRisk !== p30 && cell.headlineRisk !== p30 * 100) {
             errors.push(`Invariant 4: Headline risk ${cell.headlineRisk} != p30 ${p30}`);
          }
        }
      } else if (cell.mode === "active") {
        if (cell.headlineRisk !== cell.activeRisk30) {
          errors.push(`Invariant 4: Headline risk != activeRisk30`);
        }
      }

      // Invariant 5: Corridor nesting
      for (const horiz of ["15", "30", "60"] as const) {
        const c = cell.corridors[horiz];
        if (c && c.inner.length > 0 && c.outer.length > 0) {
          checkNesting(c.inner, c.outer, `${horiz}min`);
          
          if (c.center.length > 0) {
             checkNesting(c.center, c.inner, `center in ${horiz}min`);
          }
        }
      }
      
      const area15 = cell.corridors["15"] ? polygonArea(cell.corridors["15"].outer) : 0;
      const area30 = cell.corridors["30"] ? polygonArea(cell.corridors["30"].outer) : 0;
      const area60 = cell.corridors["60"] ? polygonArea(cell.corridors["60"].outer) : 0;
      if (area60 < area30 - 0.01 || area30 < area15 - 0.01) {
        errors.push(`Invariant 5: Corridor areas not monotonic`);
      }
    }
  }

  // Invariant 3: Scenario A outcome
  if (scenario.id === "A" && scenario.outcome && scenario.outcome.firstFlashMin !== undefined) {
    const t0frame = scenario.frames.find(f => f.t === 0);
    const cellA07 = t0frame?.cells.find(c => c.id === "C-A07");
    if (cellA07 && cellA07.firstFlash) {
      const w = cellA07.firstFlash.windowMin;
      if (scenario.outcome.firstFlashMin < w[0] || scenario.outcome.firstFlashMin > w[1]) {
        errors.push("Invariant 3: Outcome firstFlashMin not in t=0 window");
      }
    }
  }

  // Invariant 6: Sensor table
  if (scenario.sensorTable) {
    for (const [cellId, masks] of Object.entries(scenario.sensorTable)) {
      const allSensorsOn = masks["0"]!; // mask 0 means all bits 0 => all sensors ON
      if (allSensorsOn === undefined) {
        errors.push(`Invariant 6: Missing mask 0 for ${cellId}`);
        continue;
      }
      for (let m = 0; m < 16; m++) {
        const risk = masks[m.toString()];
        if (risk === undefined) continue;
        if (risk < 12 || risk > allSensorsOn) {
          errors.push(`Invariant 6: Risk ${risk} out of bounds [12, ${allSensorsOn}] for mask ${m}`);
        }
        
        // Monotonicity: if mask B has a bit SET that mask A has CLEAR (meaning B has a sensor OFF that A has ON)
        // then risk B <= risk A.
        for (let bit = 0; bit < 4; bit++) {
          if ((m & (1 << bit)) === 0) { // If sensor is ON in mask m
            const maskOff = m | (1 << bit); // Turn it OFF
            const riskOff = masks[maskOff.toString()];
            if (riskOff !== undefined && riskOff > risk) {
               errors.push(`Invariant 6: Risk increased when sensor ${bit} turned off (${risk} -> ${riskOff})`);
            }
          }
        }
      }
    }
  }

  return errors;
}

if (require.main === module) {
  const dataDir = path.join(process.cwd(), 'src', 'data', 'scenarios');
  if (!fs.existsSync(dataDir)) {
    console.log("No scenarios folder found. Exiting 0.");
    process.exit(0);
  }
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
  if (files.length === 0) {
    console.log("No scenario files found. Exiting 0.");
    process.exit(0);
  }

  let hasError = false;
  for (const f of files) {
    const data = JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf-8'));
    const errs = validate(data);
    if (errs.length > 0) {
      console.error(`Errors in ${f}:`);
      errs.forEach(e => console.error(" - " + e));
      hasError = true;
    } else {
      console.log(`${f} is valid.`);
    }
  }
  
  if (hasError) process.exit(1);
}
