# Mission playbook

How to win a mission during a click-through, when a change needs a real Debrief and World Network return (click-through step 5). Written from the WN-017 run on 2026-10-13: a clean first win on Glass Veil after two losses.

Gameplay is deterministic from `mission.seed`, so the positions below hold for Glass Veil on a New Operation. Other contracts need their own layout read first (see [Reading the mission](#reading-the-mission)).

## Rules of the run

- Play through the sim's own order calls or the mouse and keys. Read any state you like; write none. Setting `influence`, `outcome` or any other store field is not a win, and evidence built on it must say it was seeded.
- Abort from pause writes nothing to the campaign. If a civilian is hit and you need a clean win, pause, abort and redeploy.
- A clean win means `civiliansHit === 0`. Squad casualties do not affect it.
- Start from a New Operation when the check needs Influence 0. A loss awards no Influence, so a lost attempt does not spoil the start value, but it does cost operatives.

## Driving it from the browser

With the dev server running (`npm run dev -- --strictPort`, or `preview_start` with `.claude/launch.json` in the desktop app), the page can import the live modules. Vite serves them at the same URLs the app uses, so these are the running instances. This works only on the dev server, not on a production build.

```js
const rt = await import('/src/game/runtime.ts')
const ms = (await import('/src/state/missionStore.ts')).useMissionStore
const w = rt.getWorld()          // null until the mission scene mounts
ms.getState().setPaused(true)    // same as the Pause button
```

Step the fight: unpause for 0.5–1 s, pause, read `w.units`, issue orders, repeat. Orders are the calls the input layer makes:

| Call | Equivalent input |
|---|---|
| `w.orderMove([id], {x, z})` | right-click ground |
| `w.orderAttack([id], targetId)` | right-click a hostile |
| `w.orderHold(ids, true)` | H |
| `w.orderUseMed([id])` | medkit item |
| `w.orderAbility(ids)` | Q |
| `w.orderGrenade(ids, {x, z})` | grenade targeting; first selected operative in range throws; returns false when unavailable (comm line on no thrower / bad target / out of range) |

Use `hasLos(w.city, a, b)` from `/src/game/pathfind.ts` to test sight lines. It takes the city, not `city.walk`.

## Reading the mission

Pause at load and dump the board before moving:

```js
w.mission.objectives                 // ids, kinds, eliminate-tag targets
w.city.checkpoint, w.city.extraction // zone centres and radii
w.units.map(u => [u.id, u.kind, u.tag, u.archetype, u.pos, u.weapon?.range])
```

Missed rounds keep flying out to the weapon's range and hit the first body in the lane (`strayVictim` in `src/game/world.ts`). Pick firing positions where nothing civilian stands behind the targets.

## Glass Veil (m01, SEVERE)

Board at deploy: the squad spawns at (48, 89); extraction is at (48, 88), r 4; the checkpoint gate is at (48, 14), r 6. The garrison (e1–e7, tag `garrison`) holds the plaza around x 42–54, z 10–19. It includes a heavy (e2) and a marksman (e7, range 26). Eight more patrol the map. A crowd of civilians stands at x 46–52, z 22–29, just south of the gate on the avenue.

1. **Leave auto-fire on.** The squad engages on its own. Putting everyone on hold fire and choosing targets by hand lost a run when the custom check vetoed every shot.
2. **Go up the west side:** (30, 80) → (30, 55) → (30, 38). Auto-fire takes the west patrols e11, e14 and e9 one at a time. Use a medkit on anyone under ~45%.
3. **Take the firing spot around (36, 25):** rifle (a1) at (36.5, 25.5), the others within a unit behind it, then hold ground. From here the garrison is 11–15 away with sight lines into the plaza, and the civilians are off to the side, not behind the targets.
4. **Fire abilities as the garrison alerts.** It comes at you in a spread, not one clump, so grenades rarely find two targets.
5. **Watch the east.** Avenue patrols e8 and e13 flank in from around (45, 32) once the shooting starts.
6. **Pull anyone under ~30% back to (29.5, 34)** and fight the last garrison units from there.
7. **When `ob2` completes,** walk the survivors into the gate zone at (44, 15). `ob1` and `ob2` then tick together.
8. **Extract down the west side:** (30, 30) → (30, 55) → (30, 80) → (48, 88). The remaining east patrols did not intercept.

The winning run took 75 s of mission time and lost two operatives (Mara, Dart), with collateral 0. Expect the Debrief to show +2 days elapsed and Influence to go 0 → 8.

## After the win

- The Debrief applies the outcome on entry (`lastAppliedKey` equals `outcome.applyKey`). Influence and the ETA jump are already in the stores before you press RETURN TO WORLD NETWORK.
- After a 2-day ETA the catch-up adds more than 40 Feed events, and the `MAX_EVENTS` cap evicts the mission-result entry, so the win will not appear in the Feed on return. The GDD accepts this (`design/gdd/world-network.md`, post-win criterion); do not report it as a defect.
- Stop the dev server and confirm nothing is listening on port 4200.
