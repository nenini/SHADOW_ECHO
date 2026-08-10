# NEXT STEPS

프로토타입의 **핵심 게임 기능은 모두 구현·검증 완료**되었습니다. 남은 것은
"온라인 배포 → 폴리시 → 제출물" 순서입니다.

## 현재 상태 (구현 완료)

- Phaser 3 + TypeScript + Vite, `npm run build` 성공(TS 오류 0)
- Pseudo-2.5D 벨트스크롤 (worldX/worldY/jumpZ, depth sorting, perspective, ground shadow)
- 이동/점프/대시/8방향
- 검 공격, Lost Pilgrim 적, HP/피격/넉백/사망, 2.5D 판정
- 잔영(Echo): 최근 ~3초 기록 + Q 재생(이동/점프/대시/공격/상호작용), 잔영 공격으로 적 타격
- Echo 레버 퍼즐 (혼자 실패 → 잔영으로 성공)
- Adaptive Shadow: PlayerProfile 6지표 → AGGRESSIVE/CAUTIOUS 분류 → 두 번째 전투
  마지막에 분류별 독립 지원(경직/시선끌기) + "이렇게 할 거였잖아."
- 스토리 엔딩: 마을 → 마라("네 그림자는 아니란다.") → 암전 →
  "잔영 보존 실험 37차 — 대상 HARIN" → TO BE CONTINUED

커밋: `git log --oneline` (8개, chore→feat 순)

---

## 1. 온라인 배포 (최우선) — GitHub + Pages

- [ ] GitHub에 저장소 생성 (이름 **`SHADOW_ECHO`** 권장 — `vite.config.ts`의 base와 일치)
- [ ] 로컬 remote 연결 + push (아래 명령)
- [ ] 저장소 **Settings → Pages → Source = GitHub Actions** 설정
- [ ] `main` push 시 `.github/workflows/deploy.yml`가 자동 빌드/배포
- [ ] 배포 URL 접속 확인: `https://<사용자명>.github.io/SHADOW_ECHO/`

```bash
git remote add origin https://github.com/<사용자명>/SHADOW_ECHO.git
git push -u origin main
```

> 저장소 이름을 다르게 하려면 `vite.config.ts`의 `repoName`을 바꾸거나
> 워크플로에 `VITE_BASE=/<repo>/`를 지정해야 Pages에서 에셋 경로가 맞습니다.

## 2. 폴리시

- [x] 사운드: 절차적 SFX(공격/피격/점프/대시/잔영/레버/문/사망/지원) — `systems/Sfx.ts`, 외부 에셋 없음
- [~] VFX: 대시 퍼프·히트 파티클·슬래시·잔영 펄스 (추가 보강 여지: 잔영 잔상, 마을 안개)
- [ ] 배경 앰비언스/음악 (선택)
- [x] **아트 교체(자체 픽셀아트)** — 하린(여성 검사)/잔영(다크+금빛 rim)/순례자(후드+랜턴+붉은 눈)
      도트, 숲 바닥+풀/돌 장식, 달/마른 나무/백색 성당 배경. 단순 도형 캐릭터 제거 완료.
      (외부 에셋 통합은 환경 제약으로 불가 → 자체 제작, `ASSET_LICENSES.md` 기록)
      · 남은 여지: 실제 걷기/공격 프레임 애니메이션, 레버/문 텍스처 디테일
- [ ] 버그 수정 / 밸런스 튜닝

## 3. 제출물 (`SUBMISSION_CHECKLIST.md` 참조)

- [ ] 플레이 영상 30~60초 (이동/전투/잔영/퍼즐/그림자 선제 행동)
- [ ] 게임 소개 PDF (제목/한줄소개/목표/조작/종료조건/실행방법/플레이 URL/영상 URL)
- [ ] AI 활용 기술 PDF (ChatGPT·Claude Code 내역, 주요 프롬프트, Shadow Agent 입력지표·판단·행동)
- [ ] 최종 링크 점검, API Key/민감정보 없음 확인

---

## 조작 요약

`A/D·←/→` 좌우 · `W/S·↑/↓` 앞뒤 · `Space` 점프 · `Shift` 대시 · `J` 공격 ·
`E` 상호작용 · `Q` 잔영 · `R` (엔딩) 다시 시작
