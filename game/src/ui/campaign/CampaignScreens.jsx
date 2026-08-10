import { useEffect, useState } from "react";
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
  User,
  Wrench,
} from "@phosphor-icons/react";

function assetSource(asset, fallback = "") {
  return asset?.src || asset || fallback;
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
        <small>HAVEN-09 · CAMPAIGN ARCHIVE</small>
        <h1>작전 기록 선택</h1>
        <p>보스 격파와 지역 해금 정보는 선택한 슬롯에 자동 저장됩니다.</p>
      </header>
      <section className="save-slot-grid" aria-label="캠페인 저장 슬롯">
        {normalized.map((slot, index) => {
          const completed = slot?.completedRegionIds?.length || 0;
          const progress = Math.round(completed / 3 * 100);
          return (
            <button
              type="button"
              className={slot ? "save-slot-card has-data" : "save-slot-card is-empty"}
              onClick={() => onSelect(index)}
              key={`slot-${index + 1}`}
            >
              <span className="save-slot-number">SLOT 0{index + 1}</span>
              {slot ? (
                <>
                  <FloppyDisk weight="fill" />
                  <strong>{slot.homeBaseUnlocked ? "HAVEN-09 복귀 기록" : "첫 출격 준비"}</strong>
                  <p>{completed} / 3 지역 해방 · {progress}%</p>
                  <i><i style={{ width: `${progress}%` }} /></i>
                  <small>{formatUpdatedAt(slot.updatedAt)}</small>
                  <b>기록 계속하기 <Play weight="fill" /></b>
                </>
              ) : (
                <>
                  <span className="empty-slot-mark">+</span>
                  <strong>새 캠페인</strong>
                  <p>AEGIS의 첫 번째 추론핵 공격부터 시작합니다.</p>
                  <b>새 작전 생성 <Play weight="fill" /></b>
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
    id: "gravitySnare",
    name: "NULL SNARE",
    koreanName: "중력 포획장",
    category: "TACTICAL UTILITY",
    cooldown: 18,
    icon: "snare",
    summary: "적 무리 한가운데를 가리키고 Q. 3초간 한 점으로 끌어모읍니다.",
    details: ["자폭 드론과 저격수를 한곳에 묶습니다.", "날아오는 적 탄환도 휘어져 약해집니다."],
    timing: "적이 뭉쳤을 때 포인터를 무리 중앙에 두세요.",
    quote: "Q는 붙잡는 키. 적들이 예쁘게 모이면 우리 총알도 덜 헤매지.",
    exampleAssetKey: "tutorialNullSnare",
    exampleAlt: "실제 전투에서 NULL SNARE 중력장으로 적과 탄환을 끌어당기는 장면",
    overlayPrompt: "포인터를 적 무리 중앙에 놓고 Q 또는 강조된 버튼을 누르세요.",
    callouts: Object.freeze([
      Object.freeze({ label: "포인터 목표", x: 38, y: 37 }),
      Object.freeze({ label: "중력장 범위", x: 24, y: 48 }),
      Object.freeze({ label: "실제 Q 슬롯", x: 31, y: 92 }),
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
    summary: "위험 경고가 보이면 E. 5초간 회복·방어막이 AEGIS를 따라옵니다.",
    details: ["즉시 체력을 조금 회복하고 임시 실드를 얻습니다.", "피해와 상태 이상을 줄여 연속 공격을 버팁니다."],
    timing: "맞은 뒤보다 보스 경고 직전에 누르는 것이 좋습니다.",
    quote: "선체가 비명 지르기 전에 E. 기계한테 타이밍으로 지면 좀 창피하잖아?",
    exampleAssetKey: "tutorialAegisWard",
    exampleAlt: "실제 전투에서 AEGIS WARD 육각 방벽이 주인공을 감싸는 장면",
    overlayPrompt: "보스 경고나 포위 직전에 E 또는 강조된 버튼으로 방벽을 켜세요.",
    callouts: Object.freeze([
      Object.freeze({ label: "AEGIS를 따라오는 방벽", x: 50, y: 50 }),
      Object.freeze({ label: "5초 보호 범위", x: 35, y: 31 }),
      Object.freeze({ label: "실제 E 슬롯", x: 44, y: 92 }),
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
    summary: "긴 적 대열을 가리키고 F. 세 편대가 평행 항로를 연속 소사합니다.",
    details: ["밝은 경고선 세 줄이 실제 타격 경로입니다.", "소총수·저격수가 길게 늘어섰을 때 강합니다."],
    timing: "포인터로 적 대열을 가로지르는 공격 축을 정하세요.",
    quote: "적들이 줄을 섰다? 포인터로 길을 그리고 F. STRATOS가 세 줄로 긁고 갈게.",
    exampleAssetKey: "tutorialStratosRun",
    exampleAlt: "실제 전투에서 세 개의 STRATOS RUN 소사 항로가 적 대열을 통과하는 장면",
    overlayPrompt: "포인터로 적 대열을 가로지른 뒤 F 또는 강조된 버튼을 누르세요.",
    callouts: Object.freeze([
      Object.freeze({ label: "포인터를 지나는 공격 축", x: 50, y: 51 }),
      Object.freeze({ label: "3개 평행 소사 항로", x: 37, y: 25 }),
      Object.freeze({ label: "실제 F 슬롯", x: 59, y: 92 }),
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
    summary: "완전히 포위되면 R. 네 랜스가 3.2초간 360°를 빠르게 청소합니다.",
    details: ["여러 바퀴 회전하며 사방을 연속 타격합니다.", "72초 쿨타임이므로 대공세·보스 코어에 아끼세요."],
    timing: "완전 포위 또는 보스 코어 노출이 가장 좋은 순간입니다.",
    quote: "R은 72초짜리 비상금. 포위됐거나 코어가 열렸을 때만 멋지게 써 줘.",
    exampleAssetKey: "tutorialHelixTempest",
    exampleAlt: "실제 전투에서 네 개의 HELIX TEMPEST 랜스가 주인공 주위를 회전하는 장면",
    overlayPrompt: "포위됐을 때 R 또는 강조된 버튼. 긴 쿨타임의 비상 화력입니다.",
    callouts: Object.freeze([
      Object.freeze({ label: "AEGIS 중심", x: 50, y: 50 }),
      Object.freeze({ label: "360° 회전 랜스", x: 78, y: 37 }),
      Object.freeze({ label: "실제 R 슬롯", x: 72, y: 92 }),
    ]),
  }),
]);

const ABILITY_ICON = Object.freeze({
  snare: Crosshair,
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

export function NpcDialoguePanel({ npc, assets, lineIndex, onAdvance, onClose, onFacility, onInteraction, onNarration }) {
  const lines = npc?.dialogue || [];
  const line = lines[Math.min(lineIndex, Math.max(0, lines.length - 1))] || "통신 기록이 없습니다.";
  const final = lineIndex >= lines.length - 1;
  useEffect(() => {
    if (!npc || !onNarration) return;
    const id = `npc-${npc.id}-${lineIndex}`;
    onNarration({ id, speaker: npc.name, text: line, kind: "npc-dialogue" });
    return () => onNarration({ id, cancel: true });
  }, [line, lineIndex, npc?.id, npc?.name, onNarration]);
  if (!npc) return null;
  return (
    <section className="base-dialogue" role="dialog" aria-modal="true" aria-labelledby="base-dialogue-name">
      <NpcPortrait npc={npc} assets={assets} />
      <div>
        <small>{npc.role}</small>
        <h2 id="base-dialogue-name">{npc.name}</h2>
        <p>{line}</p>
        <footer>
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
          <button type="button" onClick={final ? onClose : onAdvance}>
            {final ? "대화 종료" : "다음"}<ChatText weight="bold" />
          </button>
        </footer>
      </div>
    </section>
  );
}

export function BaseFacilityPanel({ facility, onPurchase, onClose }) {
  if (!facility) return null;
  const FacilityIcon = facility.id === "research" ? Brain : Wrench;
  return (
    <section className={`base-facility-panel facility-${facility.id}`} role="dialog" aria-modal="true" aria-labelledby="base-facility-name">
      <header>
        <span><FacilityIcon weight="fill" /></span>
        <div>
          <small>{facility.kicker}</small>
          <h2 id="base-facility-name">{facility.name}</h2>
          <p>{facility.description}</p>
        </div>
        <button type="button" className="facility-close" onClick={onClose} aria-label={`${facility.name} 닫기`}><ArrowLeft weight="bold" /> 기지로</button>
      </header>

      <div className="facility-resource">
        <small>{facility.currencyLabel}</small>
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
                <b>RANK {upgrade.rank} / {upgrade.maxRank}</b>
              </header>
              <div className="upgrade-ranks" aria-label={`${upgrade.maxRank}랭크 중 ${upgrade.rank}랭크`}>
                {Array.from({ length: upgrade.maxRank }, (_, index) => <i className={index < upgrade.rank ? "is-active" : ""} key={index} />)}
              </div>
              <p>{upgrade.description}</p>
              <dl>
                <div><dt>현재 효과</dt><dd>{upgrade.currentEffect || "미적용"}</dd></div>
                <div><dt>{maxed ? "완료" : "다음 랭크"}</dt><dd>{maxed ? "최대 출력 도달" : upgrade.nextEffect}</dd></div>
              </dl>
              <button type="button" disabled={disabled} onClick={() => onPurchase(upgrade.id)}>
                {maxed ? <><CheckCircle weight="fill" /> MAX RANK</> : upgrade.lockedReason ? <><Lock weight="fill" /> {upgrade.lockedReason}</> : <><FacilityIcon weight="bold" /> {upgrade.nextCost} {facility.currencyShortLabel}</>}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function HomeBaseScreen({ campaign, npcs, assets, activeNpc, lineIndex, activeFacility, onNpc, onAdvanceNpc, onCloseNpc, onOpenFacility, onNpcInteraction, onPurchaseUpgrade, onCloseFacility, onBoard, onTitle, onNarration }) {
  const background = assetSource(assets?.homeBase);
  const completed = campaign?.completedRegionIds?.length || 0;
  return (
    <main className="campaign-shell home-base-screen">
      {background && <img className="campaign-background" src={background} alt="인류 저항군의 이동 기지 HAVEN-09" />}
      <div className="base-vignette" aria-hidden="true" />
      <header className="base-status">
        <div><small>MAIN BASE</small><strong>HAVEN-09</strong></div>
        <span><FloppyDisk weight="fill" /> SLOT {(campaign?.slotIndex ?? 0) + 1} · AUTO SAVED</span>
        <b>{campaign?.progression?.researchData || 0} DATA · {campaign?.progression?.equipmentParts || 0} PARTS · {completed} / 3 NODES</b>
      </header>

      {(npcs || []).map((npc) => {
        const Icon = NPC_ICON[npc.id] || User;
        return (
          <button
            type="button"
            className={`base-hotspot npc-${npc.id}`}
            onClick={() => onNpc(npc)}
            aria-label={`${npc.name}와 대화`}
            key={npc.id}
          >
            <Icon weight="fill" /><span><small>{npc.role}</small><b>{npc.name}</b></span>
          </button>
        );
      })}

      <button type="button" className="base-hotspot airship-hotspot" onClick={onBoard}>
        <AirplaneTilt weight="fill" /><span><small>STEALTH AIRSHIP</small><b>구역 선택 및 출격</b></span>
      </button>

      <aside className="base-objective">
        <small>현재 작전</small>
        <strong>{completed >= 3 ? "SOVEREIGN ORBITAL UPLINK 발견" : "지역 추론핵을 추적하십시오"}</strong>
        <p>{completed >= 3 ? "세 지역 신호가 하나의 궤도 통제망을 가리킵니다." : "비행선에서 다음 전투 구역을 선택할 수 있습니다."}</p>
        {campaign?.lastRegionRewards && (
          <div className="base-reward-receipt">
            <span>RECOVERED</span>
            <b>+{campaign.lastRegionRewards.researchData} DATA</b>
            <b>+{campaign.lastRegionRewards.equipmentParts} PARTS</b>
          </div>
        )}
        <button type="button" onClick={onTitle}>저장 슬롯 화면</button>
      </aside>

      <NpcDialoguePanel npc={activeNpc} assets={assets} lineIndex={lineIndex} onAdvance={onAdvanceNpc} onClose={onCloseNpc} onFacility={onOpenFacility} onInteraction={onNpcInteraction} onNarration={onNarration} />
      <BaseFacilityPanel facility={activeFacility} onPurchase={onPurchaseUpgrade} onClose={onCloseFacility} />
    </main>
  );
}

export function AbilityGuideScreen({ assets, onComplete, onBack, onNarration }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const ability = MANUAL_ABILITY_GUIDE[activeIndex];
  const ActiveIcon = ABILITY_ICON[ability.icon] || Crosshair;
  const portrait = assetSource(assets?.controlOfficer);
  const background = assetSource(assets?.homeBase);
  const example = assetSource(assets?.[ability.exampleAssetKey]);
  const final = activeIndex === MANUAL_ABILITY_GUIDE.length - 1;

  useEffect(() => {
    if (!onNarration) return undefined;
    const id = `ability-guide-${ability.id}`;
    onNarration({
      id,
      speaker: "RHEA",
      text: `${ability.quote} ${ability.summary}`,
      kind: "ability-guide",
    });
    return () => onNarration({ id, cancel: true });
  }, [ability, onNarration]);

  return (
    <main className="campaign-shell ability-guide-screen">
      {background && <img className="campaign-background" src={background} alt="HAVEN-09 전술 관제실" />}
      <div className="ability-guide-shade" aria-hidden="true" />
      <aside className="ability-guide-rhea" aria-label="전술 관제관 RHEA">
        {portrait && <img src={portrait} alt="은빛 보랏빛 단발과 전술 헤드셋을 착용한 관제관 RHEA" />}
        <div><small>TACTICAL CONTROL · RHEA</small><strong>“{ability.quote}”</strong></div>
      </aside>

      <section className="ability-guide-console" aria-labelledby="ability-guide-title">
        <header>
          <div>
            <small>HAVEN-09 · 실제 전투 화면으로 배우기</small>
            <h1 id="ability-guide-title">Q · E · F · R, 이것만 기억하세요</h1>
          </div>
          {onBack && <button type="button" className="campaign-back" onClick={onBack}><ArrowLeft weight="bold" /> 기지로</button>}
        </header>

        <div className="ability-circuit-separation" role="note" aria-label="자동 스킬과 수동 스킬의 차이">
          <span><i>AUTO</i><b>레벨업 기술</b><em>자동 발동</em></span>
          <span className="is-manual"><i>MANUAL</i><b>Q · E · F · R</b><em>직접 눌러 사용 · 자동 기술과 완전히 별개</em></span>
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
                <kbd>{entry.key}</kbd><Icon weight="fill" /><span><b>{entry.name}</b><small>{entry.cooldown}초</small></span>
              </button>
            );
          })}
        </nav>

        <div className={`ability-guide-detail ability-${ability.id}`}>
          <figure className="ability-guide-example">
            {example ? <img src={example} alt={ability.exampleAlt} /> : <div className="ability-guide-example-missing">전투 예시 전송 중</div>}
            <span className="ability-guide-live-badge">ACTUAL GAMEPLAY</span>
            {ability.callouts.map((callout) => (
              <span className="ability-example-callout" style={{ left: `${callout.x}%`, top: `${callout.y}%` }} key={callout.label}>
                <i />{callout.label}
              </span>
            ))}
          </figure>
          <article className="ability-guide-copy">
            <header>
              <div className="ability-guide-emblem"><ActiveIcon weight="fill" /><kbd>{ability.key}</kbd></div>
              <div><small>{ability.category} · {ability.cooldown}초</small><h2>{ability.name}</h2><span>{ability.koreanName}</span></div>
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
            {final ? "브리핑 완료 · 출격" : "다음 전술"}<ArrowRight weight="bold" />
          </button>
        </footer>
      </section>
    </main>
  );
}

export function RegionSelectScreen({ regions, campaign, assets, onSelect, onBack }) {
  const background = assetSource(assets?.regionMap);
  const unlocked = new Set(campaign?.unlockedRegionIds || ["wrong-engine-core"]);
  const completed = new Set(campaign?.completedRegionIds || []);
  return (
    <main className="campaign-shell region-select-screen">
      {background && <img className="campaign-background" src={background} alt="비행선 전술 지도에 표시된 세 개의 작전 구역" />}
      <div className="region-map-shade" aria-hidden="true" />
      <header className="region-select-heading">
        <button type="button" className="campaign-back" onClick={onBack}><ArrowLeft weight="bold" /> 기지</button>
        <small>SKYLINE · FLIGHT CONTROL</small>
        <h1>출격 구역 선택</h1>
        <p>각 지역의 군단을 돌파하고 SOVEREIGN 지역 추론핵을 파괴하십시오.</p>
      </header>
      <section className="region-card-grid" aria-label="출격 가능한 지역">
        {(regions || []).map((region, index) => {
          const isUnlocked = unlocked.has(region.id);
          const isCompleted = completed.has(region.id);
          return (
            <button
              type="button"
              className={`region-card region-${index + 1}${isCompleted ? " is-completed" : ""}`}
              disabled={!isUnlocked}
              onClick={() => onSelect(region.id)}
              key={region.id}
            >
              <span>{region.chapterLabel || `CHAPTER ${index + 1}`}</span>
              <strong>{region.name}</strong>
              <p>{region.summary}</p>
              {region.threatProfile && (
                <span className="region-threat">
                  <i>{region.threatProfile.label}</i>
                  <em>{region.threatProfile.composition}</em>
                  <em>{region.threatProfile.bossSignatures}</em>
                </span>
              )}
              <small>{region.bossName}</small>
              <b>{!isUnlocked ? <><Lock weight="fill" /> LOCKED</> : isCompleted ? <><CheckCircle weight="fill" /> 재출격</> : <><MapTrifold weight="fill" /> 출격</>}</b>
            </button>
          );
        })}
      </section>
    </main>
  );
}
