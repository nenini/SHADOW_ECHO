# AI_USAGE_LOG

| 날짜/시간 | 도구 | 목적 | 주요 프롬프트 요약 | 결과 | 직접 수정 내용 |
|---|---|---|---|---|---|
| | ChatGPT | 기획/스토리 | | | |
| 2026-08-10 | Claude Code | 프로젝트 초기화 | `CLAUDE_PROMPT.md`를 첫 프롬프트로 사용. Phaser 3 + TS + Vite 프로젝트 초기화, 폴더 구조 생성, 기본 게임 화면/바닥/플레이어 이동·점프·대시, 카메라 추적, GitHub Pages 배포 설정, README 작성 요청 | package.json, tsconfig, vite.config, index.html, src/main.ts, config.ts, BootScene, GameScene, Player, deploy.yml, README 생성. winget으로 Node.js LTS 설치 후 npm install/build 검증 | (초안 그대로 사용, 검증 후 필요 시 수정 예정) |
| | Claude Code | 플레이어 이동 | | | |
| | Claude Code | 전투 | | | |
| | Claude Code | 잔영 시스템 | | | |
| | Claude Code | 적응형 Shadow | | | |
| | Claude Code | GitHub Pages | | | |

## 기록 원칙

- 중요한 프롬프트는 원문 보관
- 생성 코드를 그대로 사용했는지 수정했는지 기록
- 버그 해결 과정 기록
- 외부 에셋 선정에 AI를 사용했다면 함께 기록
