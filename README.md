# 그림자가 걷는 밤 · Shadow Echo

그림자를 잃은 채 폐허가 된 밤에서 깨어난 **하린**이, 자신을 따라 하는 정체불명의
그림자와 함께 백색 성당을 향하는 2D 사이드뷰 액션 어드벤처 프로토타입.

핵심 기믹은 **잔영(Echo)** — 플레이어의 최근 행동을 그림자가 재현하고, 이후
플레이 스타일을 학습해 스스로 움직이기 시작한다.

> 6시간 웹 액션 프로토타입 · Phaser 3 + TypeScript + Vite

---

## 기술 스택

- [Phaser 3](https://phaser.io/) — 게임 엔진
- TypeScript
- Vite — 개발 서버 / 번들러
- GitHub Pages + GitHub Actions — 배포

## 실행 방법

Node.js 18 이상이 필요합니다.

```bash
npm install
npm run dev
```

개발 서버가 뜨면 브라우저에서 자동으로 열립니다 (기본 http://localhost:5173).

프로덕션 빌드:

```bash
npm run build      # tsc 타입체크 + vite 빌드 -> dist/
npm run preview    # 빌드 결과 로컬 미리보기
```

## 조작

| 키 | 동작 |
|---|---|
| `A` / `D` 또는 `←` / `→` | 좌우 이동 |
| `W` / `S` 또는 `↑` / `↓` | 앞뒤 이동 (바닥 평면 depth) |
| `Space` | 점프 |
| `Shift` | 대시 (8방향) |
| `J` | 공격 |

## 현재 구현 범위

**Pseudo-2.5D 벨트스크롤 기반**
- 좌표 모델: `(worldX, worldY)` = 바닥 평면, `jumpZ` = 가상 점프 높이 (전역 중력 없음)
- 8방향 이동(대각선 normalize) + 제한된 belt 전투 공간(worldY 앞뒤 범위)
- 수동 Z축 점프(코요테/버퍼/가변 높이) — 점프해도 worldY·depth 불변
- 바닥 그림자(점프 시 축소·투명), worldY 기반 perspective scaling
- worldY 기반 동적 depth sorting (아래쪽이 앞)

**전투 (2.5D 대응)**
- 검 공격(J): X 범위 + worldY depth 허용치 + 점프 높이 조건 판정, 스윙당 1회
- 길 잃은 순례자: 평면 배회 → 감지 시 X/Y 추적 → 근접 공격(텔레그래프)
- 플레이어 HP·i-frame·2D 넉백, 적 HP·넉백·사망
- 히트 파티클/슬래시 VFX/화면 흔들림, HP UI

**잔영 (Echo)**
- 최근 ~3초 행동을 프레임 단위로 기록(worldX/worldY/jumpZ/facing/dash/attack)
- `Q` 입력 시 Shadow(잔영)가 기록된 위치·높이·공격을 시간순으로 재현
- 재현 중에도 플레이어는 자유롭게 이동; Shadow의 공격도 적에게 적중(협공)
- 창백한 금빛 잔영 톤, 재현 종료 시 사라짐

**Echo 레버 퍼즐**
- `E` 상호작용(누른 순간 1회) — 공통 `InteractionSystem`으로 Player/Shadow 동일 처리
- Lever(작동 시 Door 열림) + Door(2~3초 후 자동 닫힘, 닫히면 통과 불가)
- 혼자서는 조금 늦게 도착해 실패 → `Q`로 Shadow가 과거의 레버 작동을 재현해 성공
- Shadow의 레버 작동은 고정 연출이 아니라 실제 기록→재생 결과

**Adaptive Shadow (적응형 그림자)**
- 실제 플레이 로그 수집: 공격/대시/점프 횟수, 피격량, 잔영 사용, 적과의 평균 거리
- 스타일 분류: **AGGRESSIVE**(근접·공격적) / **CAUTIOUS**(거리 유지·피격 적음)
- 두 번째 전투(관문 너머)의 마지막 적에서 그림자가 **분류 결과에 따라 독립 지원 1회**
  - AGGRESSIVE → 적을 **경직**시켜 진입 기회 생성
  - CAUTIOUS → 적의 **시선을 끌어** 공격 기회 생성
- 이후 그림자 대사: "이렇게 할 거였잖아." (고정 연출이 아니라 실제 로그로 분기)

**스토리 (Vertical Slice 엔딩)**
- 마을 입구 도달 시 컷신 진입(게임플레이 정지) + 마라 NPC 대사
- "네 그림자는 아니란다." 포함 대사(Space/E/J로 진행)
- 암전 → "잔영 보존 실험 37차 — 대상 HARIN" → "TO BE CONTINUED" (R로 다시 시작)

**기반**
- Phaser + TypeScript + Vite, 카메라 추적, 다층 Parallax 배경
- GitHub Pages 빌드/배포 설정 (`.github/workflows/deploy.yml`)

모든 아트/효과음은 **외부 에셋 없이 코드로 생성한 자체 픽셀아트/사운드**입니다
(하린·잔영·순례자 도트, 숲 바닥/장식, 달·마른 나무·백색 성당 배경, Web Audio SFX).
자세한 출처/라이선스는 [`docs/ASSET_LICENSES.md`](docs/ASSET_LICENSES.md) 참고.

> 여기까지가 6시간 프로토타입의 스토리 Vertical Slice입니다:
> 숲에서 깨어남 → 첫 전투 → 잔영 획득 → 레버 퍼즐 → 두 번째 전투 →
> 그림자의 선제 행동("이렇게 할 거였잖아.") → 마을 입구(마라) → 암전 →
> "잔영 보존 실험 37차 — 대상 HARIN" → TO BE CONTINUED

## 이후 구현 예정

- 사운드 / 최종 픽셀아트 에셋 교체(임시 도형 제거) / GitHub Pages 온라인 배포

전체 방향은 [`docs/STORY.md`](docs/STORY.md), 범위는 [`docs/PROJECT_PLAN.md`](docs/PROJECT_PLAN.md) 참고.

## 프로젝트 구조

```text
src/
  main.ts              # Phaser 부트스트랩
  game/
    config.ts          # 게임 설정 · 팔레트 · 좌표/물리/전투 상수
    scenes/            # BootScene, GameScene
    entities/          # Player, Enemy, Shadow, Lever, Door, Mara
    systems/           # space, ActionRecorder, InteractionSystem, PlayerProfile
    ui/                # Dialogue
  styles/
public/assets/         # characters / enemies / environment / ui / audio / effects
docs/                  # STORY, PROJECT_PLAN, AI_USAGE_LOG, ASSET_LICENSES 등
.github/workflows/     # GitHub Pages 배포
```

## GitHub Pages 배포

1. 이 프로젝트를 GitHub 저장소에 푸시합니다 (`main` 브랜치).
2. 저장소 **Settings → Pages → Build and deployment → Source** 를 **GitHub Actions** 로 설정합니다.
3. `main` 에 푸시하면 [`deploy.yml`](.github/workflows/deploy.yml) 워크플로가 자동으로 빌드/배포합니다.
4. 배포 URL: `https://<사용자명>.github.io/SHADOW_ECHO/`

> Vite `base` 는 저장소 이름(`SHADOW_ECHO`)에 맞춰져 있습니다
> ([`vite.config.ts`](vite.config.ts)). 저장소 이름이 다르면 `VITE_BASE`
> 환경변수로 재정의하거나 `vite.config.ts` 의 `repoName` 을 수정하세요.

## 라이선스 / AI 활용

- 외부 에셋: [`docs/ASSET_LICENSES.md`](docs/ASSET_LICENSES.md)
- AI 활용 내역: [`docs/AI_USAGE_LOG.md`](docs/AI_USAGE_LOG.md)
