# 제작·검증 도구

게임 이미지·Cubism 모델·`reference/` 제작 입력과 `output/` PDF는 비공개 로컬 자료입니다. 공개 저장소를 복제한 경우 해당 작업 전에 권한 있는 사본을 원래 경로에 복원합니다. [이미지 보관·Git 검사 정책](../docs/public-repository-assets.md)을 따릅니다.

명령은 `game/`에서 실행합니다. Python 이미지 도구에는 Pillow·NumPy, PDF 도구에는 ReportLab·pypdf가 필요합니다. 포트폴리오 글꼴은 Windows 맑은 고딕을 사용합니다. 브라우저 검증 도구는 번들 Playwright와 Edge 경로를 사용합니다.

| 작업 | 도구와 입력 |
| --- | --- |
| 이지스 대표 아이콘 | `prepare-aegis-icon.py`: 비공개 승인 원본에서 512px 대표 이미지·32px 파비콘·180px 홈 화면 아이콘 인코딩 |
| 공개 Git 이미지 제외 검사 | `npm run check:public-assets` + 저장소의 `.githooks/`: 인덱스와 푸시할 새 커밋을 검사 |
| 공개 에셋 검사 | `npm run analyze:assets` → `lib/runtime-assets.mjs`: manifest의 동적 등록·화질과 HTML/CSS 참조까지 확인 |
| 배포 패키징 | `prepare-sites-build.mjs`: Worker·DB·hosting 계약 보존, 구형 공개 경로 방어 목록 적용 |
| 현행 전투 아틀라스 | `build-sprite-quality-assets.py` + `sprite-quality-recipes.json` + `sprite-source-layouts.json` |
| 저사양 이미지 | `build-performance-assets.py`: 현행 출력만 생성, 셀 단위 축소 |
| 원본 프레임 검사 | `test-sprite-source-layouts.py`, `audit-sprite-source-cuts.py` |
| 런타임 아틀라스 검사 | `audit-motion-atlases.py`, `verify-combat-sprites.mjs` |
| 애니메이션풍 일러스트·알파 | `prepare-anime-art.py`: 승인된 생성 이미지의 알파 정리와 런타임 출력 |
| Cubism 제작 입력·PSD | `prepare-anime-live2d.py`, `package-anime-live2d-psd.mjs`: `reference/source-assets/overload/live2d-production/anime-v2/` 소재 준비 |
| Cubism 모델·런타임 텍스처 | `author-anime-live2d.mjs`, `pack-anime-live2d-textures.mjs`: Editor 모델 편집과 런타임용 텍스처 패킹 |
| 신규 캐릭터 입력 정규화 | `build-nox-assets.py`, `build-vesper-assets.py`: 구형 보조 전투 출력은 reference 입력 영역에만 생성 |
| Cubism·터치 상호작용 검사 | `verify-anime-cubism.mjs`: 네 모델, 부위별 대사, 화면 배치와 모션 감소·대체 표시 검사 |
| UI·음악 회귀 검사 | `verify-skill-readiness.mjs`, `verify-music-continuity.mjs` |
| 방어 배경·구역 대체 배경 | `build-defense-battlefields.py`, `build-expedition-arenas.py` |
| 개별 소재 정규화 | `normalize-*`, `compose-*`, `extract-atlas-frame.py`, `process-character-chroma.py` 등: 명시한 입력·출력만 처리 |
| 본문 문서 PDF | `build-project-pdfs.py`: `docs/project/*.md` → `output/pdf/` |
| 채용 포트폴리오 PDF | `build-recruitment-portfolio.py` + `lib/portfolio_pdf.py`: `docs/project/media/recruitment/` 사용 |
| 콘텐츠 기획 지원용 PDF | `build-content-planner-portfolio.py`: `docs/project/media/content-planner/`의 당시 근거 사용 |
| 음성 생성 | `generate-google-agent-voice.mjs`: 현재 F/R 두 대사만 생성; 인증·과금 설정은 GOOGLE_TTS_SETUP.md 참조 |

현재 전투원 모델은 `anime-v2` 제작 소재를 기준으로 합니다. `build-runtime-portraits.py`, `operative_portrait_contract.py`, `verify-portrait-framing.mjs`, `verify-portrait-motion.mjs`, `verify-cubism-parts-v2.mjs`는 이전 일러스트·리깅의 재현 또는 검수 도구이므로 현재 모델에 그대로 적용하지 않습니다.

새로운 출력은 manifest와 레시피를 먼저 연결하고 에셋 검사를 통과시킵니다. 범용 정규화 도구가 출력한 실험 이미지는 승인 전 `public/`에 두지 않습니다. `production-asset-policy.mjs`의 구형 경로 목록은 예전 로컬 도구의 출력을 배포에서 막는 호환 방어 규칙입니다.
