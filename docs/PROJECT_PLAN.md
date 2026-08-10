# PROJECT PLAN

## 기술 선택

이번 6시간 프로토타입은 다음으로 고정한다.

- Phaser 3
- TypeScript
- Vite
- HTML5 Canvas
- npm
- GitHub
- GitHub Pages
- GitHub Actions

Unity 프로젝트는 이번 제출 저장소에 포함하지 않는다.

개발 보조 AI:
- Claude Code: 코드 작성, 리팩터링, 버그 수정, 배포 설정
- ChatGPT: 게임 기획, 스토리, AI 구조, 제출 문서 초안

게임 내부 AI 1차:
- 플레이 로그 기반 적응형 Shadow Agent
- 공격 빈도, 대시 빈도, 점프 빈도, 피격 횟수, 적과의 거리, 잔영 사용 빈도 수집
- 최소 AGGRESSIVE / CAUTIOUS 2개 플레이 스타일 분류
- 두 번째 전투에서 플레이 스타일에 따라 그림자의 선제 지원 행동 변경

외부 LLM은 핵심 게임이 완성된 뒤 선택적으로 추가한다.
GitHub Pages 클라이언트 안에 API 키를 넣지 않는다.

## 권장 저장소 구조

```text
SHADOW_ECHO/
├── src/
│   ├── main.ts
│   ├── game/
│   │   ├── config.ts
│   │   ├── scenes/
│   │   ├── entities/
│   │   ├── systems/
│   │   └── ui/
│   └── styles/
├── public/
│   └── assets/
│       ├── characters/
│       ├── enemies/
│       ├── environment/
│       ├── ui/
│       ├── audio/
│       └── effects/
├── docs/
│   ├── STORY.md
│   ├── GAME_CONCEPT.md
│   ├── AI_TECH.md
│   ├── ASSET_LICENSES.md
│   ├── AI_USAGE_LOG.md
│   └── SUBMISSION_CHECKLIST.md
├── .github/
│   └── workflows/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── README.md
└── .gitignore
```

## 6시간 순서

### 0:00~0:30
- 저장소 초기화
- Phaser + TypeScript + Vite
- Git 초기 커밋
- GitHub Pages 배포 파이프라인 먼저 구성

### 0:30~1:30
- 캐릭터 이동
- 점프
- 대시
- 충돌
- 카메라
- 첫 배경

### 1:30~2:30
- 검 공격
- 적 1종
- HP
- 피격
- 넉백
- 타격 이펙트

### 2:30~3:30
- 최근 3초 행동 기록
- Q로 Shadow Playback
- 이동, 점프, 대시, 공격 재생
- 금빛/백색 잔상

### 3:30~4:15
- 레버 + 문 퍼즐
- Shadow가 레버 행동 재현
- Player가 문 통과

### 4:15~5:00
- 두 번째 전투
- PlayerProfile 수집
- AGGRESSIVE / CAUTIOUS 분류
- 그림자의 독립 지원 행동
- "이렇게 할 거였잖아." 연출

### 5:00~5:30
- 마을 입구
- 마라 NPC
- "네 그림자는 아니란다."
- "잔영 보존 실험 37차 — 대상 HARIN"
- TO BE CONTINUED

### 5:30~6:00
- 버그 수정
- 사운드
- VFX
- GitHub Pages 최종 배포
- 영상 녹화 동선 확인

## 이번 프로토타입에서 제외

- 보스
- 백색 성당 전체
- 엔딩 분기
- 인벤토리
- 스킬 트리
- 여러 적 타입
- 저장 시스템
- 멀티플레이
- 복잡한 메뉴

## 제출을 위해 개발 중 반드시 기록

- Claude Code 프롬프트
- ChatGPT 활용 내역
- AI가 생성한 코드와 직접 수정한 부분
- 외부 에셋 URL
- 라이선스
- 게임 내부 Shadow Agent의 입력, 판단, 행동 구조
