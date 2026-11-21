---
description: React 섬에서 쓰는 hook 가이드라인
paths: ["src/shared/hooks/**/*.ts"]
---

# react hook 가이드라인

## 개요

React 섬(`index.tsx` + `client:*`) 안에서 쓰는 훅의 가이드라인. `.astro` 컴포넌트에는 훅이 없음.

## 핵심 개념

`shared/hooks`의 커스텀 훅은 도메인 로직을 다루는 훅(domain 훅)과 다루지 않는 훅(common 훅)으로 나뉨.

e.g.

- usePrefersReducedMotion, useAnimationFrame → common 훅
- usePlaybackProgress(데모 공통 재생 상태) → domain 훅 (`demo` 도메인)

단, 특정 컴포넌트와 강결합된 훅은 `shared/hooks`에 두지 않고 해당 컴포넌트 폴더의 `model`에 코로케이션 (예: `RenderingPipelineDemo/model/useRenderingPipeline.ts`). **훅의 위치는 사용 횟수("지금은 여기서만 쓴다")가 아니라 컴포넌트와의 강결합 여부로 판단**하며, 세부 기준은 `project-structure` 스킬의 「코드를 shared로 내리는 기준」 참고. 덕분에 재사용 가능한 훅을 찾을 때는 `shared/hooks`만 확인하면 됨.

데모가 여러 개 생겨 재생 · 처음으로 · 슬라이더 상태가 겹치면, 그 부분을 `shared/hooks/domain/demo/`로 내림.

## 훅 파일 구조

모든 훅은 index.ts 파일로 작성.
훅 이름과 동일한 디렉토리를 만들고, 그 안에 index.ts 파일을 작성하는 형태.

## domain 훅

도메인 로직을 다루되 특정 컴포넌트에 강결합되지 않은 훅은 domain 훅으로 분류.

domain 훅은 common 훅에 도메인만 붙인 형태.

domain 훅은 `src/shared/hooks/domain/` 디렉토리에 **도메인별 디렉토리로 묶어서** 작성.

e.g.

- src/shared/hooks/common/useAnimationFrame/index.ts
- src/shared/hooks/domain/demo/usePlaybackProgress/index.ts

## checklist

- [ ] 커스텀 훅은 index.ts 파일로 작성
- [ ] 훅 이름과 동일한 디렉토리를 만들고 그 안에 index.ts를 작성
- [ ] 도메인 로직을 다루면 domain 훅, 아니면 common 훅으로 분류
- [ ] domain 훅은 `src/shared/hooks/domain/`에 도메인별 디렉토리로 묶어서 작성
- [ ] 특정 컴포넌트와 강결합된 훅은 `shared/hooks`가 아니라 해당 컴포넌트 폴더의 `model`에 코로케이션
- [ ] 객체를 반환함 (배열 X)
