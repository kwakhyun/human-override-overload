import { SORTIE_BRIEFINGS } from '../../game/content/sortieBriefings.js';
import { defaultSortieParty } from '../../game/content/sortieFormation.js';
import { NpcPortraitImage } from '../portrait/NpcPortraitImage.jsx';
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AirplaneTilt,
  ArrowCounterClockwise,
  ArrowLeft,
  ArrowRight,
  Brain,
  Broadcast,
  CheckCircle,
  ChatText,
  Crosshair,
  FloppyDisk,
  GearSix,
  Lightning,
  Lock,
  MapTrifold,
  Play,
  Plus,
  ShieldChevron,
  ShieldStar,
  Sparkle,
  Sword,
  Target,
  User,
  Wrench,
} from "@phosphor-icons/react";
import { useDialogFocusTrap } from "../useDialogFocusTrap.js";
import { InteractivePortrait, OperativePortraitImage } from "../portrait/InteractivePortrait.jsx";
import { MIKA_RECRUIT_DIALOGUE } from "../../game/content/characterDialogue.js";
import { DEFENSE_DOCTRINES } from "../../defense/content.js";
import { getCampaignDirective } from "../../game/progression/campaignDirective.js";

const VESPER_RECRUIT_DIALOGUE = Object.freeze([
  Object.freeze({ portrait: "aegis", speaker: "이지스", text: "심해 기록고의 신호원이군. 혼자서 드라운드 오라클의 감시망을 무너뜨린 건가?" }),
  Object.freeze({ portrait: "vesper", speaker: "베스퍼", text: "지원이 늦었어. 그래도 마지막 좌표는 지켜 냈으니, 작전은 성공으로 기록해도 되겠지." }),
  Object.freeze({ portrait: "vesper", speaker: "베스퍼", text: "호출부호 베스퍼. 지금부터 헤이븐-09의 정밀 사격과 기동 저격을 맡는다." }),
]);

const NOX_RECRUIT_DIALOGUE = Object.freeze([
  Object.freeze({ portrait: "aegis", speaker: "이지스", text: "주조로의 통제망은 끊겼어. 그런데 누군가 폐기 직전의 심사 기록을 우리 쪽으로 넘겼어." }),
  Object.freeze({ portrait: "nox", speaker: "녹스", text: "증거 보존 절차를 완료했습니다. 소버린의 명령은 무효이며, 헤이븐-09의 작전권은 적법합니다." }),
  Object.freeze({ portrait: "nox", speaker: "녹스", text: "호출부호 녹스. 표식 심사와 전장 처형을 담당하겠습니다. 판결은 지연하지 않습니다." }),
]);

function assetSource(asset, fallback = "") {
  return asset?.src || asset || fallback;
}

function nextDialogueIndex(index, lines) {
  return lines?.length ? (index + 1) % lines.length : -1;
}

function getRailIndex(container) {
  const children = Array.from(container?.children || []);
  if (!children.length) return 0;
  const center = container.scrollLeft + container.clientWidth * 0.5;
  let closestIndex = 0;
  let closestDistance = Number.POSITIVE_INFINITY;
  for (let index = 0; index < children.length; index += 1) {
    const child = children[index];
    const childCenter = child.offsetLeft + child.offsetWidth * 0.5;
    const distance = Math.abs(childCenter - center);
    if (distance >= closestDistance) continue;
    closestDistance = distance;
    closestIndex = index;
  }
  return closestIndex;
}

function scrollRailTo(ref, index) {
  const container = ref.current;
  const target = container?.children?.[index];
  if (!target) return;
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "nearest", inline: "center" });
}

function CarouselPosition({ className, label, index, count, onPrevious, onNext }) {
  if (count < 2) return null;
  return (
    <div className={className} aria-label={`${label} ${index + 1}/${count}`}>
      <button type="button" onClick={onPrevious} disabled={index <= 0} aria-label={`${label} 이전 항목`}><ArrowLeft weight="bold" /></button>
      <span aria-hidden="true">
        {Array.from({ length: count }, (_, dotIndex) => <i className={dotIndex === index ? "is-active" : ""} key={dotIndex} />)}
      </span>
      <b>{index + 1} / {count}</b>
      <button type="button" onClick={onNext} disabled={index >= count - 1} aria-label={`${label} 다음 항목`}><ArrowRight weight="bold" /></button>
    </div>
  );
}

const NPC_DISPLAY = Object.freeze({
  hana: Object.freeze({ name: "하나", role: "기지 지휘관 · 연구실" }),
  ilya: Object.freeze({ name: "일리야", role: "장비 기술자 · 정비소" }),
  lark: Object.freeze({ name: "세라", role: "나이트자 수석 조종사 · 항로 관제" }),
  rhea: Object.freeze({ name: "레아", role: "전술 관제관 · 관제실" }),
});

const BOSS_DISPLAY = Object.freeze({
  "THE WRONG ENGINE": "오답 엔진 · THE WRONG ENGINE",
  "MIRROR TYRANT": "거울 폭군 · MIRROR TYRANT",
  "DROWNED ORACLE": "침몰한 예언자 · DROWNED ORACLE",
  "FORGE COLOSSUS": "용광로 거신 · FORGE COLOSSUS",
  "TEMPEST WYRM": "폭풍룡 · TEMPEST WYRM",
  "PALE ARCHON": "창백한 집정관 · PALE ARCHON",
});

const CHARACTER_ACTIVE_LOADOUTS = Object.freeze({
  aegisRifle: Object.freeze([
    Object.freeze({ key: "Q", name: "EMP 펄스", detail: "기계 정지", icon: Broadcast }),
    Object.freeze({ key: "E", name: "방벽 전개", detail: "회복·보호", icon: ShieldChevron }),
    Object.freeze({ key: "F", name: "항공 지원", detail: "3중 폭격", icon: AirplaneTilt }),
    Object.freeze({ key: "R", name: "섬멸 모드", detail: "전방위 회전", icon: Crosshair }),
  ]),
  aegisSword: Object.freeze([
    Object.freeze({ key: "Q", name: "환검진", detail: "다중 검기", icon: Sword }),
    Object.freeze({ key: "E", name: "유령 참격", detail: "고속 관통", icon: Crosshair }),
    Object.freeze({ key: "F", name: "천검 영역", detail: "광역 검진", icon: Sparkle }),
    Object.freeze({ key: "R", name: "천검 낙하", detail: "거대 낙하검", icon: AirplaneTilt }),
  ]),
  mika: Object.freeze([
    Object.freeze({ key: "Q", name: "프리즘 연무", detail: "연쇄 도탄", icon: Sparkle }),
    Object.freeze({ key: "E", name: "리본 와류", detail: "주변 절단", icon: Crosshair }),
    Object.freeze({ key: "F", name: "쌍성 질주", detail: "왕복 돌진", icon: AirplaneTilt }),
    Object.freeze({ key: "R", name: "심장박동 카니발", detail: "링 블레이드 폭풍", icon: Broadcast }),
  ]),
  vesper: Object.freeze([
    Object.freeze({ key: "Q", name: "벡터 스텝", detail: "회피 사격", icon: Lightning }),
    Object.freeze({ key: "E", name: "제로 마크", detail: "약점 표식", icon: Target }),
    Object.freeze({ key: "F", name: "레일 버스트", detail: "관통 저격", icon: Crosshair }),
    Object.freeze({ key: "R", name: "데드라인", detail: "고속 섬멸", icon: AirplaneTilt }),
  ]),
  nox: Object.freeze([
    Object.freeze({ key: "Q", name: "검열 격자", detail: "표식 구속", icon: Target }),
    Object.freeze({ key: "E", name: "항소 무효", detail: "방어 차단", icon: ShieldChevron }),
    Object.freeze({ key: "F", name: "적색 영장", detail: "연쇄 판결", icon: Crosshair }),
    Object.freeze({ key: "R", name: "최종 판결", detail: "전장 처형", icon: Broadcast }),
  ]),
});

export { MIKA_RECRUIT_DIALOGUE };

const ABILITY_CATEGORY_KO = Object.freeze({
  "BASIC CONTROL": "필수 조작",
  "SURVIVAL CONTROL": "생존 조작",
  "TACTICAL UTILITY": "전술 유틸리티",
  "SURVIVAL SUPPORT": "생존 지원",
  "FIRE SUPPORT": "화력 지원",
  "ROTARY ULTIMATE": "회전형 필살기",
  "SWORD CONTROL": "근접 기본기",
  "DASH CUT": "돌진 참격",
  "SWORD DOMAIN": "광역 검술",
  "SWORD ULTIMATE": "검술 필살기",
});

const WORLD_TERM_KO = Object.freeze({
  "WRONG ENGINE": "오답 엔진",
  "GLASS DUNE": "유리 사구",
  "ABYSSAL ARCHIVE": "심해 기록고",
  "SOVEREIGN": "소버린",
  "AEGIS": "이지스",
  "HAVEN-09": "헤이븐-09",
  "NIGHTJAR": "나이트자",
  "NEON FOUNDRY": "네온 주조구",
  "STORM SPIRE": "폭풍 첨탑",
  "GENE VAULT": "생체 금고",
});

function localizeWorldText(value = "") {
  const protectedWrongEngine = "__THE_WRONG_ENGINE_PROPER_NAME__";
  const source = String(value).replaceAll("THE WRONG ENGINE", protectedWrongEngine);
  const localized = Object.entries(WORLD_TERM_KO).reduce(
    (copy, [term, korean]) => copy.replaceAll(term, korean),
    source,
  );
  return localized.replaceAll(protectedWrongEngine, "THE WRONG ENGINE");
}

function localizeThreatText(value = "") {
  return localizeWorldText(value)
    .replaceAll("DRONE", "자폭 드론")
    .replaceAll("RIFLE", "소총수")
    .replaceAll("SNIPER", "저격수")
    .replaceAll("RADIAL", "방사 탄막")
    .replaceAll("SWEEP", "전장 휩쓸기")
    .replaceAll("RAPID CHARGE", "연속 돌진")
    .replaceAll("PRISM LATTICE", "프리즘 격자")
    .replaceAll("SOLAR FLARE", "태양 폭발")
    .replaceAll("MEMORY SPIRAL", "기억 나선")
    .replaceAll("DEPTH COLLAPSE", "심해 붕괴");
}

function formatUpdatedAt(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "기록 없음";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function SaveSlotScreen({ slots, onSelect, onBack }) {
  const normalized = Array.from({ length: 3 }, (_, index) => slots?.[index] ?? null);
  return (
    <main className="campaign-shell save-slot-screen">
      <div className="campaign-grid" aria-hidden="true" />
      <header className="campaign-heading">
        <button type="button" className="campaign-back" onClick={onBack}><ArrowLeft weight="bold" /> 메인 메뉴</button>
        <small>HAVEN-09 // TACTICAL ARCHIVE</small>
        <h1>작전 프로필 선택</h1>
        <p>보스 토벌 데이터 및 작전 구역 해금 기록은 선택한 슬롯에 자동 저장됩니다.</p>
      </header>
      <section className="save-slot-grid" aria-label="캠페인 저장 슬롯">
        {normalized.map((slot, index) => {
          const completed = slot?.completedRegionIds?.length || 0;
          const progress = Math.round(completed / 6 * 100);
          const statusKey = !slot ? "new" : completed >= 6 ? "clear" : completed > 0 ? "in-progress" : "ready";
          const statusLabel = { new: "신규", clear: "완료", "in-progress": "진행 중", ready: "준비" }[statusKey];
          return (
            <button
              type="button"
              className={slot ? "save-slot-card has-data" : "save-slot-card is-empty"}
              onClick={() => onSelect(index)}
              key={`slot-${index + 1}`}
            >
              <div className="save-slot-card-header">
                <span className="save-slot-number">SLOT 0{index + 1}</span>
                <span className={`save-slot-status-tag is-${statusKey}`}>{statusLabel}</span>
              </div>
              {slot ? (
                <>
                  <div className="save-slot-icon-wrapper is-saved" aria-hidden="true"><FloppyDisk weight="duotone" /></div>
                  <strong>{slot.homeBaseUnlocked ? "헤이븐-09 작전 기록" : "첫 출격 대기"}</strong>
                  <p>해방 권역 {completed} / 6 · 전체 달성률 {progress}%</p>
                  <div className="save-slot-meter"><i style={{ width: `${progress}%` }} /></div>
                  <small>{formatUpdatedAt(slot.updatedAt)}</small>
                  <b>작전 속행 <Play weight="fill" /></b>
                </>
              ) : (
                <>
                  <div className="save-slot-icon-wrapper is-new" aria-hidden="true"><Plus weight="regular" /></div>
                  <strong>새 캠페인</strong>
                  <p>이지스와 함께 오답 엔진 추론핵 공략 작전을 개시합니다.</p>
                  <b>신규 작전 개시 <Play weight="fill" /></b>
                </>
              )}
            </button>
          );
        })}
      </section>
    </main>
  );
}

const NPC_ICON = Object.freeze({ hana: Broadcast, ilya: Wrench, lark: User, rhea: Crosshair });

const NPC_MENU_ICON = Object.freeze({ hana: "research", ilya: "equipment", lark: "navigation", rhea: "defense" });

function MenuAtlasIcon({ icon, fallback: FallbackIcon = Sparkle, className = "" }) {
  return (
    <span
      className={`generated-menu-icon is-${icon}${className ? ` ${className}` : ""}`}
      aria-hidden="true"
    >
      <FallbackIcon weight="duotone" />
    </span>
  );
}

export const MANUAL_ABILITY_GUIDE = Object.freeze([
  Object.freeze({
    key: "Q",
    id: "empPulse",
    name: "EMP PULSE",
    koreanName: "전자기 정지 펄스",
    category: "TACTICAL UTILITY",
    cooldown: 18,
    icon: "emp",
    summary: "적 무리 한가운데를 조준하고 Q를 누르세요. 범위 안의 기계가 잠시 멈춥니다.",
    details: ["일반 적은 3.6초, 정예 적은 1.8초 동안 정지합니다.", "탄환을 끌어당기지 않으므로 위험한 사격은 계속 피해야 합니다."],
    timing: "저격수와 자폭 드론이 동시에 접근할 때 포인터를 무리 중앙에 두세요.",
    quote: "Q는 전원 잠깐 빌리는 키야. 멈춘 동안 신나게 두들겨 줘.",
    exampleAssetKey: "tutorialEmpPulse",
    exampleAlt: "실제 전투에서 EMP 펄스로 기계 적의 이동과 사격을 정지시키는 장면",
    overlayPrompt: "기계 적 무리의 한가운데를 조준한 뒤 Q 또는 강조된 버튼을 누르세요.",
    callouts: Object.freeze([
      Object.freeze({ label: "포인터 목표", x: 38, y: 37 }),
      Object.freeze({ label: "EMP 정지 범위", x: 24, y: 48 }),
      Object.freeze({ label: "Q 스킬 버튼", x: 31, y: 92 }),
    ]),
  }),
  Object.freeze({
    key: "E",
    id: "aegisWard",
    name: "AEGIS WARD",
    koreanName: "이지스 방벽",
    category: "SURVIVAL SUPPORT",
    cooldown: 28,
    icon: "ward",
    summary: "위험 경고가 뜨기 직전에 E를 누르세요. 방벽이 5초 동안 이지스를 따라옵니다.",
    details: ["즉시 체력을 조금 회복하고 임시 실드를 얻습니다.", "피해와 상태 이상을 줄여 연속 공격을 버팁니다."],
    timing: "맞은 뒤보다 보스 경고 직전에 누르는 것이 좋습니다.",
    quote: "선체가 비명 지르기 전에 E. 기계한테 타이밍으로 지면 좀 창피하잖아?",
    exampleAssetKey: "tutorialAegisWard",
    exampleAlt: "실제 전투에서 이지스 방벽이 주인공을 감싸는 장면",
    overlayPrompt: "보스 경고나 포위 직전에 E 또는 강조된 버튼으로 방벽을 켜세요.",
    callouts: Object.freeze([
      Object.freeze({ label: "이지스를 따라오는 방벽", x: 50, y: 50 }),
      Object.freeze({ label: "5초 보호 범위", x: 35, y: 31 }),
      Object.freeze({ label: "E 스킬 버튼", x: 44, y: 92 }),
    ]),
  }),
  Object.freeze({
    key: "F",
    id: "stratosRun",
    name: "STRATOS RUN",
    koreanName: "성층권 기총 소사",
    category: "FIRE SUPPORT",
    cooldown: 34,
    icon: "stratos",
    summary: "길게 늘어선 적을 조준하고 F를 누르세요. 세 편대가 평행한 항로를 따라 연속 사격합니다.",
    details: ["밝은 경고선 세 줄이 실제 타격 경로입니다.", "소총수·저격수가 길게 늘어섰을 때 강합니다."],
    timing: "포인터로 적 대열을 가로지르는 공격 축을 정하세요.",
    quote: "적들이 줄을 섰다? 포인터로 길을 그리고 F. 성층권 편대가 세 줄로 긁고 갈게.",
    exampleAssetKey: "tutorialStratosRun",
    exampleAlt: "실제 전투에서 세 개의 STRATOS RUN 소사 항로가 적 대열을 통과하는 장면",
    overlayPrompt: "포인터로 적 대열을 가로지른 뒤 F 또는 강조된 버튼을 누르세요.",
    callouts: Object.freeze([
      Object.freeze({ label: "포인터를 지나는 공격 축", x: 50, y: 51 }),
      Object.freeze({ label: "3개 평행 소사 항로", x: 37, y: 25 }),
      Object.freeze({ label: "F 스킬 버튼", x: 59, y: 92 }),
    ]),
  }),
  Object.freeze({
    key: "R",
    id: "helixTempest",
    name: "HELIX TEMPEST",
    koreanName: "나선 폭풍",
    category: "ROTARY ULTIMATE",
    cooldown: 72,
    duration: 3.2,
    icon: "tempest",
    summary: "적에게 포위됐을 때 R을 누르세요. 네 개의 랜스가 3.2초 동안 주변을 빠르게 휩씁니다.",
    details: ["여러 바퀴 회전하며 사방을 연속 타격합니다.", "재사용 대기시간이 72초이므로 대공세나 보스의 코어 노출에 맞춰 사용하세요."],
    timing: "완전 포위 또는 보스 코어 노출이 가장 좋은 순간입니다.",
    quote: "R은 72초짜리 비상금. 포위됐거나 코어가 열렸을 때만 멋지게 써 줘.",
    exampleAssetKey: "tutorialHelixTempest",
    exampleAlt: "실제 전투에서 네 개의 HELIX TEMPEST 랜스가 주인공 주위를 회전하는 장면",
    overlayPrompt: "포위됐을 때 R 또는 강조된 버튼을 누르세요. 재사용 대기시간이 긴 비상 화력입니다.",
    callouts: Object.freeze([
      Object.freeze({ label: "이지스 중심", x: 50, y: 50 }),
      Object.freeze({ label: "360° 회전 랜스", x: 78, y: 37 }),
      Object.freeze({ label: "R 스킬 버튼", x: 72, y: 92 }),
    ]),
  }),
]);

export const STARTER_BRIEFING_GUIDE = Object.freeze([
  Object.freeze({
    key: "WASD",
    id: "starterMovement",
    name: "MOVE & AUTO ATTACK",
    koreanName: "이동과 자동 공격",
    category: "BASIC CONTROL",
    cooldownLabel: "상시",
    icon: "emp",
    summary: "WASD 또는 방향키로 위험 범위를 벗어나세요. 기본 공격은 포인터 방향으로 자동 발사됩니다.",
    details: ["공격 버튼을 연타할 필요가 없습니다.", "모바일에서는 빈 곳을 드래그해 이동하며 가까운 적을 자동 조준합니다."],
    timing: "적을 화면 한쪽에 두고 이동하면 조준과 회피를 함께 관리하기 쉽습니다.",
    quote: "먼저 움직여. 기본 사격은 기체가 맡을 테니 넌 안전한 길을 골라.",
    exampleAssetKey: "tutorialEmpPulse",
    exampleAlt: "실제 전투에서 이동하며 자동 공격하는 이지스",
    callouts: Object.freeze([
      Object.freeze({ label: "이동 경로", x: 36, y: 64 }),
      Object.freeze({ label: "포인터 조준", x: 61, y: 36 }),
    ]),
  }),
  Object.freeze({
    key: "SPACE",
    id: "starterSurvival",
    name: "PHASE DASH & ACTIVE SKILLS",
    koreanName: "대시와 위기 대응",
    category: "SURVIVAL CONTROL",
    cooldownLabel: "충전식",
    icon: "ward",
    summary: "붉은 경고선을 넘을 때 Space로 대시하세요. Q · E · F · R은 필요한 순간에 직접 쓰는 전술 스킬입니다.",
    details: ["대시 중에는 짧게 피해를 받지 않습니다.", "각 전술 스킬은 실제 교전에서 필요한 순간에 한 번씩 안내합니다."],
    timing: "첫 출격에서는 이동과 대시만 기억하고, 스킬은 화면의 강조 안내를 따라 사용하세요.",
    quote: "전부 외울 필요 없어. 위험하면 Space, 스킬은 내가 필요한 순간에 짚어 줄게.",
    exampleAssetKey: "tutorialAegisWard",
    exampleAlt: "실제 전투에서 대시와 방어 스킬로 위험을 넘기는 이지스",
    callouts: Object.freeze([
      Object.freeze({ label: "붉은 위험 경고", x: 63, y: 35 }),
      Object.freeze({ label: "대시로 통과", x: 46, y: 60 }),
    ]),
  }),
]);

export const SWORD_ABILITY_GUIDE = Object.freeze([
  Object.freeze({
    key: "Q", id: "spectralSwordArray", name: "SPECTRAL SWORD ARRAY", koreanName: "환검진", category: "SWORD CONTROL", cooldown: 6, icon: "sword",
    summary: "Q를 누르면 여러 자루의 환검이 주변을 즉시 베어 냅니다. 짧은 6초 주기로 적 무리에 계속 사용하세요.",
    details: ["주변 350 범위를 한 번에 공격합니다.", "근접 적이 둘 이상 붙으면 아끼지 말고 바로 사용하세요."],
    timing: "일반 전투의 기본기입니다. 재사용 알림이 켜질 때마다 적 무리 안에서 사용하세요.",
    quote: "Q 환검진은 기본 호흡이야. 준비되는 대로 계속 베어.", callouts: Object.freeze([]),
  }),
  Object.freeze({
    key: "E", id: "phantomRend", name: "PHANTOM REND", koreanName: "유령 참격", category: "DASH CUT", cooldown: 9, icon: "sword",
    summary: "포인터 방향으로 빠르게 파고들며 경로의 적을 관통합니다. 이동과 공격을 동시에 해결하는 검술입니다.",
    details: ["돌진하는 짧은 순간에는 피해를 받지 않습니다.", "적 뒤로 빠져나오거나 원거리 적에게 접근할 때 유용합니다."],
    timing: "적의 공격선이 닫히기 직전, 안전한 방향을 가리키고 E를 누르세요.",
    quote: "E는 도망이 아니라 관통이야. 위험한 선을 먼저 잘라.", callouts: Object.freeze([]),
  }),
  Object.freeze({
    key: "F", id: "imperialSwordDomain", name: "IMPERIAL SWORD DOMAIN", koreanName: "천검 영역", category: "SWORD DOMAIN", cooldown: 15, icon: "sword",
    summary: "거대한 검술 영역을 펼쳐 화면 가까이 몰린 적을 광범위하게 베어 냅니다.",
    details: ["주변 520 범위를 강하게 타격합니다.", "후반 웨이브처럼 적이 겹겹이 접근할 때 가장 효율적입니다."],
    timing: "적 무리가 충분히 모였을 때 F로 전장을 한 번에 정리하세요.",
    quote: "F는 전장을 네 검집으로 만드는 기술. 충분히 모이면 펼쳐.", callouts: Object.freeze([]),
  }),
  Object.freeze({
    key: "R", id: "heavenfallExecution", name: "HEAVENFALL EXECUTION", koreanName: "천검 낙하", category: "SWORD ULTIMATE", cooldown: 45, icon: "sword",
    summary: "거대한 검이 지정 지점에 낙하한 뒤 충격파로 주변 일반 적을 섬멸합니다.",
    details: ["낙하 경고 뒤 720 범위에 결정타가 발생합니다.", "45초 필살기이므로 후반 대공세나 보스 약점 노출에 맞추세요."],
    timing: "가장 많은 적이 모인 순간 또는 보스 코어가 열린 순간 R을 사용하세요.",
    quote: "R 천검 낙하는 끝내는 검이야. 가장 비싼 순간에 내려꽂아.", callouts: Object.freeze([]),
  }),
]);

const ABILITY_ICON = Object.freeze({
  emp: Broadcast,
  ward: ShieldChevron,
  stratos: AirplaneTilt,
  tempest: Sparkle,
  sword: Sword,
});

function resolveNpcPortraitSource(npc, assets) {
  if (npc?.portraitKey === "hanaPortrait") return assetSource(assets?.hanaPortrait);
  if (npc?.portraitKey === "ilyaPortrait") return assetSource(assets?.ilyaPortrait);
  if (npc?.portraitKey === "nightjarPilot") return assetSource(assets?.nightjarPilot);
  if (npc?.portraitKey === "rheaControlOfficer") return assetSource(assets?.controlOfficer);
  return assetSource(npc?.portraitPath);
}

function NpcPortrait({ npc, assets }) {
  const portrait = resolveNpcPortraitSource(npc, assets);
  return (
    <div
      className={`base-npc-portrait is-standalone is-${npc.id}`}
      role="img"
      aria-label={`${npc.name} 대화 일러스트`}
    >
      {portrait && <NpcPortraitImage source={portrait} npcId={npc.id} />}
    </div>
  );
}

export function NpcDialoguePanel({ npc, assets, lineIndex, onAdvance, onClose, onFacility, onInteraction }) {
  const dialogRef = useRef(null);
  useDialogFocusTrap(dialogRef, Boolean(npc));
  const lines = npc?.dialogue || [];
  const line = localizeWorldText(lines[Math.min(lineIndex, Math.max(0, lines.length - 1))] || "통신 기록이 없습니다.");
  const final = lineIndex >= lines.length - 1;
  useEffect(() => {
    if (!npc) return undefined;
    const handleDialogueSpace = (event) => {
      if (event.code !== "Space" || event.repeat) return;
      event.preventDefault();
      event.stopPropagation();
      if (final) onClose?.();
      else onAdvance?.();
    };
    window.addEventListener("keydown", handleDialogueSpace);
    return () => window.removeEventListener("keydown", handleDialogueSpace);
  }, [final, npc, onAdvance, onClose]);
  if (!npc) return null;
  const display = NPC_DISPLAY[npc.id] || { name: npc.name, role: npc.role };
  return (
    <section className="base-dialogue" role="dialog" aria-modal="true" aria-labelledby="base-dialogue-name" ref={dialogRef} tabIndex={-1}>
      <NpcPortrait npc={npc} assets={assets} />
      <div className="base-dialogue-copy">
        <small>{display.role}</small>
        <h2 id="base-dialogue-name">{display.name}</h2>
        <p>{line}</p>
        <footer className="base-dialogue-actions">
          {npc.facilityId && onFacility && (
            <button type="button" className="base-facility-cta" onClick={() => onFacility(npc.facilityId)}>
              {npc.facilityLabel || "기지 설비 열기"}{npc.facilityId === "research" ? <Brain weight="fill" /> : <Wrench weight="fill" />}
            </button>
          )}
          {npc.interaction && onInteraction && (
            <button type="button" className="base-interaction-cta" onClick={() => onInteraction(npc.interaction)}>
              {npc.flightOperationLabel || npc.interactionLabel || "상호작용"}{npc.interaction === "open-flight-operations" ? <AirplaneTilt weight="fill" /> : <Crosshair weight="bold" />}
            </button>
          )}
          <button className="base-dialogue-next" type="button" data-dialog-initial-focus data-ui-sound={final ? "uiClose" : "click"} onClick={final ? onClose : onAdvance}>
            {final ? "대화 종료" : "다음"}<ChatText weight="bold" />
          </button>
          <small className="dialogue-escape-hint"><kbd>SPACE</kbd> {final ? "대화 종료" : "다음 대사"} · <kbd>ESC</kbd> 닫기</small>
        </footer>
      </div>
    </section>
  );
}

export function BaseFacilityPanel({ facility, onPurchase, onExchange, onClose, onWeaponChange, onOpenSwordGuide }) {
  const dialogRef = useRef(null);
  const [npcReactionIndex, setNpcReactionIndex] = useState(-1);
  useDialogFocusTrap(dialogRef, Boolean(facility && facility.id !== "augmentation"));
  useEffect(() => setNpcReactionIndex(-1), [facility?.id]);
  if (!facility) return null;
  if (facility.id === "augmentation") {
    return <CharacterInformationPanel facility={facility} onPurchase={onPurchase} onClose={onClose} onCharacterChange={facility.onCharacterChange} onWeaponChange={onWeaponChange} onOpenSwordGuide={onOpenSwordGuide} />;
  }
  const isResearch = facility.id === "research";
  const FacilityIcon = isResearch ? Brain : Wrench;
  const facilityNpc = facility.npc;
  const facilityNpcDisplay = facilityNpc ? NPC_DISPLAY[facilityNpc.id] || { name: facilityNpc.name, role: facilityNpc.role } : null;
  const facilityNpcDialogue = facilityNpc?.portraitDialogue?.length ? facilityNpc.portraitDialogue : facilityNpc?.dialogue || [];
  const facilityNpcReaction = npcReactionIndex >= 0 && facilityNpcDialogue.length
    ? localizeWorldText(facilityNpcDialogue[npcReactionIndex % facilityNpcDialogue.length])
    : "일러스트를 눌러 담당자와 대화하세요.";
  return (
    <section className={`base-facility-panel facility-${facility.id}${facility.artSource ? " has-key-art" : ""}${facilityNpc ? " has-npc-host" : ""}`} role="dialog" aria-modal="true" aria-labelledby="base-facility-name" ref={dialogRef} tabIndex={-1}>
      {facility.artSource && <img className="facility-key-art" src={assetSource(facility.artSource)} alt="기지 시설 일러스트" />}
      {facilityNpc && (
        <aside className={`facility-npc-stage is-${facilityNpc.id}`} aria-label={`${facilityNpcDisplay.name} 담당자 인터랙션`}>
          <button
            type="button"
            className={`facility-npc-portrait is-${facilityNpc.id}${facilityNpc.portraitMode === "standalone" ? " is-standalone" : ""}`}
            onClick={() => setNpcReactionIndex((index) => nextDialogueIndex(index, facilityNpcDialogue))}
            aria-label={`${facilityNpcDisplay.name} 일러스트와 대화`}
          >
            {facilityNpc.portraitSource && (
              <NpcPortraitImage source={assetSource(facilityNpc.portraitSource)} npcId={facilityNpc.id} />
            )}
          </button>
          <div className="facility-npc-dialogue" role="status">
            <small>{facilityNpcDisplay.role}</small>
            <strong>{facilityNpcDisplay.name}</strong>
            <p>{facilityNpcReaction}</p>
          </div>
        </aside>
      )}
      <header>
        <span><FacilityIcon weight="fill" /></span>
        <div>
          <small>{facility.kicker}</small>
          <h2 id="base-facility-name">{facility.name}</h2>
          <p>{facility.description}</p>
        </div>
        <button type="button" className="facility-close" data-ui-sound="uiClose" onClick={onClose} aria-label={`${facility.name} 닫기`}><ArrowLeft weight="bold" /> 기지로 <kbd>ESC</kbd></button>
      </header>

      <div className="facility-resource">
        <small>보유 {facility.currencyLabel}</small>
        <strong>{facility.currency}</strong>
        <span>{facility.currencyHint}</span>
      </div>

      <div className="facility-upgrade-grid">
        {(facility.upgrades || []).map((upgrade) => {
          const maxed = upgrade.rank >= upgrade.maxRank;
          const disabled = maxed || !upgrade.canPurchase;
          const purchasable = !maxed && upgrade.canPurchase;
          return (
            <article className={`facility-upgrade${maxed ? " is-maxed" : ""}${purchasable ? " is-purchasable" : ""} upgrade-${upgrade.id}`} key={upgrade.id}>
              <header>
                <span className="upgrade-index-badge">{String(upgrade.order || 1).padStart(2, "0")}</span>
                <div><small>{upgrade.category}</small><h3>{upgrade.name}</h3></div>
                <b>{maxed ? "MAX 개조" : `RANK ${upgrade.rank} / ${upgrade.maxRank}`}</b>
              </header>
              <div className="upgrade-ranks" aria-label={`${upgrade.maxRank}랭크 중 ${upgrade.rank}랭크`}>
                {Array.from({ length: upgrade.maxRank }, (_, index) => <i className={index < upgrade.rank ? "is-active" : ""} key={index} />)}
              </div>
              <p>{upgrade.description}</p>
              <dl>
                <div><dt>현재 효과</dt><dd className="effect-current">{upgrade.currentEffect || "효과 없음"}</dd></div>
                <div><dt>{maxed ? "완료" : "다음 단계"}</dt><dd className={`effect-next${purchasable ? " is-upgradable" : ""}`}>{maxed ? "최고 단계" : upgrade.nextEffect}</dd></div>
              </dl>
              <button type="button" className={`command-ui-button${purchasable ? " is-ready-cta" : ""}`} data-ui-sound={disabled ? "denied" : "uiConfirm"} disabled={disabled} onClick={() => onPurchase(upgrade.id)}>
                {maxed ? <><CheckCircle weight="fill" /> 개조 완료</> : upgrade.lockedReason ? <><Lock weight="fill" /> {upgrade.lockedReason}</> : <><FacilityIcon weight="bold" /> {upgrade.nextCost} {facility.currencyShortLabel}로 강화</>}
              </button>
            </article>
          );
        })}
      </div>

      {(facility.exchanges || []).length > 0 && (
        <section className="facility-exchange-panel" aria-labelledby="facility-exchange-title">
          <header>
            <div><small>잉여 자원 전환</small><h3 id="facility-exchange-title">전술 물자 합성</h3></div>
            <span>보유 재화를 즉시 상호 변환합니다.</span>
          </header>
          <div className="facility-exchange-grid">
            {facility.exchanges.map((exchange) => (
              <article className={exchange.canExchange ? "is-ready" : ""} key={exchange.id}>
                <div><small>{exchange.name}</small><strong>{exchange.koreanName}</strong></div>
                <p>{exchange.description}</p>
                <footer>
                  <span><b>{exchange.costLabel}</b><ArrowRight weight="bold" /><em>{exchange.rewardLabel}</em></span>
                  <button type="button" className="command-ui-button" data-ui-sound={exchange.canExchange ? "uiConfirm" : "denied"} disabled={!exchange.canExchange} onClick={() => onExchange?.(exchange.id)}>
                    {exchange.lockedReason ? <><Lock weight="fill" /> {exchange.lockedReason}</> : <><Brain weight="fill" /> 1회 제작</>}
                  </button>
                </footer>
              </article>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}

function CharacterInformationPanel({ facility, onPurchase, onClose, onCharacterChange, onWeaponChange, onOpenSwordGuide }) {
  const dialogRef = useRef(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [profileId, setProfileId] = useState(facility?.selectedCharacterId || facility?.characters?.[0]?.id || "aegis");
  const [portraitCompact, setPortraitCompact] = useState(false);
  useDialogFocusTrap(dialogRef, true);
  useEffect(() => {
    setProfileId(facility?.selectedCharacterId || facility?.characters?.[0]?.id || "aegis");
  }, [facility?.selectedCharacterId, facility?.characters]);
  const profile = facility?.characters?.find((character) => character.id === profileId) || facility?.characters?.[0];
  const upgrades = facility?.upgrades || [];
  const activeLoadout = profile?.id === "mika"
    ? CHARACTER_ACTIVE_LOADOUTS.mika
    : profile?.id === "vesper"
      ? CHARACTER_ACTIVE_LOADOUTS.vesper
      : profile?.id === "nox"
        ? CHARACTER_ACTIVE_LOADOUTS.nox
        : facility?.mainWeaponId === "beam-sword" ? CHARACTER_ACTIVE_LOADOUTS.aegisSword : CHARACTER_ACTIVE_LOADOUTS.aegisRifle;
  const progressionUpgrade = upgrades.find((upgrade) => upgrade.characterId === profile?.id)
    || upgrades.find((upgrade) => String(upgrade.id || "").startsWith(`${profile?.id}-`))
    || null;
  const progressionRank = Math.max(0, Number(progressionUpgrade?.rank || 0));
  const progressionSkills = progressionUpgrade?.skillLoadout?.skills || [];
  const skillNodes = activeLoadout.map((ability, index) => {
    const key = String(ability.key || "").trim().toUpperCase();
    const runtimeSkill = progressionSkills.find((skill) => String(skill.slot || "").toUpperCase() === key);
    const requiredGrade = Number(runtimeSkill?.requiredGrade ?? index);
    const unlocked = Boolean(profile?.unlocked) && requiredGrade <= progressionRank;
    return {
      ability,
      upgrade: progressionUpgrade,
      key,
      requiredGrade,
      unlocked,
      index,
      state: unlocked ? "unlocked" : requiredGrade === progressionRank + 1 ? "next" : "locked",
    };
  });
  const unlockedSkillCount = skillNodes.filter((node) => node.unlocked).length;
  const baseDamageOutput = facility?.combatStats?.damageOutput || 100;
  const baseFireRate = facility?.combatStats?.fireRate || 100;
  const displayedMaxHp = profile?.id === "vesper" ? 320 : profile?.id === "nox" ? 338 : (facility?.combatStats?.maxHp || 360);
  const displayedDamageOutput = profile?.id === "vesper" ? Math.round(baseDamageOutput * 1.16) : profile?.id === "nox" ? Math.round(baseDamageOutput * 1.11) : baseDamageOutput;
  const displayedFireRate = profile?.id === "vesper" ? Math.round(baseFireRate * 1.08) : profile?.id === "nox" ? Math.round(baseFireRate * 1.03) : baseFireRate;
  const completedRegions = new Set(facility?.completedRegionIds || []);
  const chooseCharacter = (characterId) => {
    const selected = facility?.characters?.find((character) => character.id === characterId);
    if (!selected) return;
    setProfileId(characterId);
    if (selected.unlocked) onCharacterChange?.(characterId);
  };
  const purchaseUpgrade = (upgradeId) => {
    onPurchase?.(upgradeId);
  };
  return (
    <section className={`character-information-panel is-${profile?.accent || "cyan"}${portraitCompact ? " is-portrait-compact" : ""}`} role="dialog" aria-modal="true" aria-labelledby="character-information-name" ref={dialogRef} tabIndex={-1}>
      {facility?.artSource && <img className="character-info-environment" src={assetSource(facility.artSource)} alt="" aria-hidden="true" />}
      <header className="character-info-topbar">
        <div>
          <small>{facility?.kicker || "HAVEN-09 // SYNC CHAMBER"}</small>
          <strong>전투원 정보</strong>
        </div>
        <div className="character-core-balance" aria-label={`보유 ${facility?.currencyLabel} ${facility?.currency}`}>
          <MenuAtlasIcon atlas={facility?.menuIconAtlas} icon="augmentation" fallback={Sparkle} /><span>{facility?.currencyLabel}</span><b>{facility?.currency}</b>
        </div>
        <button type="button" className="facility-close" data-ui-sound="uiClose" onClick={onClose} aria-label="전투원 정보 닫기"><ArrowLeft weight="bold" /> 기지로 <kbd>ESC</kbd></button>
      </header>

      <button
        type="button"
        className="character-portrait-toggle"
        aria-expanded={!portraitCompact}
        aria-controls="character-art-stage"
        onClick={() => setPortraitCompact((compact) => !compact)}
      >
        {portraitCompact ? "초상화 펼치기" : "초상화 접고 정보 보기"}
      </button>

      <figure className={`character-art-stage is-${profile?.id || "aegis"}`} id="character-art-stage">
        {profile?.portraitSource && <InteractivePortrait key={profile.id} source={assetSource(profile.portraitSource)} characterId={profile.id} name={profile.koreanName} />}
        {!profile?.unlocked && (
          <div className="character-lock-banner" role="status">
            <Lock weight="fill" />
            <span><small>OPERATIVE LOCKED</small><strong>{profile?.unlockDescription || "작전 구역 클리어 시 합류"}</strong></span>
          </div>
        )}
        <figcaption>
          <small>{profile?.role}</small>
          <h2 id="character-information-name">{profile?.koreanName}</h2>
          <strong>{profile?.name}</strong>
          <span>스킬 링크 {unlockedSkillCount} / {skillNodes.length}</span>
        </figcaption>
      </figure>

      <section className="character-data-console">
        <nav className="character-info-tabs" aria-label="전투원 정보 분류">
          <button type="button" className={activeTab === "profile" ? "is-active" : ""} onClick={() => setActiveTab("profile")}><MenuAtlasIcon atlas={facility?.menuIconAtlas} icon="operative" fallback={User} /> 기본 정보</button>
          <button type="button" className={activeTab === "upgrade" ? "is-active" : ""} onClick={() => setActiveTab("upgrade")}><MenuAtlasIcon atlas={facility?.menuIconAtlas} icon="augmentation" fallback={Sparkle} /> 스킬 해금</button>
        </nav>

        {activeTab === "profile" ? (
          <div className="character-profile-content">
            <header>
              <div><small>ACTIVE OPERATIVE</small><h3>{profile?.koreanName} · {profile?.name}</h3></div>
              <span>{profile?.weaponName}</span>
            </header>
            <p>{profile?.description}</p>
            <dl className="character-stat-grid">
              <div><dt>최대 내구도</dt><dd>{displayedMaxHp}</dd></div>
              <div><dt>공격 출력</dt><dd>{displayedDamageOutput}%</dd></div>
              <div><dt>기동 속도</dt><dd>{profile?.id === "mika" ? facility?.combatStats?.mikaSpeed : profile?.id === "vesper" ? facility?.combatStats?.vesperSpeed : profile?.id === "nox" ? facility?.combatStats?.noxSpeed : facility?.combatStats?.aegisSpeed}</dd></div>
              <div><dt>공격 주기</dt><dd>{displayedFireRate}%</dd></div>
              <div><dt>해방 구역</dt><dd>{facility?.combatStats?.completedRegions || 0} / 6</dd></div>
              <div><dt>태그 대기</dt><dd>10초</dd></div>
            </dl>
            <section className="character-active-kit" aria-label={`${profile?.koreanName} 액티브 스킬`}>
              <header><small>MANUAL COMBAT LINK</small><strong>사용 스킬</strong></header>
              <div>
                {skillNodes.map(({ ability, key, unlocked, state }) => {
                  const AbilityIcon = ability.icon;
                  return (
                    <article className={unlocked ? "is-unlocked" : "is-locked"} key={key}>
                      <kbd>{key}</kbd>
                      <AbilityIcon weight="fill" />
                      <span><b>{ability.name}</b><small>{unlocked ? ability.detail : state === "next" ? "다음 강화에서 해금" : "선행 스킬 해금 필요"}</small></span>
                      {!unlocked && <Lock className="character-skill-lock" weight="fill" />}
                    </article>
                  );
                })}
              </div>
            </section>
            {profile?.id === "aegis" ? (
              <section className="character-weapon-management" aria-labelledby="character-weapon-title">
                <header>
                  <div><small>MAIN WEAPON LOADOUT</small><strong id="character-weapon-title">주 무기 장착</strong></div>
                  <span>출격 전 이 화면에서 장비와 증강 트리를 확정합니다.</span>
                </header>
                <div className="character-weapon-options">
                  {(facility?.weapons || []).map((weapon) => {
                    const equipped = weapon.id === facility?.mainWeaponId;
                    const unlocked = !weapon.unlockRegionId || completedRegions.has(weapon.unlockRegionId);
                    const rankKey = weapon.id === "beam-sword" ? "ilya-sword-resonator" : "ilya-rifle-emitter";
                    const rank = facility?.equipmentRanks?.[rankKey] || 0;
                    const WeaponIcon = weapon.id === "beam-sword" ? Sword : Crosshair;
                    return (
                      <button
                        type="button"
                        className={`character-weapon-card${equipped ? " is-equipped" : ""}${unlocked ? "" : " is-locked"}`}
                        disabled={!unlocked}
                        aria-pressed={equipped}
                        data-ui-sound={unlocked ? equipped ? "click" : "uiConfirm" : "denied"}
                        onClick={() => unlocked && onWeaponChange?.(weapon.id)}
                        key={weapon.id}
                      >
                        <span><WeaponIcon weight="fill" /></span>
                        <div><small>{weapon.role}</small><strong>{weapon.koreanName}</strong><em>{weapon.name}</em></div>
                        <p>{unlocked ? weapon.description : weapon.unlockDescription}</p>
                        <footer><b>{unlocked ? `${weapon.treeLabel} · 개조 ${rank}단계` : "유리 사구 최초 클리어 필요"}</b></footer>
                        {equipped ? <mark><CheckCircle weight="fill" /> 장착 중</mark> : !unlocked && <mark><Lock weight="fill" /> 미해금</mark>}
                      </button>
                    );
                  })}
                </div>
                {completedRegions.has("glass-dune") && <button type="button" className="character-sword-guide-button" data-ui-sound="click" onClick={onOpenSwordGuide}><Sword weight="fill" /> 빔 소드 스킬 가이드</button>}
              </section>
            ) : (
              <section className="character-fixed-weapon-note"><strong>{profile?.weaponName}</strong><span>{profile?.koreanName} 전용 고정 장비 · 태그 시 자동 전환</span></section>
            )}
            <section className="character-trait-note"><small>OPERATIVE TRAIT</small><strong>{profile?.traitName}</strong><span>{profile?.traitDescription}</span></section>
            <button type="button" className="character-open-upgrades command-ui-button" data-ui-sound="click" onClick={() => setActiveTab("upgrade")}><Sparkle weight="fill" /> 스킬 링크 해금 보기</button>
            <section className="character-story-archive" aria-labelledby="character-story-title">
              <header><small>PERSONNEL ARCHIVE</small><strong id="character-story-title">{profile?.backgroundTitle || "전투원 기록"}</strong></header>
              <p>{profile?.backgroundSummary}</p>
              <div>
                {(profile?.storyEntries || []).map((entry, index) => (
                  <article key={`${profile?.id}-story-${index}`}>
                    <small>FILE {String(index + 1).padStart(2, "0")}</small>
                    <strong>{entry.title}</strong>
                    <span>{entry.text}</span>
                  </article>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="character-upgrade-content">
            <header className="character-skill-ladder-heading">
              <div><small>COMBAT LINK AUTHORIZATION</small><h3>전투 스킬 해금 경로</h3></div>
              <span>Q 기본 지급 · E → F → R 순차 개방</span>
            </header>
            <section className="character-skill-ladder-summary" aria-label="스킬 해금 진행 요약">
              <div><small>현재 전투원</small><strong>{profile?.koreanName}</strong></div>
              <div><small>해금 진행</small><strong>{unlockedSkillCount} / {skillNodes.length}</strong></div>
              <p>상위 스킬은 앞 단계 링크를 확보한 뒤 동기화 코어로 개방합니다. 향후 추가 스킬도 이 경로에 연장됩니다.</p>
            </section>
            <ol className="character-skill-ladder" aria-label={`${profile?.koreanName} Q E F R 스킬 해금 경로`}>
              {skillNodes.map(({ ability, upgrade, key, state, unlocked, requiredGrade }, index) => {
                const AbilityIcon = ability.icon;
                const canPurchase = Boolean(upgrade && !unlocked && state === "next" && upgrade.canPurchase);
                const disabled = !canPurchase;
                return (
                  <li className={`character-skill-node is-${state}`} key={key}>
                    <span className="character-skill-connector" aria-hidden="true"><i /></span>
                    <div className="character-skill-emblem"><kbd>{key}</kbd><AbilityIcon weight="fill" /></div>
                    <div className="character-skill-copy">
                      <small>{index === 0 ? "BASE LINK" : `AUTHORIZATION 0${requiredGrade}`}</small>
                      <h4>{ability.name}</h4>
                      <p>{ability.detail}</p>
                      <span>{unlocked ? "전투 사용 가능" : state === "next" ? "다음 해금 대상" : `${skillNodes[index - 1]?.key || "선행"} 스킬 해금 필요`}</span>
                    </div>
                    <div className="character-skill-state">
                      {unlocked ? (
                        <strong><CheckCircle weight="fill" /> {key === "Q" ? "기본 해금" : "해금 완료"}</strong>
                      ) : upgrade && state === "next" ? (
                        <button
                          type="button"
                          className={`command-ui-button${canPurchase ? " is-ready-cta" : ""}`}
                          data-ui-sound={disabled ? "denied" : "uiConfirm"}
                          disabled={disabled}
                          onClick={() => purchaseUpgrade(upgrade.id)}
                        >
                          {upgrade.lockedReason ? <><Lock weight="fill" /> {upgrade.lockedReason}</> : <><Sparkle weight="fill" /> 코어 {upgrade.nextCost || 1}개로 해금</>}
                        </button>
                      ) : (
                        <strong className="is-locked"><Lock weight="fill" /> {state === "locked" ? `${skillNodes[index - 1]?.key || "선행"} 링크 필요` : "해금 데이터 대기"}</strong>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
            <footer className="character-skill-ladder-footer">
              <Sparkle weight="fill" /><span>{facility?.currencyHint || "동기화 코어는 작전 보상으로 획득합니다."}</span>
            </footer>
          </div>
        )}
      </section>

      <nav className="character-roster-rail" aria-label="전투원 선택">
        {(facility?.characters || []).map((character) => (
          <button type="button" className={`${character.id === profile?.id ? "is-active" : ""}${character.unlocked ? "" : " is-locked"}`} aria-label={character.unlocked ? `${character.koreanName} 정보 보기` : `${character.koreanName} 미리보기. ${character.unlockDescription}`} aria-pressed={character.id === profile?.id} onClick={() => chooseCharacter(character.id)} key={character.id}>
            <img src={assetSource(character.portraitSource)} alt="" /><span>{character.unlocked ? character.koreanName : <><Lock weight="fill" /> {character.koreanName}</>}</span>
          </button>
        ))}
      </nav>
    </section>
  );
}

function MotionPortraitStage({ source, characterId, name, onOpen }) {
  return (
    <section
      className={`base-motion-portrait is-${characterId}`}
      data-portrait-surface="interactive-operative"
      aria-label={`${name} 상호작용 포트레이트`}
    >
      <div className="motion-portrait-body">
        <InteractivePortrait key={characterId} source={assetSource(source)} characterId={characterId} name={name} presentation="lobby" />
      </div>
      <button type="button" className="motion-portrait-caption" onClick={onOpen} aria-label={`${name} 전투원 정보 열기`}>
        <small>ACTIVE OPERATIVE</small><strong>{name}</strong><em>전투원 정보</em>
      </button>
    </section>
  );
}

export function MikaRecruitScreen({ assets, onComplete }) {
  const dialogRef = useRef(null);
  const [lineIndex, setLineIndex] = useState(0);
  const line = MIKA_RECRUIT_DIALOGUE[Math.min(lineIndex, MIKA_RECRUIT_DIALOGUE.length - 1)];
  const finalLine = lineIndex >= MIKA_RECRUIT_DIALOGUE.length - 1;
  const next = useCallback(
    () => finalLine ? onComplete?.() : setLineIndex((index) => index + 1),
    [finalLine, onComplete],
  );
  const portraitSource = line.portrait === "rhea"
    ? assets?.controlOfficer
    : line.portrait === "aegis" ? assets?.playerPortrait : assets?.mikaPortrait;
  useDialogFocusTrap(dialogRef, true);
  useEffect(() => {
    const advance = (event) => {
      if ((event.code !== "Space" && event.code !== "Enter") || event.repeat) return;
      event.preventDefault();
      next();
    };
    window.addEventListener("keydown", advance);
    return () => window.removeEventListener("keydown", advance);
  }, [next]);
  return (
    <main className="campaign-shell mika-recruit-screen">
      {assets?.characterSyncChamber && <img className="campaign-background" src={assetSource(assets.characterSyncChamber)} alt="헤이븐-09 전투원 동기화실" />}
      <div className="mika-recruit-shade" aria-hidden="true" />
      <header className="mika-recruit-heading">
        <small>오답 엔진 중앙로 · 최초 클리어</small>
        <strong id="mika-recruit-title">신규 전투원 조우</strong>
      </header>
      <section className="mika-recruit-stage" role="dialog" aria-modal="true" aria-labelledby="mika-recruit-title" ref={dialogRef} tabIndex={-1}>
        <figure className={`mika-recruit-character is-${line.portrait}`} key={`${lineIndex}-${line.portrait}`}>
          {portraitSource && (line.portrait === "rhea" ? <NpcPortraitImage source={assetSource(portraitSource)} npcId="rhea" alt={`${line.speaker} 대화 일러스트`} /> : <OperativePortraitImage source={assetSource(portraitSource)} characterId={line.portrait} alt={`${line.speaker} 대화 일러스트`} />)}
        </figure>
        <div className="mika-recruit-progress" aria-label={`${lineIndex + 1}/${MIKA_RECRUIT_DIALOGUE.length} 대화`}>
          {MIKA_RECRUIT_DIALOGUE.map((_, index) => <i className={index <= lineIndex ? "is-active" : ""} key={index} />)}
        </div>
        <div className="mika-recruit-dialogue-box">
          <div><small>{line.portrait === "mika" ? "PRISM RINGBLADE OPERATIVE" : line.portrait === "aegis" ? "AEGIS FIELD LEAD" : "HAVEN-09 CONTROL"}</small><strong>{line.speaker}</strong></div>
          <p>{line.text}</p>
          <button type="button" data-ui-sound={finalLine ? "uiConfirm" : "click"} onClick={next}>
            <span>{finalLine ? "미카의 합류를 확인한다" : "다음 대화"}<kbd>SPACE</kbd></span><ArrowRight weight="bold" />
          </button>
        </div>
      </section>
    </main>
  );
}

export function VesperRecruitScreen({ assets, onComplete }) {
  const dialogRef = useRef(null);
  const [lineIndex, setLineIndex] = useState(0);
  const line = VESPER_RECRUIT_DIALOGUE[Math.min(lineIndex, VESPER_RECRUIT_DIALOGUE.length - 1)];
  const finalLine = lineIndex >= VESPER_RECRUIT_DIALOGUE.length - 1;
  const next = useCallback(
    () => finalLine ? onComplete?.() : setLineIndex((index) => index + 1),
    [finalLine, onComplete],
  );
  const portraitSource = line.portrait === "aegis" ? assets?.playerPortrait : assets?.vesperPortrait;
  useDialogFocusTrap(dialogRef, true);
  useEffect(() => {
    const advance = (event) => {
      if ((event.code !== "Space" && event.code !== "Enter") || event.repeat) return;
      event.preventDefault();
      next();
    };
    window.addEventListener("keydown", advance);
    return () => window.removeEventListener("keydown", advance);
  }, [next]);
  return (
    <main className="campaign-shell mika-recruit-screen vesper-recruit-screen">
      {assets?.characterSyncChamber && <img className="campaign-background" src={assetSource(assets.characterSyncChamber)} alt="헤이븐-09 전투원 동기화실" />}
      <div className="mika-recruit-shade" aria-hidden="true" />
      <header className="mika-recruit-heading">
        <small>심해 기록고 · 최초 클리어</small>
        <strong id="vesper-recruit-title">신규 전투원 합류</strong>
      </header>
      <section className="mika-recruit-stage" role="dialog" aria-modal="true" aria-labelledby="vesper-recruit-title" ref={dialogRef} tabIndex={-1}>
        <figure className={`mika-recruit-character is-${line.portrait}`} key={`${lineIndex}-${line.portrait}`}>
          {portraitSource && (line.portrait === "rhea" ? <NpcPortraitImage source={assetSource(portraitSource)} npcId="rhea" alt={`${line.speaker} 대화 일러스트`} /> : <OperativePortraitImage source={assetSource(portraitSource)} characterId={line.portrait} alt={`${line.speaker} 대화 일러스트`} />)}
        </figure>
        <div className="mika-recruit-progress" aria-label={`${lineIndex + 1}/${VESPER_RECRUIT_DIALOGUE.length} 대화`}>
          {VESPER_RECRUIT_DIALOGUE.map((_, index) => <i className={index <= lineIndex ? "is-active" : ""} key={index} />)}
        </div>
        <div className="mika-recruit-dialogue-box">
          <div><small>{line.portrait === "vesper" ? "VESPER PRECISION OPERATIVE" : "AEGIS FIELD LEAD"}</small><strong>{line.speaker}</strong></div>
          <p>{line.text}</p>
          <button type="button" data-ui-sound={finalLine ? "uiConfirm" : "click"} onClick={next}>
            <span>{finalLine ? "베스퍼 합류를 승인한다" : "다음 대화"}<kbd>SPACE</kbd></span><ArrowRight weight="bold" />
          </button>
        </div>
      </section>
    </main>
  );
}

export function NoxRecruitScreen({ assets, onComplete }) {
  const dialogRef = useRef(null);
  const [lineIndex, setLineIndex] = useState(0);
  const line = NOX_RECRUIT_DIALOGUE[Math.min(lineIndex, NOX_RECRUIT_DIALOGUE.length - 1)];
  const finalLine = lineIndex >= NOX_RECRUIT_DIALOGUE.length - 1;
  const next = useCallback(
    () => finalLine ? onComplete?.() : setLineIndex((index) => index + 1),
    [finalLine, onComplete],
  );
  const portraitSource = line.portrait === "aegis" ? assets?.playerPortrait : assets?.noxPortrait;
  useDialogFocusTrap(dialogRef, true);
  useEffect(() => {
    const advance = (event) => {
      if ((event.code !== "Space" && event.code !== "Enter") || event.repeat) return;
      event.preventDefault();
      next();
    };
    window.addEventListener("keydown", advance);
    return () => window.removeEventListener("keydown", advance);
  }, [next]);
  return (
    <main className="campaign-shell mika-recruit-screen nox-recruit-screen">
      {assets?.characterSyncChamber && <img className="campaign-background" src={assetSource(assets.characterSyncChamber)} alt="헤이븐-09 전투원 동기화실" />}
      <div className="mika-recruit-shade" aria-hidden="true" />
      <header className="mika-recruit-heading">
        <small>네온 주조로 · 불법 명령 기록 회수</small>
        <strong id="nox-recruit-title">신규 전투원 합류</strong>
      </header>
      <section className="mika-recruit-stage" role="dialog" aria-modal="true" aria-labelledby="nox-recruit-title" ref={dialogRef} tabIndex={-1}>
        <figure className={`mika-recruit-character is-${line.portrait}`} key={`${lineIndex}-${line.portrait}`}>
          {portraitSource && (line.portrait === "rhea" ? <NpcPortraitImage source={assetSource(portraitSource)} npcId="rhea" alt={`${line.speaker} 대화 일러스트`} /> : <OperativePortraitImage source={assetSource(portraitSource)} characterId={line.portrait} alt={`${line.speaker} 대화 일러스트`} />)}
        </figure>
        <div className="mika-recruit-progress" aria-label={`${lineIndex + 1}/${NOX_RECRUIT_DIALOGUE.length} 대화`}>
          {NOX_RECRUIT_DIALOGUE.map((_, index) => <i className={index <= lineIndex ? "is-active" : ""} key={index} />)}
        </div>
        <div className="mika-recruit-dialogue-box">
          <div><small>{line.portrait === "nox" ? "NOX JUDGMENT OPERATIVE" : "AEGIS FIELD LEAD"}</small><strong>{line.speaker}</strong></div>
          <p>{line.text}</p>
          <button type="button" data-ui-sound={finalLine ? "uiConfirm" : "click"} onClick={next}>
            <span>{finalLine ? "녹스의 합류를 승인한다" : "다음 대화"}<kbd>SPACE</kbd></span><ArrowRight weight="bold" />
          </button>
        </div>
      </section>
    </main>
  );
}

export function HomeBaseScreen({ campaign, npcs, assets, activeNpc, lineIndex, activeFacility, larkAlert = false, availableUpgrades = {}, onNpc, onAdvanceNpc, onCloseNpc, onOpenFacility, onNpcInteraction, onPurchaseUpgrade, onExchangeResources, onCharacterChange, onWeaponChange, onOpenSwordGuide, onCloseFacility, onBoard, onDefense, onOpenSettings, onArchive, onTitle }) {
  const facilityRailRef = useRef(null);
  const [facilityRailIndex, setFacilityRailIndex] = useState(0);
  const background = assetSource(assets?.homeBase);
  const completed = campaign?.completedRegionIds?.length || 0;
  const directive = getCampaignDirective(campaign);
  const activeCharacterId = campaign?.loadout?.characterId || "aegis";
  const activeCharacterName = activeCharacterId === "mika" ? "미카" : activeCharacterId === "vesper" ? "베스퍼" : activeCharacterId === "nox" ? "녹스" : "이지스";
  const activePortrait = activeCharacterId === "mika" ? assets?.mikaPortrait : activeCharacterId === "vesper" ? assets?.vesperPortrait : activeCharacterId === "nox" ? assets?.noxPortrait : assets?.playerPortrait;
  const modalOpen = Boolean(activeNpc || activeFacility);
  const moveFacilityRail = useCallback((delta) => {
    const nextIndex = Math.max(0, Math.min((npcs?.length || 1) - 1, facilityRailIndex + delta));
    setFacilityRailIndex(nextIndex);
    scrollRailTo(facilityRailRef, nextIndex);
  }, [facilityRailIndex, npcs?.length]);
  return (
    <main className={`campaign-shell home-base-screen${modalOpen ? " has-modal" : ""}`}>
      <div className="home-base-surface" inert={modalOpen} aria-hidden={modalOpen}>
      {background && <img className="campaign-background" src={background} alt="인류 저항군의 이동 기지 헤이븐-09" />}
      <div className="base-vignette" aria-hidden="true" />
      <header className="base-lobby-topbar">
        <div className="base-identity">
          <small>인류 저항군 이동 기지</small><strong>헤이븐-09</strong>
          <span><FloppyDisk weight="fill" /> 슬롯 {(campaign?.slotIndex ?? 0) + 1} · 자동 저장</span>
        </div>
        <nav className="base-currency-rail" aria-label="기지 보유 재화">
          <button type="button" className={availableUpgrades?.research ? "has-upgrade-ready" : ""} onClick={() => onOpenFacility("research")} aria-label="연구 자료로 연구실 열기">
            {availableUpgrades?.research && <span className="currency-upgrade-dot" title="강화 가능" />}
            <MenuAtlasIcon atlas={assets?.menuIconAtlas} icon="researchCurrency" fallback={Brain} />
            <span><small>연구 자료</small><b>{campaign?.progression?.researchData || 0}</b></span>
          </button>
          <button type="button" className={availableUpgrades?.equipment ? "has-upgrade-ready" : ""} onClick={() => onOpenFacility("equipment")} aria-label="장비 부품으로 정비소 열기">
            {availableUpgrades?.equipment && <span className="currency-upgrade-dot" title="강화 가능" />}
            <MenuAtlasIcon atlas={assets?.menuIconAtlas} icon="equipmentCurrency" fallback={Wrench} />
            <span><small>장비 부품</small><b>{campaign?.progression?.equipmentParts || 0}</b></span>
          </button>
          <button type="button" className={availableUpgrades?.augmentation ? "has-upgrade-ready" : ""} onClick={() => onOpenFacility("augmentation")} aria-label="동기화 코어로 전투원 정보 열기">
            {availableUpgrades?.augmentation && <span className="currency-upgrade-dot" title="강화 가능" />}
            <MenuAtlasIcon atlas={assets?.menuIconAtlas} icon="augmentation" fallback={Sparkle} />
            <span><small>동기화 코어</small><b>{campaign?.progression?.augmentationCores || 0}</b></span>
          </button>
        </nav>
        <button type="button" className="base-settings-button" data-ui-sound="click" onClick={onOpenSettings} aria-label="게임 설정 열기">
          <GearSix weight="bold" /><span><small>SYSTEM</small><strong>설정</strong></span>
        </button>
      </header>

      <MotionPortraitStage source={activePortrait} characterId={activeCharacterId} name={activeCharacterName} onOpen={() => onOpenFacility("augmentation")} />

      <nav
        className="base-lobby-navigation"
        aria-label="헤이븐-09 시설 메뉴"
        ref={facilityRailRef}
        onScroll={(event) => setFacilityRailIndex(getRailIndex(event.currentTarget))}
      >
        {(npcs || []).map((npc) => {
        const Icon = NPC_ICON[npc.id] || User;
        const display = NPC_DISPLAY[npc.id] || { name: npc.name, role: npc.role };
        return (
          <button
            type="button"
            className={`base-menu-button npc-${npc.id}${npc.id === "lark" && larkAlert ? " has-mission-alert" : ""}`}
            onClick={() => onNpc(npc)}
            aria-label={`${display.name}와 대화`}
            key={npc.id}
          >
            {npc.id === "lark" && larkAlert && <span className="npc-mission-alert" aria-label="신규 권역 브리핑"><Sparkle weight="fill" /><b>!</b></span>}
            <MenuAtlasIcon atlas={assets?.menuIconAtlas} icon={NPC_MENU_ICON[npc.id]} fallback={Icon} /><span><small>{display.role}</small><b>{display.name}</b></span>
          </button>
        );
        })}
      </nav>

      <CarouselPosition
        className="base-facility-position"
        label="기지 시설"
        index={facilityRailIndex}
        count={npcs?.length || 0}
        onPrevious={() => moveFacilityRail(-1)}
        onNext={() => moveFacilityRail(1)}
      />

      <aside className="base-primary-actions">
        <button type="button" className={`base-character-action${availableUpgrades?.augmentation ? " has-upgrade-alert" : ""}`} onClick={() => onOpenFacility("augmentation")}>
          {availableUpgrades?.augmentation && <span className="npc-upgrade-badge" aria-label="강화 가능"><Sparkle weight="fill" /></span>}
          <MenuAtlasIcon atlas={assets?.menuIconAtlas} icon="operative" fallback={User} /><span><small>전투원 관리</small><b>전투원 · 강화</b></span><ArrowRight weight="bold" />
        </button>
        <button type="button" className="base-sortie-action command-ui-button" data-ui-sound="uiConfirm" onClick={onBoard}>
          <MenuAtlasIcon atlas={assets?.menuIconAtlas} icon="sortie" fallback={AirplaneTilt} /><span><small>전술 침투선 나이트자</small><b>작전 권역 · 출격</b></span><Play weight="fill" />
        </button>
        <button type="button" className="base-defense-action command-ui-button" data-ui-sound="uiConfirm" onClick={onDefense}>
          <MenuAtlasIcon atlas={assets?.menuIconAtlas} icon="defense" fallback={ShieldChevron} /><span><small>레아 전술 관제</small><b>기지 방어전</b></span><Crosshair weight="bold" />
        </button>
      </aside>

      <aside className="base-objective">
        <small>작전 현황 · 해방 권역 {completed} / 6</small>
        <strong>{directive.title}</strong>
        <p>{directive.detail}</p>
        <div className="campaign-progress-track" role="progressbar" aria-label="권역 해방 진행도" aria-valuemin={0} aria-valuemax={directive.total} aria-valuenow={directive.cleared}>
          {Array.from({ length: directive.total }, (_, index) => <i className={index < directive.cleared ? "is-complete" : ""} key={index} />)}
        </div>
        <button type="button" className="base-directive-action" onClick={() => {
          const pilot = npcs?.find((npc) => npc.id === "lark");
          if (directive.target === "pilot" && pilot) onNpc(pilot);
          else onBoard();
        }}>{directive.action}<ArrowRight weight="bold" /></button>
        {campaign?.lastRegionRewards && (
          <div className="base-reward-receipt">
            <span>작전 노획 자원</span>
            <b>연구 자료 +{campaign.lastRegionRewards.researchData}</b>
            <b>장비 부품 +{campaign.lastRegionRewards.equipmentParts}</b>
            <b>동기화 코어 +{campaign.lastRegionRewards.augmentationCores || 0}</b>
          </div>
        )}
        <div className="base-record-actions"><button type="button" onClick={onArchive}>작전 기록</button><button type="button" onClick={onTitle}>작전 프로필 선택</button></div>
      </aside>

      </div>
      <NpcDialoguePanel npc={activeNpc} assets={assets} lineIndex={lineIndex} onAdvance={onAdvanceNpc} onClose={onCloseNpc} onFacility={onOpenFacility} onInteraction={onNpcInteraction} />
      <BaseFacilityPanel facility={activeFacility ? { ...activeFacility, onCharacterChange } : null} onPurchase={onPurchaseUpgrade} onExchange={onExchangeResources} onClose={onCloseFacility} onWeaponChange={onWeaponChange} onOpenSwordGuide={onOpenSwordGuide} />
    </main>
  );
}

const FLIGHT_PLAN_ICON = Object.freeze({
  "night-veil": AirplaneTilt,
  "lifeline-corridor": ShieldChevron,
  "raptor-escort": Crosshair,
});

export function LarkFlightOperationsScreen({ campaign, pilot, plans = [], activePlanId, assets, onSelect, onBack }) {
  const [selectedPlanId, setSelectedPlanId] = useState(activePlanId || plans[0]?.id || null);
  const [pilotReactionIndex, setPilotReactionIndex] = useState(-1);
  const completedRegions = campaign?.completedRegionIds?.length || 0;
  const operations = campaign?.flightOperations || {};
  const background = assetSource(assets?.regionMap || assets?.homeBase);
  const pilotPortrait = assetSource(assets?.nightjarPilot);
  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) || plans[0] || null;
  const selectedUnlocked = Boolean(selectedPlan && completedRegions >= selectedPlan.unlockClears);
  const selectedActive = selectedPlan?.id === activePlanId;
  const unlockedPlanCount = plans.filter((plan) => completedRegions >= plan.unlockClears).length;
  const SelectedIcon = FLIGHT_PLAN_ICON[selectedPlan?.id] || AirplaneTilt;
  const pilotDialogue = pilot?.portraitDialogue?.length ? pilot.portraitDialogue : pilot?.dialogue || [];
  const pilotLine = pilotReactionIndex >= 0 && pilotDialogue.length
    ? localizeWorldText(pilotDialogue[pilotReactionIndex % pilotDialogue.length])
    : selectedPlan?.pilotQuote || "지원 전술을 골라. 다음 출격부터 바로 적용할게.";

  useEffect(() => {
    setSelectedPlanId(activePlanId || plans[0]?.id || null);
  }, [activePlanId, plans]);

  useEffect(() => {
    const close = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onBack?.();
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onBack]);

  return (
    <main className="campaign-shell flight-ops-screen">
      {background && <img className="campaign-background flight-ops-map" src={background} alt="나이트자 항로 작전 전략 지도" />}
      <div className="flight-ops-shade" aria-hidden="true" />
      <header className="flight-ops-heading">
        <button type="button" className="campaign-back" data-ui-sound="uiClose" onClick={onBack}><ArrowLeft weight="bold" /> 기지로 <kbd>ESC</kbd></button>
        <div>
          <small>SERA FLIGHT CONTROL · NIGHTJAR SUPPORT</small>
          <h1>항공 지원 전술</h1>
          <p>다음 출격에 적용할 나이트자 지원 1개를 선택하세요. 선택한 효과는 전투가 끝날 때까지 유지됩니다.</p>
          <ol className="flight-ops-purpose" aria-label="항공 지원 전술 적용 순서">
            <li><b>01</b> 전술 선택</li><li><b>02</b> 효과 확인</li><li><b>03</b> 출격 적용</li>
          </ol>
        </div>
        <dl className="flight-ops-record">
          <div><dt>개방 권역</dt><dd>{completedRegions} / 6</dd></div>
          <div><dt>지원 출격</dt><dd>{operations.completedSorties || 0}</dd></div>
          <div><dt>적용 전술</dt><dd>{plans.find((plan) => plan.id === activePlanId)?.routeCode || "FC-01"}</dd></div>
        </dl>
      </header>

      <section className="flight-ops-console" aria-label="세라 항공 지원 전술 통제실">
        <aside className="flight-ops-lark is-sera">
          <button
            type="button"
            className="flight-ops-lark-portrait is-sera"
            onClick={() => setPilotReactionIndex((index) => nextDialogueIndex(index, pilotDialogue))}
            aria-label="나이트자 수석 조종사 세라와 대화"
          >
            {pilotPortrait && <NpcPortraitImage source={pilotPortrait} npcId="sera" alt="나이트자 수석 조종사 세라" />}
            <span><ChatText weight="fill" /> 세라에게 말 걸기</span>
          </button>
          <div>
            <small>NIGHTJAR CHIEF PILOT · FLIGHT CONTROL</small>
            <strong>세라</strong>
            <p role="status">“{pilotLine}”</p>
          </div>
        </aside>

        <section className="flight-command-board" aria-label="나이트자 출격 지원 현황" style={{ "--flight-accent": selectedPlan?.accent || "#c7ff4a" }}>
          <header>
            <span className="flight-command-emblem"><MapTrifold weight="fill" /></span>
            <div><small>NIGHTJAR SUPPORT CONTROL</small><strong>출격 지원 현황</strong></div>
            <span className="flight-command-link"><CheckCircle weight="fill" /> 전술 링크 정상</span>
          </header>
          <div className="flight-command-main">
            <div className="flight-command-selection">
              <small>{selectedActive ? "현재 적용 전술" : "적용 전 미리보기"}</small>
              <b>{selectedPlan?.koreanName || "선행 정찰 지원"}</b>
              <em>{selectedPlan?.routeCode || "FC-01"} · {selectedPlan?.callSign || "PATHFINDER"}</em>
            </div>
            <ol className="flight-command-phases" aria-label="지원 작전 단계">
              <li className="is-complete"><span>01</span><b>정찰</b></li>
              <li className="is-active"><span>02</span><b>진입</b></li>
              <li><span>03</span><b>전투 지원</b></li>
              <li><span>04</span><b>귀환</b></li>
            </ol>
            <dl className="flight-command-summary">
              <div><dt>선택 효과</dt><dd>{selectedPlan?.effects?.map((effect) => `${effect.label} ${effect.value}`).join(" · ") || "-"}</dd></div>
              <div><dt>해금 현황</dt><dd>{unlockedPlanCount} / {plans.length}</dd></div>
            </dl>
          </div>
        </section>

        <nav className="flight-plan-rail" aria-label="항공 지원 전술 선택">
          {plans.map((plan) => {
            const unlocked = completedRegions >= plan.unlockClears;
            const active = plan.id === activePlanId;
            const selected = plan.id === selectedPlan?.id;
            const Icon = FLIGHT_PLAN_ICON[plan.id] || AirplaneTilt;
            return (
              <button
                type="button"
                className={`flight-plan-card${selected ? " is-selected" : ""}${active ? " is-active" : ""}${unlocked ? "" : " is-locked"}`}
                style={{ "--flight-accent": plan.accent }}
                aria-pressed={selected}
                aria-label={`${plan.koreanName}, ${unlocked ? active ? "현재 적용 중" : "적용 가능" : `권역 ${plan.unlockClears}곳 해방 필요`}`}
                onClick={() => unlocked && setSelectedPlanId(plan.id)}
                disabled={!unlocked}
                key={plan.id}
              >
                <span className="flight-plan-index">0{plan.order}</span>
                <span className="flight-plan-icon">{unlocked ? <Icon weight="fill" /> : <Lock weight="fill" />}</span>
                <span className="flight-plan-title"><small>{plan.category}</small><strong>{plan.koreanName}</strong><em>{plan.callSign}</em></span>
                <span className="flight-plan-status">{unlocked ? active ? <><CheckCircle weight="fill" /> 적용 중</> : "적용 가능" : `권역 ${plan.unlockClears}곳 해방`}</span>
              </button>
            );
          })}
        </nav>

        {selectedPlan && (
          <article className="flight-plan-brief" style={{ "--flight-accent": selectedPlan.accent }}>
            <header>
              <span><SelectedIcon weight="fill" /></span>
              <div><small>{selectedPlan.routeCode} · {selectedPlan.category}</small><h2>{selectedPlan.koreanName}</h2><em>{selectedPlan.callSign}</em></div>
            </header>
            <p>{selectedPlan.summary}</p>
            <dl>
              {selectedPlan.effects.map((effect) => <div key={effect.label}><dt>{effect.label}</dt><dd>{effect.value}</dd></div>)}
            </dl>
            {!selectedUnlocked && <p className="flight-plan-lock-copy"><Lock weight="fill" /> 권역 {selectedPlan.unlockClears}곳을 해방하면 이 지원 전술을 사용할 수 있습니다.</p>}
            <button
              type="button"
              className="flight-plan-activate command-ui-button"
              data-ui-sound={selectedUnlocked ? "uiConfirm" : "denied"}
              disabled={!selectedUnlocked || selectedActive}
              onClick={() => onSelect?.(selectedPlan.id)}
            >
              {selectedActive ? <><CheckCircle weight="fill" /> 현재 전술 적용 중</> : selectedUnlocked ? <><AirplaneTilt weight="fill" /> 이 전술 적용</> : <><Lock weight="fill" /> 해금 필요</>}
            </button>
          </article>
        )}
      </section>
    </main>
  );
}

export function DefenseStageSelectScreen({ stages, campaign, assets, onSelect, onBack }) {
  const background = assetSource(assets?.defenseBattlefield || assets?.homeBase);
  const completedIds = campaign?.completedDefenseStageIds || [];
  const unlockedIds = campaign?.unlockedDefenseStageIds || [];
  const [selectedDoctrineId, setSelectedDoctrineId] = useState("rapidDeployment");
  const doctrineIcons = { rapidDeployment: Lightning, fireControl: Target, lastBastion: ShieldStar };
  useEffect(() => {
    const close = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onBack?.();
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onBack]);
  return (
    <main className="campaign-shell defense-stage-select-screen">
      {background && <img className="campaign-background" src={background} alt="헤이븐-09 기지 방어 전술 지도" />}
      <div className="defense-select-shade" aria-hidden="true" />
      <header className="defense-select-heading">
        <button type="button" className="campaign-back" data-ui-sound="uiClose" onClick={onBack}><ArrowLeft weight="bold" /> 기지로 <kbd>ESC</kbd></button>
        <small>RHEA DEFENSE CONTROL · 독립 방어 작전</small>
        <h1>헤이븐 방어망</h1>
        <p>방어 패드에 포대를 배치하고, 적을 처치해 얻은 자원으로 강화하세요. 중앙 추론핵을 끝까지 지켜야 합니다.</p>
      </header>
      <section className="defense-doctrine-panel" aria-label="출격 교리 선택">
        <header><small>PRE-SORTIE DOCTRINE</small><strong>이번 작전의 지휘 교리</strong><span>교리는 해당 출격에만 적용됩니다.</span></header>
        <div>
          {Object.values(DEFENSE_DOCTRINES).map((doctrine, index) => {
            const Icon = doctrineIcons[doctrine.id] || ShieldChevron;
            const selected = doctrine.id === selectedDoctrineId;
            return (
              <button type="button" className={selected ? "is-selected" : ""} style={{ "--doctrine-accent": doctrine.accent }} aria-pressed={selected} onClick={() => setSelectedDoctrineId(doctrine.id)} key={doctrine.id}>
                <kbd>{index + 1}</kbd><Icon weight={selected ? "fill" : "duotone"} />
                <span><small>{doctrine.callSign}</small><b>{doctrine.name}</b><em>{doctrine.description}</em></span>
              </button>
            );
          })}
        </div>
      </section>
      <section className="defense-stage-grid" aria-label="디펜스 스테이지 선택">
        {(stages || []).map((stage) => {
          const unlocked = unlockedIds.includes(stage.id);
          const completed = completedIds.includes(stage.id);
          const record = campaign?.defenseStageRecords?.[stage.id];
          return (
            <button type="button" className={`defense-stage-card${unlocked ? "" : " is-locked"}${completed ? " is-cleared" : ""}`} style={{ "--defense-stage-art": `url("${stage.previewPath}")` }} aria-label={`${stage.name}, ${unlocked ? completed ? "방어 완료" : "출격 가능" : "잠김"}`} disabled={!unlocked} onClick={() => onSelect(stage.id, selectedDoctrineId)} key={stage.id}>
              <div className="defense-stage-card-top"><span>DEFENSE {String(stage.order).padStart(2, "0")}</span><b>{unlocked ? completed ? "방어 완료" : "출격 가능" : "잠김"}</b></div>
              <strong>{stage.name}</strong><small>{stage.subtitle}</small>
              <p>{stage.description}</p>
              <div className="defense-stage-intel"><span><small>주요 위협</small><b>{stage.threat}</b></span><span><small>전장 규칙</small><b>{stage.mutator}</b></span></div>
              <dl><div><dt>웨이브</dt><dd>{stage.waveCounts.length}</dd></div><div><dt>기지 내구</dt><dd>{stage.baseHp}</dd></div><div><dt>위험도</dt><dd>{"◆".repeat(stage.order)}</dd></div></dl>
              <footer>
                <span>{unlocked ? completed ? `${record?.clears || 1}회 방어 완료` : "출격 가능" : "이전 방어선을 먼저 지켜야 합니다"}</span>
                <b>연구 {stage.rewards.firstClear.researchData} · 부품 {stage.rewards.firstClear.equipmentParts} · 코어 {stage.rewards.firstClear.augmentationCores}</b>
                <em>{unlocked ? "방어 작전 시작" : "선행 방어선 필요"}<ArrowRight weight="bold" /></em>
              </footer>
            </button>
          );
        })}
      </section>
    </main>
  );
}

export function AbilityGuideScreen({ assets, npc, guideType = "rifle", onComplete, onBack }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [rheaReactionIndex, setRheaReactionIndex] = useState(-1);
  const guideEntries = guideType === "sword" ? SWORD_ABILITY_GUIDE : guideType === "starter" ? STARTER_BRIEFING_GUIDE : MANUAL_ABILITY_GUIDE;
  const ability = guideEntries[activeIndex];
  const ActiveIcon = ABILITY_ICON[ability.icon] || Crosshair;
  const portrait = assetSource(assets?.controlOfficer);
  const background = assetSource(assets?.homeBase);
  const example = assetSource(assets?.[ability.exampleAssetKey]);
  const final = activeIndex === guideEntries.length - 1;
  const rheaDialogue = npc?.portraitDialogue?.length ? npc.portraitDialogue : npc?.dialogue || [];
  const rheaGuideLine = rheaReactionIndex >= 0 && rheaDialogue.length
    ? localizeWorldText(rheaDialogue[rheaReactionIndex % rheaDialogue.length])
    : ability.quote;

  const advanceGuide = useCallback(() => {
    if (final) onComplete?.();
    else setActiveIndex((index) => Math.min(guideEntries.length - 1, index + 1));
  }, [final, guideEntries.length, onComplete]);

  useEffect(() => {
    const handleGuideKey = (event) => {
      if (event.repeat) return;
      if (event.code === "Escape" && onBack) {
        event.preventDefault();
        onBack();
        return;
      }
      if (event.code === "ArrowLeft") {
        event.preventDefault();
        setActiveIndex((index) => Math.max(0, index - 1));
        return;
      }
      if (event.code !== "Space" && event.code !== "Enter" && event.code !== "ArrowRight") return;
      event.preventDefault();
      advanceGuide();
    };
    window.addEventListener("keydown", handleGuideKey);
    return () => window.removeEventListener("keydown", handleGuideKey);
  }, [advanceGuide, onBack]);

  return (
    <main className={`campaign-shell ability-guide-screen${guideType === "sword" ? " is-sword-guide" : guideType === "starter" ? " is-starter-guide" : ""}`}>
      {background && <img className="campaign-background" src={background} alt="헤이븐-09 전술 관제실" />}
      <div className="ability-guide-shade" aria-hidden="true" />
      <aside className="ability-guide-rhea" aria-label="전술 관제관 레아">
        <button type="button" className="npc-illustration-button" onClick={() => setRheaReactionIndex((index) => nextDialogueIndex(index, rheaDialogue))} aria-label="전술 관제관 레아와 대화">
          {portrait && <NpcPortraitImage source={portrait} npcId="rhea" alt="전술 관제관 레아" />}
        </button>
        <div><small>전술 관제 · 레아</small><strong role="status">“{rheaGuideLine}”</strong></div>
      </aside>

      <section className="ability-guide-console" aria-labelledby="ability-guide-title">
        <header>
          <div>
            <small>{guideType === "sword" ? "신규 장비 해금 · 공명 검술 실전 교본" : guideType === "starter" ? "첫 출격 · 필수 조작 2단계" : "헤이븐-09 · 실제 전투 화면으로 배우기"}</small>
            <h1 id="ability-guide-title">{guideType === "sword" ? "빔 소드 전용 Q · E · F · R" : guideType === "starter" ? "이동과 생존, 두 가지만 먼저" : "Q · E · F · R, 이것만 기억하세요"}</h1>
          </div>
          {onBack && <button type="button" className="campaign-back" onClick={onBack}><ArrowLeft weight="bold" /> 기지로</button>}
        </header>

        <div className="ability-circuit-separation" role="note" aria-label="자동 스킬과 수동 스킬의 차이">
          <span><i>{guideType === "sword" ? "기본" : "자동"}</i><b>{guideType === "sword" ? "자동 근접 베기" : guideType === "starter" ? "기본 공격" : "레벨업 기술"}</b><em>{guideType === "sword" ? "주변 적 자동 공격" : guideType === "starter" ? "포인터 방향 자동 발사" : "자동 발동"}</em></span>
          <span className="is-manual"><i>직접</i><b>{guideType === "starter" ? "이동 · 대시" : "Q · E · F · R"}</b><em>{guideType === "sword" ? "짧은 주기의 전용 검술" : guideType === "starter" ? "스킬은 전투 중 안내" : "직접 사용 · 레벨업 기술과 별도"}</em></span>
        </div>

        <nav className="ability-guide-tabs" aria-label="사용 스킬 선택">
          {guideEntries.map((entry, index) => {
            const Icon = ABILITY_ICON[entry.icon] || Crosshair;
            return (
              <button
                type="button"
                className={index === activeIndex ? "is-active" : ""}
                aria-pressed={index === activeIndex}
                onClick={() => setActiveIndex(index)}
                key={entry.id}
              >
                <kbd>{entry.key}</kbd><Icon weight="fill" /><span><b>{entry.koreanName}</b><small>{entry.cooldownLabel || `${entry.cooldown}초`}</small></span>
              </button>
            );
          })}
        </nav>

        <div className={`ability-guide-detail ability-${ability.id}`}>
          <figure className="ability-guide-example">
            {example ? <img src={example} alt={ability.exampleAlt} /> : guideType === "sword" ? (
              <div className={`ability-guide-sword-demo is-${ability.id}`} aria-label={`${ability.koreanName} 검술 범위 예시`}>
                <span className="sword-demo-core"><Sword weight="fill" /></span>
                <i /><i /><i /><i />
                <strong><kbd>{ability.key}</kbd>{ability.koreanName}</strong>
              </div>
            ) : <div className="ability-guide-example-missing">전투 예시 불러오는 중</div>}
            <span className="ability-guide-live-badge">{guideType === "sword" ? "검술 범위 예시" : "실제 전투 화면"}</span>
            {ability.callouts.map((callout) => (
              <span className="ability-example-callout" style={{ left: `${callout.x}%`, top: `${callout.y}%` }} key={callout.label}>
                <i />{callout.label}
              </span>
            ))}
          </figure>
          <article className="ability-guide-copy">
            <header>
              <div className="ability-guide-emblem"><ActiveIcon weight="fill" /><kbd>{ability.key}</kbd></div>
              <div><small>{ABILITY_CATEGORY_KO[ability.category] || ability.category} · {ability.cooldownLabel || `${ability.cooldown}초`}</small><h2>{ability.koreanName}</h2><span>{ability.name}</span></div>
            </header>
            <p>{ability.summary}</p>
            <ul>{ability.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>
            <div className="ability-guide-timing"><small>언제?</small><strong>{ability.timing}</strong></div>
          </article>
        </div>

        <footer className="ability-guide-actions">
          <span><i style={{ width: `${(activeIndex + 1) / guideEntries.length * 100}%` }} /></span>
          <small>{activeIndex + 1} / {guideEntries.length}</small>
          <button type="button" disabled={activeIndex === 0} onClick={() => setActiveIndex((index) => Math.max(0, index - 1))}><ArrowLeft weight="bold" /> 이전</button>
          <button type="button" className="ability-guide-next" onClick={advanceGuide}>
            {final ? guideType === "sword" ? "검술 교본 확인 완료" : guideType === "starter" ? "필수 조작 확인 · 출격" : "브리핑 완료 · 출격" : guideType === "starter" ? "다음 조작" : "다음 스킬"}<ArrowRight weight="bold" />
          </button>
        </footer>
      </section>
    </main>
  );
}

export function RegionSelectScreen({ regions, clusters = [], campaign, assets, weapons = [], equippedWeaponId = "pulse-rifle", characters = [], selectedCharacterId = "aegis", onCharacterChange, onSelect, onBack }) {
  const regionRailRef = useRef(null);
  const sortieDialogRef = useRef(null);
  const background = assetSource(assets?.regionMap);
  const unlocked = new Set(campaign?.unlockedRegionIds || ["wrong-engine-core"]);
  const completed = new Set(campaign?.completedRegionIds || []);
  const storyFlags = new Set(campaign?.storyFlags || []);
  const [selectedClusterId, setSelectedClusterId] = useState(null);
  const [selectedRegionId, setSelectedRegionId] = useState(null);
  const [hoveredRegionId, setHoveredRegionId] = useState(null);
  const [regionRailIndex, setRegionRailIndex] = useState(0);
  const availableCharacters = useMemo(
    () => (characters || []).filter((character) => character?.unlocked !== false),
    [characters],
  );
  const selectedCluster = useMemo(
    () => (clusters || []).find((cluster) => cluster.id === selectedClusterId) || null,
    [clusters, selectedClusterId],
  );
  const clusterRegions = useMemo(
    () => selectedCluster ? (regions || []).filter((region) => selectedCluster.regionIds.includes(region.id)) : [],
    [regions, selectedCluster],
  );
  const previewRegionId = selectedRegionId || hoveredRegionId;
  const previewRegion = useMemo(
    () => (regions || []).find((region) => region.id === previewRegionId) || null,
    [previewRegionId, regions],
  );
  const selectedRegion = useMemo(
    () => (regions || []).find((region) => region.id === selectedRegionId) || null,
    [selectedRegionId, regions],
  );
  const [partyIds, setPartyIds] = useState(() => defaultSortieParty(selectedCharacterId, availableCharacters.map(character => character.id)));
  const selectedParty = partyIds.filter(id => availableCharacters.some(character => character.id === id)).slice(0, 2);
  const selectedCharacter = availableCharacters.find(character => character.id === selectedParty[0]) || null;
  const togglePartyMember = (id) => {
    const next = selectedParty.includes(id)
      ? selectedParty.length > 1 ? selectedParty.filter(member => member !== id) : selectedParty
      : selectedParty.length < 2 ? [...selectedParty, id] : selectedParty;
    setPartyIds(next);
    if (next[0] && next[0] !== selectedParty[0]) onCharacterChange?.(next[0]);
  };
  const makeLead = (id) => {
    setPartyIds([id, ...selectedParty.filter(member => member !== id)]);
    onCharacterChange?.(id);
  };
  const equippedWeapon = weapons.find((weapon) => weapon.id === equippedWeaponId) || null;
  const equippedWeaponUnlocked = Boolean(equippedWeapon && (!equippedWeapon.unlockRegionId || completed.has(equippedWeapon.unlockRegionId)));
  const formationConfirmed = Boolean(selectedCharacter && equippedWeaponUnlocked);
  const repeatOperation = Boolean(selectedRegion && completed.has(selectedRegion.id));
  const briefing = selectedRegion ? SORTIE_BRIEFINGS[selectedRegion.id] : null;
  useDialogFocusTrap(sortieDialogRef, Boolean(selectedRegion));

  useEffect(() => {
    setRegionRailIndex(0);
  }, [selectedClusterId]);

  const moveRegionRail = useCallback((delta) => {
    const nextIndex = Math.max(0, Math.min(clusterRegions.length - 1, regionRailIndex + delta));
    setRegionRailIndex(nextIndex);
    scrollRailTo(regionRailRef, nextIndex);
  }, [clusterRegions.length, regionRailIndex]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      if (selectedRegionId) {
        setSelectedRegionId(null);
        return;
      }
      if (selectedClusterId) {
        setSelectedClusterId(null);
        setHoveredRegionId(null);
        return;
      }
      onBack?.();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onBack, selectedClusterId, selectedRegionId]);

  const previewSource = selectedCluster
    ? (previewRegion?.assets?.dom?.thumbnail?.path || selectedCluster.previewPath)
    : null;
  const canEnterCluster = (cluster) => {
    if (!cluster || cluster.comingSoon) return false;
    if (!(cluster.prerequisiteRegionIds || []).every((regionId) => completed.has(regionId))) return false;
    return !cluster.briefingFlag || storyFlags.has(cluster.briefingFlag);
  };
  return (
    <main className={`campaign-shell region-select-screen${selectedRegion ? " has-selection" : ""}${selectedCluster ? " has-cluster" : " is-cluster-map"}`}>
      {background && <img className="campaign-background" src={background} alt="나이트자 비행선의 권역 전술 지도" />}
      {previewSource && (
        <img
          className={`region-focus-background region-focus-${previewRegion?.id}${selectedRegion ? " is-selected" : ""}`}
          src={previewSource}
          alt=""
          aria-hidden="true"
          key={previewRegion?.id || selectedCluster?.id}
        />
      )}
      <div className="region-map-shade" aria-hidden="true" />
      <header className="region-select-heading" inert={Boolean(selectedRegion)} aria-hidden={Boolean(selectedRegion)}>
        <div className="region-heading-navigation">
          <button type="button" className="campaign-back" data-ui-sound="uiClose" onClick={selectedCluster ? () => setSelectedClusterId(null) : onBack}><ArrowLeft weight="bold" /> {selectedCluster ? "권역 지도" : "기지"} <kbd>ESC</kbd></button>
          <small>나이트자 · 광역 항로 관제</small>
        </div>
        <h1>{selectedCluster ? <>{selectedCluster.koreanName}<span> · 구역 선택</span></> : "작전 권역 선택"}</h1>
        <p>{selectedCluster ? "이 권역에서 출격할 구역을 선택하세요." : "먼저 출격할 작전 권역을 선택하세요."}</p>
      </header>
      {selectedCluster && !selectedRegion && (
        <div className="region-mobile-swipe-hint" role="status" aria-hidden={Boolean(selectedRegion)}>
          <ArrowLeft weight="bold" /><span>좌우로 밀어 출격 구역 선택</span><ArrowRight weight="bold" />
        </div>
      )}
      {!selectedCluster ? (
        <section className="region-world-map" aria-label="작전 권역 월드맵" inert={Boolean(selectedRegion)} aria-hidden={Boolean(selectedRegion)}>
          {(clusters || []).map((cluster) => {
            const available = canEnterCluster(cluster);
            const clearedCount = cluster.regionIds.filter((regionId) => completed.has(regionId)).length;
            const milestoneReady = !cluster.comingSoon
              && (cluster.prerequisiteRegionIds || []).every((regionId) => completed.has(regionId))
              && cluster.briefingFlag
              && !storyFlags.has(cluster.briefingFlag);
            return (
              <button
                type="button"
                className={`region-map-hotspot cluster-${cluster.id}${available ? " is-available" : " is-locked"}${milestoneReady ? " needs-briefing" : ""}`}
                style={{ "--map-x": `${cluster.mapPosition?.x ?? 50}%`, "--map-y": `${cluster.mapPosition?.y ?? 50}%` }}
                disabled={!available}
                onClick={() => { setSelectedClusterId(cluster.id); setSelectedRegionId(null); }}
                key={cluster.id}
              >
                <i aria-hidden="true"><i /></i>
                <span>{cluster.rangeLabel}</span>
                <strong>{cluster.koreanName}<em>{cluster.name}</em></strong>
                <small>{cluster.comingSoon ? "항로 분석 중" : milestoneReady ? "신규 항로 브리핑 필요" : available ? `${clearedCount} / ${cluster.regionIds.length} 해방` : "선행 구역 미완료"}</small>
                {available ? <ArrowRight weight="bold" /> : <Lock weight="fill" />}
              </button>
            );
          })}
        </section>
      ) : (
      <section
        className="region-card-grid"
        aria-label={`${selectedCluster.koreanName} 출격 구역`}
        ref={regionRailRef}
        onScroll={(event) => setRegionRailIndex(getRailIndex(event.currentTarget))}
        inert={Boolean(selectedRegion)}
        aria-hidden={Boolean(selectedRegion)}
      >
        {clusterRegions.map((region) => {
          const isUnlocked = unlocked.has(region.id);
          const isCompleted = completed.has(region.id);
          return (
            <button
              type="button"
              className={`region-card region-${region.order}${isCompleted ? " is-completed" : ""}${isUnlocked ? "" : " is-locked"}`}
              disabled={!isUnlocked}
              aria-pressed={selectedRegionId === region.id}
              onMouseEnter={() => isUnlocked && setHoveredRegionId(region.id)}
              onMouseLeave={() => setHoveredRegionId(null)}
              onFocus={() => isUnlocked && setHoveredRegionId(region.id)}
              onBlur={() => setHoveredRegionId(null)}
              onClick={() => setSelectedRegionId(region.id)}
              key={region.id}
            >
              <span>작전 {String(region.order).padStart(2, "0")}</span>
              <strong className="region-mixed-name"><span>{region.koreanName || region.name}</span><em>{region.name}</em></strong>
              <p>{localizeWorldText(region.summary)}</p>
              {region.threatProfile && (
                <span className="region-threat">
                  <i>{localizeWorldText(region.threatProfile.label)}</i>
                  <em>{localizeThreatText(region.threatProfile.composition)}</em>
                  <em>{localizeThreatText(region.threatProfile.bossSignatures)}</em>
                </span>
              )}
              <small>보스 · {BOSS_DISPLAY[region.bossName] || region.bossName}</small>
              <b className={`region-card-status${!isUnlocked ? " is-locked" : isCompleted ? " is-completed" : " is-ready"}`}>{!isUnlocked ? <><Lock weight="fill" /> 잠김</> : isCompleted ? <><CheckCircle weight="fill" /> 클리어 · 재출격</> : <><MapTrifold weight="fill" /> 작전 정보 보기</>}</b>
            </button>
          );
        })}
      </section>
      )}
      {selectedCluster && !selectedRegion && (
        <CarouselPosition
          className="region-card-position"
          label="출격 구역"
          index={regionRailIndex}
          count={clusterRegions.length}
          onPrevious={() => moveRegionRail(-1)}
          onNext={() => moveRegionRail(1)}
        />
      )}
      {selectedRegion && (
        <section className={`region-sortie-dialog${repeatOperation ? " is-repeat-operation" : ""}`} role="dialog" aria-modal="true" aria-labelledby="region-sortie-title" ref={sortieDialogRef} tabIndex={-1}>
          <header className="region-sortie-command-header">
            <button type="button" className="region-sortie-close" data-ui-sound="uiClose" onClick={() => setSelectedRegionId(null)} aria-label="작전 상세 닫기">
              <ArrowLeft weight="bold" /> 구역 목록 <kbd>ESC</kbd>
            </button>
            <div className="region-sortie-kicker"><span>{selectedRegion.chapterLabel}</span><i>{completed.has(selectedRegion.id) ? "해방 완료" : "첫 공략"}</i></div>
          </header>
          <div className="region-sortie-layout">
            <section className="region-sortie-briefing">
              <h2 className="region-mixed-name" id="region-sortie-title"><span>{selectedRegion.koreanName || selectedRegion.name}</span><em>{selectedRegion.name}</em></h2>
              <p>{localizeWorldText(selectedRegion.description)}</p>
              <p className="sortie-clear-route">일반 적 {selectedRegion.enemyBudget}기 돌파 → {selectedRegion.midBoss ? `${selectedRegion.midBoss.koreanName} 격파 → ` : ''}최종 보스 격파</p>
              <details className="region-sortie-repeat-intel">
                <summary>적과 보스 공략 보기</summary>
                <div className="sortie-boss-preview">
                  <span className="sortie-boss-image" role="img" aria-label={`${BOSS_DISPLAY[selectedRegion.bossName] || selectedRegion.bossName} 전투 모습`}
                    style={{backgroundImage: `url(./assets/overload/quality-v3/performance/${selectedRegion.id}-boss.png)`, backgroundSize: `${selectedRegion.midBoss ? 800 : 600}% 400%`}} />
                  <div><small>최종 보스</small><strong>{(BOSS_DISPLAY[selectedRegion.bossName] || selectedRegion.bossName).split(" · ")[0]}</strong><p>보스전은 별도 전장에서 진행됩니다. 아래 위험을 확인하고 출격하세요.</p></div>
                </div>
                <dl className="region-sortie-intel">
                  <div><dt>주로 만나는 적</dt><dd>{briefing?.enemies}</dd></div>
                  <div><dt>보스의 위험한 공격</dt><dd>{briefing?.danger}</dd></div>
                  <div><dt>이렇게 대응하세요</dt><dd>{briefing?.tip}</dd></div>
                </dl>
              </details>
              <div className="region-sortie-rewards">
                <div className="reward-tier is-first-clear">
                  <small><Sparkle weight="fill" /> {repeatOperation ? "최초 클리어 보상 (획득 완료)" : "최초 클리어 보상"}</small>
                  <div className="reward-chips">
                    <span>연구 +{selectedRegion.victoryRewards?.firstClear?.researchData || 0}</span>
                    <span>부품 +{selectedRegion.victoryRewards?.firstClear?.equipmentParts || 0}</span>
                    <span>코어 +{selectedRegion.victoryRewards?.firstClear?.augmentationCores || 0}</span>
                  </div>
                </div>
                {repeatOperation && selectedRegion.victoryRewards?.repeatClear && (
                  <div className="reward-tier is-repeat-clear">
                    <small><ArrowCounterClockwise weight="bold" /> 반복 파밍 보상</small>
                    <div className="reward-chips">
                      <span>연구 +{selectedRegion.victoryRewards.repeatClear.researchData || 0}</span>
                      <span>부품 +{selectedRegion.victoryRewards.repeatClear.equipmentParts || 0}</span>
                      <span>코어 +{selectedRegion.victoryRewards.repeatClear.augmentationCores || 0}</span>
                    </div>
                  </div>
                )}
              </div>
            </section>
            <section className="sortie-character-loadout" aria-labelledby="sortie-character-title">
              <header>
                <div><small>출격 편성 · {selectedParty.length} / 2명</small><h3 id="sortie-character-title">함께 출격할 전투원</h3></div>
                <span>최대 2명까지 선택합니다. 선택한 두 전투원만 태그로 교대하며, 1명 출격 시에는 태그를 사용할 수 없습니다.</span>
              </header>
              <div className="sortie-party-order" aria-label="출격 순서">
                {selectedParty.map((id, index) => <button key={id} type="button" aria-pressed={index === 0} onClick={() => makeLead(id)}>
                  {index === 0 ? '선봉' : '교대'} · {availableCharacters.find(character => character.id === id)?.koreanName}
                  {index > 0 && <small>선봉으로 변경</small>}
                </button>)}
              </div>
              <div className="sortie-character-options">
                {availableCharacters.map((character) => {
                  const selected = selectedParty.includes(character.id);
                  const portrait = assetSource(assets?.[character.portraitAssetKey === "player" ? "playerPortrait" : character.portraitAssetKey]);
                  return (
                    <button
                      type="button"
                      className={`sortie-character-card is-${character.accent}${selected ? " is-selected" : ""}`}
                      aria-pressed={selected}
                      data-ui-sound={selected ? "click" : "uiConfirm"}
                      disabled={!selected && selectedParty.length >= 2}
                      onClick={() => togglePartyMember(character.id)}
                      key={character.id}
                    >
                      {portrait && <img src={portrait} alt={`${character.koreanName} 출격 초상화`} />}
                      <span><small>{character.role}</small><strong>{character.koreanName}</strong><em>{character.name}</em></span>
                      <p>{character.description}</p>
                      {selected && <mark><CheckCircle weight="fill" /> {selectedParty[0] === character.id ? "선봉" : "교대"} · {selectedParty.length > 1 ? "눌러서 제외" : "선택됨"}</mark>}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
          <footer className="region-sortie-command-footer">
            <span className={formationConfirmed ? "is-confirmed" : "is-pending"}>{formationConfirmed ? <CheckCircle weight="fill" /> : <Crosshair weight="bold" />} {formationConfirmed ? "현재 편성으로 즉시 출격할 수 있습니다." : "사용 가능한 전투원과 장비를 선택하세요."}</span>
            <button type="button" className="region-sortie-launch command-ui-button" data-ui-sound={formationConfirmed ? "uiConfirm" : "denied"} disabled={!formationConfirmed} onClick={() => formationConfirmed && onSelect(selectedRegion.id, selectedParty)}>
              <AirplaneTilt weight="fill" /><span><small>{selectedCharacter?.koreanName || "이지스"} 선봉</small><strong>{formationConfirmed ? (repeatOperation ? "즉시 재출격" : "이 편성으로 출격") : "편성 확인 필요"}</strong></span><ArrowRight weight="bold" />
            </button>
          </footer>
        </section>
      )}
    </main>
  );
}

export function SortieCinematicScreen({ region, videoSource, posterSource, soundEnabled = true, combatLoadProgress = 0, combatReady = false, videoComplete = false, repeatSortie = false, onComplete }) {
  const videoRef = useRef(null);
  const completedRef = useRef(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [playing, setPlaying] = useState(false);

  const complete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete?.();
  }, [onComplete]);

  const startPlayback = useCallback(() => {
    if (repeatSortie) {
      setPlaying(true);
      complete();
      return;
    }
    const video = videoRef.current;
    if (!video) return;
    video.play().then(() => setAutoplayBlocked(false)).catch(() => setAutoplayBlocked(true));
  }, [complete, repeatSortie]);

  useEffect(() => {
    completedRef.current = false;
    setAutoplayBlocked(false);
    setPlaying(false);
    const frame = window.requestAnimationFrame(startPlayback);
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [startPlayback, videoSource]);

  useEffect(() => {
    if (repeatSortie || assetSource(videoSource)) return undefined;
    setPlaying(true);
    const timer = window.setTimeout(complete, 2400);
    return () => window.clearTimeout(timer);
  }, [complete, repeatSortie, videoSource]);

  useEffect(() => {
    if (repeatSortie || !playing || !assetSource(videoSource)) return undefined;
    const watchdog = window.setInterval(() => {
      const video = videoRef.current;
      if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
      if (video.duration - video.currentTime <= 0.08) complete();
    }, 100);
    return () => window.clearInterval(watchdog);
  }, [complete, playing, repeatSortie, videoSource]);

  const handlePlaying = () => {
    setPlaying(true);
    setAutoplayBlocked(false);
  };

  const handleTimeUpdate = (event) => {
    const video = event.currentTarget;
    if (!Number.isFinite(video.duration) || video.duration <= 0) return;
    if (video.duration - video.currentTime <= 0.08) complete();
  };

  const koreanName = region?.koreanName || region?.name || "작전 구역";
  const englishName = region?.name || "SORTIE";
  const loadPercent = Math.round(Math.max(0, Math.min(1, Number(combatLoadProgress) || 0)) * 100);
  const loadStatus = combatReady
    ? (videoComplete ? (repeatSortie ? "전장 재진입 중" : "전장 진입 중") : "전장 준비 완료")
    : `${repeatSortie ? "재출격 전장 동기화 중" : "전장 불러오는 중"} ${loadPercent}%`;
  return (
    <main className={`sortie-cinematic sortie-${region?.id || "unknown"}${playing ? " is-playing" : ""}${repeatSortie ? " is-repeat-sortie" : ""}`} aria-label={`${koreanName} 출격 영상`}>
      {!repeatSortie && assetSource(videoSource) ? <video
        ref={videoRef}
        className="sortie-cinematic-video"
        src={assetSource(videoSource)}
        poster={assetSource(posterSource)}
        autoPlay
        playsInline
        preload="metadata"
        muted={!soundEnabled}
        controls={false}
        disablePictureInPicture
        controlsList="nodownload noplaybackrate nofullscreen"
        onPlaying={handlePlaying}
        onTimeUpdate={handleTimeUpdate}
        onEnded={complete}
        onError={complete}
      /> : <img className="sortie-cinematic-video" src={assetSource(posterSource)} alt={`${koreanName} 출격 항로`} />}
      <div className="sortie-cinematic-grade" aria-hidden="true" />
      <header className="sortie-cinematic-heading">
        <small>{repeatSortie ? "NIGHTJAR // 재출격 항로 단축" : "NIGHTJAR // 출격 항로 확보"}</small>
        <h1><span>{koreanName}</span><em>{englishName}</em></h1>
      </header>
      <footer className="sortie-flight-status" aria-live="polite">
        <span><AirplaneTilt weight="fill" /> {repeatSortie ? "작전 구역 재진입" : "나이트자 이륙"}</span>
        <div className="sortie-flight-progress" aria-hidden="true"><i style={{ width: `${loadPercent}%` }} /></div>
        <b className={combatReady ? "is-ready" : ""}>{playing ? loadStatus : "출격 영상 준비 중"}</b>
      </footer>
      {autoplayBlocked && (
        <button type="button" className="sortie-play-fallback command-ui-button" data-ui-sound="uiConfirm" onClick={startPlayback}>
          <Play weight="fill" /> 출격 영상 재생
        </button>
      )}
    </main>
  );
}

export function ReturnCinematicScreen({ region, backgroundSource, onComplete }) {
  const completedRef = useRef(false);
  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete?.();
  }, [onComplete]);

  useEffect(() => {
    completedRef.current = false;
    // The destination surface is already warmed before this lightweight
    // handoff screen opens, so do not hold the player behind a fake load.
    const timer = window.setTimeout(finish, 1000);
    const handleKey = (event) => {
      if (event.repeat) return;
      if (event.key === "Escape" || event.key === "Enter" || event.key === " ") finish();
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", handleKey);
    };
  }, [finish, region?.id]);

  return (
    <main className="return-cinematic" aria-label={`${region?.koreanName || "작전 구역"}에서 헤이븐-09로 귀환`}>
      <img className="return-cinematic-background" src={assetSource(backgroundSource)} alt="나이트자 비행선이 헤이븐-09 격납고로 귀환하는 모습" />
      <div className="return-cinematic-speed" aria-hidden="true" />
      <section className="return-cinematic-copy">
        <small>MISSION COMPLETE // NIGHTJAR RTB</small>
        <h1>작전 완료</h1>
        <strong>{region?.koreanName || region?.name}에서 귀환 중</strong>
        <span><AirplaneTilt weight="fill" /> 헤이븐-09 도킹 항로 확보</span>
      </section>
      <button type="button" className="return-cinematic-skip" onClick={finish}>귀환 연출 건너뛰기 <kbd>ESC</kbd></button>
    </main>
  );
}
