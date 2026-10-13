/* node explainer/tests/run.mjs — the chemistry checker and the 3D geometry on known mechanisms */
import { validateMechanism } from "../../import-server/chemspec.mjs";
import { buildMechanism3D } from "../../import-server/chem3d.mjs";
import { SPECS } from "./specs.mjs";
let fail = 0;
for (const [k, s] of Object.entries(SPECS)) {
  const v = validateMechanism(s); const M = v.ok ? buildMechanism3D(s) : null;
  const ok = v.ok && M.warnings.length === 0; if (!ok) fail++;
  console.log((ok ? "PASS " : "FAIL ") + k, v.ok ? "" : v.errors, M && M.warnings.length ? M.warnings : "");
}
const bad = JSON.parse(JSON.stringify(SPECS.sn2)); bad.states[1].smiles = bad.states[1].smiles.replace("[C@H:3]", "[C@@H:3]");
const w = buildMechanism3D(bad).warnings; console.log(w.length ? "PASS retention-vs-inversion caught" : "FAIL inversion check"); if (!w.length) fail++;
process.exit(fail ? 1 : 0);
