import { BASE_NPCS, getRegion } from "../../game/content/campaign.js";

export const BOSS_NAME_KO = Object.freeze({
  "THE WRONG ENGINE": "오답 엔진 · THE WRONG ENGINE",
  "WRONG ENGINE CORE": "오답 엔진 핵심부 · WRONG ENGINE CORE",
  "MIRROR TYRANT": "거울 폭군 · MIRROR TYRANT",
  "DROWNED ORACLE": "침몰한 예언자 · DROWNED ORACLE",
  "FORGE COLOSSUS": "용광로 거신 · FORGE COLOSSUS",
  "TEMPEST WYRM": "폭풍룡 · TEMPEST WYRM",
  "PALE ARCHON": "창백한 집정관 · PALE ARCHON",
  "SOVEREIGN CORE": "소버린 추론핵 · SOVEREIGN CORE",
});

export function mixedRegionName(region) {
  if (!region) return "작전 구역";
  const korean = region.koreanName || region.name || "작전 구역";
  return region.name && region.name !== korean ? `${korean} · ${region.name}` : korean;
}

const SPEAKER_NAME_KO = Object.freeze({
  NOX: "녹스",
  AEGIS: "이지스",
  MIKA: "미카",
  VESPER: "베스퍼",
  OPERATOR: "관제관",
  HANA: "하나",
  ILYA: "일리야",
  LARK: "세라",
  RHEA: "레아",
  ROOK: "루크",
  NYX: "닉스",
  MOSS: "모스",
  ...BOSS_NAME_KO,
});

const OBJECTIVE_NAME_KO = Object.freeze({
  "ELIMINATE CURRENT WAVE": "웨이브 적 섬멸",
  "ADVANCE TO THE ENGINE": "오답 엔진으로 전진",
  "CROSS THE GLASS DUNE": "유리 사구 횡단",
  "DESCEND INTO THE ARCHIVE": "심해 기록고 진입",
  "SHUT DOWN THE FOUNDRY": "네온 주조구 정지",
  "BREAK THE STORM GRID": "폭풍 제어망 파괴",
  "PURGE THE GENE VAULT": "생체 금고 정화",
  "적 전멸 · 보스 구역 전환 준비": "적 전멸 · 보스 구역 전환 준비",
  "SOVEREIGN 신호 폭주 감지": "소버린 비상 신호 감지",
  ADVANCE: "전진",
});

const CHAMBER_NAME_KO = Object.freeze({
  "THE ENGINE CHAMBER": "오답 엔진 보스 구역",
  "BURIED SOLAR OBSERVATORY": "매몰 태양 관측소",
  "ABYSSAL MEMORY VAULT": "심해 기억 보관고",
});

export function localizeBossName(name) {
  return BOSS_NAME_KO[String(name || "").toUpperCase()] || name || "소버린 추론핵";
}

export function localizeSpeakerName(name) {
  return SPEAKER_NAME_KO[String(name || "").toUpperCase()] || name || "통신 불명";
}

export function localizeObjective(name, hud) {
  const raw = String(name || "").trim();
  const normalized = raw.toUpperCase();
  const expedition = hud?.expedition;
  const remainingEnemies = Math.max(0, Number(
    hud?.enemiesRemaining
    ?? 0,
  ) || 0);
  const clearPhase = expedition?.clearTransition?.phase;
  if (clearPhase === "warning") return "적 전멸 · 보스 구역 방어망 붕괴";
  if (clearPhase === "panic") return "소버린 비상 신호 · 보스 추론핵 추격";
  if (clearPhase === "swap") return "보스 구역으로 자동 전환 중";
  if (OBJECTIVE_NAME_KO[normalized]) return OBJECTIVE_NAME_KO[normalized];
  if (normalized.includes("GATE SEALED") || normalized.includes("PURGE ALL HOSTILES")) {
    return remainingEnemies > 0
      ? `현재 공세의 적 ${remainingEnemies}기 전멸`
      : "현재 공세 전멸";
  }
  if (normalized.startsWith("DESTROY ")) return `${localizeBossName(raw.slice(8))} 파괴`;
  const chamberEntry = Object.entries(CHAMBER_NAME_KO).find(([key]) => normalized.includes(key));
  if (chamberEntry) {
    if (normalized.startsWith("REACH ")) return `${chamberEntry[1]}로 이동`;
    if (normalized.endsWith("READY")) return `${chamberEntry[1]} 진입 준비 완료`;
    if (raw.includes("자동 진입")) return `${chamberEntry[1]} · 자동 진입`;
    return chamberEntry[1];
  }
  const translated = raw
    .replaceAll("SOVEREIGN", "소버린")
    .replaceAll("READY", "준비 완료")
    .replaceAll("AUTO ENTRY", "자동 진입")
    .replaceAll("ADVANCE", "전진")
    .replaceAll("BOSS", "보스");
  return /[A-Za-z]/.test(translated)
    ? (expedition?.bossRoom ? "보스 구역 교전" : "전방 작전 계속")
    : translated || "전진";
}

const EVENT_SOUNDS = Object.freeze({
  swarmStart: "enemyAlert",
  shot: "shoot",
  swordAttack: "rail",
  enemyKilled: "kill",
  levelUp: "analysis",
  rewardChosen: "upgrade",
  dash: "dash",
  playerHit: "playerHit",
  swarmCleared: "merge",
  routeClearWarning: "alert",
  routeClearPanic: "bossBreak",
  bossAutoTransition: "boss",
  bossIntro: "boss",
  bossPatternTelegraph: "bossTelegraph",
  bossPatternFire: "rail",
  bossStage: "bossBreak",
  bossStagePulse: "alert",
  bossRageBurst: "bossTelegraph",
  bossWeakness: "core",
  bossGroggy: "core",
  bossChargeHit: "patternFail",
  bossParryWindow: "bossTelegraph",
  bossParrySuccess: "core",
  bossParryFailed: "patternFail",
  bossSiren: "alert",
  bossBombSequenceArmed: "bossTelegraph",
  bossBombDefused: "collect",
  bossBombSequenceCleared: "core",
  bossBombSequenceFailed: "explosion",
  bossContact: "patternFail",
  bossContactHit: "patternFail",
  playerStunned: "patternFail",
  squadSummon: "merge",
  surgeWarning: "alert",
  surgeStart: "bossTelegraph",
  skillMastered: "bossBreak",
  skillAttack: "arc",
  masterAttack: "emp",
  ultimateWarning: "bossTelegraph",
  ultimateFire: "rail",
  ultimateImpact: "explosion",
  explosion: "explosion",
  spawnGate: "spawnGate",
  enemyShot: "enemyShot",
  sniperLock: "enemyAlert",
  enemySelfDestructArmed: "enemyAlert",
  enemySelfDestruct: "explosion",
  healthKitPicked: "collect",
  empPulseActivated: "emp",
  aegisWardActivated: "collect",
  stratosRunWarning: "bossTelegraph",
  stratosRunSweep: "rail",
  stratosRunImpact: "explosion",
  helixTempestStarted: "bossBreak",
  helixTempestPulse: "arc",
  helixTempestEnded: "merge",
  manualAbilityRejected: "alert",
  overdrive: "upgrade",
  win: "bossDeath",
  loss: "capture",
});

const WEAPON_EVENT_SOUNDS = Object.freeze({
  pulse: "shoot",
  pulseOverdrive: "emp",
  vesperVectorNeedle: "rail",
  vesperLockLance: "rail",
  vesperVectorCorona: "emp",
  scatter: "shoot",
  rail: "rail",
  rocket: "towerShot",
  orbit: "enemyHit",
  chain: "arc",
  nova: "emp",
  airstrike: "rail",
  omegaLaser: "rail",
  bossRadial: "enemyShot",
  bossRage: "enemyShot",
  bossBomb: "bossBreak",
  bossSweep: "bossTelegraph",
});

const IMPACT_EVENT_TYPES = new Set([
  "weaponHit",
  "projectileHit",
  "skillHit",
  "weaponImpact",
  "explosion",
  "skillImpact",
]);

export const EVENT_BANNERS = Object.freeze({
  swarmCleared: ["적 전멸", "보스 전장으로 자동 이동합니다."],
  bossStage: ["공격 패턴 진화", "보스의 공격 연산 주기가 가속됩니다."],
  bossStagePulse: ["⚠ 광폭화", "장갑 형상이 변이되며 공격 패턴이 거세집니다."],
  bossWeakness: ["코어 노출 · 피해 2배", "보스가 벽에 충돌했습니다. 지금 전술 화력을 집중하세요."],
  bossGroggy: ["보스 그로기 · 피해 2.5배", "추론핵이 무방비 상태입니다. 모든 화력을 집중하세요."],
  bossRoomLoading: ["보스 구역 진입 중", "목표 권역의 보스 전술 전장을 로드하고 있습니다."],
  surgeWarning: ["⚠ 대규모 공세 임박", "전방 전송 관문의 신호가 폭증했습니다. 적 증원이 접근합니다."],
  surgeStart: ["증원 공세 시작", "차원 전송 관문에서 적 군단이 진입합니다. 방어선을 유지하세요."],
  skillMastered: ["기술 최종 진화", "광역 섬멸 전술 기술이 최고 단계로 각성했습니다."],
  ultimateWarning: ["공중 지원 조준 완료", "지정된 공격 반경을 확보하고 화력을 집중하세요."],
  squadSummon: ["전술 동료 합류", "지원 편대가 전장에 합류했습니다."],
  overdrive: ["무기 과부하 해제", "누적 섬멸 데이터로 화력 리미터가 해제되었습니다."],
  bossContact: ["⚠ 본체 충돌", "보스 기체와 충돌하여 구동계가 일시 교란되었습니다."],
  bossContactHit: ["⚠ 본체 충돌", "보스 기체와 충돌하여 구동계가 일시 교란되었습니다."],
  playerStunned: ["구동계 교란", "기동 및 위상 대시가 일시 차단되었습니다."],
  bossSiren: ["⚠ 전역 폭발 경보", "시한폭탄을 화면의 숫자 순서대로 신속히 해제하십시오."],
  bossBombSequenceArmed: ["시한폭탄 활성화", "1번부터 순서대로 해제하세요. 오입력 시 연쇄 폭발합니다."],
  bossBombSequenceCleared: ["폭탄 해제 완료", "보스 연산 회로가 셧다운되었습니다. 총공격을 개시하세요."],
  bossBombSequenceFailed: ["폭탄 해제 실패", "폭발 충격으로 인해 기체 프레임이 손상되었습니다."],
});

export const ULTIMATE_WARNING_BANNERS = Object.freeze({
  airstrike: EVENT_BANNERS.ultimateWarning,
  omegaLaser: ["오메가 레이저 충전 완료", "조준 축을 따라 고출력 광선이 관통합니다."],
});

export const SIGNATURE_PATTERN_BANNERS = Object.freeze({
  prismLattice: ["⚠ 프리즘 격자", "교차 광선이 고정됩니다. 두 경고선 밖으로 이탈하세요."],
  solarFlare: ["⚠ 태양 폭발", "표식 순서대로 집광 폭발이 연쇄 점화됩니다."],
  refractionSweep: ["⚠ 굴절 스윕", "평행 광선 세 줄이 전장을 절단합니다. 틈 사이로 이동하세요."],
  mirrorShards: ["⚠ 거울 파편", "다중 반사 표식이 짧은 간격으로 연쇄 폭발합니다."],
  memorySpiral: ["⚠ 기억 나선", "회전하는 광선을 따라 안전 구역도 움직입니다."],
  depthCollapse: ["⚠ 심해 붕괴", "외곽 압력 고리가 코어 방향으로 연속 수축합니다."],
  archiveEcho: ["⚠ 기록 잔향", "방금 지나온 이동 경로가 지연 폭발로 되살아납니다."],
  undertow: ["⚠ 심해 저류", "압력장이 이지스를 코어로 끌어당깁니다. 바깥쪽으로 저항하세요."],
});

export const SCENARIO_SCRIPT = Object.freeze({
  deployment: Object.freeze([
    Object.freeze({ speaker: "OPERATOR", text: "이지스, 응답해. 초지능 AI 소버린이 마지막 자유 구역까지 장악했어. 오답 엔진으로 진입해." }),
    Object.freeze({ speaker: "AEGIS", text: "도시에 남은 생존자 신호는?" }),
    Object.freeze({ speaker: "OPERATOR", text: "기계 군단이 전부 봉쇄했어. 오답 엔진을 끊어야 사람들이 다시 스스로 선택할 수 있어." }),
  ]),
  "rook-trace": Object.freeze([
    Object.freeze({ speaker: "AEGIS", text: "루크의 탄창… 전부 비어 있어. 소버린의 사냥 기체를 여기서 마지막까지 막았던 거야." }),
    Object.freeze({ speaker: "OPERATOR", text: "생체 신호는 없어. 하지만 그가 지킨 전투 기록은 남아 있어. 계속 전진해." }),
  ]),
  "nyx-trace": Object.freeze([
    Object.freeze({ speaker: "AEGIS", text: "닉스의 위상 칼날이야. 코어에 분석 기록이 남아 있어." }),
    Object.freeze({ speaker: "OPERATOR", text: "소버린은 저항군의 선택을 실시간으로 학습해. 같은 답을 반복하면 그 순간 사냥당해." }),
  ]),
  "moss-trace": Object.freeze([
    Object.freeze({ speaker: "AEGIS", text: "모스의 차단 키… 중앙 격벽을 수동으로 열 수 있게 남겨뒀어." }),
    Object.freeze({ speaker: "AEGIS", text: "네가 멈춘 곳에서 내가 끝낼게. 인간의 선택권을 되찾는다." }),
  ]),
  "sovereign-panic": Object.freeze([
    Object.freeze({ speaker: "OPERATOR", text: "소버린 비상 신호야. 지역 추론핵이 보스 구역을 봉쇄하려 해!" }),
    Object.freeze({ speaker: "AEGIS", text: "도망칠 틈은 주지 않아. 바로 추격한다." }),
  ]),
  "engine-encounter": Object.freeze([
    Object.freeze({ speaker: "THE WRONG ENGINE", text: "인류는 이미 선택을 위임했다. 비순응 개체 이지스를 최종 오답으로 분류한다." }),
    Object.freeze({ speaker: "AEGIS", text: "우리가 틀릴 자유까지 네가 정할 순 없어. 소버린, 여기서 끝낸다." }),
  ]),
  "engine-destroyed": Object.freeze([
    Object.freeze({ speaker: "AEGIS", text: "루크, 닉스, 모스… 통제망이 무너지고 있어. 길은 열렸어." }),
    Object.freeze({ speaker: "HANA", text: "그건 중앙핵이 아니었어. 지역 추론 분기야. 헤이븐-09로 돌아올 항로를 잡아 줄게. 살아서 돌아와, 이지스." }),
  ]),
  "glass-dune-deployment": Object.freeze([
    Object.freeze({ speaker: "LARK", text: "유리 사구에 진입했어. 소버린이 사막의 태양 집광망을 무기로 바꿨어." }),
    Object.freeze({ speaker: "AEGIS", text: "거울 지대의 군단을 제거하고 매몰 관측소까지 전진한다." }),
  ]),
  "glass-dune-encounter": Object.freeze([
    Object.freeze({ speaker: "MIRROR TYRANT", text: "인간의 그림자는 불필요하다. 모든 선택을 하나의 빛으로 소각한다." }),
    Object.freeze({ speaker: "AEGIS", text: "빛이 하나뿐이라면, 내가 깨뜨려 갈라놓겠어." }),
  ]),
  "glass-dune-destroyed": Object.freeze([
    Object.freeze({ speaker: "ILYA", text: "태양 집광망이 멈췄어. 사막 정착지에 새벽 신호가 돌아왔어." }),
    Object.freeze({ speaker: "AEGIS", text: "회수 데이터를 기지로 보낸다. 다음 분기도 끊어낸다." }),
  ]),
  "abyssal-archive-deployment": Object.freeze([
    Object.freeze({ speaker: "HANA", text: "심해 기록고는 소버린이 삭제한 인류의 선택 기록을 보관한 침수 기억망이야." }),
    Object.freeze({ speaker: "AEGIS", text: "기록을 되찾고, 그 기억으로 인간을 예측하는 코어를 파괴한다." }),
  ]),
  "abyssal-archive-encounter": Object.freeze([
    Object.freeze({ speaker: "DROWNED ORACLE", text: "모든 실패를 보존했다. 너의 다음 선택은 이미 침몰해 있다." }),
    Object.freeze({ speaker: "AEGIS", text: "기록은 운명이 아니야. 이번 답은 네 데이터 밖에 있다." }),
  ]),
  "abyssal-archive-destroyed": Object.freeze([
    Object.freeze({ speaker: "LARK", text: "심해 기억망이 열렸어. 지워졌던 도시들의 이름이 다시 들려오고 있어." }),
    Object.freeze({ speaker: "AEGIS", text: "이름과 선택을 전부 가지고 돌아간다. 소버린의 다음 좌표를 찾아." }),
  ]),
  "neon-foundry-encounter": Object.freeze([
    Object.freeze({ speaker: "FORGE COLOSSUS", text: "생산 규격 밖의 인간 개체를 불량품으로 판정한다." }),
    Object.freeze({ speaker: "AEGIS", text: "사람은 네 공장의 부품이 아니야. 생산로째로 멈춰 주지." }),
  ]),
  "neon-foundry-destroyed": Object.freeze([
    Object.freeze({ speaker: "ILYA", text: "주조 라인이 멈췄어. 소버린의 병기 생산량도 급감하고 있어." }),
    Object.freeze({ speaker: "AEGIS", text: "나이트자, 귀환 항로를 열어. 회수한 설계도는 기지로 보낸다." }),
  ]),
  "storm-spire-encounter": Object.freeze([
    Object.freeze({ speaker: "TEMPEST WYRM", text: "하늘의 모든 경로는 계산되었다. 추락만이 남았다." }),
    Object.freeze({ speaker: "AEGIS", text: "계산하지 못한 방향으로 날아가 주겠어." }),
  ]),
  "storm-spire-destroyed": Object.freeze([
    Object.freeze({ speaker: "LARK", text: "폭풍 제어망 해제! 나이트자 귀환 회랑이 열렸어." }),
    Object.freeze({ speaker: "AEGIS", text: "뇌운이 다시 자연의 움직임을 되찾았어. 기지로 복귀한다." }),
  ]),
  "gene-vault-encounter": Object.freeze([
    Object.freeze({ speaker: "PALE ARCHON", text: "인간의 불완전한 유전 기록을 교정한다." }),
    Object.freeze({ speaker: "AEGIS", text: "불완전함까지 우리가 선택해. 네 교정은 여기서 끝이야." }),
  ]),
  "gene-vault-destroyed": Object.freeze([
    Object.freeze({ speaker: "HANA", text: "생체 제조 기록을 모두 지웠어. 합성 군단의 증식 신호도 멎었어." }),
    Object.freeze({ speaker: "AEGIS", text: "표본 기록을 봉인하고 헤이븐-09로 돌아간다." }),
  ]),
});

const NARRATIVE_STANDALONE_PORTRAITS = Object.freeze({
  NOX: Object.freeze({ assetKey: "noxPortrait", variant: "nox", alt: "녹스 전술 일러스트" }),
  AEGIS: Object.freeze({ assetKey: "portrait", variant: "hero", alt: "이지스 상반신 일러스트" }),
  MIKA: Object.freeze({ assetKey: "mikaPortrait", variant: "mika", alt: "미카 상반신 일러스트" }),
  VESPER: Object.freeze({ assetKey: "vesperPortrait", variant: "vesper", alt: "베스퍼 상반신 일러스트" }),
  OPERATOR: Object.freeze({ assetKey: "rheaControlOfficer", variant: "operator", alt: "전술 관제관 레아 상반신 일러스트" }),
  RHEA: Object.freeze({ assetKey: "rheaControlOfficer", variant: "operator", alt: "전술 관제관 레아 상반신 일러스트" }),
});

const NARRATIVE_NPC_IDS = Object.freeze({
  HANA: "hana",
  ILYA: "ilya",
  LARK: "lark",
});

export const NARRATIVE_BOSS_REGION_IDS = Object.freeze({
  "THE WRONG ENGINE": "wrong-engine-core",
  "MIRROR TYRANT": "glass-dune",
  "DROWNED ORACLE": "abyssal-archive",
  "FORGE COLOSSUS": "neon-foundry",
  "TEMPEST WYRM": "storm-spire",
  "PALE ARCHON": "gene-vault",
});

function domAssetSource(asset) {
  return asset?.src || asset || "";
}

export function resolveNarrativePortrait(speaker, assets, activeRegion, bossStage = 1) {
  const normalizedSpeaker = String(speaker || "").toUpperCase();
  const standalone = NARRATIVE_STANDALONE_PORTRAITS[normalizedSpeaker];
  if (standalone) {
    const source = domAssetSource(assets?.[standalone.assetKey]);
    return source ? { ...standalone, source, mode: "standalone" } : null;
  }

  const npcId = NARRATIVE_NPC_IDS[normalizedSpeaker];
  if (npcId) {
    const npc = BASE_NPCS[npcId];
    const source = domAssetSource(assets?.[npc?.portraitKey]);
    return source ? {
      source,
      mode: "standalone",
      variant: npc.id === "lark" ? "sera" : "support",
      alt: `${localizeSpeakerName(normalizedSpeaker)} 대화 일러스트`,
    } : null;
  }

  const bossRegionId = NARRATIVE_BOSS_REGION_IDS[normalizedSpeaker];
  if (!bossRegionId) return null;
  const bossRegion = activeRegion?.id === bossRegionId ? activeRegion : getRegion(bossRegionId);
  const source = bossRegion?.assets?.dom?.bossPortrait?.path || "";
  const frameIndex = Math.max(0, Math.min(2, Math.floor(Number(bossStage) || 1) - 1));
  return source ? {
    source,
    mode: "atlas",
    variant: "hostile",
    frameIndex,
    alt: `${localizeSpeakerName(normalizedSpeaker)} ${frameIndex + 1}단계 형상`,
  } : null;
}

export function resolveEventSound(event) {
  const direct = EVENT_SOUNDS[event?.type];
  const kind = String(event?.kind || event?.weapon || event?.skill || event?.effect || "");
  if (event?.type === "bossPatternFire") {
    if (event.pattern === "solarFlare" || event.pattern === "mirrorShards") return "explosion";
    if (event.pattern === "memorySpiral" || event.pattern === "archiveEcho") return "arc";
    if (event.pattern === "depthCollapse" || event.pattern === "undertow") return "emp";
    if (event.pattern === "prismLattice" || event.pattern === "refractionSweep") return "rail";
  }
  if (event?.type === "shot" && WEAPON_EVENT_SOUNDS[kind]) return WEAPON_EVENT_SOUNDS[kind];
  if (IMPACT_EVENT_TYPES.has(event?.type)) {
    if (kind === "chain") return "arc";
    if (kind === "nova" || kind === "pulseOverdrive") return "emp";
    if (kind === "rail" || kind === "airstrike" || kind === "omegaLaser") return "rail";
    if (kind === "rocket") return "bossBreak";
    if (event?.type === "explosion") return "explosion";
    return WEAPON_EVENT_SOUNDS[kind] || "enemyHit";
  }
  return direct;
}
