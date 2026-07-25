# UI/UX improvements: inspiration vs in-game

Captured from the dev build (commit f2ec775) at a 1280x720 viewport, walking the full flow with the default squad: menu, world map, mission brief, team select, mission. Each section compares one inspiration image against the live screen and lists improvements ordered by impact. The research reference has no in-game counterpart, so its section is a build list. Shared problems sit in the cross-cutting section at the end.

## 01-world-map.png vs World Network screen

The screen matches the reference's skeleton (three columns, bottom strip, nav tabs), but the map carries almost no data and several panels claim more than the game holds.

1. Tint territories by controlling corporation. Every landmass renders in the same olive tone while the CONTROL KEY legend lists five corporation colors that appear nowhere on the map. Wire the land tints to the key or drop the key.
2. Make sector rows interactive. Clicking EUROPE or ASIA does nothing: the rows are static divs, EUROPE is hardcoded as selected, and the right panel always shows the European sector. In the reference the selected row drives the inset map, stats, and operations list. The inset's paging chevrons are decorative spans too.
3. Stop clipping list content. ANTARCTICA is cut from the sectors panel, and the third operation plus the VIEW SECTOR INTEL button are cut from the operations panel. The 5px transparent scrollbars give no hint that more exists.
4. Fix sector name truncation ("NORTH AMERI…", "SOUTH AMERI…"). Reduce letter-spacing or widen the name column.
5. Add map depth and light. The reference sells the screen with city glow, graticule labels, colored borders, animated arcs, and radar pulses at conflict points; the in-game plate has faint dashes and 2px dots. Cheap wins: brighter animated arcs, city-light clusters, latitude labels, a slow radar sweep.
6. Add the time control cluster or drop the dead clock. The reference has a timeline scrubber and a play/pause/speed transport; the game shows a static date next to a ticking clock. If world time never advances, the date block is noise.
7. Make the events feed real. Three fixed rows and a permanent "3 UNREAD" badge never change. Feed it from world state, or trim it to flavor text without the badge.
8. Give nav tabs icons and states. Four of five tabs are disabled with no explanation. Add per-tab icons like the reference, plus a lock tooltip ("REQUIRES INTEL LVL 2"), or hide unbuilt tabs.
9. Strengthen mission markers: a hover tooltip with type, chance, and ETA (now only in the right panel), a clearly distinct locked state, and a brighter pulse on the one clickable marker.
10. INTEL LEVEL in the resource pool is a bare bar; give it a number like every other row.

## 02-mission-brief.png vs Mission Brief screen

The dossier column tracks the reference closely; the two map panels carry too little signal and the footer loses a block at common window widths.

1. Fix the recon feed collision: the TARGET callout box overlaps the ALT/RNG/TRK readout stack, and the callout text overflows its own frame. Anchor the callout clear of the readouts and size the box to its text.
2. Raise the recon feed's contrast. Building blocks are near-invisible on the dark plate; the reference reads as an IR satellite photo with one glowing target. Brighten block edges, add window speckle, and let the target volume glow.
3. Restore the comms log below 1350px width. `.mb-comms` is display:none under that breakpoint, so at 1280x720 the footer shows RETURN, a void, then the CTA. Let the log shrink instead of vanish.
4. Draw the tactical map from the real mission layout. The blocks are random rectangles unrelated to the generated city, so the routes and points promise a layout the mission never delivers. citygen already builds the district; project it into this panel.
5. Keep the reward on one line. "85,000 CR" wraps the unit onto its own row; the reference right-aligns one line with a smaller unit mark.
6. Surface the mission notes. They exist in data but sit below the dossier fold behind an invisible scrollbar, so at this size they are never seen. Compress the dossier's vertical rhythm or add a scroll cue.
7. PATROL ROUTE appears in the legend but never on the map. Draw patrols or cut the row.
8. Give the dossier portrait presence or drop it. The current silhouette is a small dark box beside the fields; the reference uses a large scanned figure with corner brackets and an ID chip.

## 03-team-selection.png vs Operative Assembly screen

The layout matches the reference; the core interaction model and the lower half of the detail panel need work.

1. Separate inspect from assign. Clicking a roster row both toggles squad membership and opens the detail panel, so reading up on an operative adds or removes them from the squad. Click should focus; a separate control (chevron, double-click, or an add button) should assign. This is the screen's biggest flaw.
2. Unclip the detail panel. At 1280x720 the SECONDARY weapon is cut mid-silhouette and the INVENTORY grid is unreachable unless the player discovers an invisible scrollbar.
3. Fill the bays. The portrait bust floats mid-panel with the whole top half empty dark glass; the reference fills each case with a full-body figure. Scale the bust, add a body silhouette, or shorten the bay.
4. Stop mid-word truncation in the footer role cards: "BREAC…", "LONG R…", "AREA DE…". Shorten the copy to fit the card.
5. Keep "342.9 KG" on one line in the deployment mass block, with the "/ 400.0 KG LIMIT" beside it as in the reference.
6. Make the roster indices legible. They map rows to bay numbers but render near-black.
7. Show true counts. The header claims "8 / 24" with 8 operatives in the data, and there is no FILTER control to justify a database framing. Use real numbers now; add the filter when the roster grows.
8. Worth stealing from the reference once loadouts become editable: an AUTO-EQUIP button, four stat lines per bay instead of two, and a bottom strip putting mission profile, threat, and weather next to the deploy decision.

## 04-research.png vs (no research screen)

The game has no research screen; the world map's RESEARCH tab is disabled. This list is a build order, smallest step first.

1. Decide the tab's fate now: hide it until the screen exists, or label the lock so it reads as progression instead of dead UI.
2. Build the v1 core from the reference: three branch columns (ballistics, cybernetics, control systems) of hex nodes in three states (researched, in progress, locked), plus a detail panel with description, prerequisites, projected benefit, and an AUTHORIZE CTA.
3. Tie nodes to systems that already exist: the WEAPONS table and the augmentation strings in data.ts are natural unlocks, and credits the funding source.
4. Defer the queue, per-lab funding sliders, and completion forecast to v2; they only matter once research time is a real resource.
5. Compose it from the existing Panel/Chip/SegBar kit so it lands consistent with the other screens.

## 05-gameplay-ui.png vs in-mission HUD

The HUD skeleton matches the reference well. The gaps are feedback, dead controls, and the deploy transition.

1. Cover the world-build gap. After DEPLOY TEAM the screen sits for several seconds as a black scene with an empty HUD ("SQUAD LINK 0 ONLINE") before the city appears. Keep the ESTABLISHING SQUAD LINK splash up until the first rendered frame.
2. Add a confirm step to ABORT. One click discards the mission and returns to the world map.
3. Distinguish selected from active. All four agents spawn selected, which is fine, but the selected card treatment barely differs from the base card, and the weapon bar silently shows the first selected agent's loadout. Brighten selection and mark the active agent the bar describes.
4. Wire or restyle the ability slots. Five glyphs with hotkey numbers render permanently dim and do nothing, which reads as broken. Implement one (grenade), or style the row as locked progression.
5. Make the minimap honest: the + and - buttons only play a click sound. Add zoom or remove them, and add a camera viewport rectangle and an objective marker.
6. Add in-world unit feedback. The reference shows numbered tags and health pips above squad members, bright selection rings, and a dotted move path with a destination node; in-game units carry no overhead identity and the ring is faint at default zoom.
7. Brighten squad card portraits; at 40px on dark glass the faces read as black squares against the reference's lit portraits.
8. Fix secondary weapon truncation ("S-18 PISTO…") caused by the 146px cap below 1360px width.
9. Item counts are hardcoded (02 MED, 01 CELL) rather than read from inventory; bind them to data or drop the panel until items exist.
10. Comm log: long entries wrap to a full-width second line so timestamps stop aligning; add a hanging indent. The alert/ok color classes exist but most entries land as dim sys text; color more event types the way the reference colors speakers.

## Cross-cutting

1. Scroll affordances. Scrollbars are 5px and near-transparent everywhere, and five panels across three screens depend on them. Add a hover-visible scrollbar and an edge fade so cut content announces itself.
2. Pick a minimum supported window size and audit at it. Nearly all truncation and clipping above appears at 1280x720, a common laptop viewport; the layouts feel tuned for 1440 and up.
3. Remove UI that claims data or function the game lacks: the control key, the patrol legend row, the unread badge, "/ 24" and "/ 120" roster counts, inset paging chevrons, minimap zoom, ability slots, static weather chips. Each one teaches the player to ignore the interface; wire them or cut them.
4. No button on any screen exposes an accessible name; markers, operations, roster rows, bays, and CTAs all read as anonymous buttons. Add aria-labels: it fixes screen readers and makes the UI scriptable for tests.
5. Type hierarchy. Almost everything sits at 8.5 to 10px tracked uppercase, so key numbers never jump the way the references' 68%, 85,000, and ammo counts do. Keep labels small; push primary values up a size class.
6. The CRT overlay dims small HUD text. The references keep grain on the scene and leave type crisp; exclude the text layer from the overlay or halve its opacity.
