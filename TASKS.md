# TASKS.md — Project Backlog & Status

## Active Sprint: MVP Release

| Task ID | Priority | Status | Description | Acceptance Criteria |
|---------|----------|--------|-------------|---------------------|
| TASK-001 | P0 | DONE | Workspace inspection & dependency installation | Bun, Vite, React 18, Phaser 3 installed & operational. |
| TASK-002 | P0 | DONE | Project memory files & architecture docs | AGENTS, PROJECT, DECISIONS, TASKS, LEARNINGS, RESEARCH, docs created. |
| TASK-003 | P0 | DONE | Core game logic & Solvability Solver | Pure TS engine with grid, dog models, collision check, move validation, BFS solver. |
| TASK-004 | P0 | DONE | 10+ Handcrafted Solvable Levels | 12 handcrafted levels with progression, 100% validated by automated BFS tests. |
| TASK-005 | P0 | DONE | Web Audio Synthesizer (Barks, Slides, Win) | Procedural sound engine with toggle & mute persistence via localStorage. |
| TASK-006 | P0 | DONE | Phaser 3 Game Scenes & Visual Polish | Original procedural dog sprites, smooth slide tweens, celebration particles. |
| TASK-007 | P0 | DONE | React Game Shell & Responsive Layout | Game container, level indicator, moves/target counter, restart, undo, level select modal. |
| TASK-008 | P0 | DONE | Portal Architecture & Multi-Game Registry | Home page (`/`), Game page (`/games/dog-parking/`), 404 page, game registry. |
| TASK-009 | P0 | DONE | Technical SEO & Performance | Code-split bundles, OpenGraph, Twitter Cards, robots.txt, sitemap.xml, semantic markup. |
| TASK-010 | P1 | DONE | Analytics Abstraction & Ad Placement Points | Provider-agnostic event dispatcher (`game_loaded`, `level_completed`, etc.) & ad slot hooks. |
| TASK-011 | P0 | DONE | Automated Tests & Production Verification | Bun test suite passes (5/5 tests, 40 assertions), `vite build` succeeds, typecheck passes. |

## Completed Sprint Summary
- All 11 core backlog tasks completed.
- Definition of Done met: 12 levels verified, responsive layout, SEO tags, production build ready.
