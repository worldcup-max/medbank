/* shared styles for both 3D Tutor players */
export const CSS = `
.mbx{--mbx-gold:#ffc040;color:var(--text,#f2f3f8);font-size:15px;line-height:1.5}
.mbx *{box-sizing:border-box}
.mbx-stage{position:relative;width:100%;aspect-ratio:16/10;border-radius:16px;overflow:hidden;touch-action:none;cursor:grab;user-select:none;-webkit-user-select:none;
  background:radial-gradient(110% 90% at 50% 40%,#1d2133 0%,#0d0e17 60%,#06070b 100%);box-shadow:0 0 0 1px #ffffff14,0 20px 60px -30px #000}
.mbx-stage:active{cursor:grabbing}
@media (max-width:640px){.mbx-stage{aspect-ratio:4/5}}
.mbx-stage canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.mbx-labels{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.mbx-labels>div{position:absolute;left:0;top:0;transition:opacity .35s;will-change:transform}
.mbx-q{font:700 15px/1 ui-sans-serif,system-ui;color:#ffd7a0;text-shadow:0 0 8px #000,0 0 3px #000;translate:-50% -50%}
.mbx-ts{font-size:34px;font-weight:300;color:var(--mbx-gold);text-shadow:0 0 18px #ffc04099;translate:-50% -60%}
.mbx-block{font-size:13px;font-weight:700;color:#fff;background:#c0392bdd;border-radius:999px;padding:5px 11px;white-space:nowrap;translate:-50% 0}
.mbx-cip{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;background:var(--mbx-gold);color:#201400;font-size:12px;font-weight:800;box-shadow:0 0 14px #ffc040aa;translate:-50% -50%}
.mbx-tag{display:inline-flex;align-items:center;gap:7px;white-space:nowrap;padding:5px 12px 5px 6px;border-radius:999px;background:#0b0c12e6;border:1px solid var(--mbx-gold);color:#ffe2a0;font-size:13px;font-weight:650;box-shadow:0 8px 24px -6px #000;translate:-50% 0}
.mbx-tag b{display:grid;place-items:center;width:20px;height:20px;border-radius:50%;background:var(--mbx-gold);color:#201400;font-size:11px}
.mbx-hud{position:absolute;left:10px;top:10px;right:10px;display:flex;justify-content:space-between;align-items:flex-start;gap:8px;pointer-events:none;color:#f2f3f8}
.mbx-chip{background:#0b0c12c4;border:1px solid #ffffff1c;border-radius:12px;padding:7px 11px;backdrop-filter:blur(8px)}
.mbx-chip small{display:block;color:#9aa0b4;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase}.mbx-chip b{font-size:15px}
.mbx-energy{width:210px;padding:5px 8px 2px}
.mbx-energy svg{display:block;width:100%;height:auto}
@media (max-width:640px){.mbx-energy{width:140px}.mbx-chip b{font-size:13.5px}}
.mbx-meters{position:absolute;left:10px;bottom:10px;display:flex;gap:8px;pointer-events:none;color:#9aa0b4;font-size:12px}
.mbx-bar{display:flex;align-items:center;gap:8px}.mbx-bar span{width:40px}.mbx-bar i{width:70px;height:6px;border-radius:9px;background:#ffffff14;overflow:hidden;display:block}.mbx-bar i em{display:block;height:100%;width:0;background:var(--mbx-gold);border-radius:9px}
.mbx-cfg{font-size:20px;font-weight:800;color:#8fb2ff}.mbx-cfg.r{color:#ff9aa5}
.mbx-badge{position:absolute;right:10px;bottom:10px;font-size:11.5px;color:#cfd3e0;background:#0b0c12b0;border:1px solid #ffffff1c;border-radius:999px;padding:4px 10px;pointer-events:none}
@media (max-width:640px){.mbx-badge{max-width:58%;white-space:normal;text-align:right;font-size:10.5px;line-height:1.3}}
.mbx-badge.ok{color:#04150d;background:#2fd18d;border-color:#2fd18d}
.mbx-card{margin-top:10px;background:var(--panel,#10121a);border:1px solid var(--line,#232739);border-radius:14px;padding:10px 12px}
.mbx-card h4{margin:0 0 8px;font-size:11.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--dim,#9aa0b4)}
.mbx-fig{display:block;width:100%;height:auto;border-radius:10px}
.mbx-cap{font-size:17px;line-height:1.55;min-height:3.2em;color:var(--dim,#9aa0b4)}
.mbx-cap span{transition:color .3s}.mbx-cap span.on{color:var(--text,#f2f3f8)}
.mbx-ctl{display:flex;gap:7px;align-items:center;flex-wrap:wrap;margin-top:10px}
.mbx-ctl button{font:inherit;font-size:13.5px;border:1px solid var(--line,#232739);background:var(--panel,#161927);color:var(--text,#f2f3f8);border-radius:10px;padding:8px 12px;cursor:pointer}
.mbx-ctl .mbx-play{background:var(--accent,#7c5cff);border-color:var(--accent,#7c5cff);color:#fff;font-weight:700}
.mbx-ctl .sp{flex:1}
.mbx-quiz{margin-top:8px}.mbx-quiz button{font:inherit;background:var(--mbx-gold);color:#201400;border:0;font-weight:700;border-radius:10px;padding:8px 13px;cursor:pointer}
.mbx-reveal{margin-top:8px;color:#e0a800;font-size:15.5px}
.mbx-chaps{display:flex;gap:6px;overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:4px}
.mbx-chaps button{flex:none;font:inherit;font-size:12.5px;border:1px solid var(--line,#232739);background:transparent;color:var(--dim,#9aa0b4);border-radius:999px;padding:6px 11px;cursor:pointer;white-space:nowrap}
.mbx-chaps button.on{background:#7c5cff;border-color:#7c5cff;color:#fff}
.mbx-cols{display:grid;grid-template-columns:1fr 1fr;gap:10px}
@media (max-width:720px){.mbx-cols{grid-template-columns:1fr}}
.mbx-key,.mbx-lines{margin:0;padding:0;list-style:none;display:grid;gap:3px}
.mbx-key li{display:flex;gap:8px;align-items:center;font-size:13px;color:var(--dim,#9aa0b4);padding:3px 5px;border-radius:8px;cursor:pointer}
.mbx-key li b{width:20px;height:20px;flex:none;border-radius:50%;display:grid;place-items:center;font-size:10.5px;background:var(--line,#232739)}
.mbx-key li.on{background:#ffc04022;color:var(--text,#f2f3f8)}.mbx-key li.on b{background:var(--mbx-gold);color:#201400}
.mbx-lines li{font-size:13.5px;color:var(--dim,#9aa0b4);padding:3px 6px;border-radius:6px;transition:.3s}
.mbx-lines li.on{color:var(--text,#f2f3f8);background:#ffc0401c;box-shadow:inset 3px 0 0 var(--mbx-gold)}
.mbx-legend{display:flex;gap:12px;flex-wrap:wrap;font-size:11.5px;color:var(--dim,#9aa0b4);margin-top:8px}
.mbx-legend em{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:5px;vertical-align:-1px}
`;
