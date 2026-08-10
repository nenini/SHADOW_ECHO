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
| `Space` | 점프 |
| `Shift` | 대시 |

## 현재 구현 범위 (1차)

- Phaser + TypeScript + Vite 프로젝트 초기화
- 프로젝트 폴더 구조
- 다크 페어리테일 톤의 기본 게임 화면 (달빛/숲 실루엣/안개)
- 테스트용 바닥 + 점프/대시 확인용 플랫폼
- 플레이어(하린) 좌우 이동 / 점프 / 대시
- 카메라 추적
- GitHub Pages 빌드/배포 설정 (`.github/workflows/deploy.yml`)

플레이어와 지형은 코드로 생성한 임시 플레이스홀더 텍스처입니다. 최종 제출 전에
픽셀아트 에셋으로 교체하며, 외부 에셋은 [`docs/ASSET_LICENSES.md`](docs/ASSET_LICENSES.md)에 기록합니다.

## 이후 구현 예정

- 검 공격 / 적(길 잃은 순례자) / HP·피격·넉백
- 잔영(Echo) 기록·재생 시스템 (Q)
- 레버 퍼즐
- 두 번째 전투 + Adaptive Shadow (AGGRESSIVE / CAUTIOUS 분류에 따른 선제 지원 행동)
- 스토리 시퀀스 및 "이렇게 할 거였잖아." → 마을 → TO BE CONTINUED

전체 방향은 [`docs/STORY.md`](docs/STORY.md), 범위는 [`docs/PROJECT_PLAN.md`](docs/PROJECT_PLAN.md) 참고.

## 프로젝트 구조

```text
src/
  main.ts              # Phaser 부트스트랩
  game/
    config.ts          # 게임 설정 · 팔레트 · 튜닝 상수
    scenes/            # BootScene, GameScene
    entities/          # Player
    systems/           # (예정) Echo 기록/재생, Adaptive Shadow
    ui/                # (예정) HUD, 대사창
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
