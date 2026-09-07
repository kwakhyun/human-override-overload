# 제작·검증 도구

명령은 `game/`에서 실행합니다. Python 이미지 도구에는 Pillow·NumPy, PDF 도구에는 ReportLab·pypdf가 필요합니다. 포트폴리오 글꼴은 Windows 맑은 고딕을 사용합니다. 브라우저 검증 도구는 번들 Playwright와 Edge 경로를 사용합니다.

| 작업 | 도구와 입력 |
| --- | --- |
| 공개 에셋 검사 | `npm run analyze:assets` → `lib/runtime-assets.mjs`: manifest의 동적 등록·화질과 HTML/CSS 참조까지 확인 |
| 배포 패키징 | `prepare-sites-build.mjs`: Worker·DB·hosting 계약 보존, 구형 공개 경로 방어 목록 적용 |
| 현행 전투 아틀라스 | `build-sprite-quality-assets.py` + `sprite-quality-recipes.json` + `sprite-source-layouts.json` |
| 저사양 이미지 | `build-performance-assets.py`: 현행 출력만 생성, 셀 단위 축소 |
| 원본 프레임 검사 | `test-sprite-source-layouts.py`, `audit-sprite-source-cuts.py` |
| 런타임 아틀라스 검사 | `audit-motion-atlases.py`, `verify-combat-sprites.mjs` |
| 일러스트 비율·알파 | `build-runtime-portraits.py`, `operative_portrait_contract.py`, `verify-portrait-framing.mjs` |
| 신규 캐릭터 입력 정규화 | `build-nox-assets.py`, `build-vesper-assets.py`: 구형 보조 전투 출력은 reference 입력 영역에만 생성 |
| AEGIS 제작 중인 리깅 | `prepare-aegis-rig-parts-v2.mjs`, `verify-cubism-parts-v2.mjs`: 현재 Cubism 작업본 보존, 재분리는 수동 리깅 완료와 다름 |
| 현재 UI·음악 회귀 검사 | `verify-skill-readiness.mjs`, `verify-portrait-motion.mjs`, `verify-music-continuity.mjs` |
| 방어 배경·구역 대체 배경 | `build-defense-battlefields.py`, `build-expedition-arenas.py` |
| 개별 소재 정규화 | `normalize-*`, `compose-*`, `extract-atlas-frame.py`, `process-character-chroma.py` 등: 명시한 입력·출력만 처리 |
| 본문 문서 PDF | `build-project-pdfs.py`: `docs/project/*.md` → `output/pdf/` |
| 채용 포트폴리오 PDF | `build-recruitment-portfolio.py` + `lib/portfolio_pdf.py`: `docs/project/media/recruitment/` 사용 |
| 콘텐츠 기획 지원용 PDF | `build-content-planner-portfolio.py`: `docs/project/media/content-planner/`의 당시 근거 사용 |
| 음성 생성 | `generate-google-agent-voice.mjs`: 현재 F/R 두 대사만 생성; 인증·과금 설정은 GOOGLE_TTS_SETUP.md 참조 |

오래된 PSD 프록시 생성기, v1 Cubism 검수기, 중간 AI 보고서 생성기는 제거했습니다. 현행 리깅을 다시 분리할 때 필요한 좌표는 `reference/source-assets/overload/runtime-inputs/aegis-part-segmentation.json`으로 독립 보존했습니다.

새로운 출력은 manifest와 레시피를 먼저 연결하고 에셋 검사를 통과시킵니다. 범용 정규화 도구가 출력한 실험 이미지는 승인 전 `public/`에 두지 않습니다. `production-asset-policy.mjs`의 구형 경로 목록은 예전 로컬 도구의 출력을 배포에서 막는 호환 방어 규칙입니다.
