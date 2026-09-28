import { describe, it, expect } from 'vitest';
import { validate } from '../scripts/validate-scenarios';
import { Scenario } from '../src/types/scenario';

const createValidScenario = (): Scenario => {
  return {
    id: "A",
    name: "Valid",
    story: "Story",
    region: { bbox: [82.0, 18.0, 83.0, 19.0], center: [82.5, 18.5], zoom: 7 },
    t0IsoIst: "2026-05-14T16:00:00+05:30",
    frames: Array.from({ length: 12 }, (_, i) => ({
      t: (i - 6) * 10,
      kind: i <= 6 ? "obs" : "forecast",
      cells: [
        {
          id: "C-A07",
          centroid: [82.5, 18.5],
          radiusKm: 5,
          reflectivityDbz: 45,
          stage: "developing",
          mode: "first-flash",
          cloudTopCoolingKmin: 2,
          echoTopKm: 12,
          zdrColumnLevel: "0C",
          kdpCore: 1,
          updraftMs: 15,
          cape: 2500,
          freezingLevelKm: 5,
          flashRate: 0,
          motion: { dirDeg: 90, speedKmh: 20 },
          corridors: {
            "15": { center: [], inner: [[82.4, 18.4], [82.6, 18.4], [82.6, 18.6], [82.4, 18.6]], outer: [[82.3, 18.3], [82.7, 18.3], [82.7, 18.7], [82.3, 18.7]] },
            "30": { center: [], inner: [[82.4, 18.4], [82.6, 18.4], [82.6, 18.6], [82.4, 18.6]], outer: [[82.2, 18.2], [82.8, 18.2], [82.8, 18.8], [82.2, 18.8]] },
            "60": { center: [], inner: [[82.4, 18.4], [82.6, 18.4], [82.6, 18.6], [82.4, 18.6]], outer: [[82.1, 18.1], [82.9, 18.1], [82.9, 18.9], [82.1, 18.9]] }
          },
          decomposition: { motion: 1, growth: 0, initiation: 0, initiationSites: [] },
          firstFlash: { p15: 0.42, p30: 0.71, p60: 0.89, windowMin: [18, 27], confidence: "Moderate", region: [], minutesSinceAppeared: 10 },
          headlineRisk: 71,
          evidence: []
        }
      ],
      lightning: [],
      sensorHealth: {
        radar: { status: "online", dataAgeMin: 0 },
        insat: { status: "online", dataAgeMin: 0 },
        lightning: { status: "online", dataAgeMin: 0 },
        nwp: { status: "online", dataAgeMin: 0 }
      },
      flashDensity: []
    })),
    sensorTable: {
      "C-A07": {
        "0": 71,
        "1": 46, // radar off
        "2": 63, // insat off
        "4": 69, // lightning off
        "8": 67, // nwp off
        "15": 15 // all off
      }
    },
    outcome: { firstFlashMin: 25, observedFlashes: [], observedPath: [] },
    events: []
  };
};

describe('Data Invariants', () => {
  it('passes on valid scenario', () => {
    const sc = createValidScenario();
    expect(validate(sc)).toEqual([]);
  });

  it('fails Invariant 1: p15 <= p30 <= p60', () => {
    const sc = createValidScenario();
    sc.frames[0]!.cells[0]!.firstFlash!.p30 = 0.3; // p15=0.42 > p30
    const errs = validate(sc);
    expect(errs).toEqual(expect.arrayContaining([expect.stringContaining('Invariant 1')]));
  });

  it('fails Invariant 2: windowMin lo < hi', () => {
    const sc = createValidScenario();
    sc.frames[0]!.cells[0]!.firstFlash!.windowMin = [27, 18];
    const errs = validate(sc);
    expect(errs).toEqual(expect.arrayContaining([expect.stringContaining('Invariant 2: Invalid windowMin')]));
  });

  it('fails Invariant 2: window midpoint', () => {
    const sc = createValidScenario();
    sc.frames[0]!.cells[0]!.firstFlash!.p15 = 0.4;
    sc.frames[0]!.cells[0]!.firstFlash!.p30 = 0.8;
    sc.frames[0]!.cells[0]!.firstFlash!.windowMin = [5, 10]; // midpoint 7.5 not in (15, 30)
    const errs = validate(sc);
    expect(errs).toEqual(expect.arrayContaining([expect.stringContaining('Invariant 2: Window midpoint')]));
  });

  it('fails Invariant 3: outcome firstFlashMin', () => {
    const sc = createValidScenario();
    sc.outcome.firstFlashMin = 30; // window is [18, 27]
    const errs = validate(sc);
    expect(errs).toEqual(expect.arrayContaining([expect.stringContaining('Invariant 3')]));
  });

  it('fails Invariant 4: headlineRisk === p30', () => {
    const sc = createValidScenario();
    sc.frames[0]!.cells[0]!.headlineRisk = 80; // p30 is 0.71 (71)
    const errs = validate(sc);
    expect(errs).toEqual(expect.arrayContaining([expect.stringContaining('Invariant 4')]));
  });

  it('fails Invariant 5: corridor nesting', () => {
    const sc = createValidScenario();
    // make 30min outer smaller than 15min outer
    sc.frames[0]!.cells[0]!.corridors["30"].outer = [[82.35, 18.35], [82.65, 18.35], [82.65, 18.65], [82.35, 18.65]];
    const errs = validate(sc);
    expect(errs).toEqual(expect.arrayContaining([expect.stringContaining('Invariant 5')]));
  });

  it('fails Invariant 6: sensor table bounds', () => {
    const sc = createValidScenario();
    sc.sensorTable["C-A07"]!["15"] = 5; // < 12
    const errs = validate(sc);
    expect(errs).toEqual(expect.arrayContaining([expect.stringContaining('Invariant 6: Risk 5 out of bounds')]));
  });

  it('fails Invariant 6: sensor table monotonicity', () => {
    const sc = createValidScenario();
    sc.sensorTable["C-A07"]!["1"] = 75; // radar off = 75 > all on = 71
    const errs = validate(sc);
    expect(errs).toEqual(expect.arrayContaining([expect.stringContaining('Invariant 6: Risk increased')]));
  });

  it('fails Invariant 7: Scenario C radar offline', () => {
    const sc = createValidScenario();
    sc.id = "C";
    sc.frames[5]!.sensorHealth.radar.status = "online"; // Should be offline from index 5
    const errs = validate(sc);
    expect(errs).toEqual(expect.arrayContaining([expect.stringContaining('Invariant 7')]));
  });

  it('fails Invariant 8: Odisha BBox', () => {
    const sc = createValidScenario();
    sc.frames[0]!.cells[0]!.centroid = [90, 20]; // lon 90 > 87.5
    const errs = validate(sc);
    expect(errs).toEqual(expect.arrayContaining([expect.stringContaining('Invariant 8')]));
  });

  it('fails Invariant 9: NaN radius', () => {
    const sc = createValidScenario();
    sc.frames[0]!.cells[0]!.radiusKm = NaN;
    const errs = validate(sc);
    expect(errs).toEqual(expect.arrayContaining([expect.stringContaining('Invariant 9')]));
  });

  it('fails Invariant 10: Invalid evidence variable', () => {
    const sc = createValidScenario();
    sc.frames[0]!.cells[0]!.evidence = [
      { variable: "invalidVar", label: "foo", direction: "up", delta: "1", sparkline: [] }
    ];
    const errs = validate(sc);
    expect(errs).toEqual(expect.arrayContaining([expect.stringContaining('Invariant 10')]));
  });
});
