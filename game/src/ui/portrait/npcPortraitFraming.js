// 960 x 1280 anime upper-body masters; crown/chin exclude accessories.
export const NPC_PORTRAIT_LANDMARKS = Object.freeze({
  hana: { crown: 85, chin: 480, center: 480 },
  ilya: { crown: 85, chin: 420, center: 408 },
  lark: { crown: 105, chin: 484, center: 490 },
  sera: { crown: 105, chin: 484, center: 490 },
  rhea: { crown: 85, chin: 446, center: 487 },
});
export function npcPortraitFit(width, height, npcId) {
  const head = NPC_PORTRAIT_LANDMARKS[npcId] || NPC_PORTRAIT_LANDMARKS.rhea;
  const unit = Math.max(0, Math.min(width / 600, height / 740));
  const scale = unit * 300 / (head.chin - head.crown);
  return { frameWidth: 600 * unit, frameHeight: 740 * unit,
    width: 960 * scale, height: 1280 * scale,
    left: 300 * unit - head.center * scale, top: 20 * unit - head.crown * scale };
}
