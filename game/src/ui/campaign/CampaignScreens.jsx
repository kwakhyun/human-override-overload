import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AirplaneTilt,
  ArrowLeft,
  ArrowRight,
  Brain,
  Broadcast,
  CheckCircle,
  ChatText,
  Crosshair,
  FloppyDisk,
  Lock,
  MapTrifold,
  Play,
  ShieldChevron,
  Sparkle,
  Sword,
  User,
  Wrench,
} from "@phosphor-icons/react";

function assetSource(asset, fallback = "") {
  return asset?.src || asset || fallback;
}

const NPC_DISPLAY = Object.freeze({
  hana: Object.freeze({ name: "하나", role: "기지 지휘관 · 연구실" }),
  ilya: Object.freeze({ name: "일리야", role: "장비 기술자 · 정비소" }),
  lark: Object.freeze({ name: "라크", role: "비행선 조종사 · 격납고" }),
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
});

const PORTRAIT_REACTIONS = Object.freeze({
  aegis: Object.freeze({
    head: Object.freeze(["머리 만지지 마. 작전 브리핑이나 계속해.", "집중이 흐트러져. 손을 거둬."]),
    chest: Object.freeze(["손 치워. 다음엔 경고 없이 제압한다.", "접촉 허가 안 했어. 선을 지켜."]),
    arms: Object.freeze(["장비 점검이면 일리야에게 가.", "팔은 멀쩡해. 네 걱정은 필요 없어."]),
    legs: Object.freeze(["기동부는 정상. 발목 잡지 마.", "출격 전이야. 장난은 여기까지."]),
  }),
  mika: Object.freeze({
    head: Object.freeze(["으앗… 머리 흐트러지잖아. 그래도 조금은 괜찮아.", "또 쓰다듬는 거야? 싫진 않지만… 딱 한 번만이야."]),
    chest: Object.freeze(["자, 잠깐! 거긴 안 돼… 정말 하지 마. …미워하진 않지만.", "너무 가깝잖아! 심장 소리 들리면 책임져."]),
    arms: Object.freeze(["손잡고 싶으면 그냥 말해. 이번만이야.", "팔은 전투 준비 완료! 네가 잡아 주면… 조금 더 든든할지도."]),
    legs: Object.freeze(["간지럽잖아! 출격 전에 장난치지 마… 조금만 더.", "도망 못 가게 잡는 거야? 나도 같이 갈 테니까 놔 줘."]),
  }),
});

export const MIKA_RECRUIT_DIALOGUE = Object.freeze([
  Object.freeze({ speaker: "레아", text: "오답 엔진 잔해에서 미확인 저항군 신호를 잡았어. 생존자가 헤이븐-09에 구조를 요청하고 있어." }),
  Object.freeze({ speaker: "미카", text: "미카야! 네가 그 소문난 이지스지? 혼자 멋있는 건 불공평하니까, 다음 작전부터 나도 같이 갈게." }),
  Object.freeze({ speaker: "이지스", text: "전투 기록은 확인했어. 명령을 따를 수 있다면 합류를 허가한다." }),
  Object.freeze({ speaker: "미카", text: "차갑기는. 그래도 방금 나 받아 준 거 맞지? 링블레이드 전투원 미카, 지금부터 팀에 합류합니다!" }),
]);

const ABILITY_CATEGORY_KO = Object.freeze({
  "TACTICAL UTILITY": "전술 유틸리티",
  "SURVIVAL SUPPORT": "생존 지원",
  "FIRE SUPPORT": "화력 지원",
  "ROTARY ULTIMATE": "회전형 필살기",
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
  return Object.entries(WORLD_TERM_KO).reduce(
    (copy, [term, korean]) => copy.replaceAll(term, korean),
    String(value),
  );
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
        <button type="button" className="campaign-back" onClick={onBack}><ArrowLeft weight="bold" /> 타이틀</button>
        <small>헤이븐-09 · 작전 기록 보관소</small>
        <h1>작전 기록 선택</h1>
        <p>보스 처치 기록과 해금한 지역은 선택한 슬롯에 자동으로 저장됩니다.</p>
      </header>
      <section className="save-slot-grid" aria-label="캠페인 저장 슬롯">
        {normalized.map((slot, index) => {
          const completed = slot?.completedRegionIds?.length || 0;
          const progress = Math.round(completed / 6 * 100);
          return (
            <button
              type="button"
              className={slot ? "save-slot-card has-data" : "save-slot-card is-empty"}
              onClick={() => onSelect(index)}
              key={`slot-${index + 1}`}
            >
              <span className="save-slot-number">슬롯 0{index + 1}</span>
              {slot ? (
                <>
                  <FloppyDisk weight="fill" />
                  <strong>{slot.homeBaseUnlocked ? "헤이븐-09 작전 기록" : "첫 출격 준비"}</strong>
                  <p>해방한 지역 {completed} / 6 · 진행도 {progress}%</p>
                  <i><i style={{ width: `${progress}%` }} /></i>
                  <small>{formatUpdatedAt(slot.updatedAt)}</small>
                  <b>이어서 플레이 <Play weight="fill" /></b>
                </>
              ) : (
                <>
                  <span className="empty-slot-mark">+</span>
                  <strong>새 캠페인</strong>
                  <p>이지스와 함께 첫 지역 추론핵을 공략합니다.</p>
                  <b>새 작전 시작 <Play weight="fill" /></b>
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

const ABILITY_ICON = Object.freeze({
  emp: Broadcast,
  ward: ShieldChevron,
  stratos: AirplaneTilt,
  tempest: Sparkle,
});

function NpcPortrait({ npc, assets }) {
  const standalone = npc.portraitMode === "standalone";
  const atlas = assetSource(standalone ? assets?.controlOfficer : assets?.npcPortraits);
  return (
    <div
      className={standalone ? "base-npc-portrait is-standalone" : "base-npc-portrait"}
      role="img"
      aria-label={`${npc.name} 상반신 초상화`}
      style={{
        backgroundImage: atlas ? `url(${atlas})` : undefined,
        backgroundPosition: standalone ? "center bottom" : `${(npc.portraitIndex || 0) * 50}% center`,
      }}
    />
  );
}

export function NpcDialoguePanel({ npc, assets, lineIndex, onAdvance, onClose, onFacility, onInteraction }) {
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
    <section className="base-dialogue" role="dialog" aria-modal="true" aria-labelledby="base-dialogue-name">
      <NpcPortrait npc={npc} assets={assets} />
      <div>
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
              {npc.interactionLabel || "상호작용"}{npc.interaction === "open-region-select" ? <AirplaneTilt weight="fill" /> : <Crosshair weight="bold" />}
            </button>
          )}
          <button className="base-dialogue-next" type="button" data-ui-sound={final ? "uiClose" : "click"} onClick={final ? onClose : onAdvance}>
            {final ? "대화 종료" : "다음"}<ChatText weight="bold" />
          </button>
          <small className="dialogue-escape-hint"><kbd>SPACE</kbd> {final ? "대화 종료" : "다음 대사"} · <kbd>ESC</kbd> 닫기</small>
        </footer>
      </div>
    </section>
  );
}

export function BaseFacilityPanel({ facility, onPurchase, onClose }) {
  if (!facility) return null;
  if (facility.id === "augmentation") {
    return <CharacterInformationPanel facility={facility} onPurchase={onPurchase} onClose={onClose} onCharacterChange={facility.onCharacterChange} />;
  }
  const FacilityIcon = facility.id === "research" ? Brain : facility.id === "augmentation" ? Sparkle : Wrench;
  return (
    <section className={`base-facility-panel facility-${facility.id}${facility.artSource ? " has-key-art" : ""}`} role="dialog" aria-modal="true" aria-labelledby="base-facility-name">
      {facility.artSource && <img className="facility-key-art" src={assetSource(facility.artSource)} alt="이지스와 미카의 전투 프레임을 강화하는 동기화실" />}
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
          return (
            <article className={maxed ? "facility-upgrade is-maxed" : "facility-upgrade"} key={upgrade.id}>
              <header>
                <span>{String(upgrade.order || 1).padStart(2, "0")}</span>
                <div><small>{upgrade.category}</small><h3>{upgrade.name}</h3></div>
                <b>{maxed ? "개조 완료" : `현재 ${upgrade.rank}단계 / 최대 ${upgrade.maxRank}단계`}</b>
              </header>
              <div className="upgrade-ranks" aria-label={`${upgrade.maxRank}랭크 중 ${upgrade.rank}랭크`}>
                {Array.from({ length: upgrade.maxRank }, (_, index) => <i className={index < upgrade.rank ? "is-active" : ""} key={index} />)}
              </div>
              <p>{upgrade.description}</p>
              <dl>
                <div><dt>현재 효과</dt><dd>{upgrade.currentEffect || "효과 없음"}</dd></div>
                <div><dt>{maxed ? "완료" : "다음 단계"}</dt><dd>{maxed ? "최고 단계" : upgrade.nextEffect}</dd></div>
              </dl>
              <button type="button" className="command-ui-button" data-ui-sound={disabled ? "denied" : "uiConfirm"} disabled={disabled} onClick={() => onPurchase(upgrade.id)}>
                {maxed ? <><CheckCircle weight="fill" /> 개조 완료</> : upgrade.lockedReason ? <><Lock weight="fill" /> {upgrade.lockedReason}</> : <><FacilityIcon weight="bold" /> {upgrade.nextCost} {facility.currencyShortLabel}로 강화</>}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function CharacterInformationPanel({ facility, onPurchase, onClose, onCharacterChange }) {
  const [activeTab, setActiveTab] = useState("profile");
  const [profileId, setProfileId] = useState(facility.selectedCharacterId || facility.characters?.[0]?.id || "aegis");
  useEffect(() => {
    setProfileId(facility.selectedCharacterId || facility.characters?.[0]?.id || "aegis");
  }, [facility.selectedCharacterId, facility.characters]);
  const profile = facility.characters?.find((character) => character.id === profileId) || facility.characters?.[0];
  const totalRank = (facility.upgrades || []).reduce((sum, upgrade) => sum + upgrade.rank, 0);
  const maxRank = (facility.upgrades || []).reduce((sum, upgrade) => sum + upgrade.maxRank, 0);
  const activeLoadout = profile?.id === "mika"
    ? CHARACTER_ACTIVE_LOADOUTS.mika
    : facility.mainWeaponId === "beam-sword" ? CHARACTER_ACTIVE_LOADOUTS.aegisSword : CHARACTER_ACTIVE_LOADOUTS.aegisRifle;
  const chooseCharacter = (characterId) => {
    const selected = facility.characters?.find((character) => character.id === characterId);
    if (!selected?.unlocked) return;
    setProfileId(characterId);
    onCharacterChange?.(characterId);
  };
  return (
    <section className={`character-information-panel is-${profile?.accent || "cyan"}`} role="dialog" aria-modal="true" aria-labelledby="character-information-name">
      {facility.artSource && <img className="character-info-environment" src={assetSource(facility.artSource)} alt="" aria-hidden="true" />}
      <header className="character-info-topbar">
        <div>
          <small>{facility.kicker}</small>
          <strong>전투원 정보</strong>
        </div>
        <div className="character-core-balance" aria-label={`보유 ${facility.currencyLabel} ${facility.currency}`}>
          <Sparkle weight="fill" /><span>{facility.currencyLabel}</span><b>{facility.currency}</b>
        </div>
        <button type="button" className="facility-close" data-ui-sound="uiClose" onClick={onClose} aria-label="전투원 정보 닫기"><ArrowLeft weight="bold" /> 기지로 <kbd>ESC</kbd></button>
      </header>

      <figure className="character-art-stage">
        {profile?.portraitSource && <img src={assetSource(profile.portraitSource)} alt={`${profile.koreanName} 전신 일러스트`} />}
        <figcaption>
          <small>{profile?.role}</small>
          <h2 id="character-information-name">{profile?.koreanName}</h2>
          <strong>{profile?.name}</strong>
          <span>동기화 랭크 {totalRank} / {maxRank}</span>
        </figcaption>
      </figure>

      <section className="character-data-console">
        <nav className="character-info-tabs" aria-label="전투원 정보 분류">
          <button type="button" className={activeTab === "profile" ? "is-active" : ""} onClick={() => setActiveTab("profile")}><User weight="fill" /> 기본 정보</button>
          <button type="button" className={activeTab === "upgrade" ? "is-active" : ""} onClick={() => setActiveTab("upgrade")}><Sparkle weight="fill" /> 영구 강화</button>
        </nav>

        {activeTab === "profile" ? (
          <div className="character-profile-content">
            <header>
              <div><small>ACTIVE OPERATIVE</small><h3>{profile?.koreanName} · {profile?.name}</h3></div>
              <span>{profile?.weaponName}</span>
            </header>
            <p>{profile?.description}</p>
            <dl className="character-stat-grid">
              <div><dt>최대 내구도</dt><dd>{facility.combatStats?.maxHp || 360}</dd></div>
              <div><dt>공격 출력</dt><dd>{facility.combatStats?.damageOutput || 100}%</dd></div>
              <div><dt>기동 속도</dt><dd>{profile?.id === "mika" ? facility.combatStats?.mikaSpeed : facility.combatStats?.aegisSpeed}</dd></div>
              <div><dt>공격 주기</dt><dd>{facility.combatStats?.fireRate || 100}%</dd></div>
              <div><dt>해방 구역</dt><dd>{facility.combatStats?.completedRegions || 0} / 6</dd></div>
              <div><dt>태그 대기</dt><dd>10초</dd></div>
            </dl>
            <section className="character-active-kit" aria-label={`${profile?.koreanName} 액티브 스킬`}>
              <header><small>MANUAL COMBAT LINK</small><strong>사용 스킬</strong></header>
              <div>
                {activeLoadout.map((ability) => {
                  const AbilityIcon = ability.icon;
                  return <article key={ability.key}><kbd>{ability.key}</kbd><AbilityIcon weight="fill" /><span><b>{ability.name}</b><small>{ability.detail}</small></span></article>;
                })}
              </div>
            </section>
            <button type="button" className="character-open-upgrades command-ui-button" data-ui-sound="click" onClick={() => setActiveTab("upgrade")}><Sparkle weight="fill" /> 동기화 코어로 영구 강화</button>
          </div>
        ) : (
          <div className="character-upgrade-content">
            <header><div><small>PERMANENT AUGMENTATION</small><h3>동기화 프로토콜</h3></div><span>{facility.currencyHint}</span></header>
            <div className="character-upgrade-list">
              {(facility.upgrades || []).map((upgrade) => {
                const maxed = upgrade.rank >= upgrade.maxRank;
                const disabled = maxed || !upgrade.canPurchase;
                return (
                  <article className={maxed ? "character-upgrade-row is-maxed" : "character-upgrade-row"} key={upgrade.id}>
                    <header><span>{String(upgrade.order || 1).padStart(2, "0")}</span><div><small>{upgrade.category}</small><h4>{upgrade.name}</h4></div><b>{upgrade.rank} / {upgrade.maxRank}</b></header>
                    <p>{upgrade.description}</p>
                    <div className="upgrade-ranks" aria-label={`${upgrade.maxRank}랭크 중 ${upgrade.rank}랭크`}>{Array.from({ length: upgrade.maxRank }, (_, index) => <i className={index < upgrade.rank ? "is-active" : ""} key={index} />)}</div>
                    <footer><span>{maxed ? "최고 단계" : upgrade.nextEffect}</span><button type="button" className="command-ui-button" data-ui-sound={disabled ? "denied" : "uiConfirm"} disabled={disabled} onClick={() => onPurchase(upgrade.id)}>{maxed ? <><CheckCircle weight="fill" /> 완료</> : upgrade.lockedReason ? <><Lock weight="fill" /> {upgrade.lockedReason}</> : <><Sparkle weight="fill" /> 코어 {upgrade.nextCost}개로 강화</>}</button></footer>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <nav className="character-roster-rail" aria-label="전투원 선택">
        {(facility.characters || []).map((character) => (
          <button type="button" className={`${character.id === profile?.id ? "is-active" : ""}${character.unlocked ? "" : " is-locked"}`} aria-label={character.unlocked ? `${character.koreanName} 정보 보기` : `${character.koreanName} 잠김. 오답 엔진 중앙로 최초 클리어 필요`} aria-pressed={character.id === profile?.id} aria-disabled={!character.unlocked} onClick={() => chooseCharacter(character.id)} key={character.id}>
            <img src={assetSource(character.portraitSource)} alt="" /><span>{character.unlocked ? character.koreanName : <><Lock weight="fill" /> 미해금</>}</span>
          </button>
        ))}
      </nav>
    </section>
  );
}

function MotionPortraitStage({ source, characterId, name, onOpen }) {
  const [reaction, setReaction] = useState(null);
  const reactionIndex = useRef(0);
  const reactionTimer = useRef(null);
  useEffect(() => () => clearTimeout(reactionTimer.current), []);
  const react = useCallback((area) => {
    const lines = PORTRAIT_REACTIONS[characterId]?.[area] || [];
    const text = lines[reactionIndex.current % Math.max(1, lines.length)] || "작전 준비를 계속하세요.";
    reactionIndex.current += 1;
    clearTimeout(reactionTimer.current);
    setReaction({ area, text, token: reactionIndex.current });
    reactionTimer.current = setTimeout(() => setReaction(null), 4200);
  }, [characterId]);

  return (
    <section
      className={`base-motion-portrait is-${characterId}${reaction ? ` is-reacting reaction-${reaction.area}` : ""}`}
      data-portrait-renderer="original-illustration"
      aria-label={`${name} 상호작용 포트레이트`}
    >
      <div className="motion-portrait-body" aria-hidden="true">
        <img className="motion-portrait-original" src={assetSource(source)} alt="" />
      </div>
      <div className="portrait-interaction-zones" aria-label={`${name} 터치 상호작용`}>
        <button type="button" className="portrait-zone is-head" data-ui-sound="click" onClick={() => react("head")} aria-label={`${name} 머리 반응 보기`} />
        <button type="button" className="portrait-zone is-chest" data-ui-sound="click" onClick={() => react("chest")} aria-label={`${name} 상체 반응 보기`} />
        <button type="button" className="portrait-zone is-arm is-left" data-ui-sound="click" onClick={() => react("arms")} aria-label={`${name} 왼팔 반응 보기`} />
        <button type="button" className="portrait-zone is-arm is-right" data-ui-sound="click" onClick={() => react("arms")} aria-label={`${name} 오른팔 반응 보기`} />
        <button type="button" className="portrait-zone is-legs" data-ui-sound="click" onClick={() => react("legs")} aria-label={`${name} 다리 반응 보기`} />
      </div>
      {reaction && <aside className="motion-portrait-speech" key={reaction.token} role="status" aria-live="polite"><strong>{name}</strong><p>{reaction.text}</p></aside>}
      <button type="button" className="motion-portrait-caption" onClick={onOpen} aria-label={`${name} 전투원 정보 열기`}>
        <small>ACTIVE OPERATIVE</small><strong>{name}</strong><em>전투원 정보</em>
      </button>
    </section>
  );
}

export function MikaRecruitScreen({ assets, onComplete }) {
  const [lineIndex, setLineIndex] = useState(0);
  const line = MIKA_RECRUIT_DIALOGUE[Math.min(lineIndex, MIKA_RECRUIT_DIALOGUE.length - 1)];
  const finalLine = lineIndex >= MIKA_RECRUIT_DIALOGUE.length - 1;
  const next = () => finalLine ? onComplete?.() : setLineIndex((index) => index + 1);
  return (
    <main className="campaign-shell mika-recruit-screen">
      {assets?.characterSyncChamber && <img className="campaign-background" src={assetSource(assets.characterSyncChamber)} alt="헤이븐-09 전투원 동기화실" />}
      <div className="mika-recruit-shade" aria-hidden="true" />
      <section className="mika-recruit-card" role="dialog" aria-modal="true" aria-labelledby="mika-recruit-title">
        <small>신규 전투원 합류 · FIRST CLEAR REWARD</small>
        <h1 id="mika-recruit-title">미카 · MIKA</h1>
        <p>프리즘 링블레이드 전투원이 헤이븐-09 편성에 등록되었습니다.</p>
        <div className="mika-recruit-dialogue">
          {assets?.mikaPortrait && <img src={assetSource(assets.mikaPortrait)} alt="새로 합류한 전투원 미카" />}
          <div><small>{line.speaker}</small><strong>{line.text}</strong></div>
        </div>
        <button type="button" data-ui-sound={finalLine ? "uiConfirm" : "click"} onClick={next}>{finalLine ? "팀 합류 확인" : "다음 대화"}<ArrowRight weight="bold" /></button>
      </section>
    </main>
  );
}

export function HomeBaseScreen({ campaign, npcs, assets, activeNpc, lineIndex, activeFacility, larkAlert = false, onNpc, onAdvanceNpc, onCloseNpc, onOpenFacility, onNpcInteraction, onPurchaseUpgrade, onCharacterChange, onCloseFacility, onBoard, onDefense, onTitle }) {
  const background = assetSource(assets?.homeBase);
  const completed = campaign?.completedRegionIds?.length || 0;
  const activeCharacterId = campaign?.loadout?.characterId || "aegis";
  const activeCharacterName = activeCharacterId === "mika" ? "미카" : "이지스";
  const activePortrait = activeCharacterId === "mika" ? assets?.mikaPortrait : assets?.playerPortrait;
  return (
    <main className="campaign-shell home-base-screen">
      {background && <img className="campaign-background" src={background} alt="인류 저항군의 이동 기지 헤이븐-09" />}
      <div className="base-vignette" aria-hidden="true" />
      <header className="base-lobby-topbar">
        <div className="base-identity">
          <small>인류 저항군 이동 기지</small><strong>헤이븐-09</strong>
          <span><FloppyDisk weight="fill" /> 슬롯 {(campaign?.slotIndex ?? 0) + 1} · 자동 저장</span>
        </div>
        <nav className="base-currency-rail" aria-label="기지 보유 재화">
          <button type="button" onClick={() => onOpenFacility("research")} aria-label="연구 자료로 연구실 열기"><Brain weight="fill" /><span><small>연구 자료</small><b>{campaign?.progression?.researchData || 0}</b></span></button>
          <button type="button" onClick={() => onOpenFacility("equipment")} aria-label="장비 부품으로 정비소 열기"><Wrench weight="fill" /><span><small>장비 부품</small><b>{campaign?.progression?.equipmentParts || 0}</b></span></button>
          <button type="button" onClick={() => onOpenFacility("augmentation")} aria-label="동기화 코어로 전투원 정보 열기"><Sparkle weight="fill" /><span><small>동기화 코어</small><b>{campaign?.progression?.augmentationCores || 0}</b></span></button>
        </nav>
      </header>

      <MotionPortraitStage source={activePortrait} characterId={activeCharacterId} name={activeCharacterName} onOpen={() => onOpenFacility("augmentation")} />

      <nav className="base-lobby-navigation" aria-label="헤이븐-09 시설 메뉴">
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
            <Icon weight="fill" /><span><small>{display.role}</small><b>{display.name}</b></span>
          </button>
        );
        })}
      </nav>

      <aside className="base-primary-actions">
        <button type="button" className="base-character-action" onClick={() => onOpenFacility("augmentation")}>
          <User weight="fill" /><span><small>전투원 관리</small><b>전투원 · 강화</b></span><ArrowRight weight="bold" />
        </button>
        <button type="button" className="base-sortie-action command-ui-button" data-ui-sound="uiConfirm" onClick={onBoard}>
          <AirplaneTilt weight="fill" /><span><small>스텔스 비행선 나이트자</small><b>작전 권역 · 출격</b></span><Play weight="fill" />
        </button>
        <button type="button" className="base-defense-action command-ui-button" data-ui-sound="uiConfirm" onClick={onDefense}>
          <ShieldChevron weight="fill" /><span><small>전술 관제관 레아</small><b>기지 방어 · 디펜스</b></span><Crosshair weight="bold" />
        </button>
      </aside>

      <aside className="base-objective">
        <small>현재 작전 · 해방 {completed} / 6</small>
        <strong>{larkAlert ? "라크가 신규 권역 신호를 해독했습니다" : completed >= 3 ? "외곽 권역 작전 진행 중" : "지역 추론핵을 추적하세요"}</strong>
        <p>{larkAlert ? "격납고에서 느낌표가 떠 있는 라크와 대화하세요." : completed >= 3 ? "작전 권역을 고른 뒤 출격할 구역을 선택하세요." : "비행선에서 다음 출격 구역을 선택하세요."}</p>
        {campaign?.lastRegionRewards && (
          <div className="base-reward-receipt">
            <span>회수 자원</span>
            <b>연구 +{campaign.lastRegionRewards.researchData}</b>
            <b>부품 +{campaign.lastRegionRewards.equipmentParts}</b>
            <b>코어 +{campaign.lastRegionRewards.augmentationCores || 0}</b>
          </div>
        )}
        <button type="button" onClick={onTitle}>저장 슬롯 화면</button>
      </aside>

      <NpcDialoguePanel npc={activeNpc} assets={assets} lineIndex={lineIndex} onAdvance={onAdvanceNpc} onClose={onCloseNpc} onFacility={onOpenFacility} onInteraction={onNpcInteraction} />
      <BaseFacilityPanel facility={activeFacility ? { ...activeFacility, onCharacterChange } : null} onPurchase={onPurchaseUpgrade} onClose={onCloseFacility} />
    </main>
  );
}

export function DefenseStageSelectScreen({ stages, campaign, assets, onSelect, onBack }) {
  const background = assetSource(assets?.defenseBattlefield || assets?.homeBase);
  const portrait = assetSource(assets?.controlOfficer);
  const completedIds = campaign?.completedDefenseStageIds || [];
  const unlockedIds = campaign?.unlockedDefenseStageIds || [];
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
      <aside className="defense-rhea-briefing">
        {portrait && <img src={portrait} alt="디펜스 작전을 지휘하는 전술 관제관 레아" />}
        <div><small>전술 관제관 · 레아</small><strong>“침투로는 셋. 방어 패드는 열둘. 웨이브가 시작되기 전에 화력 축선을 계산해.”</strong></div>
      </aside>
      <section className="defense-stage-grid" aria-label="디펜스 스테이지 선택">
        {(stages || []).map((stage) => {
          const unlocked = unlockedIds.includes(stage.id);
          const completed = completedIds.includes(stage.id);
          const record = campaign?.defenseStageRecords?.[stage.id];
          return (
            <button type="button" className={`defense-stage-card${unlocked ? "" : " is-locked"}${completed ? " is-cleared" : ""}`} aria-label={`${stage.name}, ${unlocked ? completed ? "방어 완료" : "출격 가능" : "잠김"}`} disabled={!unlocked} onClick={() => onSelect(stage.id)} key={stage.id}>
              <div className="defense-stage-card-top"><span>DEFENSE {String(stage.order).padStart(2, "0")}</span><b>{unlocked ? completed ? "방어 완료" : "출격 가능" : "잠김"}</b></div>
              <strong>{stage.name}</strong><small>{stage.subtitle}</small>
              <p>{stage.description}</p>
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

export function AbilityGuideScreen({ assets, onComplete, onBack }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const ability = MANUAL_ABILITY_GUIDE[activeIndex];
  const ActiveIcon = ABILITY_ICON[ability.icon] || Crosshair;
  const portrait = assetSource(assets?.controlOfficer);
  const background = assetSource(assets?.homeBase);
  const example = assetSource(assets?.[ability.exampleAssetKey]);
  const final = activeIndex === MANUAL_ABILITY_GUIDE.length - 1;

  return (
    <main className="campaign-shell ability-guide-screen">
      {background && <img className="campaign-background" src={background} alt="헤이븐-09 전술 관제실" />}
      <div className="ability-guide-shade" aria-hidden="true" />
      <aside className="ability-guide-rhea" aria-label="전술 관제관 레아">
        {portrait && <img src={portrait} alt="은빛 보랏빛 단발과 전술 헤드셋을 착용한 관제관 레아" />}
        <div><small>전술 관제 · 레아</small><strong>“{ability.quote}”</strong></div>
      </aside>

      <section className="ability-guide-console" aria-labelledby="ability-guide-title">
        <header>
          <div>
            <small>헤이븐-09 · 실제 전투 화면으로 배우기</small>
            <h1 id="ability-guide-title">Q · E · F · R, 이것만 기억하세요</h1>
          </div>
          {onBack && <button type="button" className="campaign-back" onClick={onBack}><ArrowLeft weight="bold" /> 기지로</button>}
        </header>

        <div className="ability-circuit-separation" role="note" aria-label="자동 스킬과 수동 스킬의 차이">
          <span><i>자동</i><b>레벨업 기술</b><em>자동 발동</em></span>
          <span className="is-manual"><i>직접</i><b>Q · E · F · R</b><em>직접 사용 · 레벨업 기술과 별도</em></span>
        </div>

        <nav className="ability-guide-tabs" aria-label="사용 스킬 선택">
          {MANUAL_ABILITY_GUIDE.map((entry, index) => {
            const Icon = ABILITY_ICON[entry.icon] || Crosshair;
            return (
              <button
                type="button"
                className={index === activeIndex ? "is-active" : ""}
                aria-pressed={index === activeIndex}
                onClick={() => setActiveIndex(index)}
                key={entry.id}
              >
                <kbd>{entry.key}</kbd><Icon weight="fill" /><span><b>{entry.koreanName}</b><small>{entry.cooldown}초</small></span>
              </button>
            );
          })}
        </nav>

        <div className={`ability-guide-detail ability-${ability.id}`}>
          <figure className="ability-guide-example">
            {example ? <img src={example} alt={ability.exampleAlt} /> : <div className="ability-guide-example-missing">전투 예시 불러오는 중</div>}
            <span className="ability-guide-live-badge">실제 전투 화면</span>
            {ability.callouts.map((callout) => (
              <span className="ability-example-callout" style={{ left: `${callout.x}%`, top: `${callout.y}%` }} key={callout.label}>
                <i />{callout.label}
              </span>
            ))}
          </figure>
          <article className="ability-guide-copy">
            <header>
              <div className="ability-guide-emblem"><ActiveIcon weight="fill" /><kbd>{ability.key}</kbd></div>
              <div><small>{ABILITY_CATEGORY_KO[ability.category] || ability.category} · {ability.cooldown}초</small><h2>{ability.koreanName}</h2><span>{ability.name}</span></div>
            </header>
            <p>{ability.summary}</p>
            <ul>{ability.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>
            <div className="ability-guide-timing"><small>언제?</small><strong>{ability.timing}</strong></div>
          </article>
        </div>

        <footer className="ability-guide-actions">
          <span><i style={{ width: `${(activeIndex + 1) / MANUAL_ABILITY_GUIDE.length * 100}%` }} /></span>
          <small>{activeIndex + 1} / {MANUAL_ABILITY_GUIDE.length}</small>
          <button type="button" disabled={activeIndex === 0} onClick={() => setActiveIndex((index) => Math.max(0, index - 1))}><ArrowLeft weight="bold" /> 이전</button>
          <button type="button" className="ability-guide-next" onClick={final ? onComplete : () => setActiveIndex((index) => Math.min(MANUAL_ABILITY_GUIDE.length - 1, index + 1))}>
            {final ? "브리핑 완료 · 출격" : "다음 스킬"}<ArrowRight weight="bold" />
          </button>
        </footer>
      </section>
    </main>
  );
}

export function RegionSelectScreen({ regions, clusters = [], campaign, assets, weapons = [], equippedWeaponId = "pulse-rifle", characters = [], selectedCharacterId = "aegis", onCharacterChange, onWeaponChange, onSelect, onBack }) {
  const background = assetSource(assets?.regionMap);
  const unlocked = new Set(campaign?.unlockedRegionIds || ["wrong-engine-core"]);
  const completed = new Set(campaign?.completedRegionIds || []);
  const storyFlags = new Set(campaign?.storyFlags || []);
  const [selectedClusterId, setSelectedClusterId] = useState(null);
  const [selectedRegionId, setSelectedRegionId] = useState(null);
  const [hoveredRegionId, setHoveredRegionId] = useState(null);
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
      <header className="region-select-heading">
        <button type="button" className="campaign-back" data-ui-sound="uiClose" onClick={selectedCluster ? () => setSelectedClusterId(null) : onBack}><ArrowLeft weight="bold" /> {selectedCluster ? "권역 지도" : "기지"} <kbd>ESC</kbd></button>
        <small>나이트자 · 광역 항로 관제</small>
        <h1>{selectedCluster ? <>{selectedCluster.koreanName}<span> · 구역 선택</span></> : "작전 권역 선택"}</h1>
        <p>{selectedCluster ? "이 권역에서 출격할 구역을 선택하세요." : "먼저 출격할 작전 권역을 선택하세요."}</p>
      </header>
      {selectedCluster && !selectedRegion && (
        <div className="region-mobile-swipe-hint" role="status">
          <ArrowLeft weight="bold" /><span>좌우로 밀어 출격 구역 선택</span><ArrowRight weight="bold" />
        </div>
      )}
      {!selectedCluster ? (
        <section className="region-world-map" aria-label="작전 권역 월드맵">
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
      <section className="region-card-grid" aria-label={`${selectedCluster.koreanName} 출격 구역`}>
        {clusterRegions.map((region) => {
          const isUnlocked = unlocked.has(region.id);
          const isCompleted = completed.has(region.id);
          return (
            <button
              type="button"
              className={`region-card region-${region.order}${isCompleted ? " is-completed" : ""}`}
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
              <b>{!isUnlocked ? <><Lock weight="fill" /> 잠김</> : isCompleted ? <><CheckCircle weight="fill" /> 작전 정보 · 재출격</> : <><MapTrifold weight="fill" /> 작전 정보 보기</>}</b>
            </button>
          );
        })}
      </section>
      )}
      {selectedRegion && (
        <section className="region-sortie-dialog" role="dialog" aria-modal="true" aria-labelledby="region-sortie-title">
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
              <dl className="region-sortie-intel">
                <div><dt>주요 적 조합</dt><dd>{localizeThreatText(selectedRegion.threatProfile?.composition)}</dd></div>
                <div><dt>보스 패턴</dt><dd>{localizeThreatText(selectedRegion.threatProfile?.bossSignatures)}</dd></div>
                {selectedRegion.midBoss && <div><dt>중간 방어체</dt><dd>{selectedRegion.midBoss.koreanName} · {selectedRegion.midBoss.name}</dd></div>}
                <div><dt>최종 목표</dt><dd>{BOSS_DISPLAY[selectedRegion.bossName] || selectedRegion.bossName} 파괴</dd></div>
                <div><dt>예상 교전</dt><dd>기계 군단 {selectedRegion.enemyBudget}기</dd></div>
              </dl>
              <div className="region-sortie-rewards">
                <small>첫 승리 회수 자원</small>
                <span>연구 자료 +{selectedRegion.victoryRewards?.firstClear?.researchData || 0}</span>
                <span>장비 부품 +{selectedRegion.victoryRewards?.firstClear?.equipmentParts || 0}</span>
                <span>동기화 코어 +{selectedRegion.victoryRewards?.firstClear?.augmentationCores || 0}</span>
              </div>
            </section>
            <section className="sortie-character-loadout" aria-labelledby="sortie-character-title">
              <header>
                <div><small>태그 편성</small><h3 id="sortie-character-title">시작 캐릭터 선택</h3></div>
                <span>전투 중 <kbd>T</kbd>로 두 캐릭터를 교대합니다.</span>
              </header>
              <div className="sortie-character-options">
                {characters.map((character) => {
                  const selected = character.id === selectedCharacterId;
                  const portrait = assetSource(assets?.[character.id === "mika" ? "mikaPortrait" : "playerPortrait"]);
                  return (
                    <button
                      type="button"
                      className={`sortie-character-card is-${character.accent}${selected ? " is-selected" : ""}`}
                      aria-pressed={selected}
                      data-ui-sound={selected ? "click" : "uiConfirm"}
                      onClick={() => onCharacterChange?.(character.id)}
                      key={character.id}
                    >
                      {portrait && <img src={portrait} alt={`${character.koreanName} 출격 초상화`} />}
                      <span><small>{character.role}</small><strong>{character.koreanName}</strong><em>{character.name}</em></span>
                      <p>{character.weaponName} · {character.description}</p>
                      {selected && <mark><CheckCircle weight="fill" /> 선봉 지정</mark>}
                    </button>
                  );
                })}
              </div>
            </section>
            <section className="sortie-weapon-loadout" aria-labelledby="sortie-weapon-title">
              <header>
                <div><small>메인 장비</small><h3 id="sortie-weapon-title">이번 출격 무기 선택</h3></div>
                <span>무기에 따라 레벨업 증강 트리가 변경됩니다.</span>
              </header>
              <div className="sortie-weapon-options">
                {weapons.map((weapon) => {
                  const equipped = weapon.id === equippedWeaponId;
                  const rankKey = weapon.id === "beam-sword" ? "ilya-sword-resonator" : "ilya-rifle-emitter";
                  const upgradeRank = campaign?.progression?.equipmentRanks?.[rankKey] || 0;
                  const WeaponIcon = weapon.id === "beam-sword" ? Sword : Crosshair;
                  return (
                    <button
                      type="button"
                      className={`sortie-weapon-card${equipped ? " is-equipped" : ""}`}
                      aria-pressed={equipped}
                      data-ui-sound={equipped ? "click" : "uiConfirm"}
                      onClick={() => onWeaponChange?.(weapon.id)}
                      key={weapon.id}
                    >
                      <span><WeaponIcon weight="fill" /></span>
                      <div><small>{weapon.role}</small><strong>{weapon.koreanName}</strong><em>{weapon.name}</em></div>
                      <p>{weapon.description}</p>
                      <footer><b>{weapon.treeLabel}</b><i>기지 개조 {upgradeRank}단계</i></footer>
                      {equipped && <mark><CheckCircle weight="fill" /> 장착 중</mark>}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
          <footer className="region-sortie-command-footer">
            <span><CheckCircle weight="fill" /> 시작 캐릭터와 메인 장비를 모두 선택했습니다.</span>
            <button type="button" className="region-sortie-launch command-ui-button" data-ui-sound="uiConfirm" onClick={() => onSelect(selectedRegion.id)}>
              <AirplaneTilt weight="fill" /><span><small>{characters.find((character) => character.id === selectedCharacterId)?.koreanName || "이지스"} 선봉 · {weapons.find((weapon) => weapon.id === equippedWeaponId)?.koreanName || "펄스 소총"}</small><strong>이 편성으로 출격</strong></span><ArrowRight weight="bold" />
            </button>
          </footer>
        </section>
      )}
    </main>
  );
}

export function SortieCinematicScreen({ region, videoSource, posterSource, soundEnabled = true, combatLoadProgress = 0, combatReady = false, videoComplete = false, onComplete }) {
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
    const video = videoRef.current;
    if (!video) return;
    video.play().then(() => setAutoplayBlocked(false)).catch(() => setAutoplayBlocked(true));
  }, []);

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
    if (assetSource(videoSource)) return undefined;
    setPlaying(true);
    const timer = window.setTimeout(complete, 2400);
    return () => window.clearTimeout(timer);
  }, [complete, videoSource]);

  const handlePlaying = () => {
    setPlaying(true);
    setAutoplayBlocked(false);
  };

  const koreanName = region?.koreanName || region?.name || "작전 구역";
  const englishName = region?.name || "SORTIE";
  const loadPercent = Math.round(Math.max(0, Math.min(1, Number(combatLoadProgress) || 0)) * 100);
  const loadStatus = combatReady
    ? (videoComplete ? "전장 진입 중" : "전장 준비 완료")
    : `전장 불러오는 중 ${loadPercent}%`;
  return (
    <main className={`sortie-cinematic sortie-${region?.id || "unknown"}${playing ? " is-playing" : ""}`} aria-label={`${koreanName} 출격 영상`}>
      {assetSource(videoSource) ? <video
        ref={videoRef}
        className="sortie-cinematic-video"
        src={assetSource(videoSource)}
        poster={assetSource(posterSource)}
        autoPlay
        playsInline
        preload="auto"
        muted={!soundEnabled}
        controls={false}
        disablePictureInPicture
        controlsList="nodownload noplaybackrate nofullscreen"
        onPlaying={handlePlaying}
        onEnded={complete}
        onError={complete}
      /> : <img className="sortie-cinematic-video" src={assetSource(posterSource)} alt={`${koreanName} 출격 항로`} />}
      <div className="sortie-cinematic-grade" aria-hidden="true" />
      <header className="sortie-cinematic-heading">
        <small>NIGHTJAR // 출격 항로 확보</small>
        <h1><span>{koreanName}</span><em>{englishName}</em></h1>
      </header>
      <footer className="sortie-flight-status" aria-live="polite">
        <span><AirplaneTilt weight="fill" /> 나이트자 이륙</span>
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
    const timer = window.setTimeout(finish, 5200);
    const handleKey = (event) => {
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
