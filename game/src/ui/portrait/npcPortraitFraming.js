// Approved 768px square sources. Crown/chin exclude stray hair and accessories.
export const NPC_PORTRAIT_LANDMARKS = Object.freeze({
  hana: { crown: 20, chin: 324, center: 390 },
  ilya: { crown: 48, chin: 278, center: 332 },
  lark: { crown: 32, chin: 272, center: 350 },
  sera: { crown: 32, chin: 272, center: 350 },
  rhea: { crown: 22, chin: 288, center: 400 },
});
export function npcPortraitFit(width, height, npcId) {
  const head = NPC_PORTRAIT_LANDMARKS[npcId] || NPC_PORTRAIT_LANDMARKS.rhea;
  const unit = Math.max(0, Math.min(width / 600, height / 740));
  const scale = unit * 300 / (head.chin - head.crown);
  return { frameWidth: 600 * unit, frameHeight: 740 * unit,
    width: 768 * scale, height: 768 * scale,
    left: 300 * unit - head.center * scale, top: 20 * unit - head.crown * scale };
}
