# Architecture Traceability Index
Last Updated: 2026-09-11 (second pass)
Engine: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 WebGPU
Source review: `docs/architecture/architecture-review-2026-09-11.md`
TR registry: `docs/architecture/tr-registry.yaml`
Prior index: 2026-09-10 (44 covered / 4 partial / 16 gaps)

## Coverage Summary
- Total requirements: 64
- Covered: 64 (100%)
- Partial: 0
- Gaps: 0

ADRs 0001–0008 cite `docs/game-design.md`. ADRs 0009–0020 cite `design/gdd/*.md` TR-IDs. Coverage is from ADR decision text (implicit counts as covered). All covering ADRs are Accepted (second pass: ADR-0013, ADR-0016, ADR-0017, ADR-0019, ADR-0020 Accepted).

## Full Matrix

| Requirement ID | GDD | System | Requirement | ADR Coverage | Status |
|---------------|-----|--------|-------------|--------------|--------|
| TR-world-network-001 | world-network.md | World Network | Strategic and tactical clocks are independent; the World Network does not tick in the field | ADR-0001 | ✅ |
| TR-world-network-002 | world-network.md | World Network | Only two advancement paths: Screen ticking and win-ETA catch-up; a loss spends none | ADR-0001 | ✅ |
| TR-world-network-003 | world-network.md | World Network | Catch-up fires one next due at its timestamp; rearm from due `t`; fixed collision order | ADR-0018 | ✅ |
| TR-world-network-004 | world-network.md | World Network | Debrief write-back at frozen `t0`, then ETA jump | ADR-0001, ADR-0002 | ✅ |
| TR-world-network-005 | world-network.md | World Network | Influence is a spendable wallet (Stabilize/Lobby/Expedite); no index or standing bar | ADR-0008 | ✅ |
| TR-world-network-006 | world-network.md | World Network | Tax yield computed by World Network, emitted to Economy; Nexus-held only | ADR-0008 | ✅ |
| TR-world-network-007 | world-network.md | World Network | Intel is World Network’s access resource; live home is `campaignStore.intelLevel` / `intelProgress` | ADR-0012 | ✅ |
| TR-world-network-008 | world-network.md | World Network | Deploy snapshot WN slice; no live store handles; no live mission or roster query | ADR-0002, ADR-0009 | ✅ |
| TR-world-network-009 | world-network.md | World Network | Outcome DTO applied once at debrief; abort writes nothing | ADR-0002 | ✅ |
| TR-world-network-010 | world-network.md | World Network | Quiet replay: 0 Influence/Intel, no Control/Unrest shove; ETA still catch-up | ADR-0004 | ✅ |
| TR-world-network-011 | world-network.md | World Network | Timeline Review is not an advancement path | ADR-0014 | ✅ |
| TR-world-network-012 | world-network.md | World Network | Strategic clock runs only on the four Screens | ADR-0001 | ✅ |
| TR-economy-001 | economy-and-contracts.md | Economy | Credits ledger never negative; overdraft refuse; exact-balance spend allowed | ADR-0013 | ✅ |
| TR-economy-002 | economy-and-contracts.md | Economy | Economy does not keep Influence or award it | ADR-0008 | ✅ |
| TR-economy-003 | economy-and-contracts.md | Economy | Authored and generated contracts share brief → assembly → mission → debrief | ADR-0003 | ✅ |
| TR-economy-004 | economy-and-contracts.md | Economy | Quiet replay zeros the whole net, including optionals | ADR-0004 | ✅ |
| TR-economy-005 | economy-and-contracts.md | Economy | Partitioned deploy snapshot Economy slice (Reward, bonus defs, `quietReplay`) | ADR-0009 | ✅ |
| TR-economy-006 | economy-and-contracts.md | Economy | Economy owns generated instances; live home is `worldStore.contracts` / `contractRngState` / `nextContractT` | ADR-0012 | ✅ |
| TR-economy-007 | economy-and-contracts.md | Economy | Tactical counts `civiliansHit`; Economy prices `collateral` / `net_payout` | ADR-0009 | ✅ |
| TR-economy-008 | economy-and-contracts.md | Economy | Debrief Credits apply-once; abort writes nothing | ADR-0002 | ✅ |
| TR-economy-009 | economy-and-contracts.md | Economy | Tax deposit is the emitted amount; do not recompute yield | ADR-0008 | ✅ |
| TR-research-001 | research.md | Research | `sync(t)` after Screen tick or win ETA; labs frozen in the field | ADR-0001 | ✅ |
| TR-research-002 | research.md | Research | Ballistics unslotted/squad-wide; slotted bays wear one blueprint; sample at deploy | ADR-0005 | ✅ |
| TR-research-003 | research.md | Research | Death drops assignment, not the program; unpinned follow current issue | ADR-0005 | ✅ |
| TR-research-004 | research.md | Research | Research deploy-slice is the completed unslotted set only; resolved wear is not on this slice | ADR-0009 | ✅ |
| TR-research-005 | research.md | Research | Authorize via Economy debit; no research Credits ledger; no refund on abort | ADR-0013 | ✅ |
| TR-research-006 | research.md | Research | Completions after freeze apply on the next deploy only | ADR-0002, ADR-0005, ADR-0009 | ✅ |
| TR-persistence-001 | persistence-and-validation.md | Persistence | Mission in progress is memory-only; no mid-mission resume | ADR-0002 | ✅ |
| TR-persistence-002 | persistence-and-validation.md | Persistence | Three slots: campaign blob, settings, telemetry; New Operation does not reset prefs | ADR-0011 | ✅ |
| TR-persistence-003 | persistence-and-validation.md | Persistence | Four Screens autosave; mission and debrief do not | ADR-0002, ADR-0011 | ✅ |
| TR-persistence-004 | persistence-and-validation.md | Persistence | Debrief applies once in memory; durable commit is the next Screen autosave | ADR-0011 | ✅ |
| TR-persistence-005 | persistence-and-validation.md | Persistence | Hydrate to menu; `sync(t)` to saved `t`; no offline hours | ADR-0001, ADR-0002, ADR-0011 | ✅ |
| TR-persistence-006 | persistence-and-validation.md | Persistence | Invalid/unreadable campaign blob is all-or-nothing; no half-load | ADR-0011 | ✅ |
| TR-persistence-007 | persistence-and-validation.md | Persistence | World Event stream and candidate market serialize RNG across reload | ADR-0011 | ✅ |
| TR-persistence-008 | persistence-and-validation.md | Persistence | Telemetry opt-in, local, cap 60, never leaves the machine | ADR-0015 | ✅ |
| TR-roster-001 | roster-and-assembly.md | Roster | Deploy gate: 1–4 Ready, empty bays legal, mass ≤ 400 kg | ADR-0019 | ✅ |
| TR-roster-002 | roster-and-assembly.md | Roster | Wear, XP, items, mass/tier freeze at mission create | ADR-0002, ADR-0005, ADR-0009 | ✅ |
| TR-roster-003 | roster-and-assembly.md | Roster | Injury recovery and candidate market run on strategic `t`; win ETA can finish recovery | ADR-0001 | ✅ |
| TR-roster-004 | roster-and-assembly.md | Roster | Quiet replay still applies KIA, injury, Experience | ADR-0004 | ✅ |
| TR-roster-005 | roster-and-assembly.md | Roster | Roster slice owns resolved wear and ordered `appliedIds`; Research slice is unslotted only | ADR-0009 | ✅ |
| TR-roster-006 | roster-and-assembly.md | Roster | Abort writes no roster; debrief applies once | ADR-0002 | ✅ |
| TR-roster-007 | roster-and-assembly.md | Roster | Empty incomplete roster fails; completed campaign stays complete after wipe | ADR-0020 | ✅ |
| TR-tactical-001 | tactical-mission.md | Tactical | One seed, unsaved lifetime for district, weather, Opening hour, objectives | ADR-0002, ADR-0006, ADR-0007 | ✅ |
| TR-tactical-002 | tactical-mission.md | Tactical | Five verbs + auto-acquire; custom sim, no physics engine | ADR-0016 | ✅ |
| TR-tactical-003 | tactical-mission.md | Tactical | Weather is a determined script; ≤1 adjacent change; brief tells the truth | ADR-0006 | ✅ |
| TR-tactical-004 | tactical-mission.md | Tactical | Opening hour per-mission; lighting frozen; not sight/noise/risk | ADR-0007 | ✅ |
| TR-tactical-005 | tactical-mission.md | Tactical | Tactical clock independent; in-mission pause freezes it | ADR-0001 | ✅ |
| TR-tactical-006 | tactical-mission.md | Tactical | Fire-lane first Unit is hit; Tactical counts `N` | ADR-0016 | ✅ |
| TR-tactical-007 | tactical-mission.md | Tactical | Deterministic 96×96 citygen / walk grid from mission seed | ADR-0016 | ✅ |
| TR-tactical-008 | tactical-mission.md | Tactical | Camera 45°/55°/25° FOV, zoom 44–115 m; no rotate/tilt; minimap up = screen up | ADR-0016 | ✅ |
| TR-tactical-009 | tactical-mission.md | Tactical | Hardened is a discrete profile; must not hide minimap information | ADR-0016 | ✅ |
| TR-tactical-010 | tactical-mission.md | Tactical | Win/Loss → HUD result → 2.5 s → debrief; abort emits no outcome | ADR-0002 | ✅ |
| TR-tactical-011 | tactical-mission.md | Tactical | `quietReplay` stamped from frozen Economy slice, not live `contractsWon` | ADR-0009 | ✅ |
| TR-interface-001 | interface.md | Interface | One OS; palette `index.css` + `tokens.ts`; no `public/` art; DOM around 3D | ADR-0017 | ✅ |
| TR-interface-002 | interface.md | Interface | 1280×720 no clip; critical state never color-only; Quality is not a design lever | ADR-0010, ADR-0017 — joint | ✅ |
| TR-interface-003 | interface.md | Interface | Phase router: Menu / four Screens / Mission / Debrief | ADR-0017 | ✅ |
| TR-interface-004 | interface.md | Interface | Per-frame unit data stays out of React; scene reads the world imperatively | ADR-0010 | ✅ |
| TR-interface-005 | interface.md | Interface | Mission canvas: `WebGPURenderer` + `await init()` + r3f `createRoot` (not `<Canvas>`) | ADR-0010 | ✅ |
| TR-interface-006 | interface.md | Interface | Pause two-step Abort; no mid-mission save chrome | ADR-0002 | ✅ |
| TR-interface-007 | interface.md | Interface | One remap table; pause/slots/mouse reserved; keyboard+mouse desktop only | ADR-0017 | ✅ |
| TR-audio-001 | audio.md | Audio | Four channels + master + mute live in the settings slot, not the campaign blob | ADR-0011, ADR-0017 | ✅ |
| TR-audio-002 | audio.md | Audio | Strategy bed on four Screens only; mission bed on district; rain follows live weather | ADR-0006, ADR-0017 | ✅ |
| TR-audio-003 | audio.md | Audio | Unavailable/late audio must not block or burst; unseeded jitter must not change outcomes | ADR-0017 | ✅ |
| TR-audio-004 | audio.md | Audio | No spoken VO, no spatial shooter mix, no payout celebration sting | ADR-0017 | ✅ |

## Known Gaps

None. All 64 TRs have an Accepted ADR.

Remaining documentation (not TR gaps): no master `docs/architecture/architecture.md`; ADR-0010 References Consulted omit `modules/tsl.md`; `docs/technical-preferences.md` ADR log stops at ADR-0008 and still lists drei while ADR-0010/0016 forbid drei camera/view kits.

## Superseded Requirements

None. No registry entry was marked deprecated.

No requirement text revised this run. Coverage/ADR fields updated 2026-09-11 for the former 16 gaps and 4 partials. Second pass confirmed all 20 covering ADRs Accepted.

Game-concept still says engine-reference is missing. Documentation drift versus `docs/engine-reference/` (2026-09-08), not a superseded TR.
