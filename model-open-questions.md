# Palmon Calculator – Model Questions & Validation Log

This file tracks game mechanics that are intentionally unresolved or have been experimentally confirmed.

The goal is to distinguish:
- implementation bugs,
- deliberate placeholders,
- and game mechanics that still need validation.

---

## Open

### Evolution – exact Elemental Counter math
**Status:** Open

**Known**
- Base element counters currently used by the calculator:
  - Water > Fire
  - Electric > Water
  - Earth > Electric
  - Fire > Earth
- The known base counter benefit is currently treated as an offensive and defensive counter effect.
- Evo4 grants `Elemental Counters +50%`.
- Evo7 can further increase:
  - damage dealt to the countered element by `+0.5%` per talent level;
  - damage taken reduction from the countered element by `+0.5%` per talent level.

**Unknown**
- Whether the offensive counter effect is internally `Final Damage`.
- Whether the defensive counter effect is internally `Final Damage Taken Reduction`.
- Whether Evo4 `+50%` means:
  - multiply the existing counter effect by `1.5` (for example 10% -> 15%), or
  - add 50 percentage points to a separate counter coefficient.

**Current implementation**
- Store the effects separately as:
  - `elementCounterDamageBonus`
  - `elementCounterDamageTakenReduction`
- Do not convert them into `finalDamage` / `finalDamageTakenReduction` until verified.

---


### SSR / SR Ascension scaling
**Status:** Open

**Known**
- UR Ascension is well measured.
- SSR and SR 0★ level-growth behavior is measured independently.

**Unknown**
- Whether SSR and SR use the same Ascension curve shape as UR.
- Exact SSR/SR Ascension scaling.

---

### Palmanac stat composition
**Status:** Partially understood

**Unknown**
- Exactly which account-wide systems are included in the Palmanac stat display.
- Whether Palmanac values include the same Bloodmoon/account effects as the actual Palmon stat screen.

**Implementation rule**
- Do not call Palmanac values naked/base stats. Treat them as reference/display stats unless their included systems are known.

---

### Boss Palmon elemental-counter effects
**Status:** Open

**Known**
- Boss Palmon data contains effects such as `counterFire`, `counterWater`, etc.

**Unknown**
- Exact combat semantics.

**Implementation rule**
- Do not automatically translate these into `finalDamage` or `finalDamageTakenReduction` until verified.

---

### Evo6 – Squad Size per Palmon Deployed scope
**Status:** Needs confirmation

**Known**
- Evo6 grants `Squad Size per Palmon Deployed +20` as the stage unlock effect.

**Unknown**
- Whether this is strictly tied to the evolved Palmon while deployed or has a broader account/squad scope.

**Current implementation**
- Stored as a self-scoped permanent `squadSizePerPalmonDeployed` effect.

---

## Resolved / Confirmed

### Ascension – Level dependency

Confirmed:
- Ascension RAW growth is effectively independent of Palmon level.
- Same Escarffier UR Defender, same account state:

0-0 -> 0-1

Lv1:
ATK +651
DEF +161
HP +31,200

Lv100:
ATK +652
DEF +161
HP +31,201

Lv200:
ATK +652
DEF +161
HP +31,201

Lv300:
ATK +657
DEF +162
HP +31,399

Explanation for Lv300:
- Bloodmoon Lv270 adds +2 percentage points to ATK / DEF / HP.
- Ascension RAW growth is applied before percentage bonuses.
- Therefore the same RAW Ascension increase appears slightly larger on the visible stat screen.

Conclusion:
Ascension does not need a level-dependent scaling function.

---

### UR Ascension curve shape
Status: Resolved

Confirmed:
- UR Attacker and UR Defender use the same normalized Ascension progression.
- Lucidina (UR Attacker) and Escarffier (UR Defender) produce nearly identical
  normalized step ratios for ATK, DEF and HP.
- Different account bonus states do not affect the normalized curve shape because
  the constant percentage multiplier cancels when steps are normalized.

Conclusion:
UR Ascension can be modeled as:

stat-specific Palmon Ascension scale
×
universal UR stat-specific Ascension curve

Remaining question:
How the Palmon-specific ATK / DEF / HP Ascension scale is derived from its base stats.

---

### ATK / DEF / HP percent bonuses are additive
**Status:** Confirmed experimentally

Bloodmoon measurements independently confirmed the same behavior for all three main stats.

Example structure:

```text
finalStat = (rawStat + flatBonuses) * (1 + totalPercent / 100)
```

Percentage-point additions enter the same pool rather than multiplying each other sequentially.

Examples:
- Lv270 Bloodmoon: `+2% ATK / DEF / HP`
- Lv310 Bloodmoon: another `+4% ATK / DEF / HP`

---

### Flat main-stat bonuses are applied before the percent pool
**Status:** Confirmed experimentally

Examples:
- Lv250 Bloodmoon `Attack +500`
- Lv260 Bloodmoon `HP +100,000`

The visible increase shows that these flat values are subsequently multiplied by the applicable percentage pool.

---

### Post-Lv300 UR level growth
**Status:** Confirmed

UR Attacker RAW growth per level:
- Attack `+240`
- Defense `+40`
- HP `+60,000`

UR Defender corresponds to the confirmed role profile:
- Attack `+200`
- Defense `+48`
- HP `+72,000`

---

### Role bonus behavior
**Status:** Confirmed

Attacker:
- Attack `+20%`

Defender:
- Defense `+20%`
- HP `+20%`

The role effect belongs to the additive percentage layer, not to the RAW level curve.

---

### 4★ Palmon skill activation
**Status:** Confirmed

- The fourth Palmon skill unlocks at the actual `4-0★` state.
- The Ascension preview can omit the effect, which previously made it appear as if the skill activated at `4-1★`.
- The actual stat screen confirms that the effect is already active at `4-0★`.

The commonly observed UR skill provides:
- Attack `+20%`
- Defense `+20%`
- HP `+20%`

This is modeled as a Palmon skill, not as a generic rarity rule.

---

### Skill availability structure
**Status:** Confirmed

- Skill 1: Normal Attack – always available.
- Skill 2: Rage Skill – always available; normal attacks build Rage and the Rage Skill triggers at 100 Rage.
- Skill 3: Individual Palmon skill – always available.
- Skills 1–3 are strengthened by whole stars.
- Skill 4 unlocks at 4★.
- Skill 5 unlocks at Evo3.
- Skill 6 unlocks through Mega Evolution / Evo5.
- Completing Evo8 gives Skill 6 an additional bonus effect.

---

### Permanent vs in-battle effects
**Status:** Confirmed as required model distinction

Effects that are only active during battle must not alter normal displayed Palmon stats.

The calculator therefore separates:
- permanent effects,
- battle effects,
- conditional battle effects.

This same distinction is used for Research and Palmon skills.

---

### Evolution progression is linear
**Status:** Confirmed

- Each talent has 10 levels.
- The next talent unlocks only after the current talent reaches `10/10`.
- The next Evo stage unlocks only after all talents in the previous stage are complete.
- A current Evolution state can therefore be represented by:
  - Evo stage,
  - current talent index,
  - current talent level.
- Previous stages/talents are implicitly `10/10`; future talents are implicitly `0/10`.

---

### Evolution stage unlock effects are cumulative
**Status:** Confirmed

Example:
- Evo1 Attack +5%
- Evo2 Attack +10%

At Evo2 both remain active, yielding +15% from those two stage unlocks together.

---

### Evo4 account-wide squad talents
**Status:** Confirmed

Attacker Evo4 final talent:
- `+0.5% Squad Attack` per talent level.

Defender Evo4 final talent:
- `+0.7% Squad Defense` per talent level.
- `+0.7% Squad HP` per talent level.

These bonuses:
- apply account-wide to all squads;
- remain active even when the evolved Palmon is not deployed.
