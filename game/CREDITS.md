# Assets, Tools, and Licenses

## Project-original game assets

아래 이미지는 모두 이 프로젝트 전용으로 OpenAI 내장 이미지 생성 도구를 사용해 제작했습니다.
외부 게임 에셋 팩이나 타인의 게임 이미지는 사용하지 않았습니다.

### Dedicated OVERLOAD arena

- 생성일: 2026-08-09
- 생성 도구: OpenAI 내장 ImageGen
- 런타임 경로: `public/assets/survivor/swarm-arena.png`
- 고해상도 원본: `reference/source-assets/public/assets/survivor/swarm-arena-source.png`
- 용도: 단일 캐릭터 물량전과 보스전을 모두 수용하는 전용 오픈 아레나
- 주요 프롬프트:

  > Strict orthographic 90-degree top-down, 16:9 dark industrial circular combat arena; huge unobstructed traversable center; four entry ramps; cyan concentric lane markings; red hazard perimeter; boss summoning seal in the upper-right; bulky scenery only outside the playable perimeter; no characters, UI, or text; photoreal game-ready texture; near-black steel, cyan, red, and amber palette.

프롬프트에서 대형 구조물을 플레이 경계 밖으로 제한해 시각적 통로와 실제 이동 경로가
일치하도록 설계했습니다. 고해상도 생성본은 출처 보존용으로 유지하고, 런타임 사본은 브라우저
표시 크기에 맞춰 최적화했습니다.

### Characters, enemies, boss, and support equipment

- `public/assets/survivor/player.png`
  - 흰 세라믹 장갑, 암청색 관절, 시안 바이저와 펄스 라이플을 가진 플레이어
    `AEGIS / SUBJECT 01`.
- `public/assets/survivor/hunter.png`
  - 빠르게 거리를 좁히는 4족 근접 추적 드론.
- `public/assets/survivor/suppressor.png`
  - 원거리에서 사격 압박을 가하는 코일 라이플 기체.
- `public/assets/survivor/brute.png`
  - 방패와 충격포를 장비한 중장갑 돌파 기체.
- `public/assets/survivor/bosses/wrong-engine.png`
  - 방사 탄막·스윕·지연 폭발·확장 링·돌진 텔레그래프와 3초간 실제 2배 피해를 받는
    코어 노출 단계를 가진 거대 생체 기계 보스
    `THE WRONG ENGINE`.
  - 주요 프롬프트: 상부 3/4 시점의 원형 장갑 실루엣, 네 개의 비대칭 기계 팔, 중앙 반응로
    눈, 흑철·백색 장갑·적색 경고등, 시안·호박·청보라·에메랄드 도관, 작은 화면에서도
    읽히는 굵은 실루엣, 텍스트·UI·그림자 제외, 균일한 크로마키 배경.
- `public/assets/survivor/skills/sentry.png`
  - 흑철 원형 기부, 호박색 쌍열 에너지 포신, 시안 조준 렌즈를 가진 센트리.
- `public/assets/survivor/skills/emp-pylon.png`
  - 육각 기부와 보라색 전자기 코일, 호박색 안정판, 시안 축전기를 가진 EMP 파일런.
- `public/assets/survivor/skills/wingman-drone.png`
  - 흑철 가오리형 동체, 보라색 코어와 시안 센서를 가진 전투 보조 드론.

캐릭터 공통 프롬프트 조건은 실제 90도 상부 시점, 동쪽을 향하는 단일 배우, 전술 게임에서
작은 크기로 읽히는 실루엣, 균일한 크로마키 배경, 그림자·UI·텍스트 제외입니다. 지원 장비는
균일 배경 위에 단일 개체로 생성하고, 근흑색 산업 금속·호박·시안·보라색 발광부, 넉넉한
패딩, 그림자와 바닥면 제외를 지시했습니다. 생성 원본은 프로젝트의 크로마키 제거 도구로
투명 PNG화했습니다. 런타임 사본은 표시 크기에 맞춘 premultiplied-alpha Lanczos PNG로
최적화했으며 전체 해상도 원본은 `reference/source-assets/`에 보존합니다.

### Three-form boss and combat VFX atlases

- 생성일: 2026-08-09
- 생성 도구: OpenAI 내장 ImageGen
- 런타임 경로:
  - `public/assets/survivor/bosses/wrong-engine-phase2.png`
  - `public/assets/survivor/bosses/wrong-engine-phase3.png`
  - `public/assets/survivor/vfx/boss-pattern-atlas.png`
  - `public/assets/survivor/vfx/player-ordnance-atlas.png`
- 크로마키 원본: 동일한 하위 구조의 `reference/source-assets/public/assets/survivor/` 경로
- 후처리: 내장 ImageGen의 균일한 `#ff00ff` 또는 `#00ff00` 배경을 프로젝트 크로마키 제거
  도구로 알파 PNG화한 뒤, 보스는 512×512, 보스 패턴은 768×512, 플레이어 병기는
  768×768로 축소했습니다.
- 최종 프롬프트 세트:

  > Phase 2: preserve THE WRONG ENGINE's red central reactor, ivory armor, black mechanical frame and radial identity; unfold the outer armor into segmented blades, enlarge weapon pods, expose amber cooling vents and internal mechanisms; one centered top-down three-quarter game sprite on a perfectly flat magenta chroma-key background; no shadow, floor, text or watermark.

  > Phase 3: evolve the same machine into a catastrophic overclocked form with three concentric white-hot reactor rings, retracted and fractured armor, longer weapon limbs, rail barrels, charge blades and molten red-orange energy veins; preserve the radial identity; one centered isolated sprite on flat magenta chroma key; no smoke, loose particles, shadow, text or watermark.

  > Boss pattern atlas: exactly six isolated sprites in a 3×2 atlas—radial plasma saw orb, sweep laser blade, reactor bomb, segmented shock-ring shard, charge drill spear and triple multi-charge lance—in the boss's ivory/black/red industrial style; uniform green chroma key, no grid lines, text, shadow or extra objects.

  > Player ordnance atlas: exactly nine isolated sprites in a 3×3 atlas—pulse bolt, scatter shard, rail lance, guided rocket, orbit blade, arc capacitor, zero-point nova reactor, airstrike missile and omega laser cannon—in the player's ivory/black/cyan style; uniform magenta chroma key, no grid lines, text, shadow or extra objects.

보스 단계 이미지는 체력 70%와 38% 변환에 직접 연결됩니다. 두 아틀라스는 캔버스가 셀 좌표를
잘라 투사체, 텔레그래프, 궤도 칼날, 공중 폭격, 노바와 오메가 레이저에 사용하며 외부 에셋은
포함하지 않습니다.

## Original procedural sound

- 외부 효과음 파일을 사용하지 않습니다.
- `src/audio/sfx.js`에서 필터 노이즈, 오실레이터, 다이내믹 컴프레서와 절차적 공간 잔향을
  조합해 자동 사격, 피격, 적 처치, XP 흡수, 레벨업, 대시, 보스 진입, 위험 텔레그래프와
  약점 노출 효과음을 실시간 합성합니다.

## Legacy project originals

`reference/source-assets/` 아래의 미사용 이미지도 이 프로젝트의 이전 개발 과정에서 제작한
원본입니다. 현재 게임에서는 로드하지 않으며 제작 기록을 위해 보관하고 production build에는
포함하지 않습니다.

## Main background music

- 파일: `public/assets/audio/overload-main-theme.mp3`
- 원본 파일명: `300 드론 생존전.mp3`
- 재생 시간: 약 59.9초, 게임 플레이 중 반복 재생
- 출처: 프로젝트 사용자가 직접 제공한 외부 제작 음원
- 적용: 시작 버튼의 사용자 제스처로 재생하며 게임 종료 시 정지, 전체 사운드 토글과 연동
- 생성 프롬프트, 사용 도구의 이용 플랜 및 세부 라이선스 정보는 최종 AI 활용 기술 문서 작성
  전에 사용자 제공 정보로 보완합니다.

## Open-source dependencies

- React — MIT License
- Vite — MIT License
- Phosphor Icons — MIT License
- Rajdhani — SIL Open Font License 1.1
- IBM Plex Mono — SIL Open Font License 1.1

정확한 버전은 `package-lock.json`에 고정되어 있습니다.
