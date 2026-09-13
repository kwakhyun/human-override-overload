// Player-facing advice follows REGION_BOSS_PATTERNS, not the legacy English
// flavour labels (which do not always describe the attacks used in combat).
import { TERMINAL_CAMPAIGN } from './terminalCampaign.js';
export const SORTIE_BRIEFINGS = Object.freeze({
  ...Object.fromEntries(Object.values(TERMINAL_CAMPAIGN).map(r => [r.id, { enemies: r.enemies, danger: r.danger, tip: r.tip }])),
  'wrong-engine-core': {
    enemies: '자폭 드론이 많이 접근합니다. 소총병과 저격수의 원거리 사격도 함께 들어옵니다.',
    danger: '보스가 사방으로 탄을 쏘고 넓은 범위를 쓸어 공격합니다. 연속 돌진도 주의하세요.',
    tip: '설비는 이동과 일반 탄환을 막습니다. 냉각 탱크는 공격해 파괴할 수 있습니다. 보스 돌진은 경고 방향의 옆으로 피하세요.',
  },
  'glass-dune': {
    enemies: '저격수가 많은 구역입니다. 멈춰서 싸우면 여러 조준선이 한곳에 겹칩니다.',
    danger: '격자 형태의 공격선과 넓은 폭발 구역이 안전한 이동 공간을 좁힙니다.',
    tip: '수정 군집은 공격해 부술 수 있고, 반사경 기둥은 돌아가야 합니다. 보스전에서는 공격선 사이의 빈 공간을 먼저 찾으세요.',
  },
  'abyssal-archive': {
    enemies: '자폭 드론이 대규모로 밀려옵니다. 한곳에 오래 머물면 둘러싸이기 쉽습니다.',
    danger: '나선형 탄막과 바닥 붕괴가 겹칩니다. 끌어당기는 공격으로 위치가 흐트러질 수 있습니다.',
    tip: '낮은 서버 설비를 파괴하면 퇴로가 열립니다. 보스의 바닥 경고를 먼저 피하고 탄막 사이로 빠져나오세요.',
  },
  'neon-foundry': {
    enemies: '중장갑 보병과 원거리 병기가 함께 등장합니다. 길목을 막는 적을 먼저 줄이세요.',
    danger: '넓은 폭발, 쓸어오는 공격, 시한폭탄과 연속 돌진이 등장합니다.',
    tip: '소형 용광로는 파괴할 수 있고 대형 프레스는 돌아가야 합니다. 보스의 돌진은 연속으로 이어지며 시한폭탄에는 해제 순서가 있습니다.',
  },
  'storm-spire': {
    enemies: '빠른 비행 병기와 원거리 사격이 함께 압박합니다. 이동할 공간을 남겨 두세요.',
    danger: '나선형 탄막, 격자 공격선, 고리 형태의 공격에 연속 돌진이 더해집니다.',
    tip: '축전기를 부수면 길이 열립니다. 높은 코일 기둥은 피해서 이동하세요. 보스전에서는 공격선과 고리 사이의 빈틈을 찾으세요.',
  },
  'gene-vault': {
    enemies: '생체 병기와 원거리 병기가 섞여 나옵니다. 근접 적을 끌고 이동하며 사격을 피하세요.',
    danger: '바닥 붕괴, 사방으로 퍼지는 탄막, 시한폭탄과 끌어당기는 공격이 등장합니다.',
    tip: '배양조는 공격해 파괴할 수 있고 생체 기둥은 막혀 있습니다. 보스에게 끌려간 뒤에는 바닥 경고와 주변 탄막을 다시 확인하세요.',
  },
});
