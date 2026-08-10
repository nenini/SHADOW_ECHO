# AI_USAGE_LOG

| 날짜/시간 | 도구 | 목적 | 주요 프롬프트 요약 | 결과 | 직접 수정 내용 |
|---|---|---|---|---|---|
| | ChatGPT | 기획/스토리 | | | |
| 2026-08-10 | Claude Code | 프로젝트 초기화 | `CLAUDE_PROMPT.md`를 첫 프롬프트로 사용. Phaser 3 + TS + Vite 프로젝트 초기화, 폴더 구조 생성, 기본 게임 화면/바닥/플레이어 이동·점프·대시, 카메라 추적, GitHub Pages 배포 설정, README 작성 요청 | package.json, tsconfig, vite.config, index.html, src/main.ts, config.ts, BootScene, GameScene, Player, deploy.yml, README 생성. winget으로 Node.js LTS 설치 후 npm install/build 검증 | (초안 그대로 사용, 검증 후 필요 시 수정 예정) |
| 2026-08-10 | Claude Code | 플레이어 이동 | 점프 시 블럭 위로 안 올라가는 문제 수정 요청 | 점프 높이 상향(-660, apex ~155px), 원웨이 플랫폼(아래→위 통과 후 착지), 코요테 타임·점프 버퍼·가변 점프 높이 추가, 플랫폼 계단형 재배치 | 브라우저에서 p1/p2/p3 착지 검증 |
| 2026-08-10 | Claude Code | 전투 | 검 공격/적 1종/HP/피격/넉백/타격 이펙트 구현 | J 공격(사각 히트박스, 스윙당 1회 판정), 길 잃은 순례자(패트롤+HP 3), 플레이어 HP 5+무적시간, 넉백, 히트 파티클/슬래시 VFX/화면 흔들림, HP UI. 절차적 텍스처 사용(외부 에셋 0) | HP 3→2→1→사망, 접촉 피해 5→4(무적 중 중복 피해 없음), 패트롤 이동 검증 |
| | Claude Code | 잔영 시스템 | | | |
| | Claude Code | 적응형 Shadow | | | |
| | Claude Code | GitHub Pages | | | |

## 기록 원칙

- 중요한 프롬프트는 원문 보관
- 생성 코드를 그대로 사용했는지 수정했는지 기록
- 버그 해결 과정 기록
- 외부 에셋 선정에 AI를 사용했다면 함께 기록
