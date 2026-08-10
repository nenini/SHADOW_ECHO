# AI_USAGE_LOG

| 날짜/시간 | 도구 | 목적 | 주요 프롬프트 요약 | 결과 | 직접 수정 내용 |
|---|---|---|---|---|---|
| | ChatGPT | 기획/스토리 | | | |
| 2026-08-10 | Claude Code | 프로젝트 초기화 | `CLAUDE_PROMPT.md`를 첫 프롬프트로 사용. Phaser 3 + TS + Vite 프로젝트 초기화, 폴더 구조 생성, 기본 게임 화면/바닥/플레이어 이동·점프·대시, 카메라 추적, GitHub Pages 배포 설정, README 작성 요청 | package.json, tsconfig, vite.config, index.html, src/main.ts, config.ts, BootScene, GameScene, Player, deploy.yml, README 생성. winget으로 Node.js LTS 설치 후 npm install/build 검증 | (초안 그대로 사용, 검증 후 필요 시 수정 예정) |
| 2026-08-10 | Claude Code | 플레이어 이동 | 점프 시 블럭 위로 안 올라가는 문제 수정 요청 | 점프 높이 상향(-660, apex ~155px), 원웨이 플랫폼(아래→위 통과 후 착지), 코요테 타임·점프 버퍼·가변 점프 높이 추가, 플랫폼 계단형 재배치 | 브라우저에서 p1/p2/p3 착지 검증 |
| 2026-08-10 | Claude Code | 전투 | 검 공격/적 1종/HP/피격/넉백/타격 이펙트 구현 | J 공격(사각 히트박스, 스윙당 1회 판정), 길 잃은 순례자(패트롤+HP 3), 플레이어 HP 5+무적시간, 넉백, 히트 파티클/슬래시 VFX/화면 흔들림, HP UI. 절차적 텍스처 사용(외부 에셋 0) | HP 3→2→1→사망, 접촉 피해 5→4(무적 중 중복 피해 없음), 패트롤 이동 검증 |
| 2026-08-10 | Claude Code | Pseudo-2.5D 전환 | 기존 코드베이스 유지하며 사이드뷰→2.5D 벨트스크롤로 전환(Shadow/AI/스토리 제외). 좌표 모델(worldX/worldY/jumpZ), Container 기반 Player/Enemy, 바닥 그림자, depth sorting, perspective, 2.5D 전투/적 요구 | config 재정의(전역 중력 제거)·systems/space.ts 신설·Player/Enemy Container 재작성·GameScene 평면 바닥/수동 update/2.5D 검격. 브라우저 검증: 8방향+normalize, jumpZ(worldY불변), 그림자, perspective 0.90~1.05, depth 정렬, same-depth 히트/다른-depth 미스, 적 추적, 넉백/사망 | 검증 아티팩트(경계 클램프·가변점프컷·tween 수동스텝) 원인 규명 후 확인 |
| 2026-08-10 | Claude Code | 잔영 시스템 | 최근 ~3초 행동 기록 + Q로 Shadow 재현 구현(Adaptive는 이후). Shadow 공격도 적에 적용 | systems/ActionRecorder.ts(링버퍼)·entities/Shadow.ts(Container 재생)·Player.getState에 attackActive 추가·Enemy 히트 dedupe를 공격자별 맵으로·GameScene 기록/Q재생/공용 applyAttack. 검증: 기록(900→958) 재현, Q 후 Shadow 표시·궤적 일치, Shadow 공격이 적 HP 3→2, 재생 종료 시 숨김 | 검증 아티팩트(첫 프레임 transient) 회피 위해 active 필터 후 재실행 |
| 2026-08-10 | Claude Code | Echo 레버 퍼즐 | Echo interaction recording / Shadow interaction replay / Lever·Door 퍼즐 구현(고정 연출 아닌 실제 record→replay 결과). Adaptive/스토리 제외 | ActionFrame에 interact(1회성) 추가·Player E키(JustDown)·systems/InteractionSystem(Interactable)·entities/Lever·Door·Shadow.onInteract·GameScene 퍼즐/블로킹/힌트/완료. 검증: E 범위/깊이/1회성, 문 자동닫힘, 문 닫힌 상태에서 Q→Shadow가 레버(x=1300) 도달 시 문 열림→플레이어 통과→완료, 기존 전투/이동 정상 | 힌트 상태머신·솔로 실패(~0.5초) 튜닝, 검증 시 도어 잔류개방 confound 제거 후 재확인 |
| | Claude Code | 적응형 Shadow | | | |
| | Claude Code | GitHub Pages | | | |

## 기록 원칙

- 중요한 프롬프트는 원문 보관
- 생성 코드를 그대로 사용했는지 수정했는지 기록
- 버그 해결 과정 기록
- 외부 에셋 선정에 AI를 사용했다면 함께 기록
