import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const activeCopyFiles = [
  "src/App.jsx",
  "src/ui/campaign/CampaignScreens.jsx",
  "src/game/content/campaign.js",
  "src/game/content/baseUpgrades.js",
  "src/game/content/characters.js",
  "src/game/content/weapons.js",
  "src/defense/content.js",
  "src/swarm/engine.js",
];

test("active Korean UI copy avoids literal-translation phrases and keeps concise player-facing wording", async () => {
  const source = (await Promise.all(activeCopyFiles.map((path) => readFile(new URL(path, root), "utf8")))).join("\n");
  for (const awkward of [
    "인류 저항 이동 기지",
    "전투 예시 전송 중",
    "편성 확정 · 작전 시작",
    "해방 기록 있음",
    "적 전력 소거",
    "현재 공세를 소거하세요",
    "레아의 관제 기록이 확정됐습니다",
    "전투 기록을 기지로 전송합니다",
    "증강이 출현합니다",
    "생체 제조 계보 소거 확인",
    "지역 추론핵을 처치하면 획득",
    "대규모 공세 접근",
    "웨이브 조기 개시",
    "지역 추론핵 THE WRONG ENGINE",
  ]) {
    assert.doesNotMatch(source, new RegExp(awkward), `replace translation-like copy: ${awkward}`);
  }

  for (const natural of [
    "인류 저항군 이동 기지",
    "전투 예시 불러오는 중",
    "이 편성으로 출격",
    "보스 전장으로 자동 이동합니다",
    "작전 기록을 기지에 저장합니다",
    "산탄·레일·로켓 중심의 증강이 등장합니다",
    "지역 추론핵을 파괴하면 획득",
    "지금 공세 시작",
    "오답 엔진(THE WRONG ENGINE)",
  ]) {
    assert.ok(source.includes(natural), `keep natural Korean copy: ${natural}`);
  }
});
