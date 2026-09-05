# 신규 장소 BGM 제작 프롬프트

작성일: 2026-09-06. 상태: 사용자 제공 5곡을 2026-09-06 적용 완료. 파일별 이력은 music-import-2026-09-06.md 참조. 아래 내용은 제작 요청 당시의 프롬프트이며 실제 생성 길이를 보증하지 않는다.

기존 로비·타이틀·1~3구역 음악은 유지한다. 새 제작 대상은 기지 방어전, 영입·동기화 장면, 외곽 4~6구역의 총 5곡이다. 연구실·정비소·전투원 관리·지역 선택 메뉴는 로비 곡을 공유한다. 아래 BPM과 조성은 새 음악의 제안이며 기존 녹음에서 측정한 값이 아니다.

Suno Custom에서 Instrumental을 켜고 각 영문 프롬프트를 Styles에 입력한다. 제목은 Title에 별도로 입력한다. Advanced Options의 Exclude에는 아래 공통 제외 조건을 사용한다.

```text
vocals, lyrics, spoken word, whispers, choir, vocal chops, crowd chants, cinematic braams, festival EDM drops, jump scares, gunshots, alarm sirens, long silent intro, fade-out ending
```

게임의 위험 경고·무기 소리와 혼동되지 않도록 실제 경보와 총성은 음악에서 제외한다. 아래 길이와 루프 구조는 제작 목표이며 생성 결과를 보장하지 않는다. 채택 후 실제 파형을 들어 루프 지점을 편집하고 음량을 맞춘다. 서로 다른 생성곡이 동일 선율을 공유한다고 가정하지 않는다.

## 1. 기지 방어전 — Hold the Last Line

레아의 방어 지휘, 웨이브 대응과 기지 사수에 맞춘 절제된 긴장감. 전투 중 전용곡이며 방어전 선택 메뉴는 로비 음악을 유지한다. 목표 길이 약 3분.

```text
Instrumental tactical sci-fi tower-defense score, 112 BPM, D minor, 4/4. Defend HAVEN-09, humanity's underground refuge, against coordinated machine waves. Controlled urgency, disciplined resistance, a fragile human warmth beneath cold electronics. Tight electronic kick, dry snare, muted industrial percussion, steady analog bass ostinato, restrained cello pulses and a sparse three-note piano motif. Establish the groove within four bars. Alternate focused eight-bar phrases with brief thinner passages; gradually add rhythmic layers without a huge climax. Maintain a clear pulse for planning and sustained pressure for combat. Spacious midrange for UI cues and weapon effects, firm centered bass, smooth dynamics. Aim for a three-minute cue with a repeating final groove suitable for loop editing. Purely instrumental.
```

## 2. 영입·동기화 — A Human Signal

새 전투원을 맞이하는 장면의 공통 배경. 인물별 짧은 대사와 표정을 가리지 않는 긴장과 신뢰. 목표 길이 약 2~3분.

```text
Instrumental intimate sci-fi character recruitment underscore, 76 BPM, D minor with gentle suspended harmonies, 4/4. Inside a quiet synchronization chamber, two survivors cautiously choose to trust each other. Tender but restrained, uncertain at first, gradually hopeful. Soft felt piano, warm low cello, delicate glass harmonics, slow analog pads and a barely audible electronic heartbeat. Sparse melody with generous pauses for dialogue reading. Begin with a short atmospheric pickup; introduce a small memorable motif, then add warmth through subtle harmony and texture. Keep percussion minimal and volume even. Avoid a dramatic reveal or triumphant finale. Aim for a two-to-three-minute background cue, returning to the opening texture for unobtrusive loop editing. Purely instrumental, no human-like vocal textures.
```

## 3. 4구역 네온 주조구 — Furnace Protocol

무인 병기 공장, 압착 장치, 중장갑 생산 군단의 무게. 유리 사구의 날카로운 질감과 구별되는 두껍고 건조한 금속 리듬. 목표 길이 약 3분.

```text
Instrumental industrial sci-fi combat score, 124 BPM, E minor, 4/4. NEON FOUNDRY: an automated weapons city of furnace channels, hydraulic presses and marching armored machines. Heavy, hot, mechanical and relentless. Interlocking metallic percussion, hydraulic-style rhythmic thumps, dry distorted synth bass, low sequenced arpeggios and short abrasive synth stabs. Build the rhythm around a repeating press-and-release pattern, with deliberate gaps between impacts. Establish combat momentum within four bars. Develop through eight-bar variations and a brief low-density passage before returning to the main machine groove. Keep bass tight and transients distinct so combat effects remain readable. Aim for three minutes of sustained action with a repeating loop-friendly ending. Purely instrumental.
```

## 4. 5구역 폭풍 첨탑 — Above the Storm Grid

뇌운 위 기상 통제 요새와 고속 비행·방전 전투. 주조구의 무게와 대비되는 속도, 고도감과 넓은 공간. 목표 길이 약 3분.

```text
Instrumental aerial sci-fi combat score, 140 BPM, F-sharp minor, 4/4. STORM SPIRE: a weather-control fortress above thunderclouds, high-speed interceptors crossing electrified corridors. Fast, precise, wind-swept and dangerously exposed. Crisp broken electronic drums, nimble rolling bass, bright electric arpeggios, airy granular pads, short metallic sparks and rising synthetic string patterns. Wide high-frequency atmosphere with a stable centered rhythm section. Start the pulse quickly; alternate ascending eight-bar sequences with spacious half-time relief, then recover full momentum. Tension comes from motion and harmonic lift, not excessive loudness. Preserve space for attack warnings and weapon effects. Aim for a three-minute action cue with a stable repeating outro for loop editing. Purely instrumental.
```

## 5. 6구역 생체 금고 — The Manufactured Pulse

금지된 생체 제조 기록고와 합성 병기의 추적·포위. 심해 기록고의 수중 공간감과 구별되는 가깝고 건조한 생체기계 질감. 목표 길이 약 3분.

```text
Instrumental biomechanical sci-fi combat score, 118 BPM, C-sharp Phrygian, 4/4. GENE VAULT: sealed biological production chambers where synthetic organisms track and surround the intruder. Clinical, intimate, predatory and deeply unnatural. Dry membrane-like percussion, a pulsing sub-bass heartbeat, granular clicks, low bowed strings, detuned glass tones and tightly gated synth patterns. Keep a dependable combat beat beneath unsettling syncopation and small dissonant intervals. Close, narrow textures open briefly into sterile empty space, then contract again. Establish tension within four bars and sustain it through subtle eight-bar mutations. Controlled bass and restrained dynamics leave room for combat cues. Aim for three minutes with a recurring final pulse for loop editing. Purely instrumental; no breathing or whispered voices.
```

## 채택 기준

- 영입 장면은 첫 10초와 반복 구간에서 대사 읽기를 방해하지 않아야 한다.
- 전투곡은 시작 4마디 안에 리듬을 잡고, 긴 무음·급격한 음량 상승·갑작스러운 마무리가 없어야 한다.
- 방어전은 규칙적인 지휘 리듬, 주조구는 중량감, 첨탑은 속도와 넓은 공간, 금고는 밀착된 불안감으로 서로 구별한다.
- 실제 가사/허밍/속삭임/합창이 섞인 결과는 제외한다. 게임 효과음으로 오인할 경보와 총성이 들어간 결과도 제외한다.
- 반복이 자연스러운 구간을 골라 후처리한다. 완성 파일을 검수한 뒤 활성 에셋 목록과 음악 라우팅에 등록한다.

## Suno 입력 방식 확인

- Custom / Instrumental / Styles: https://help.suno.com/en/articles/3726721
- Advanced Options / Exclude: https://help.suno.com/en/articles/3161921

확인일 2026-09-06. 문서는 입력 UI 안내의 출처다. 위 창작 프롬프트와 음악적 선택은 프로젝트 설정에 맞춰 새로 작성했다.
