/* bundle entry: window.MBMech = { mount (hand-built templates), mountAuto (auto-built from a note) } */
import { mount, TEMPLATES } from "./mech3d.js";
import { mountAuto } from "./auto.js";
window.MBMech = { mount, mountAuto, templates: Object.keys(TEMPLATES), version: "1.1.0" };
