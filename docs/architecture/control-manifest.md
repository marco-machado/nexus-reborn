# Control Manifest

> **Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 (`WebGPURenderer`, WebGL2 fallback)
> **Last Updated**: 2026-09-12
> **Manifest Version**: 2026-09-12
> **ADRs Covered**: ADR-0001, ADR-0002, ADR-0003, ADR-0004, ADR-0005, ADR-0006, ADR-0007, ADR-0008, ADR-0009, ADR-0010, ADR-0011, ADR-0012, ADR-0013, ADR-0014, ADR-0015, ADR-0016, ADR-0017, ADR-0018, ADR-0019, ADR-0020
> **Status**: Active — regenerate with `/create-control-manifest update` when ADRs change
> **Technical Director Review (TD-MANIFEST)**: REVISED 2026-09-12

`Manifest Version` is the date this manifest was generated. Story files embed
this date when created. `/story-readiness` compares a story's embedded version
to this field to detect stories written against stale rules. Always matches
`Last Updated` — they are the same date, serving different consumers.

This manifest is a programmer's quick-reference extracted from all Accepted ADRs,
technical preferences, and engine reference docs. For the reasoning behind each
rule, see the referenced ADR.

Spanning ADRs are duplicated into each layer they govern: ADR-0001, ADR-0007,
ADR-0009, ADR-0010, ADR-0016, ADR-0017, ADR-0018, ADR-0020.

ADR-0016 living-spec defects are **not** stamped: do not treat current
`orderHoldFire` nulling Explicit, or `orderAttack` on devices, as the contract.

Quality numeric budgets in `docs/technical-preferences.md` are PENDING. Do not
invent FPS targets here.

---

## Foundation Layer Rules

*Applies to: scene management, event architecture, save/load, engine initialisation*

### Required Patterns

- **Strategic time and tactical time are independent clocks.** The World Network does not tick in the field. After a win, debrief spends the contract's ETA as strategic days so laboratories, injuries, recruitment, and Tax yield catch up; a loss spends none. — source: [ADR-0001](adr-0001-two-clocks.md)
- **Any new way to advance strategic time** must catch up laboratories, injury recovery, recruitment, and Tax yield at the resulting time. — source: [ADR-0001](adr-0001-two-clocks.md)
- **A mission in progress is memory only.** Aborting discards it with no debrief; there is no mid-mission resume. — source: [ADR-0002](adr-0002-unsaved-mission.md)
- **Settings and telemetry live in their own slots** so New Operation does not reset preferences. Strategy screens autosave; the mission and the debrief do not. The debrief is the only boundary that applies payout, sector movement, intel, influence, and roster changes, and it applies them once. — source: [ADR-0002](adr-0002-unsaved-mission.md)
- **At mission create, clone four plain-data slices** onto `DeployParams`. After that copy, the running mission must not read live stores. Copy means clone (`array.slice`, copy small records). Do not `Object.freeze()` live `getState()` arrays. Do not hold live `done` / `roster` / `loadout` references. — source: [ADR-0009](adr-0009-partitioned-deploy-snapshot.md)
- **Name four slices: World Network, Economy, Research, Roster.** Do not call any one slice “the Snapshot DTO.” There is no umbrella type named `SnapshotDTO`. — source: [ADR-0009](adr-0009-partitioned-deploy-snapshot.md)
- **Resolved wear has one owner: the Roster slice** (worn slotted ids + per-operative ordered `appliedIds`). The Research slice is completed unslotted ids only. The composer runs `appliedNodeIds(done, pins)` at freeze. — source: [ADR-0009](adr-0009-partitioned-deploy-snapshot.md)
- **`createWorld` does not read `researchStore`, `campaignStore`, or `worldStore`.** It never unions Research unslotted with Roster wear, never calls `appliedNodeIds`, and never calls `missionMods`. No silent live-store / `getState()` fallback **for the four deploy slices inside `createWorld`**. `src/game` still writes Zustand (`setOutcome`, HUD sync, tutorial). — source: [ADR-0009](adr-0009-partitioned-deploy-snapshot.md)
- **`DeployParams` requires `wn`, `economy`, `research`, `roster`.** It keeps `mods` and `district`. It deletes `loadout`. — source: [ADR-0009](adr-0009-partitioned-deploy-snapshot.md)
- **`MissionOutcome.quietReplay` is the Economy-slice boolean.** `maybeOutcome`, `setOutcome`, and `reportMission` must not call `isQuietReplay` / `contractsWon`. — source: [ADR-0009](adr-0009-partitioned-deploy-snapshot.md)
- **Persistence is three storage envelopes:** campaign, settings, telemetry — not player-facing save slots, not one merged blob. — source: [ADR-0011](adr-0011-campaign-persistence-envelope.md)
- **World Event and candidate / generated-market RNG streams live in the campaign blob.** Pins are roster content, not a research field. — source: [ADR-0011](adr-0011-campaign-persistence-envelope.md)
- **Invalid/unreadable campaign blob is drop-all.** Continue unavailable. Do not half-load. Settings or telemetry garbage falls back independently and must not inherit this drop-all policy. — source: [ADR-0011](adr-0011-campaign-persistence-envelope.md)
- **Hydrate lands on menu.** Then `researchStore.sync(t)` and `campaignStore.sync(t)` to the **saved** strategic `t`. Reload does not grant offline hours. Continue never resumes a mission. — source: [ADR-0011](adr-0011-campaign-persistence-envelope.md)
- **Four Screens autosave the campaign blob. Mission and Debrief do not.** Abort writes no campaign. Debrief applies once in session memory; the first durable campaign write of that result is the next Screen autosave. — source: [ADR-0011](adr-0011-campaign-persistence-envelope.md)
- **Campaign skip on mission/debrief is not a global persist ban:** enabled telemetry may still append on debrief or abort. — source: [ADR-0011](adr-0011-campaign-persistence-envelope.md)
- **`src/state/save.ts` is the only campaign-blob writer.** Do not put `zustand/middleware` persist on composed campaign stores. Screen writes coalesce. Storage throws swallow at the writer. — source: [ADR-0011](adr-0011-campaign-persistence-envelope.md)
- **New Operation erases the campaign envelope only.** Settings survive. `initializeSaveSystem` stays idempotent. Boot order: `initSettings` then `initializeSaveSystem` then `createRoot`. The storage key never moves; bump the inner version. — source: [ADR-0011](adr-0011-campaign-persistence-envelope.md)
- **Persistence lives in `src/state/`.** `src/game/` stays pure. — source: [ADR-0011](adr-0011-campaign-persistence-envelope.md)
- **Owner ≠ Zustand module.** Intel owner is World Network; live home is `campaignStore.intelLevel` / `intelProgress`. Generated-contract owner is Economy; live home is `worldStore.contracts` / `contractRngState` / `nextContractT`. — source: [ADR-0012](adr-0012-store-placement.md)
- **Do not create `economyStore`.** Do not split generated catch-up out of `advanceFlow`. Intel is not a WN deploy-slice field, not on `worldStore`, not on `appStore`. Expedite does not write Intel. — source: [ADR-0012](adr-0012-store-placement.md)
- **Timeline Review is a session view cursor** (`worldStore.review`), not a third strategic clock. `setReview` writes only `review`; never `t`, never `advanceFlow`, never `sync(t)`, never Tax. — source: [ADR-0014](adr-0014-timeline-review-is-a-view.md)
- **`setReview` does not clamp.** WorldMap Timeline writers (seek / nudge / Home / End) clamp to the 24h window or Live. — source: [ADR-0014](adr-0014-timeline-review-is-a-view.md)
- **Live board continues during Review** (unless Pause). If `review < t - DAY`, tick snaps `review` to `null` (skipped while Pause). `advanceDays`, hydrate, and New Operation force `review: null`. Review is not in `SaveV9.world`. — source: [ADR-0014](adr-0014-timeline-review-is-a-view.md)
- **Do not call `setReview` from `src/game/` or the mission scene.** Do not pass `worldStore.review` into `GameCanvas` `review` (`ReviewScene` is a different type). — source: [ADR-0014](adr-0014-timeline-review-is-a-view.md)
- **Telemetry is opt-in (default off), local, and never leaves the machine.** Cap 60 FIFO. No `fetch` / `sendBeacon` / WebSocket / cookies / analytics SDK / upload from `telemetry.ts` or Balance export. — source: [ADR-0015](adr-0015-telemetry-never-leaves-the-machine.md)
- **Enabled debrief appends one full record** from `MissionOutcome.telemetry`. Enabled Abort appends a thin record (`aborted`, duration, mission id, seed, deployed roles). Off → `recordMissionOutcome` and `recordAbort` are no-ops. — source: [ADR-0015](adr-0015-telemetry-never-leaves-the-machine.md)
- **New Operation does not clear `TELEMETRY_KEY` or the telemetry toggle.** Two-step Clear empties the log. Garbage telemetry yields an empty log. The log is not a Zustand store; do not attach persist middleware to `TELEMETRY_KEY`. — source: [ADR-0015](adr-0015-telemetry-never-leaves-the-machine.md)
- **`src/game` may type-import `MissionTelemetry`.** It must not value-import `telemetry.ts` or call `record*`. — source: [ADR-0015](adr-0015-telemetry-never-leaves-the-machine.md)
- **`tick` and `advanceDays` share private `advanceFlow`.** Fire exactly one next due process-kind at its timestamp; rearm from the due timestamp, never from now. Collision order: expiry → World Event → contract generation → staged spend → pressure → Tax yield. — source: [ADR-0018](adr-0018-catch-up-collision-order.md)
- **Tax is the implicit `else`.** A seventh due added to `Math.min` without a new branch is silently Tax. New kinds need an explicit branch and a collision-order update. Do not collapse the two `depositTax` sites (`advanceDays` deposits inside the Zustand `set` updater; `tick` deposits then `set`). rAF clamps to `worldStore` `MAX_DT` (0.25s wall); that is not offline-hour catch-up and must stay distinct from `advanceDays`. — source: [ADR-0018](adr-0018-catch-up-collision-order.md)
- **Do not bulk-apply N hours of effects at the jump instant.** Debrief applies outcome at frozen `t0`, then `advanceDays` if win. Catch-up must not run before write-back. Abort does not jump `t`. Keep `advanceFlow` on the main thread. `useWorldClock` is rAF, not `THREE.Timer` / r3f `useFrame` / `setAnimationLoop`. ScreenChrome must stay unmounted on menu / mission / debrief. — source: [ADR-0018](adr-0018-catch-up-collision-order.md)
- **Research `sync(t)` and roster dues do not import this collision table.** Do not export `advanceFlow` or a `ProcessKind` enum. Do not add a third caller that jumps `t` without `advanceFlow`. — source: [ADR-0018](adr-0018-catch-up-collision-order.md)
- **Empty incomplete living roster → `campaignFailed`.** A completed campaign stays complete after a roster wipe. The two flags cannot both be true. Injured still count as living. Generated wins do not mark complete. — source: [ADR-0020](adr-0020-campaign-fail-flags.md)
- **`isCampaignFailed(rosterSize, alreadyComplete)` is `rosterSize === 0 && !alreadyComplete`.** Pass this debrief’s `allWon`, not stored `campaignWon`. `campaignWon = allWon && !campaignFailed`. — source: [ADR-0020](adr-0020-campaign-fail-flags.md)
- **Hydrate restores stored flags;** never re-derive fail from `operatives.length === 0`. Flag writes stay in `reportMission`. `selectMission` no-ops when `campaignFailed`. Do not export a `CampaignStatus` enum. — source: [ADR-0020](adr-0020-campaign-fail-flags.md)
- **`save.ts` drop-alls if `campaignFailed && campaignWon`.** A non-failed blob’s `campaignWon` must match the three-authored record. Do not add drop-all for empty+incomplete+`!failed`. — source: [ADR-0020](adr-0020-campaign-fail-flags.md)
- **Mission canvas is `WebGPURenderer` + `await init()` + r3f `createRoot`,** not stock `<Canvas>`. — source: [ADR-0010](adr-0010-mission-renderer-and-frame-loop.md)
- **`appStore.Phase` is `'menu' | 'world' | 'research' | 'brief' | 'team' | 'mission' | 'debrief'`.** `App.tsx` routes with conditionals. Overlays do not change `Phase`. — source: [ADR-0017](adr-0017-one-os-input-audio-mixer.md)

### Forbidden Approaches

- **Never use a single shared clock** that would age the world during a firefight, or pause the network in a way that hid that cost. — source: [ADR-0001](adr-0001-two-clocks.md)
- **Never mid-mission persistence / resume.** Abort is a discard, not a reload. — source: [ADR-0002](adr-0002-unsaved-mission.md)
- **Never put resolved worn ids on the Research slice.** — source: [ADR-0009](adr-0009-partitioned-deploy-snapshot.md)
- **Never one combined Snapshot DTO.** — source: [ADR-0009](adr-0009-partitioned-deploy-snapshot.md)
- **Never reconstruct `appliedIds` in `createWorld` from unslotted ∪ wear.** — source: [ADR-0009](adr-0009-partitioned-deploy-snapshot.md)
- **Never a silent live-store fallback inside `createWorld`** for deploy-slice reads. — source: [ADR-0009](adr-0009-partitioned-deploy-snapshot.md)
- **Never one storage key for campaign + settings + telemetry.** — source: [ADR-0011](adr-0011-campaign-persistence-envelope.md)
- **Never a durable campaign write at debrief.** — source: [ADR-0011](adr-0011-campaign-persistence-envelope.md)
- **Never `zustand persist` middleware on `worldStore` / `campaignStore`.** — source: [ADR-0011](adr-0011-campaign-persistence-envelope.md)
- **Never cookies, `sessionStorage`, IndexedDB, or OPFS.** Cookies would leave the machine; `sessionStorage` dies with the tab and kills Continue. — source: [ADR-0011](adr-0011-campaign-persistence-envelope.md)
- **Never serialize the ADR-0009 freeze into the campaign blob.** — source: [ADR-0011](adr-0011-campaign-persistence-envelope.md)
- **Never move Intel onto `worldStore`.** — source: [ADR-0012](adr-0012-store-placement.md)
- **Never create `src/state/economyStore.ts`.** — source: [ADR-0012](adr-0012-store-placement.md)
- **Never put generated instances beside Credits on `appStore`.** — source: [ADR-0012](adr-0012-store-placement.md)
- **Never reconstruct historical Control/Unrest/owners from the Feed.** — source: [ADR-0014](adr-0014-timeline-review-is-a-view.md)
- **Never rewind `t` / treat Timeline scrub as a third clock.** — source: [ADR-0014](adr-0014-timeline-review-is-a-view.md)
- **Never a React-local Review pin** instead of `worldStore.review`. — source: [ADR-0014](adr-0014-timeline-review-is-a-view.md)
- **Never add `review` to `SaveV9.world`** or restore a scrub as live. — source: [ADR-0014](adr-0014-timeline-review-is-a-view.md)
- **Never a remote collector / analytics SDK / `sendBeacon` for telemetry.** — source: [ADR-0015](adr-0015-telemetry-never-leaves-the-machine.md)
- **Never fold telemetry records into the campaign blob.** — source: [ADR-0015](adr-0015-telemetry-never-leaves-the-machine.md)
- **Never refuse the 61st append** (keep all 60). FIFO: oldest out. — source: [ADR-0015](adr-0015-telemetry-never-leaves-the-machine.md)
- **Never bulk-apply N hours of effects at the ETA jump instant.** — source: [ADR-0018](adr-0018-catch-up-collision-order.md)
- **Never replace kind-level collision with a per-item priority queue.** — source: [ADR-0018](adr-0018-catch-up-collision-order.md)
- **Never fail a completed campaign on a later roster wipe.** — source: [ADR-0020](adr-0020-campaign-fail-flags.md)
- **Never replace the two booleans with a `CampaignStatus` enum.** — source: [ADR-0020](adr-0020-campaign-fail-flags.md)

### Performance Guardrails

- **Deploy snapshot**: one clone at mission create (1–4 operatives, ≤21 research ids) plus `appliedNodeIds` per assigned operative. None per frame. — source: [ADR-0009](adr-0009-partitioned-deploy-snapshot.md)
- **Campaign persist**: coalesced Screen writes, not 20Hz stringify. — source: [ADR-0011](adr-0011-campaign-persistence-envelope.md)
- **Telemetry**: stringify at most 60 records on debrief/abort/export, not per frame. — source: [ADR-0015](adr-0015-telemetry-never-leaves-the-machine.md)
- **Catch-up**: CPU proportional to dues inside the jumped span. No extra budget claimed. — source: [ADR-0018](adr-0018-catch-up-collision-order.md)

---

## Core Layer Rules

*Applies to: core gameplay loop, main player systems, physics, collision*

### Required Patterns

- **Two independent clocks; win-only ETA catch-up.** The network does not tick in the field. A loss spends none. — source: [ADR-0001](adr-0001-two-clocks.md)
- **Authored and generated contracts are the same kind of work** and share brief → assembly → mission → debrief. Type chooses the district family and the objective set for both. — source: [ADR-0003](adr-0003-one-contract-kind.md)
- **Winning all three authored contracts marks the campaign complete;** they stay replayable. A generated contract that is fulfilled or failed leaves the market. — source: [ADR-0003](adr-0003-one-contract-kind.md)
- **A second win on an already-won authored contract pays no Credits, Influence, or Intel** and does not move control or unrest. KIA, injury, experience, and ETA still apply. The debrief names the zero. — source: [ADR-0004](adr-0004-quiet-replay.md)
- **A loss retry still pays in full.** Generated contracts have no replay. — source: [ADR-0004](adr-0004-quiet-replay.md)
- **Laboratories fund one program.** Ballistics is unslotted and squad-wide. Cybernetics and Control Systems are slotted: **each operative wears at most one completed project per augmentation bay.** A project is a blueprint, not an instance — every operative may wear Neural Cache. — source: [ADR-0005](adr-0005-blueprint-assignment.md)
- **Unpinned bays follow current issue, including new hires.** Pins hold stock issue or an older completed project. Death drops the assignment, not the program. Effects are sampled at deploy from what is worn. — source: [ADR-0005](adr-0005-blueprint-assignment.md)
- **Influence is only the points spent on Stabilize, Lobby, and Expedite.** It is earned on contract wins. There is no influence index. — source: [ADR-0008](adr-0008-influence-is-a-wallet.md)
- **Tax yield is paid every 24 strategic hours, only from sectors Nexus holds.** Defense rating and NETWORK THREAT are out. Opening income is North America only. — source: [ADR-0008](adr-0008-influence-is-a-wallet.md)
- **`createWorld` copies `roster.maxHp` / `roster.speed`**, uses Roster `appliedIds` for `squadWeapon` / weapon sampling, and uses `roster.items` for `loadoutPools` only. It does not re-run `crewBonus`, `xpBonus`, `tierSpeedDelta`, or `squadMassKg`. — source: [ADR-0009](adr-0009-partitioned-deploy-snapshot.md)
- **Economy owns Credits; live home is `appStore.credits`.** The account never goes negative. Exact-balance spend is allowed (→ 0). Opening `INITIAL_CREDITS = 128450`. — source: [ADR-0013](adr-0013-credits-never-overdraw.md)
- **`spendCredits` refuses `amount <= 0` or overdraft as identity no-op (`return s`).** `hireOperative` is check → `acceptHire` → decrement; it does not call `spendCredits`. — source: [ADR-0013](adr-0013-credits-never-overdraw.md)
- **`addCredits` ignores non-positive.** `setOutcome` adds `netPayout` (≥ 0 for production producers). `researchStore.start` is occupancy only. Hydrate drop-alls if `!finite(credits) || credits < 0`; do not clamp to 0. — source: [ADR-0013](adr-0013-credits-never-overdraw.md)
- **Chrome is not the guard.** Production must not `setState({ credits })` except hydrate. Do not persist `committedFunds()` as a second ledger. Accepting a contract is free (`selectMission` does not debit). Production Research path: re-read credits; if short, return; `if (start(node, t)) spendCredits(cost)` — do not invert to spend-then-start. — source: [ADR-0013](adr-0013-credits-never-overdraw.md)
- **Protected verbs: Select, Move, Attack, Hold Ground, Hold Fire.** Stop is command language, not a sixth verb (`orderStop`). Custom TypeScript sim; no physics engine. Kit methods may stay on `WorldApi`; they are not fantasy verbs. — source: [ADR-0016](adr-0016-tactical-sim-contract.md)
- **Select lives on `missionStore.setSelected`;** do not add `WorldApi.orderSelect`. Dead are never recipients. Opens with every living operative selected. — source: [ADR-0016](adr-0016-tactical-sim-contract.md)
- **Move (`orderMove`)** writes a path, clears Explicit, releases Hold Ground. Along the route, auto-acquire visible CorpSec when weapons are free, then resume. **Attack (`orderAttack`)** is Explicit on a living hostile only; overrides Hold Fire; Hold Ground prevents the chase, keeps the target. **Hold Ground (`orderHold`)** parks/restores path; separation will not shove the held tile; fire still allowed. **Hold Fire (`orderHoldFire`)** clears automatic targets and blocks auto-acquire; does **not** null a standing Explicit; a later Attack still fires. **Stop (`orderStop`)** clears path and target; Hold Ground and Hold Fire stay. — source: [ADR-0016](adr-0016-tactical-sim-contract.md)
- **Fire lane:** a missed round continues down the lane to weapon range. The first Unit before cover is hit, regardless of side. Authority is sim walk-grid LOS, not `THREE.Raycaster` / `Mesh.raycast`. Tactical counts unique squad-caused civilian first hits as `civiliansHit` (`N`); Economy prices. — source: [ADR-0016](adr-0016-tactical-sim-contract.md)
- **Eight-direction 1 m walk grid.** No diagonal corner cutting. `explicitTarget` is sim-private; do not export the flag. — source: [ADR-0016](adr-0016-tactical-sim-contract.md)
- **Catch-up protocol:** one-due-at-timestamp, rearm-from-due, fixed collision order. Both advancement paths share `advanceFlow`. — source: [ADR-0018](adr-0018-catch-up-collision-order.md)
- **Deploy gate (all four required):** selected contract; `squad.length >= 1`; every assigned `READY`; `massKg <= MASS_LIMIT_KG` (400). Empty bays do not block. Equal 400 is allowed. No epsilon that would allow 400.1. — source: [ADR-0019](adr-0019-deploy-gate.md)
- **Pure `canDeploy` in `src/game`.** `startMission()` no-ops unless `canDeploy.ok`. `goto('mission')` is not a public start API. — source: [ADR-0019](adr-0019-deploy-gate.md)
- **`createWorld` uses `squadMassKg` only for `massTier` / `tierSpeedDelta`.** It does not read `MASS_LIMIT_KG`. Tactical does not re-own the gate. — source: [ADR-0019](adr-0019-deploy-gate.md)
- **Empty incomplete living roster fails; complete stays complete after wipe;** flags cannot both be true. — source: [ADR-0020](adr-0020-campaign-fail-flags.md)
- **`isCampaignFailed` / flag writes stay in `campaignStore.reportMission`.** Do not add a second effect that sets `campaignFailed` from length. — source: [ADR-0020](adr-0020-campaign-fail-flags.md)

### Forbidden Approaches

- **Never a second “story” pipeline** for authored work. — source: [ADR-0003](adr-0003-one-contract-kind.md)
- **Never unlimited full-fee authored replay** (would make the generated market optional). — source: [ADR-0004](adr-0004-quiet-replay.md)
- **Never a practice sandbox** that takes back “a kill is permanent.” — source: [ADR-0004](adr-0004-quiet-replay.md)
- **Never unique implants / an equipment locker.** — source: [ADR-0005](adr-0005-blueprint-assignment.md)
- **Never a global “standing” bar or a tax cheque from non-Nexus sectors.** — source: [ADR-0008](adr-0008-influence-is-a-wallet.md)
- **Never a pure `tryDebit` helper in `src/game` for Credits.** — source: [ADR-0013](adr-0013-credits-never-overdraw.md)
- **Never UI-only overdraft disable** with a store that always subtracts. — source: [ADR-0013](adr-0013-credits-never-overdraw.md)
- **Never `economyStore` holding Credits.** — source: [ADR-0013](adr-0013-credits-never-overdraw.md)
- **Never clamp a negative Credits blob to 0 on hydrate.** — source: [ADR-0013](adr-0013-credits-never-overdraw.md)
- **Never a physics engine** (Rapier / cannon / three.js physics). — source: [ADR-0016](adr-0016-tactical-sim-contract.md)
- **Never stamp current `orderHoldFire` nulling Explicit, or `orderAttack` on devices, as the contract.** Living spec wins. — source: [ADR-0016](adr-0016-tactical-sim-contract.md)
- **Never a sixth verb.** — source: [ADR-0016](adr-0016-tactical-sim-contract.md)
- **Never require all four Squad bays filled.** Sending fewer than four is a command, not a fail. — source: [ADR-0019](adr-0019-deploy-gate.md)
- **Never a soft-cap that allows mass over 400.** — source: [ADR-0019](adr-0019-deploy-gate.md)
- **Never put `MASS_LIMIT_KG` in `world.ts`.** — source: [ADR-0019](adr-0019-deploy-gate.md)
- **Never treat unrest crisis as campaign fail.** — source: [ADR-0020](adr-0020-campaign-fail-flags.md)

### Performance Guardrails

- **Credits refuse** is an identity no-op (no subscriber wake on no-change). — source: [ADR-0013](adr-0013-credits-never-overdraw.md)
- **Fire lane:** existing sim plus a stray scan per miss. No new frame budget (FPS still PENDING). — source: [ADR-0016](adr-0016-tactical-sim-contract.md)
- **Deploy gate:** sum of ≤4 operatives. No physics mass system. — source: [ADR-0019](adr-0019-deploy-gate.md)

---

## Feature Layer Rules

*Applies to: secondary mechanics, AI systems, secondary features*

### Required Patterns

- **Weather is a determined script, not a roll mid-fight.** A mission may change weather once, to an adjacent intensity, at a tactical time fixed when the mission is created. The brief prints the opening and the coming change. The same seed produces the same script. — source: [ADR-0006](adr-0006-weather-script.md)
- **Rain only shortens CorpSec sight and quiets weapons.** — source: [ADR-0006](adr-0006-weather-script.md)
- **Risk index uses the clearer weather on the script.** Generated contracts roll a front about two times in five, at 90–240s from insertion. Glass Veil clears heavy to light at 22:16:38. Hollow Crown clears light to none at 22:17:08. Rust Haven stays clear. — source: [ADR-0006](adr-0006-weather-script.md)
- **Opening hour is per-mission and presentation only:** it does not change sight, noise, or risk. Independent of strategic time and weather. Lighting is frozen for the deployment. — source: [ADR-0007](adr-0007-opening-hour.md)
- **Legal hours: 18:00 inclusive to 01:00 exclusive.** Hours in `[18:00, 20:00)` light as dusk; the rest of the window lights as night. Neon still reads. — source: [ADR-0007](adr-0007-opening-hour.md)
- **Generated contracts roll a uniform minute** in the window from the contract seed, after the existing cosmetic stream so weather and map jitter stay put. Glass Veil and Hollow Crown stay 22:14:08. Rust Haven opens at 18:14:08. — source: [ADR-0007](adr-0007-opening-hour.md)
- **The HUD clock still ticks; the sky does not.** `CLEAR NIGHT` is only legal at night. — source: [ADR-0007](adr-0007-opening-hour.md)
- **`CITY_SIZE = 96`.** `src/world/citygen.ts` is the only generator. Signature: `generateCity(mission: MissionDef, spec?: DistrictSpec, gen?: Partial<GenParams>)`. RNG is `mulberry32(district.seed)`. Same seed → same district. — source: [ADR-0016](adr-0016-tactical-sim-contract.md)
- **Ground plane XZ, +Y up, 1 unit = 1 m.** Southern insertion, walk grid, `roadRects`. — source: [ADR-0016](adr-0016-tactical-sim-contract.md)
- **Hardened is discrete `DIFFICULTY_FX`.** Must not hide minimap cones or patrols. Not a free-range. Control does not add CorpSec HP. Unrest extras are Tactical-derived from the World Network snapshot. — source: [ADR-0016](adr-0016-tactical-sim-contract.md)
- **One system, one seed, unsaved lifetime.** Do not split district / combat / weather / hour / objectives into sibling systems. — source: [ADR-0016](adr-0016-tactical-sim-contract.md)

### Forbidden Approaches

- **Never an unscripted mid-mission weather roll.** — source: [ADR-0006](adr-0006-weather-script.md)
- **Never play-driven weather.** — source: [ADR-0006](adr-0006-weather-script.md)
- **Never derive Opening hour from strategic now.** — source: [ADR-0007](adr-0007-opening-hour.md)
- **Never a live sky** (a second mid-mission change beside the weather script). — source: [ADR-0007](adr-0007-opening-hour.md)
- **Never noon / a daylight-blue sky.** — source: [ADR-0007](adr-0007-opening-hour.md)
- **Never a second generator or WebGPU compute walk grid beside `citygen.ts`.** — source: [ADR-0016](adr-0016-tactical-sim-contract.md)
- **Never Hardened-as-hidden-minimap.** — source: [ADR-0016](adr-0016-tactical-sim-contract.md)
- **Never split the tactical system into sibling systems.** — source: [ADR-0016](adr-0016-tactical-sim-contract.md)

### Performance Guardrails

- **Memory:** 96×96 walk grid plus unit list. — source: [ADR-0016](adr-0016-tactical-sim-contract.md)
- **Load time:** `generateCity` at mission create. — source: [ADR-0016](adr-0016-tactical-sim-contract.md)

---

## Presentation Layer Rules

*Applies to: rendering, audio, UI, VFX, shaders, animations*

### Required Patterns

- **Opening-hour lighting is derived and frozen.** The mission rain-hiss follows weather and is silent when the weather is none. — source: [ADR-0007](adr-0007-opening-hour.md)
- **Import `three/webgpu`.** `new THREE.WebGPURenderer(props); await renderer.init()`. WebGL2 via that `init()`, not a second renderer class. Do not construct `WebGLRenderer` “to be safe.” — source: [ADR-0010](adr-0010-mission-renderer-and-frame-loop.md)
- **Keep opaque `Scene.background`.** Do not transparent-clear the mission canvas. Do not set `alpha: false` to “fix” blending (r185 premultiplied alpha). — source: [ADR-0010](adr-0010-mission-renderer-and-frame-loop.md)
- **Mission root: `createRoot` + one `configure` / `render` per canvas.** StrictMode remount uses a `WeakMap` so `configure` is single-flight. `frameloop` stays `'always'`. Do not call `setAnimationLoop` in `GameCanvas`. Two-phase configure: boot `dpr: [1, 1.75]`, then post-init `tierDpr()`. Further `configure` must `await mount.ready`. — source: [ADR-0010](adr-0010-mission-renderer-and-frame-loop.md)
- **Tone mapping: `ACESFilmicToneMapping`, exposure 1.1.** `extend(THREE)` and the `ThreeElements` module augmentation stay. Do not import r3f 8 or unscoped `react-three-fiber`. — source: [ADR-0010](adr-0010-mission-renderer-and-frame-loop.md)
- **`WorldTicker` `useFrame(..., 0)` is the first child in `SceneTree`.** Pass **raw** r3f `dt` into `world.tick`. Opening-frame clamp and remainder catch-up are owned by `world.ts`. Do not `Math.min(dt, 0.05)` in `WorldTicker`. Leave CameraRig’s own `Math.min(rawDt, 0.05)` separate (unifying causes pause-banked fling). — source: [ADR-0010](adr-0010-mission-renderer-and-frame-loop.md), [ADR-0016](adr-0016-tactical-sim-contract.md)
- **Effects `useFrame(..., 1)` is load-bearing.** `RenderPipeline.render()` is the only GPU submit. Do not also call `gl.render()` / `renderer.render()`. A second positive-priority subscriber must not render. — source: [ADR-0010](adr-0010-mission-renderer-and-frame-loop.md)
- **Per-frame unit data stays out of React state.** Scene objects read `getWorld()`. HUD may subscribe to `missionStore` at `SYNC_INTERVAL` 0.2s. Minimap reads `getWorld()` ~10Hz. — source: [ADR-0010](adr-0010-mission-renderer-and-frame-loop.md)
- **Post: `RenderPipeline`; TSL `pass` / `mrt({ output, emissive })`; bloom from `BloomNode`.** Bloom is emissive-only. LOW tier drops bloom. — source: [ADR-0010](adr-0010-mission-renderer-and-frame-loop.md)
- **Quality tier resolves once per mission.** AUTO → HIGH on WebGPU, MEDIUM on WebGL2. `FrameGovernor` may persist `stepDownTier` for the **next** mission. Do not tear the live `createRoot` pipeline mid-fight. — source: [ADR-0010](adr-0010-mission-renderer-and-frame-loop.md)
- **Game clocks (`src/ui/clock.ts`, `missionStore.setClock`, Opening hour) are not `THREE.Clock` / `THREE.Timer`.** Do not migrate r3f’s internal `Clock` to silence the r183 warning. — source: [ADR-0010](adr-0010-mission-renderer-and-frame-loop.md)
- **Camera pose:** yaw `CAMERA_YAW = π/4` (45°), elevation 55°, FOV 25°, zoom 44–115 m. No rotate or tilt in play. Minimap uses the same yaw. CameraRig `useFrame` priority 0 after WorldTicker. `VISION_HALF_ANGLE` is not camera elevation. `GameCanvas` boot camera is boot only; CameraRig overwrites each frame. — source: [ADR-0016](adr-0016-tactical-sim-contract.md)
- **Named colours are dual-owned by `src/index.css` `:root` and `src/ui/tokens.ts`.** TS / SVG / canvas paints import from `tokens.ts`. Neutral white/black tints are the only hex/rgba literals allowed. A palette change touches both files and nothing else. — source: [ADR-0017](adr-0017-one-os-input-audio-mixer.md)
- **No `public/` art.** Audio loads with Vite `?url` from `inspiration/audio/`. DOM screens wrap the mission view; `GameCanvas` + `Hud` are siblings. — source: [ADR-0017](adr-0017-one-os-input-audio-mixer.md)
- **Screens must work at 1280×720 without clipping or truncation.** Critical state is never color-only. — source: [ADR-0017](adr-0017-one-os-input-audio-mixer.md)
- **`BINDINGS` is the only remap table.** `remappable`: `b.codes.length > 0 && b.id !== 'pause' && b.id !== 'selectSlot'`. Keyboard and mouse, desktop only. `BindingId` is not WorldApi verbs. Pointer picking in `scene/Input.tsx` may use r3f intersection; fire-lane `THREE.Raycaster` stays forbidden. — source: [ADR-0017](adr-0017-one-os-input-audio-mixer.md)
- **Four buses `ui` / `combat` / `music` / `ambience` → `master` → `createDynamicsCompressor()`** (variable `limiter` in `audio.ts` — a safety net, **not** a Web Audio `LimiterNode`). Mute folds into master; stored channel values are unchanged. Mixer values live in the settings envelope. Do not add a fifth bus. — source: [ADR-0017](adr-0017-one-os-input-audio-mixer.md)
- **Strategy bed lifetime is the four Screens** (`bindStrategyBed`). Mission city-hum owns **mission-phase lifetime**. `pickMissionBedUrl()` is unseeded 1-of-3; do not key the clip to district, contract, hour, weather, or Threat. Rain follows live Weather. Reduced-motion visual rain is not an audio mute. — source: [ADR-0017](adr-0017-one-os-input-audio-mixer.md)
- **Unavailable or late audio must not block play or dump as a delayed burst.** `sound.ts` lazy-imports and must not typecheck-import `game/audio.ts`. — source: [ADR-0017](adr-0017-one-os-input-audio-mixer.md)
- **`:root.s-high-contrast` remaps CSS variables only.** Do not runtime-read CSS into `tokens.ts` or scatter hex. — source: [ADR-0017](adr-0017-one-os-input-audio-mixer.md)
- **`sfx.threatLevel` is HUD Alert 0–3 on the combat bus,** not World Network Threat. — source: [ADR-0017](adr-0017-one-os-input-audio-mixer.md)
- **Pause overlay does not mute or swap beds.** Settings, Balance, pause, and tutorial toasts are overlays; they do not change `Phase`. — source: [ADR-0017](adr-0017-one-os-input-audio-mixer.md)

### Forbidden Approaches

- **Never stock r3f `<Canvas>`, drei `Canvas` / `View`.** — source: [ADR-0010](adr-0010-mission-renderer-and-frame-loop.md)
- **Never rewrite the mission scene as imperative three.js with no r3f.** — source: [ADR-0010](adr-0010-mission-renderer-and-frame-loop.md)
- **Never `new THREE.WebGLRenderer()` for the mission canvas.** — source: [ADR-0010](adr-0010-mission-renderer-and-frame-loop.md)
- **Never `renderAsync` / `waitForGPU` / `new PostProcessing` / EffectComposer / `@react-three/postprocessing` / `AnamorphicNode` / GLSL `ShaderMaterial` / `onBeforeCompile` on the WebGPU path.** — source: [ADR-0010](adr-0010-mission-renderer-and-frame-loop.md)
- **Never per-frame unit poses in React state.** — source: [ADR-0010](adr-0010-mission-renderer-and-frame-loop.md)
- **Never `THREE.Clock` / `THREE.Timer` as game clocks.** — source: [ADR-0010](adr-0010-mission-renderer-and-frame-loop.md)
- **Never extra `useFrame` priority > 0 that calls `render()`, or `gl.render()` beside `pipeline.render()`.** — source: [ADR-0010](adr-0010-mission-renderer-and-frame-loop.md)
- **Never drei `OrbitControls` / `MapControls` / `CameraControls` / `Html`, or `OrthographicCamera` / rotate-tilt in play.** — source: [ADR-0010](adr-0010-mission-renderer-and-frame-loop.md), [ADR-0016](adr-0016-tactical-sim-contract.md)
- **Never `THREE.Raycaster` / `Mesh.raycast` as fire-lane or LOS authority.** — source: [ADR-0016](adr-0016-tactical-sim-contract.md)
- **Never `public/` art, spoken VO, spatial shooter mix, or payout celebration sting.** — source: [ADR-0017](adr-0017-one-os-input-audio-mixer.md)
- **Never React 19.2 `<Activity>` / `useEffectEvent` to hide phases.** — source: [ADR-0017](adr-0017-one-os-input-audio-mixer.md)
- **Never `THREE.Audio` / `PositionalAudio` / `AudioListener` / `PannerNode` / `StereoPannerNode`.** — source: [ADR-0017](adr-0017-one-os-input-audio-mixer.md)
- **Never gamepad or touch.** — source: [ADR-0017](adr-0017-one-os-input-audio-mixer.md)
- **Never a second palette runtime / CSS-in-JS palette.** — source: [ADR-0017](adr-0017-one-os-input-audio-mixer.md)
- **Never key the mission bed clip to district, contract, hour, weather, or Threat.** — source: [ADR-0017](adr-0017-one-os-input-audio-mixer.md)

### Performance Guardrails

- **One `world.tick` + imperative scene mutation per frame.** No React reconciliation of unit poses. — source: [ADR-0010](adr-0010-mission-renderer-and-frame-loop.md)
- **`FrameGovernor` / `createFrameProbe`:** `SLOW_FRAME_MS` 28, 8s grace, 6s hold, 250ms hitch clamp. Step-down is next-mission. — source: [ADR-0010](adr-0010-mission-renderer-and-frame-loop.md)
- **HUD `SYNC_INTERVAL` 0.2s; minimap ~10Hz.** — source: [ADR-0010](adr-0010-mission-renderer-and-frame-loop.md)
- **Preallocated pools (`Units` / `Fx` / `Rain`).** No per-frame React objects for poses. — source: [ADR-0010](adr-0010-mission-renderer-and-frame-loop.md)

---

## Global Rules (All Layers)

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Types / components | PascalCase | `GameCanvas`, `WorldApi` |
| Functions / variables | camelCase | `buildArchitecture`, `createWorld` |
| Signals / events | Zustand stores, not engine signals | `useWorldStore`, `useCampaignStore` |
| Files | camelCase modules; PascalCase React components | `world.ts`, `GameCanvas.tsx` |
| Constants | UPPER_SNAKE_CASE | `MAX_DT`, `TEAL` |
| Stores | `useXStore` in `src/state/` | `useAppStore` |

Source: `docs/technical-preferences.md`.

### Performance Budgets

| Target | Value |
|--------|-------|
| Framerate | PENDING — `docs/game-design.md` §20 |
| Frame budget | PENDING — `docs/game-design.md` §20 |
| Draw calls | PENDING — `docs/game-design.md` §20 |
| Memory ceiling | PENDING — `docs/game-design.md` §20 |

Do not invent FPS here. — source: [ADR-0010](adr-0010-mission-renderer-and-frame-loop.md), `docs/technical-preferences.md`

### Approved Libraries / Addons

- **react, react-dom** — UI / screens
- **three (`three/webgpu` in `src/scene/`)** — mission renderer
- **@react-three/fiber** — r3f `createRoot` mission canvas
- **zustand** — stores in `src/state/`
- **@react-three/drei** — lockfile only; not a mission-canvas kit (forbidden exports listed below)
- **(dev) vite, typescript, vitest, eslint** — build / test / lint

Source: `docs/technical-preferences.md`. Physics: none — custom sim in `src/game/`.

### Forbidden APIs (three.js r185 / r3f 9.6.1 / React 19.2.8)

These APIs are deprecated, removed, or unverified for this pin:

- `import … from 'three'` in `src/scene/` — use `three/webgpu`
- `import { WebGPURenderer } from 'three/addons/…'` — use `three/webgpu`
- TSL from `'three/nodes'` — use `three/tsl`
- `new THREE.WebGLRenderer()` for the mission canvas — use `WebGPURenderer` then `await renderer.init()`
- Stock r3f `<Canvas>` for the mission view — use `createRoot` in `GameCanvas.tsx`
- `renderer.renderAsync()` / `computeAsync()` / `clearAsync()` — sync `render()` / `compute()` / `clear()` after `init()`
- `renderer.waitForGPU()` — removed
- `new PostProcessing(renderer)` — use `new RenderPipeline(renderer)`
- `THREE.Clock` as a game clock — not this game’s UTC / mission clock strings (do not migrate them to `THREE.Timer`)
- `WebGLCubeRenderTarget` with WebGPU — use `CubeRenderTarget`
- TSL `varying()` → `toVarying()`; `vertexStage()` → `toVertexStage()`; `label()` → `setName()`; `PI2` → `TWO_PI`
- TSL `directionToColor()` → `packNormalToRGB()`; `colorToDirection()` → `unpackRGBToNormal()`
- `positionLocal` in `material.positionNode` when you need pre-skin verts → `positionGeometry`
- `rangeFog(color, near, far)` → `fog(color, rangeFogFactor(near, far))`
- `storageObject()` → `storage().setPBO(true)`
- TSL `burn()` / `dodge()` / `screen()` / `overlay()` → `blendBurn()` / `blendDodge()` / `blendScreen()` / `blendOverlay()`
- Raw GLSL `ShaderMaterial` / `onBeforeCompile` on the WebGPU path — TSL / `NodeMaterial`
- `AnamorphicNode` → `BloomNode` (`bloom()` from `three/addons/tsl/display/BloomNode.js`)
- `TiledLighting` → `ClusteredLighting`
- `MeshGouraudMaterial` → `MeshLambertMaterial`
- `MeshPostProcessingMaterial` — removed
- `PCFSoftShadowMap` → `PCFShadowMap`
- `PassNode.setResolution()` → `setResolutionScale()`
- `ColorManagement.fromWorkingColorSpace()` → `workingToColorSpace()`; `toWorkingColorSpace()` → `colorSpaceToWorking()`
- `Matrix3.translate()` / `.scale()` / `.rotate()` — deprecated
- React 19.2 `<Activity>` / `useEffectEvent` — not used; do not hide phases with them
- `cacheSignal` — RSC; this game has no server components
- Vite alias `three` → `three/webgpu`
- npm `latest` (three r186, Vite 8, r3f 9.7) — not this pin

Source: `docs/engine-reference/web/deprecated-apis.md`, `docs/engine-reference/web/current-best-practices.md`, `docs/engine-reference/web/VERSION.md`.

### Required engine patterns

- Always `await renderer.init()` before `render()`, feature checks, or texture init. Log `renderer.backend` (`isWebGPUBackend`). A menu load does not prove the mission renderer came up.
- Opaque scene background / clear color unless deliberately compositing over HTML (r185 premultiplied alpha).
- Custom look: TSL nodes and node materials, not GLSL `ShaderMaterial`. Bloom is emissive-only MRT. Prefer `three/tsl` named imports already used in-repo.
- This app is a client SPA (Vite). Ignore RSC / prerender / `cacheSignal` advice. `useId` values now contain `_` not `:`; do not parse `useId` strings.
- Stay on Vite 6.4.3 until an explicit upgrade. Build is `tsc -b && vite build`. Tests are Vitest beside modules.

Source: `docs/engine-reference/web/current-best-practices.md`.

### Cross-Cutting Constraints

- **Layer imports:** `src/game/` — no three, no React. `src/world/` — no three, no React. `src/state/` — Zustand only for stores. `src/scene/` — three/webgpu, tsl, r3f. `src/ui/` — React DOM; not the mission renderer. — source: `docs/engine-reference/web/current-best-practices.md`, `AGENTS.md`
- **Preserve deterministic gameplay, campaign, and procedural RNG.**
- **Do not invent project files, engine APIs, dependencies, FPS targets, or test results.**
- **Target platform:** desktop browser, 1280×720 minimum. Keyboard/mouse. No gamepad. No touch. Mobile is out of scope.
- **Verify:** `npm run lint`, `npm run test`, `npm run build`. Rendering changes also need the click-through at 1280×720. Stop any `vite` listener on port 4200 before the turn ends.
- **Knowledge risk HIGH** — cutoff May 2025; pin is three.js r185 / React 19.2.8. Read `docs/engine-reference/web/VERSION.md` before suggesting three.js, r3f, or React APIs.
