# Architecture Requirements Traceability

Last Updated: 2026-10-05
Engine: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 WebGPU
Source: `docs/architecture/tr-registry.yaml` version 6 (2026-09-22)
Prior index: `docs/architecture/traceability-index.md` (64-row pass, 2026-09-11)

## Coverage Summary

- Total requirements: 66
- Covered: 66
- Partial: 0
- Gaps: 0
- Foundation layer (World Network): 12 requirements, 0 gaps

Coverage is the registry `coverage` field. All covering ADRs are Accepted. This file is the named traceability matrix for the Technical Setup gate. It does not mint requirements.

## Full Matrix

| Requirement ID | GDD | Layer | System | Requirement | ADR Coverage | Status |
|---|---|---|---|---|---|---|
| TR-world-network-001 | world-network.md | Foundation | world-network | Strategic and tactical clocks are independent; the World Network does not tick in the field | ADR-0001 | covered |
| TR-world-network-002 | world-network.md | Foundation | world-network | Only two advancement paths exist — Screen ticking and win-ETA catch-up; a loss spends none | ADR-0001 | covered |
| TR-world-network-003 | world-network.md | Foundation | world-network | Catch-up fires one next due at its timestamp, rearms from due t, and uses a fixed collision order | ADR-0018 | covered |
| TR-world-network-004 | world-network.md | Foundation | world-network | Debrief write-back happens at frozen t0, then the ETA jump | ADR-0001,ADR-0002 | covered |
| TR-world-network-005 | world-network.md | Foundation | world-network | Influence is a spendable wallet (Stabilize, Lobby, Expedite) with no index or standing bar | ADR-0008 | covered |
| TR-world-network-006 | world-network.md | Foundation | world-network | Tax yield is computed by World Network and emitted to Economy; only Nexus-held sectors pay | ADR-0008 | covered |
| TR-world-network-007 | world-network.md | Foundation | world-network | Intel is World Network's access resource; live home is campaignStore.intelLevel / intelProgress | ADR-0012 | covered |
| TR-world-network-008 | world-network.md | Foundation | world-network | Deploy snapshot World Network slice; no live store handles; no live mission or roster query | ADR-0002,ADR-0009 | covered |
| TR-world-network-009 | world-network.md | Foundation | world-network | Outcome DTO is applied once at debrief; abort writes nothing | ADR-0002 | covered |
| TR-world-network-010 | world-network.md | Foundation | world-network | Quiet replay awards 0 Influence and Intel and does not shove Control/Unrest; ETA still catch-up | ADR-0004 | covered |
| TR-world-network-011 | world-network.md | Foundation | world-network | Timeline Review is not an advancement path | ADR-0014 | covered |
| TR-world-network-012 | world-network.md | Foundation | world-network | Strategic clock runs only on the four Screens | ADR-0001 | covered |
| TR-economy-001 | economy-and-contracts.md | Core | economy-and-contracts | Credits ledger never goes negative; overdraft refuses; exact-balance spend is allowed | ADR-0013 | covered |
| TR-economy-002 | economy-and-contracts.md | Core | economy-and-contracts | Economy does not keep an Influence ledger and does not award Influence | ADR-0008 | covered |
| TR-economy-003 | economy-and-contracts.md | Core | economy-and-contracts | Authored and generated contracts share brief → assembly → mission → debrief | ADR-0003 | covered |
| TR-economy-004 | economy-and-contracts.md | Core | economy-and-contracts | Quiet replay zeros the whole net payout, including optional bonuses | ADR-0004 | covered |
| TR-economy-005 | economy-and-contracts.md | Core | economy-and-contracts | Partitioned deploy snapshot Economy slice (Reward, bonus defs, quietReplay) | ADR-0009 | covered |
| TR-economy-006 | economy-and-contracts.md | Core | economy-and-contracts | Economy owns generated contract instances; live home is worldStore.contracts / contractRngState / nextContractT | ADR-0012 | covered |
| TR-economy-007 | economy-and-contracts.md | Core | economy-and-contracts | Tactical counts civiliansHit; Economy prices collateral and net_payout | ADR-0009 | covered |
| TR-economy-008 | economy-and-contracts.md | Core | economy-and-contracts | Debrief Credits apply once; abort writes nothing | ADR-0002 | covered |
| TR-economy-009 | economy-and-contracts.md | Core | economy-and-contracts | Tax deposit is the emitted amount; Economy does not recompute yield | ADR-0008 | covered |
| TR-research-001 | research.md | Core | research | Research sync(t) after Screen tick or win ETA; laboratories are frozen in the field | ADR-0001 | covered |
| TR-research-002 | research.md | Core | research | Ballistics is unslotted and squad-wide; slotted bays wear one blueprint; effects sample at deploy | ADR-0005 | covered |
| TR-research-003 | research.md | Core | research | Death drops assignment, not the program; unpinned bays follow current issue | ADR-0005 | covered |
| TR-research-004 | research.md | Core | research | Research deploy-slice is the completed unslotted set only; resolved wear is not on this slice | ADR-0009 | covered |
| TR-research-005 | research.md | Core | research | Authorize via Economy debit; Research has no Credits ledger; abort does not refund | ADR-0002,ADR-0013 | covered |
| TR-research-006 | research.md | Core | research | Completions after the deploy freeze apply on the next deploy only | ADR-0002,ADR-0005,ADR-0009 | covered |
| TR-persistence-001 | persistence-and-validation.md | Core | persistence-and-validation | A mission in progress is memory-only; there is no mid-mission resume | ADR-0002 | covered |
| TR-persistence-002 | persistence-and-validation.md | Core | persistence-and-validation | Three slots — campaign blob, settings, telemetry; New Operation does not reset preferences | ADR-0011 | covered |
| TR-persistence-003 | persistence-and-validation.md | Core | persistence-and-validation | Four Screens autosave; mission and debrief do not | ADR-0002,ADR-0011 | covered |
| TR-persistence-004 | persistence-and-validation.md | Core | persistence-and-validation | Debrief applies once in session memory; durable commit is the next Screen autosave | ADR-0011 | covered |
| TR-persistence-005 | persistence-and-validation.md | Core | persistence-and-validation | Hydrate opens at menu; Research and Roster sync(t) to saved t; reload grants no offline hours | ADR-0001,ADR-0002,ADR-0011 | covered |
| TR-persistence-006 | persistence-and-validation.md | Core | persistence-and-validation | An invalid or unreadable campaign blob is dropped all-or-nothing; no half-load | ADR-0011 | covered |
| TR-persistence-007 | persistence-and-validation.md | Core | persistence-and-validation | World Event stream and candidate market serialize RNG across reload | ADR-0011 | covered |
| TR-persistence-008 | persistence-and-validation.md | Core | persistence-and-validation | Telemetry is opt-in, local, capped at 60 records, and never leaves the machine | ADR-0015 | covered |
| TR-roster-001 | roster-and-assembly.md | Feature | roster-and-assembly | Deploy gate requires 1–4 Ready operatives; empty bays are legal; squad mass must be ≤ 400 kg | ADR-0019 | covered |
| TR-roster-002 | roster-and-assembly.md | Feature | roster-and-assembly | Wear, Experience, items, mass, and mass tier freeze when the mission is created | ADR-0002,ADR-0005,ADR-0009 | covered |
| TR-roster-003 | roster-and-assembly.md | Feature | roster-and-assembly | Injury recovery and the candidate market run on strategic t; a win ETA can finish recovery | ADR-0001 | covered |
| TR-roster-004 | roster-and-assembly.md | Feature | roster-and-assembly | Quiet replay still applies KIA, injury, and Experience | ADR-0004 | covered |
| TR-roster-005 | roster-and-assembly.md | Feature | roster-and-assembly | Roster slice owns resolved wear and ordered appliedIds; Research slice is the unslotted set only | ADR-0009 | covered |
| TR-roster-006 | roster-and-assembly.md | Feature | roster-and-assembly | Abort writes no roster; debrief applies roster once | ADR-0002 | covered |
| TR-roster-007 | roster-and-assembly.md | Feature | roster-and-assembly | An empty incomplete roster fails the campaign; a completed campaign stays complete after a wipe | ADR-0020 | covered |
| TR-tactical-001 | tactical-mission.md | Feature | tactical-mission | District, weather script, Opening hour, and objectives share one seed and one unsaved lifetime | ADR-0002,ADR-0006,ADR-0007 | covered |
| TR-tactical-002 | tactical-mission.md | Feature | tactical-mission | Five verbs plus auto-acquire; custom TypeScript sim with no physics engine | ADR-0016 | covered |
| TR-tactical-003 | tactical-mission.md | Feature | tactical-mission | Weather is a determined script with at most one adjacent change; the brief tells the truth | ADR-0006 | covered |
| TR-tactical-004 | tactical-mission.md | Feature | tactical-mission | Opening hour is per-mission; lighting is frozen; it does not change sight, noise, or risk | ADR-0007 | covered |
| TR-tactical-005 | tactical-mission.md | Feature | tactical-mission | Tactical clock is independent of strategic time; in-mission pause freezes it | ADR-0001 | covered |
| TR-tactical-006 | tactical-mission.md | Feature | tactical-mission | A missed round continues down the fire lane; the first Unit before cover is hit; Tactical counts N | ADR-0016 | covered |
| TR-tactical-007 | tactical-mission.md | Feature | tactical-mission | Deterministic 96×96 m citygen and one-metre walk grid from the mission seed | ADR-0016 | covered |
| TR-tactical-008 | tactical-mission.md | Feature | tactical-mission | Camera is fixed 45° yaw / 55° elevation / 25° FOV, zoom 44–115 m; no rotate or tilt; minimap up equals screen up | ADR-0016 | covered |
| TR-tactical-009 | tactical-mission.md | Feature | tactical-mission | Hardened is a discrete profile; it must not hide minimap information | ADR-0016 | covered |
| TR-tactical-010 | tactical-mission.md | Feature | tactical-mission | Win or Loss shows a HUD result then debriefs after 2.5 s; abort emits no outcome DTO | ADR-0002 | covered |
| TR-tactical-011 | tactical-mission.md | Feature | tactical-mission | quietReplay is stamped from the frozen Economy slice, not live contractsWon | ADR-0009 | covered |
| TR-interface-001 | interface.md | Presentation | interface | One corporate OS; palette from index.css and tokens.ts; no public/ art; DOM around the 3D scene | ADR-0017 | covered |
| TR-interface-002 | interface.md | Presentation | interface | 1280×720 must not clip or truncate; critical state is never color-only; Quality is not a design lever | ADR-0010,ADR-0017 | covered |
| TR-interface-003 | interface.md | Presentation | interface | Session phase router is Menu, four Screens, Mission, and Debrief | ADR-0017 | covered |
| TR-interface-004 | interface.md | Presentation | interface | Per-frame unit data stays out of React state; the scene reads the world imperatively | ADR-0010 | covered |
| TR-interface-005 | interface.md | Presentation | interface | Mission canvas uses WebGPURenderer, await init(), and r3f createRoot — not stock Canvas | ADR-0010 | covered |
| TR-interface-006 | interface.md | Presentation | interface | Pause Abort is two-step; there is no mid-mission save chrome | ADR-0002 | covered |
| TR-interface-007 | interface.md | Presentation | interface | One remap table; pause, operative slots, and mouse are reserved; keyboard and mouse, desktop only | ADR-0017 | covered |
| TR-audio-001 | audio.md | Presentation | audio | Four channels plus master and mute live in the settings slot, not the campaign blob | ADR-0011,ADR-0017 | covered |
| TR-audio-002 | audio.md | Presentation | audio | Strategy bed owns the four Screens; mission bed owns the district; rain follows live weather | ADR-0006,ADR-0017 | covered |
| TR-audio-003 | audio.md | Presentation | audio | Unavailable or late audio must not block play or dump as a delayed burst; unseeded jitter must not change outcomes | ADR-0017 | covered |
| TR-audio-004 | audio.md | Presentation | audio | No spoken VO, no spatial shooter mix, and no payout celebration sting | ADR-0017 | covered |
| TR-tactical-012 | tactical-mission.md | Feature | tactical-mission | A Win and a total squad wipe in the same step resolve as the Win — required completion wins; deaths still grade KIA | ADR-0016 | covered |
| TR-interface-008 | interface.md | Presentation | interface | A pyrrhic win (same-step wipe-Win on an incomplete campaign) pays the full win outcome; the CAMPAIGN FAILED banner takes precedence and the invoice notes PYRRHIC — SQUAD LOST // CAMPAIGN FAILED | ADR-0020 | covered |

## Foundation gaps

None.
