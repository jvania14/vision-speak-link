/**
 * Rule-based ASL fingerspelling classifier operating on MediaPipe's 21
 * hand landmarks.  Recognizes the common static letters A–Y (excludes J
 * which requires motion).  Returns the best matching letter plus a
 * coarse confidence derived from how many rules agree.
 *
 * Landmark indices (MediaPipe Hands):
 *   0 wrist, 1-4 thumb, 5-8 index, 9-12 middle, 13-16 ring, 17-20 pinky
 */

export type Landmark = { x: number; y: number; z: number };

export type Prediction = { letter: string; confidence: number } | null;

const FINGER_TIPS = [4, 8, 12, 16, 20];
const FINGER_PIPS = [3, 6, 10, 14, 18];
const FINGER_MCPS = [2, 5, 9, 13, 17];

function dist(a: Landmark, b: Landmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a.z ?? 0) - (b.z ?? 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/** Hand scale = distance from wrist to middle-finger MCP — used to normalize. */
function handScale(lm: Landmark[]): number {
  return dist(lm[0], lm[9]) || 1e-6;
}

/**
 * Per-finger extension state.
 * 0 = thumb, 1 = index, 2 = middle, 3 = ring, 4 = pinky
 */
function fingerStates(lm: Landmark[]): boolean[] {
  const scale = handScale(lm);
  return FINGER_TIPS.map((tip, i) => {
    const d = dist(lm[tip], lm[0]) / scale;
    const mcpD = dist(lm[FINGER_MCPS[i]], lm[0]) / scale;
    return d > mcpD * 1.35;
  });
}

/** Normalized finger curl: 0 = straight, 1 = fully curled. */
function fingerCurl(lm: Landmark[], i: number): number {
  const tip = lm[FINGER_TIPS[i]];
  const pip = lm[FINGER_PIPS[i]];
  const mcp = lm[FINGER_MCPS[i]];
  const tipDist = dist(tip, mcp);
  const pipDist = dist(pip, mcp);
  return pipDist / (tipDist + 1e-6);
}

/** Is the thumb extended (across the palm, not just out to the side)? */
function thumbExtended(lm: Landmark[]): boolean {
  const scale = handScale(lm);
  const tipWrist = dist(lm[4], lm[0]) / scale;
  const ipWrist = dist(lm[3], lm[0]) / scale;
  const thumbIndexGap = dist(lm[4], lm[8]) / scale;
  return tipWrist > ipWrist * 1.08 && thumbIndexGap > 0.35;
}

/** Thumb is tucked across the palm toward the pinky side. */
function thumbAcrossPalm(lm: Landmark[]): boolean {
  const scale = handScale(lm);
  const dx = (lm[4].x - lm[17].x) / scale;
  const dy = (lm[4].y - lm[17].y) / scale;
  return Math.sqrt(dx * dx + dy * dy) < 0.55;
}

/** Lateral distance between two landmarks normalized by hand scale. */
function lateral(a: Landmark, b: Landmark, scale: number): number {
  return Math.abs(a.x - b.x) / scale;
}

function match(
  lm: Landmark[],
  ext: boolean[],
  curl: number[],
): { letter: string; score: number }[] {
  const scale = handScale(lm);
  const [thumb, index, middle, ring, pinky] = ext;
  const tExt = thumbExtended(lm);
  const tAcross = thumbAcrossPalm(lm);
  const results: { letter: string; score: number }[] = [];

  const add = (letter: string, score: number) => results.push({ letter, score });

  // --- A: fist, thumb to the side ---
  if (!index && !middle && !ring && !pinky && !tExt)
    add('A', tAcross ? 1.0 : 0.82);

  // --- B: flat palm, four fingers up, thumb tucked across ---
  if (index && middle && ring && pinky && tAcross)
    add('B', 1.0);
  else if (index && middle && ring && pinky && !tExt)
    add('B', 0.7);

  // --- C: curved open hand (all fingers curled but spread) ---
  {
    const openCount = ext.filter(Boolean).length;
    const avgCurl = (curl[1] + curl[2] + curl[3] + curl[4]) / 4;
    if (openCount >= 3 && avgCurl > 0.55 && avgCurl < 1.4)
      add('C', 0.8);
  }

  // --- D: index up, others curled, thumb touches middle ---
  if (index && !middle && !ring && !pinky)
    add('D', tAcross ? 1.0 : 0.85);

  // --- E: all fingers curled, thumb across ---
  if (!index && !middle && !ring && !pinky && tAcross && tExt)
    add('E', 0.9);
  else if (!index && !middle && !ring && !pinky && tExt)
    add('E', 0.6);

  // --- F: thumb+index circle, middle+ring+pinky up ---
  {
    const circleGap = dist(lm[4], lm[8]) / scale;
    if (circleGap < 0.25 && middle && ring && pinky)
      add('F', 1.0);
    else if (!index && !thumb && middle && ring && pinky)
      add('F', 0.7);
  }

  // --- G: index points sideways, thumb parallel, others curled ---
  if (index && !middle && !ring && !pinky && tExt) {
    const horizSpread = lateral(lm[4], lm[8], scale);
    if (horizSpread > 0.4) add('G', 0.85);
    else add('L', 0.8);
  }

  // --- H: index + middle up and together, others curled ---
  if (index && middle && !ring && !pinky) {
    const gap = dist(lm[8], lm[12]) / scale;
    add(gap < 0.18 ? 'H' : 'V', gap < 0.18 ? 0.9 : 0.6);
  }

  // --- I: pinky up, others curled ---
  if (!index && !middle && !ring && pinky)
    add('I', 0.9);

  // --- K: index up, middle down pointing out, thumb between ---
  if (index && !middle && !ring && !pinky && tExt) {
    const idxMidGap = lateral(lm[8], lm[12], scale);
    if (idxMidGap > 0.2) add('K', 0.75);
  }

  // --- L: index up, thumb out (L shape) ---
  if (index && !middle && !ring && !pinky && tExt) {
    const angle = Math.atan2(lm[8].y - lm[5].y, lm[8].x - lm[5].x);
    const thumbAngle = Math.atan2(lm[4].y - lm[2].y, lm[4].x - lm[2].x);
    const diff = Math.abs(angle - thumbAngle);
    if (diff > 0.6) add('L', 0.95);
  }

  // --- M: thumb under index+middle+ring, those three folded ---
  if (!index && !middle && !ring && pinky && tExt)
    add('M', 0.6);

  // --- N: thumb under index+middle, those two folded ---
  if (!index && !middle && ring && !pinky)
    add('N', 0.55);

  // --- O: all fingertips meet in a circle ---
  {
    const oGap = dist(lm[4], lm[8]) / scale;
    const allClose =
      dist(lm[8], lm[12]) / scale < 0.3 &&
      dist(lm[12], lm[16]) / scale < 0.3 &&
      dist(lm[16], lm[20]) / scale < 0.3;
    if (oGap < 0.3 && allClose) add('O', 0.95);
  }

  // --- P: like K but pointing down ---
  // (hard to distinguish from K in 2D — skip)

  // --- Q: like G but pointing down ---
  // (hard to distinguish — skip)

  // --- R: crossed index+middle, others down ---
  if (!middle && !ring && !pinky) {
    const crossGap = lateral(lm[8], lm[12], scale);
    if (crossGap < 0.08 && index) add('R', 0.8);
  }

  // --- S: fist with thumb across (like A but thumb wraps) ---
  if (!index && !middle && !ring && !pinky && tAcross && !tExt)
    add('S', 0.92);

  // --- T: thumb between index+middle (like N but thumb pokes out) ---
  if (!index && !middle && ring && !pinky && tExt)
    add('T', 0.5);

  // --- U: index + middle up and together, thumb closed ---
  if (index && middle && !ring && !pinky) {
    const gap = dist(lm[8], lm[12]) / scale;
    if (gap < 0.12 && !tExt) add('U', 0.85);
  }

  // --- V: index + middle up and spread (peace sign) ---
  if (index && middle && !ring && !pinky) {
    const gap = dist(lm[8], lm[12]) / scale;
    if (gap > 0.2) add('V', 0.9);
  }

  // --- W: index + middle + ring up, pinky down ---
  if (index && middle && ring && !pinky)
    add('W', 0.92);

  // --- X: index finger curled (hook) ---
  if (!middle && !ring && !pinky) {
    const idxCurl = fingerCurl(lm, 1);
    if (idxCurl > 0.8 && !index) add('X', 0.8);
  }

  // --- Y: thumb + pinky out, three middle fingers down ---
  if (tExt && !index && !middle && !ring && pinky)
    add('Y', 0.95);

  return results;
}

export function classify(lm: Landmark[]): Prediction {
  if (!lm || lm.length < 21) return null;
  const ext = fingerStates(lm);
  const curl = [0, 1, 2, 3, 4].map((i) => fingerCurl(lm, i));
  const results = match(lm, ext, curl);
  if (results.length === 0) return null;
  results.sort((a, b) => b.score - a.score);
  const best = results[0];
  return { letter: best.letter, confidence: Math.min(best.score, 0.99) };
}

export const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], // thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // index
  [5, 9], [9, 10], [10, 11], [11, 12], // middle
  [9, 13], [13, 14], [14, 15], [15, 16], // ring
  [13, 17], [17, 18], [18, 19], [19, 20], // pinky
  [0, 17], // palm base
];
