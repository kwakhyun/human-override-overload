# Windows Codex 시작 절차

## 1. 압축 해제

ZIP을 영문 경로에 푸는 것을 권장합니다.

예시:

```text
C:\CodexProjects\NAN2026-Handoff\
```

Codex Desktop에서 다음 폴더를 프로젝트로 엽니다.

```text
C:\CodexProjects\NAN2026-Handoff\PROJECT\NAN2026
```

## 2. 필요한 프로그램

- Git for Windows
- Node.js 20 LTS 이상
- npm
- Codex Desktop

PowerShell에서 확인:

```powershell
git --version
node --version
npm --version
```

## 3. 의존성 복원 및 검증

```powershell
cd .\PROJECT\NAN2026\game
npm ci
npm test
npm run build
npm run test:sites
```

예상 결과:

- 전체 테스트 101개 통과
- Sites 테스트 4개 통과
- `dist\client\index.html` 생성
- `dist\server\index.js` 생성
- `dist\.openai\hosting.json` 생성

## 4. 로컬 실행

```powershell
npm run dev
```

Vite가 출력한 Local URL을 Codex 브라우저에서 열어 확인합니다. 검증이 끝나면 터미널에서
`Ctrl+C`로 서버를 종료합니다.

## 5. Git 확인

```powershell
cd .\PROJECT\NAN2026
git status
git log --oneline -8
```

압축본은 `.git`을 포함하므로 별도 clone 없이 이력과 현재 커밋을 그대로 사용할 수 있습니다.
최초 상태에서 `git status`는 clean이어야 합니다.

## 6. Sites 배포

기존 공개 주소는 다음과 같습니다.

https://train-me-wrong-nan2026.khyun97.chatgpt.site

새 버전을 공개할 때는 사용자가 명시적으로 `Sites 공개 배포 진행`이라고 요청한 경우에만
`sites:sites-building`과 `sites:sites-hosting` 절차를 사용합니다. 로컬 변경만으로 자동 배포하지
마세요.

## Windows 관련 주의점

- 경로 구분자는 PowerShell에서 `\`를 사용합니다.
- 이미지와 BGM 파일명을 임의 변환하거나 재압축하지 마세요.
- 줄바꿈 자동 변환으로 스냅샷이 바뀌지 않도록 대량 포맷팅을 피하세요.
- `node_modules`는 macOS 사본을 사용하지 말고 반드시 Windows에서 새로 설치하세요.
- GPU가 약한 PC에서는 브라우저 탭을 여러 개 동시에 실행하지 마세요. 품질 governor가 자동으로
  `BALANCED` 또는 `PERFORMANCE`로 내려갑니다.
