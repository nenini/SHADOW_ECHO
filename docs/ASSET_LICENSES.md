# ASSET LICENSES

이 프로젝트의 모든 시각/음향 에셋은 **외부 에셋 없이 코드로 절차적으로 생성**됩니다.
따라서 제3자 라이선스가 없으며, 전부 프로젝트 자체 소유입니다. 외부 무료 픽셀아트
에셋 통합을 우선 검토했으나, 개발 환경에서 외부 바이너리 에셋을 안전하게 내려받아
라이선스를 검증·기록할 수단이 없어(라이선스 불명확 에셋 금지 원칙) 자체 픽셀아트로
대체했습니다.

| Asset Name | Author | Source URL | License | Used For | Modification |
|---|---|---|---|---|---|
| 캐릭터 픽셀아트 (하린/잔영/길 잃은 순례자) | 자체 제작 (Claude Code) | `src/game/systems/PixelArt.ts` | 프로젝트 자체 소유 | 플레이어·Echo·적 스프라이트 | 손으로 도트 그리드 작성, 코드 생성 |
| 환경 텍스처 (숲 바닥/풀/돌) | 자체 제작 (Claude Code) | `src/game/scenes/BootScene.ts` | 프로젝트 자체 소유 | 바닥 타일·장식 | 절차적 Graphics 생성 |
| 배경 (달·숲 실루엣·마른 나무·백색 성당·안개) | 자체 제작 (Claude Code) | `src/game/scenes/GameScene.ts` | 프로젝트 자체 소유 | 다층 Parallax 배경 | 절차적 Graphics 생성 |
| 오브젝트 (레버/문/마라/슬래시 VFX) | 자체 제작 (Claude Code) | `src/game/entities/*`, `BootScene.ts` | 프로젝트 자체 소유 | 퍼즐·NPC·이펙트 | 절차적 생성 |
| 효과음 (SFX) | 자체 제작 (Claude Code) | `src/game/systems/Sfx.ts` | 프로젝트 자체 소유 | 점프/대시/공격/피격/잔영/레버·문 등 | Web Audio 합성(외부 오디오 파일 미사용) |

> 이후 외부 에셋을 추가할 경우, 위 표에
> Asset Name / Author / Source URL / License / Used For / Modification 형식으로 즉시 기록한다.
