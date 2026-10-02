# Palmon Calculator – TODO

This file tracks planned product and implementation work.

Game mechanics that are still uncertain or need validation belong in
[`model-open-questions.md`](./model-open-questions.md) instead.

---

## Equipment

### Implemented
- [x] UR and SSR Equipment inventory
- [x] Stable Equipment instance IDs for later Palmon assignment
- [x] Multiple copies of the same Equipment
- [x] Automatic numbering for duplicate Equipment
- [x] Enhancement Lv0–100 controls with direct input, slider, ±1, ±10 and MAX
- [x] Ascension 0–10 controls
- [x] Live Equipment stat calculation
- [x] Ascension extra-effect display
- [x] Unlimited / Budget Build modes
- [x] Per-item Budget baseline
- [x] Current → Planned comparison
- [x] Per-item and global Reset Plan
- [x] Temperit inventory calculator
- [x] Opus Pearl budget
- [x] Equipment inventory summary
- [x] Equipment How to Use help
- [x] Equipment filters: All / Changed / UR / SSR
- [x] Collapsible Equipment cards
- [x] Collapsible Equipment categories
- [x] Expand All / Collapse All inventory controls
- [x] Current → Planned comparison shown only for changed Equipment

### Later
- [ ] Assigned / Unassigned status
- [ ] Show assigned Palmon and Team on Equipment cards
- [ ] Direct "Equip to Palmon" action
- [ ] Optional Equipment nicknames
- [ ] More detailed build comparison if needed
- [ ] Drag & Drop assignment as an optional desktop interaction
- [ ] Specialized Equipment optimization only after combat goals can be defined clearly

---

## Achievements

### Implemented
- [x] Unlimited / Budget Build modes
- [x] How to Use help
- [x] Budget baseline snapshot
- [x] Current → Planned level and UR Token comparison for changed Achievements
- [x] Reset Plan

---

## Team Overview

- [ ] Create and save multiple Teams
- [ ] Allow 1–7 Palmons per Team
- [ ] Configure Palmon level, Ascension, Evolution, Traits and Skills
- [ ] Assign saved Equipment instances to Palmons
- [ ] Maximum one Weapon, Shield, Accessory and Headgear per Palmon
- [ ] Prevent the same Equipment instance from being assigned to multiple Palmons
- [ ] Surface Equipment assignment back in the Equipment tab
- [ ] Calculate final Palmon Attack / Defense / HP
- [ ] Display secondary and combat stats where applicable
- [ ] Same-element Squad bonus
- [ ] Element-counter context
- [ ] Team / Squad conditional effects

---

## Account-wide Bonus Sources

- [x] Achievements
- [x] Research
- [x] Boss Palmon
- [ ] Element Totems
- [ ] Player Gear
- [ ] Dream Island boosts
- [ ] Additional future account-wide systems

The final Palmon calculator should consume these through an extensible bonus-source
architecture instead of hard-coding a fixed list of systems.

---

## Persistence / Quality of Life

- [ ] Export calculator state
- [ ] Import calculator state
- [ ] Consider named build presets after Team creation
- [ ] Add targeted validation tests for confirmed Palmon and Equipment formulas

---

## Nice to Have

- [ ] Compare two Team builds
- [ ] Compare two Palmon builds
- [ ] Shareable build representation
- [ ] Team-focused optimization tools only when the optimization target is explicit
