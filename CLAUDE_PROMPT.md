# Claude Code 최초 프롬프트

현재 작업할 프로젝트는 6시간 안에 완성해야 하는 2D 웹 액션 프로토타입이다.

프로젝트 가제는 "그림자가 걷는 밤"이다.

## 기술 스택

아래로 고정한다.

- Phaser 3
- TypeScript
- Vite
- npm
- GitHub Pages
- GitHub Actions

Unity, React, Next.js, 별도 백엔드 프레임워크는 사용하지 않는다.

## 가장 먼저 할 일

현재 폴더를 새 프로젝트 루트로 사용하라.

먼저 `docs/STORY.md`와 `docs/PROJECT_PLAN.md`를 읽고 전체 방향과 6시간 범위를 이해하라.

프로젝트 구조를 다음처럼 만든다.

```text
src/
  game/
    scenes/
    entities/
    systems/
    ui/
  styles/
public/
  assets/
    characters/
    enemies/
    environment/
    ui/
    audio/
    effects/
docs/
.github/
  workflows/
```

## 이번 첫 작업 범위

아직 전체 게임을 만들지 않는다.

이번 실행에서는 아래까지만 실제 구현한다.

1. Phaser + TypeScript + Vite 프로젝트 초기화
2. 위 폴더 구조 생성
3. 기본 게임 화면
4. 테스트용 바닥
5. Player 좌우 이동
6. 점프
7. 대시
8. 카메라 추적
9. GitHub Pages용 build 설정
10. README 작성
11. docs 파일 유지
12. 정상 실행 확인

조작:
- A/D 또는 방향키: 이동
- Space: 점프
- Shift: 대시

## 전체 게임에서 이후 구현할 핵심

### 잔영

최근 약 3초 동안 플레이어의 다음 행동을 기록한다.

- 위치
- 이동 방향
- 점프
- 대시
- 공격

Q 입력 시 Shadow가 시간 순서대로 재현한다.

Shadow가 재생 중인 동안 Player는 자유롭게 움직인다.

### Adaptive Shadow

다음을 수집한다.

- attackCount
- dashCount
- jumpCount
- damageTaken
- echoUseCount
- averageEnemyDistance

최소 두 스타일을 실제 데이터로 구분한다.

AGGRESSIVE:
- 공격 빈도가 높고 적과의 평균 거리가 가까움

CAUTIOUS:
- 적과 거리를 유지하고 피격이 적음

두 번째 전투 마지막에 Shadow가 실제 분류 결과에 따라 독립적으로 한 번 지원 행동을 한다.

AGGRESSIVE:
- 먼저 적을 경직시켜 플레이어의 진입 기회 생성

CAUTIOUS:
- 먼저 적의 시선을 끌어 플레이어의 공격 기회 생성

이후 Shadow 대사:

"이렇게 할 거였잖아."

단순 고정 연출이 아니라 실제 플레이 로그에 따라 동작이 달라져야 한다.

## 스토리 Vertical Slice

```text
숲에서 깨어남
→ 그림자 등장
→ 첫 전투
→ 잔영 능력 획득
→ 레버 퍼즐
→ 두 번째 전투
→ 그림자의 선제 행동
→ "이렇게 할 거였잖아."
→ 마을 입구
→ 마라: "네 그림자는 아니란다."
→ "잔영 보존 실험 37차 — 대상 HARIN"
→ TO BE CONTINUED
```

## 아트 방향

- Dark Fairy Tale
- Dark Fantasy
- Pixel Art 또는 저해상도 2D
- 검정
- 짙은 남색
- 회갈색
- 탁한 녹색
- 위험 요소는 붉은색
- 잔영은 창백한 흰색 또는 옅은 금색

금지:
- 네온 도시
- 홀로그램 UI
- 기계 연구소
- 청록색 네온
- 미래형 총기
- 사이버펑크 배경

배경:
- 어두운 숲
- 버려진 마을
- 돌 구조물
- 나무뿌리
- 안개
- 달빛

## 외부 에셋

외부 에셋이 추가되면 `docs/ASSET_LICENSES.md`에 즉시 기록한다.

- Asset Name
- Author
- Source URL
- License
- Used For
- Modification

임시 도형은 기능 테스트용으로만 허용한다.
최종 제출 화면에는 기본 사각형/원형 캐릭터를 남기지 않는다.

## 개발 원칙

1. 계획만 작성하지 말고 실제 코드를 작성한다.
2. 항상 실행 가능한 상태를 유지한다.
3. 큰 단계마다 Git commit을 남긴다.
4. 오류가 있는 상태에서 다음 단계로 넘어가지 않는다.
5. 핵심 기능을 먼저 만들고 장식은 마지막에 한다.
6. 6시간 범위를 넘는 기능을 임의로 추가하지 않는다.
7. 개발 중 AI 활용 내역을 `docs/AI_USAGE_LOG.md`에 기록한다.

## 권장 커밋

1. chore: initialize phaser vite project
2. feat: add player movement and camera
3. feat: add combat and enemy
4. feat: add shadow action recorder and playback
5. feat: add echo lever puzzle
6. feat: add adaptive shadow behavior
7. feat: add story sequence and ending
8. chore: configure github pages deployment
9. polish: add vfx audio and final fixes

## GitHub Pages

가능한 빨리 GitHub Actions 배포를 구성한다.

Vite `base` 설정이 저장소 이름에 맞도록 구성한다.

처음에는 빈 게임이어도 `npm run build`가 성공하고 GitHub Pages에서 열릴 수 있는 구조를 만든다.

## 완료 후 보고

1. 생성/수정한 파일
2. 실행 명령
3. 브라우저에서 확인하는 방법
4. 현재 구현 기능
5. GitHub Pages 배포 전 필요한 작업
6. 다음 단계
