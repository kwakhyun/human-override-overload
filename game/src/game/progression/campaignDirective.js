import { getCampaignRegions } from "../content/campaign.js";

// Guidance follows the same region and briefing gates as the campaign.
export function getCampaignDirective(slot) {
  const regions = getCampaignRegions();
  const completed = new Set(slot?.completedRegionIds || []);
  const flags = new Set(slot?.storyFlags || []);
  const cleared = regions.filter((region) => completed.has(region.id)).length;
  if (cleared === regions.length) return {
    title: "모든 권역 해방 완료", detail: "기록에 도전하거나 기지 방어전에서 전술을 시험하세요.",
    action: "출격 기록에 도전", target: "regions", cleared, total: regions.length,
  };
  const next = regions.find((region) => !completed.has(region.id)
    && slot?.unlockedRegionIds?.includes(region.id)
    && (!region.briefingFlag || flags.has(region.briefingFlag)));
  return {
    title: next ? `${next.koreanName} 작전 준비` : "다음 작전을 준비하세요",
    detail: next ? `${next.name} · 작전 권역에서 출격 구역을 선택하세요.` : "전투원과 장비를 확인한 뒤 출격하세요.",
    action: cleared === 0 ? "첫 작전 준비" : "다음 작전 준비", target: "regions",
    regionId: next?.id || null, cleared, total: regions.length,
  };
}
