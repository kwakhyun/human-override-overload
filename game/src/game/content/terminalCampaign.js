// Terminal Orbit is objective-driven. These definitions are shared by the map,
// deterministic simulation and asset manifest; completion never depends on kills.
function freeze(value) {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
export const TERMINAL_REGION_IDS = Object.freeze(['eclipse-relay', 'ark-transit', 'sovereign-throne']);
export const TERMINAL_PATTERNS = freeze({
  'eclipse-relay': ['eclipseShelter', 'relayCrossfire', 'eclipseShelter', 'solarSweep'],
  'ark-transit': ['railBarrage', 'wakeMines', 'gravityWake', 'railBarrage'],
  'sovereign-throne': ['verdictGrid', 'memoryReplay', 'throneCollapse', 'verdictGrid'],
});

const rows = [
  { id: 'eclipse-relay', order: 7, name: 'ECLIPSE RELAY', koreanName: '일식 중계항',
    summary: '세 중계기를 점령하고 일식 포격 속에서 지상과 궤도를 연결합니다.',
    description: '궤도 방주의 구조 신호가 잡혔습니다. 중계기 세 곳을 원하는 순서로 점령하고 중앙 송신대의 연결을 유지하세요. 적이 가까이 있으면 점령이 멈춥니다.',
    objective: '중계기 3곳 점령 → 중앙 송신 → 헬리오스 격파',
    missionKind: 'relays', bossName: 'HELIO JUDGE', bossKo: '헬리오스 심판관', bossId: 'helio-judge',
    chamber: '일식 관측실', bossHp: 2400000, difficultyScalar: 2.35,
    prerequisiteRegionIds: ['neon-foundry', 'storm-spire', 'gene-vault'], unlockRegionIds: ['ark-transit'],
    enemies: '중계기 주변에 드론과 소총병이 계속 보충됩니다. 전멸시키지 않아도 작전을 끝낼 수 있습니다.',
    danger: '일식 때 표시된 피난 원으로 이동하세요. 교차 포격과 천천히 회전하는 태양 광선이 이어집니다.',
    tip: '중계기의 원 안에 머물면 점령합니다. 가까운 적부터 치우세요. 궤도 포격은 채워지는 붉은 원 밖으로 피하세요.',
    color: '#f4c978', secondary: '#75e6ee', rewards: [28, 24, 9],
  },
  { id: 'ark-transit', order: 8, name: 'ARK TRANSIT', koreanName: '방주 운송로',
    summary: '방주와 함께 움직이며 생존자들을 두 갈래 궤도 항로 너머로 호송합니다.',
    description: '기록 속 실종자는 살아 있었습니다. 방주 곁에서 이동을 유도하고 접근한 적을 막으세요. 분기점 위쪽은 짧지만 포격이 잦고, 아래쪽은 길지만 방주를 수리합니다.',
    objective: '방주 접근 → 항로 선택 → 수송 완료 → 레비아탄 격파',
    missionKind: 'escort', bossName: 'CHRONO LEVIATHAN', bossKo: '크로노 레비아탄', bossId: 'chrono-leviathan',
    chamber: '방주 도킹 베이', bossHp: 2800000, difficultyScalar: 2.5,
    prerequisiteRegionIds: ['eclipse-relay'], unlockRegionIds: ['sovereign-throne'],
    enemies: '방주 주변 적은 선체를 손상시키고 이동을 막습니다. 호위 범위를 벗어나면 방주가 정지합니다.',
    danger: '철도 포격은 차례대로 터집니다. 지연 기뢰는 방금 머물던 자리를 폭격하며, 중력파에는 출구가 있습니다.',
    tip: '선체가 완전히 파괴되면 작전 실패입니다. 노란 항로는 빠르고 위험합니다. 청록 항로는 느리지만 수리 구간이 있습니다.',
    color: '#77d9ee', secondary: '#ffb77c', rewards: [32, 28, 10],
  },
  { id: 'sovereign-throne', order: 9, name: 'SOVEREIGN THRONE', koreanName: '주권의 왕좌',
    summary: '세 인증 키를 중앙으로 운반해 소버린의 판결권을 끊습니다.',
    description: '인증고에서 키를 하나씩 회수해 중앙에 전달하세요. 운반 중에는 위치가 노출됩니다. 세 키가 모이면 중앙에서 최종 접속을 완료하고 소버린의 본체에 진입합니다.',
    objective: '인증 키 3개 회수·운반 → 최종 접속 → 소버린 격파',
    missionKind: 'keys', bossName: 'NULL SOVEREIGN', bossKo: '널 소버린', bossId: 'null-sovereign',
    chamber: '최종 판결실', bossHp: 3400000, difficultyScalar: 2.7,
    prerequisiteRegionIds: ['ark-transit'], unlockRegionIds: [],
    enemies: '키 회수와 운반을 방해하는 혼성 경비대가 보충됩니다. 인증고의 키는 한 번에 하나만 운반합니다.',
    danger: '판결 격자의 안전 칸이 뒤집힙니다. 기억 공격은 지나온 위치를 재생하고, 왕좌 붕괴 때에는 피난 원이 이동합니다.',
    tip: '키를 든 채 중앙의 원에 들어가 전달하세요. 보스의 위험 칸이 터진 다음에는 반대 칸으로 옮겨야 합니다. 회피 후 코어가 노출될 때 집중 공격하세요.',
    color: '#ceadff', secondary: '#ff667f', rewards: [40, 35, 14],
  },
];

export const TERMINAL_CAMPAIGN = freeze(Object.fromEntries(rows.map(row => {
  const path = `./assets/overload/terminal-orbit/${row.id}`;
  return [row.id, Object.freeze({ ...row, clusterId: 'terminal-orbit', chapterId: 'chapter-04',
    chapterLabel: `CHAPTER ${String(row.order).padStart(2, '0')}`, enemyBudget: 1200,
    threatProfile: { label: '궤도 경비대 · 지속 증원', composition: '기동 드론 · 소총병 · 저격수', bossSignatures: row.danger },
    victoryRewards: { firstClear: { researchData: row.rewards[0], equipmentParts: row.rewards[1], augmentationCores: row.rewards[2] },
      repeatClear: { researchData: 10, equipmentParts: 8, augmentationCores: 5 } },
    boss: { id: row.bossId, name: row.bossName, maxHp: row.bossHp, phaseThresholds: [.7, .38], patterns: TERMINAL_PATTERNS[row.id] },
    assets: { dom: {
      thumbnail: { key: `${row.id}-scene`, path: `${path}/scene.webp` },
      bossPortrait: { key: `${row.id}-forms`, path: `${path}/boss-forms.png` },
    }, battle: {
      sectors: [{ key: `${row.id}-floor`, path: `${path}/floor.webp` }],
      bossRoom: { key: `${row.id}-floor`, path: `${path}/floor.webp` },
      bossForms: { key: `${row.id}-forms`, path: `${path}/boss-forms.png`, columns: 3, rows: 1 },
    } },
  })];
})));

export const TERMINAL_COMBAT_CONFIGS = freeze(Object.fromEntries(rows.map(row => [row.id, {
  id: row.id, chapterId: 'chapter-04', bossName: row.bossName, enemyBudget: 1200,
  bossHp: row.bossHp, difficultyScalar: row.difficultyScalar, objective: row.objective, chamber: row.chamber,
  deploymentBeat: `${row.id}-deployment`, encounterBeat: `${row.id}-encounter`, victoryBeat: `${row.id}-destroyed`,
  traces: false,
}])));
