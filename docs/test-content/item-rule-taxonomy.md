# The Official Smart Fella Test — Item Rule Taxonomy

> **Status:** design document. No items have been generated. This is the specification a
> generation pass reads *before* writing a single item, and the document someone extends when
> they add a new item type or a new grade band.
>
> **Scope:** one 50-item adult test (15 min, CCAT-modelled) and five 15-item child banks
> (5 min each, CogAT Screening-Form-modelled, Levels 9 / 10 / 11 / 12 / 13-14).
>
> **Why this document exists.** Two reasons, and the second one is the load-bearing one.
> First, it is how difficulty gets scaled deliberately rather than by vibes. Second, it is the
> **provenance record**: every item we ship is derived from a rule written down here, which is
> what makes the set defensibly ours rather than a derivative of a published instrument.
>
> **Not legal advice.** §2 is an operational discipline, in the same spirit as the existing
> `video/compliance.md`. A qualified attorney signs off, not this file.

---

## Table of contents

1. [Design principles](#1-design-principles)
2. [The provenance discipline (legal position)](#2-the-provenance-discipline-legal-position)
3. [The universal distractor framework](#3-the-universal-distractor-framework) ← *the spine of the whole document*
4. [Item type rule vocabularies](#4-item-type-rule-vocabularies)
   - [4.1 Sentence completion](#41-sentence-completion-sc) · [4.2 Verbal analogy](#42-verbal-analogy-va) · [4.3 Antonym](#43-antonym-an) · [4.4 Attention to detail](#44-attention-to-detail-ad)
   - [4.5 Number series](#45-number-series-ns) · [4.6 Letter series](#46-letter-series-ls) · [4.7 Number analogy](#47-number-analogy-na) · [4.8 Word problem](#48-word-problem-wp) · [4.9 Table and graph reading](#49-table-and-graph-reading-tg)
   - [4.10 Figure matrix](#410-figure-matrix-fm) · [4.11 Figure series](#411-figure-series-fs) · [4.12 Figural odd-one-out](#412-figural-odd-one-out-oo)
   - [4.13 Syllogism](#413-syllogism-sy) · [4.14 Seating arrangement](#414-seating-arrangement-sa)
5. [The child difficulty gradient](#5-the-child-difficulty-gradient)
6. [The adult difficulty curve](#6-the-adult-difficulty-curve)
7. [matRiks: findings from an actual install](#7-matriks-findings-from-an-actual-install)
8. [Verification protocol](#8-verification-protocol)
9. [Cultural and regional neutrality](#9-cultural-and-regional-neutrality)
10. [Where I expect quality to suffer](#10-where-i-expect-quality-to-suffer)

---

## 1. Design principles

Five rules that override anything else in this document if they conflict.

**P1 — The answer key is sacred.** A wrong key makes a correct child wrong. Every mechanism in
this document is subordinate to key integrity. Where a rule-based generator can produce the key,
it must, because a generated key cannot be mistyped. Where a human writes the key, §8 applies.

**P2 — Difficulty comes from rule composition, not from obscurity.** A hard item asks you to hold
two or three relations at once. It does not ask you whether you happen to know a rare word. Rare
words are a *secondary* dial on verbal items only, and they are capped (§9).

**P3 — Every distractor is a hypothesis about a mistake.** If you cannot write the sentence
"a solver who picks this made *this specific* error", the distractor is decorative. Replace it.
This is the single rule most likely to be violated and it is the one the reviewer will notice.

**P4 — Exactly one defensible answer.** Not "one best answer". The test is not asking for a
judgement call. If a smart adversarial reader can argue for a second option, the item is broken
even if our intended answer is *better*.

**P5 — Self-contained.** Everything needed to solve the item is inside the item. No world
knowledge, no cultural knowledge, no prior curriculum beyond the arithmetic floor declared per
band in §5.

---

## 2. The provenance discipline (legal position)

**The rule: generate from the taxonomy, never from an example item.**

The failure mode we are avoiding is not "copying". It is *derivation* — starting from a real
published item and changing the surface. That produces a derivative work, and paraphrase is not
a defence. Item banks for commercial instruments are actively protected and the case law does not
favour the paraphraser.

The discipline that avoids it:

| Do | Do not |
|---|---|
| Write the rule first, generate the item from the rule | Start from a real item and swap the nouns |
| Record the rule id on the item (`rule: "VA-R3 part-whole, tier-2"`) | Ship an item whose `rule` field you wrote *after* writing the item |
| Copy *structure* that is factual and public (a battery has three subtests; a 3×3 matrix has nine cells) | Copy *content* (a specific matrix, a specific sentence, a specific word pair) |
| Use MIT/GPL-licensed generators (`matRiks`, `IMak`) and honour their licences | Screenshot a practice-test PDF and re-draw it |

**Three things are safe to copy and we do copy them.** Test *format* (item counts, time limits,
subtest names) is factual information about a product, not expression. *Rule taxonomies* from the
academic literature — the Carpenter/Just/Shell relational-reasoning rule set for matrices, the
standard semantic-relation inventories behind analogy items — are published scholarship intended
to be applied. And *open-source implementations* under permissive licences are copyable on their
own terms.

**The provenance field is the audit trail.** Every item carries the rule id(s) it was generated
from. The test of whether we did this right is: pick any item at random, and the rule that
produced it should already be written in this document, with the item derivable from it by
someone who has never seen a real CCAT or CogAT. If the rule reads like a description of the item
rather than a recipe that could have produced many items, the provenance is fake and the item is
suspect.

**Attribution ledger for generated visuals.** `matRiks` is MIT (verified from the installed
package metadata: `License: MIT + file LICENSE`, v0.1.5). MIT requires the copyright notice and
licence text be retained. If we ship geometry produced by `matRiks`, the notice ships with the
repo. `IMak` is GPL-3, which is a stronger obligation — using it to *produce data* is fine and
does not make our site a derivative work, but we should not link it into shipped code. **Current
recommendation: use `matRiks` only, and skip `IMak`,** since figure matrices are the only figural
type we cannot cheaply hand-specify and matRiks covers them.

---

## 3. The universal distractor framework

This is the most reusable part of the document. Adopt it for **every** item type, verbal
included.

The framework is the distractor typology used by `matRiks` for figural matrices, which in turn
comes from the Raven's-style distractor literature. Its virtue is that each family names a
*specific cognitive error*, which is exactly the property P3 demands. I have extended each family
across the non-figural item types.

### 3.1 The four families

| Family | The error it catches | Figural form | Verbal / quantitative form |
|---|---|---|---|
| **R — Repetition** | Perseveration. The solver picks something already visible because it "matches". | `R-Left` (copy the cell to the left), `R-Top` (copy the cell above), `R-Diag` | An option that repeats a term from the stem, or repeats the last element of a series |
| **WP — Wrong Principle** | The solver inferred a *different, plausible* rule and applied it correctly. | `WP-Copy` (copies where it should transform), `WP-Matrix` (a cell borrowed from elsewhere in the grid) | Applying the wrong semantic relation; applying a linear difference to a non-linear series; resolving a connective in the wrong direction |
| **IC — Incomplete Correlate** | The solver got the rule right but applied it partially or with one attribute wrong. **The strongest family.** | `IC-Inc` (one element missing), `IC-Neg` (fill inverted), `IC-Flip` (rotation reversed), `IC-Size` (wrong magnitude) | Right operation with an off-by-one; first step of a two-step rule applied and the second forgotten; right relation at the wrong intensity |
| **D — Difference** | Nothing. It is the floor option — related to the field, derivable from no rule. | A figure sharing the visual vocabulary but no rule | A word from the right topic and register, licensed by nothing in the stem |

### 3.2 The composition rule

> **A four-option item is `Correct + WP + IC + (R or D)`.**
>
> **At most one D per item. Never two.**

This one line is the fix for the failure mode the brief names — "four options where three are
obviously silly". A D-family option is *eliminable without solving the item*. Two of them turn a
4-way item into a 2-way item, which halves its information and inflates guessing from 25% to 50%.
WP and IC options are *not* eliminable without solving, which is the whole point.

For three-option items (syllogisms), the composition is `Correct + WP + IC`; there is no room for
a D.

### 3.3 The plausibility gate (mechanical, do this per item)

For every distractor, write the error sentence:

```
D2 ("although" item, option "reluctant"):
  → picked by a solver who read the anchor "she had trained for months" and matched its
    positive valence, without noticing that "although" reverses the direction. [WP-direction]
```

If the sentence cannot be written, the option fails and is replaced. If two options produce the
*same* error sentence, they are redundant — one of them is doing no work, replace it.

This gate is cheap, it is checkable by eye in review, and it is the difference between a test and
a formality.

### 3.4 Anti-patterns (automatic reject)

| Anti-pattern | Why it is fatal |
|---|---|
| An option of a different part of speech from the others | Eliminable by syntax, without reading the stem |
| An option markedly longer or shorter than the others | Length is a well-known answer cue; test-wise solvers exploit it |
| Two options that are synonyms | Neither can be the key (they would both be right), so both are eliminable |
| An option that is a superset of another ("red" and "bright red") | Invites a "which is more right" judgement — violates P4 |
| The key being the only option that is grammatical in the blank | It is a grammar item pretending to be a reasoning item |
| Distractors drawn from a different semantic field than the key | Eliminable by topic-matching alone |
| The key being consistently the longest, or clustering in one position | Positional/length bias across the bank; shuffle and audit (§8) |

---

## 4. Item type rule vocabularies

Each type below gives: the **rule families** that generate a valid item, the **validity gate**,
the **difficulty dials**, and **worked examples**. Examples are illustrative of the rule, not
drafts for shipping.

---

### 4.1 Sentence completion (SC)

**The largest type on the adult test (9 of 50) and the one we have never built. It gets the most
space here because it is the item most likely to go wrong.**

#### The central insight

A sentence completion item is **not a vocabulary question**. It is a logic item wearing
vocabulary's clothes. The sentence contains a *constraint structure* that determines the semantic
direction of the blank; the options test whether the solver resolved the constraint. Vocabulary
tier is a second, orthogonal dial that we turn only after the logic is right.

The practical consequence: **write the constraint first, then choose words to fit it.** Writing a
nice sentence and then hunting for a blank produces underdetermined items — the characteristic
failure where two options both work.

Note that the 38 sentence-completion items already in the video bank are all one-blank,
definitional, kid-level (`SC-1a` + `SC-3a` in the vocabulary below). They are fine for their
purpose and they are essentially the *bottom rung* of what the adult test needs. There is no
existing prior art for the top of the range.

#### SC-1 — Connective rules (what fixes the direction)

| Rule | Signal words | Effect on the blank | Difficulty |
|---|---|---|---|
| `SC-1a` **Support** | because, since, so, therefore, as a result, thus | Blank *agrees* in direction with the anchor | Easiest |
| `SC-1b` **Contrast** | although, but, yet, whereas, despite, even though, however | Blank *opposes* the anchor | Moderate |
| `SC-1c` **Double reversal** | "while … nevertheless …", "for all its X, it remained Y", contrast nested inside concession | Two direction flips; net direction must be computed | Hardest |
| `SC-1d` **Restatement** | that is, in other words, indeed, a colon, an appositive | Blank *restates* the anchor in different words | Moderate |
| `SC-1e` **Condition** | unless, provided that, only if, without | Blank is the enabling or blocking condition | Moderate-hard |
| `SC-1f` **Degree comparison** | more … than, less … than, so … that, as … as | Blank sits at a specified point on a scale | Moderate-hard |

#### SC-2 — Blank structure

| Rule | Structure | Note |
|---|---|---|
| `SC-2a` | One blank | Default |
| `SC-2b` | Two blanks, **parallel** — both same direction | Mild increase |
| `SC-2c` | Two blanks, **opposed** — the connective forces them apart | **The strongest single difficulty lever**, because it makes half-right distractors possible (`IC-half`), and half-right options are the most tempting options that exist |

#### SC-3 — Anchor rules (what makes the answer determinate)

Every valid item has an explicit in-sentence anchor. No anchor, no item.

| Rule | Anchor type | Example shape |
|---|---|---|
| `SC-3a` **Definitional** | The sentence effectively defines the blank | "…so quiet that even a whisper seemed ___" |
| `SC-3b` **Causal** | An event in the sentence causes the blank state | "After three days without rain the soil had become ___" |
| `SC-3c` **Contrastive** | An explicit opposite appears in the sentence | "…generous with her time but ___ with her praise" |
| `SC-3d` **Enumerative** | A list whose shared property the blank must share | "…patient, methodical, and above all ___" |

#### Validity gate for SC

Every SC item must pass all five. These are checkable in review.

1. **Unique satisfaction.** Exactly one option satisfies *both* the connective's direction and the
   anchor's semantics. Check each option against both, separately.
2. **The cover test.** Cover the anchor clause. If the answer is still guessable from the rest,
   the item is underdetermined — the options are doing the work, not the sentence.
3. **The deletion test.** Delete the connective. If the answer does not change, the connective is
   decorative and the item is really a vocabulary question. Rewrite it.
4. **Register parity.** All options: same part of speech, same register, within ±3 characters of
   comparable length, all plausible in the slot *grammatically*.
5. **Containment.** No named entities, no cultural knowledge, no idiom that does not travel (§9).

#### Difficulty dials for SC

| Dial | Low | High |
|---|---|---|
| Connective | `SC-1a` support | `SC-1c` double reversal |
| Blanks | `SC-2a` one | `SC-2c` two opposed |
| Anchor distance | Anchor adjacent to the blank | Anchor in another clause, separated by a subordinate clause |
| Vocabulary tier | Tier 1 everyday | Tier 2 academic, capped at Tier 3 (§9) |
| Distractor pull | Distractors wrong on direction *and* meaning | One distractor right on direction, wrong only on nuance |

#### SC distractor families (mapped to §3)

| Family | SC form | The error |
|---|---|---|
| **WP-direction** | Semantically apt, wrong side of the connective | Read the anchor, ignored "although". **Every SC item should carry one of these.** |
| **WP-assoc** | Topically associated with the sentence, licensed by nothing | Keyword-matched the topic instead of solving |
| **IC-degree** | Right direction, wrong magnitude | Missed that "so … that" demands an extreme |
| **IC-half** (`SC-2c` only) | Blank 1 right, blank 2 wrong | Solved half the item and stopped |
| **R-echo** | Repeats or morphologically echoes a word in the stem | Matched surface form |
| **D-collocation** | Forms a familiar phrase with the adjacent word, breaks the logic | Completed the phrase instead of the sentence |

#### Worked examples

**Low (`SC-1a` support + `SC-3a` definitional + `SC-2a`)**

> The instructions were so ___ that even members who had never attended a meeting could follow
> them without help.
>
> A. lengthy · B. **straightforward** · C. technical · D. formal

- `straightforward` — key. Anchor: "even … never attended … could follow without help."
- `technical` — **WP-direction**: apt for instructions, opposite of what the anchor licenses.
- `lengthy` — **D**: related to instructions, licensed by nothing.
- `formal` — **WP-assoc**: register-matched to "members/meeting", not to the anchor.

**Mid (`SC-1b` contrast + `SC-3c` contrastive + `SC-2a`)**

> Although the committee had been ___ in its public statements, its internal memos showed that
> members had already agreed on the outcome weeks earlier.
>
> A. decisive · B. **noncommittal** · C. dishonest · D. thorough

- `noncommittal` — key. "Although" reverses; the internal state is *settled*, so the public state
  must be *unsettled*.
- `decisive` — **WP-direction**: matches the internal state, fails to reverse across "although".
- `dishonest` — **IC-degree**: right direction (public ≠ internal) but overshoots into a moral
  claim the sentence does not license. *This is the strongest distractor in the item.*
- `thorough` — **D**: committee-register, licensed by nothing.

**High (`SC-1c` double reversal + `SC-2c` two opposed blanks)**

> For all the ___ with which the proposal was received, its supporters privately conceded that the
> objections raised against it were far from ___.
>
> A. enthusiasm … trivial · B. **enthusiasm … substantial** · C. scepticism … trivial ·
> D. scepticism … substantial

- **The intended key is B, and B is wrong.** I have left this example in deliberately, because it
  is exactly the mistake this document exists to prevent, and it is more useful as a warning than
  as a model. Work it through: "far from ___" is itself a negation, so with "trivial" the clause
  means the objections *were* serious — which is the genuine contrast to public enthusiasm that
  "for all" and "privately conceded" both demand. **A is correct, not B.** A triple negation
  ("for all" + "far from" + the polarity of the adjective) is beyond what a solver can resolve in
  18 seconds, and it is beyond what a writer can reliably keep straight either.
- **Rule adopted from this:** `SC-1c` items may compose *at most two* negations, and `far from`,
  `hardly`, `anything but` count as one each. A double-reversal item that also contains a negated
  adjective slot is rejected at the gate. Prefer to build `SC-2c` difficulty from *opposed
  content* rather than from stacked negation.

---

### 4.2 Verbal analogy (VA)

Form: `A : B :: C : ?`

#### VA-R — Relation rules

Drawn from the standard published semantic-relation inventories. Ordered roughly by
developmental accessibility.

| Rule | Relation | Example shape |
|---|---|---|
| `VA-R1` | Category → member | bird : sparrow |
| `VA-R2` | Whole → part | tree : branch |
| `VA-R3` | Object → function | knife : cut |
| `VA-R4` | Agent → workplace | baker : bakery |
| `VA-R5` | Agent → tool | painter : brush |
| `VA-R6` | Object → characteristic attribute | glass : brittle |
| `VA-R7` | Young → adult / source → product | calf : cow, tree : paper |
| `VA-R8` | Cause → effect | drought : famine |
| `VA-R9` | Instrument → what it measures | thermometer : temperature |
| `VA-R10` | Degree / intensity on a scale | warm : scorching |
| `VA-R11` | Synonym / antonym | rapid : swift |
| `VA-R12` | Symbol → referent | dove : peace |
| `VA-R13` | Quality → its absence | mendacious : truth |

#### Validity gate for VA

1. **Relation specificity.** State the relation as a sentence with both terms in it ("a knife is
   used to cut"). If the sentence is also true of a distractor pair, the item is broken.
2. **Directionality preserved.** `A:B` and `C:D` must run the same way. `bird:sparrow ::
   sparrow:bird` is a defect, not a hard item.
3. **Single relation.** If `A:B` supports two relation readings, one of the distractors will be
   defensible under the second. Reject.
4. **Unique completion within the option set.** No two options may satisfy the stated relation.

#### VA distractor families

| Family | Form | Error |
|---|---|---|
| **WP-relation** | Satisfies a *different* relation to C (e.g. category where part-whole was required) | Inferred the wrong relation |
| **WP-reverse** | Satisfies the relation but backwards | Missed directionality |
| **IC-degree** | Right relation, wrong point on the scale (`VA-R10`) | Right idea, wrong magnitude |
| **R-echo** | Strongly associated with **A** or **B** rather than C | Associated instead of analogised |
| **D-field** | Same semantic field as C, no relation | Topic-matched |

#### Worked examples across the gradient

| Band | Item | Rule |
|---|---|---|
| L9 (G3) | `puppy : dog :: kitten : ?` → cat | `VA-R7`, Tier 1 |
| L10 (G4) | `baker : bakery :: teacher : ?` → school | `VA-R4`, Tier 1 |
| L11 (G5) | `thermometer : temperature :: clock : ?` → time | `VA-R9`, Tier 2 |
| L12 (G6) | `warm : scorching :: cool : ?` → frigid | `VA-R10`, Tier 2 |
| L13/14 (G7-8) | `mendacious : truth :: penurious : ?` → wealth | `VA-R13`, Tier 3 (**and see §10 — this is the tier I am least comfortable with**) |

---

### 4.3 Antonym (AN)

Form: "Which word means the opposite of X?"

**Only 2 items on the adult test, and they carry disproportionate risk (§10).**

#### Validity gate for AN — stricter than the others

Antonymy is rarely clean above Tier 1. The gate:

1. **Single-dimension opposition.** X must vary on exactly one dimension. `hot/cold` is one
   dimension. `candid` is not — its opposite could be *guarded* (willingness to disclose) or
   *deceitful* (truthfulness), and both are defensible. **Reject any word whose opposition is
   two-dimensional.** This alone disqualifies most interesting adult vocabulary.
2. **The key must be a *direct* antonym, distractors must not be.** If the best distractor is
   "somewhat opposite", the item is a judgement call and violates P4.
3. **No morphological giveaway.** If the key is X with a negating prefix, the item tests affixes,
   not meaning.

**Consequence, stated plainly:** the adult antonym items should sit at Tier 2, not Tier 3.
A Tier-3 antonym that survives gate 1 is rare, and reaching for one is how you ship a defective
item. Two clean Tier-2 items beat two impressive broken ones.

#### AN distractors

| Family | Form |
|---|---|
| **WP-synonym** | A synonym of X (catches direction reversal — the most common error) |
| **IC-partial** | Opposite on a *related* dimension but not on X's dimension |
| **D-field** | Same semantic field, orthogonal meaning |

---

### 4.4 Attention to detail (AD)

Form: exact-match comparison under time pressure. Three items on the adult test.

#### AD rule vocabulary

| Rule | Form | Difficulty driver |
|---|---|---|
| `AD-1` | Which option exactly matches the reference string? | Edit distance between reference and distractors |
| `AD-2` | How many of the N pairs are identical? | N, and the subtlety of each difference |
| `AD-3` | Which pair differs? | Position of the difference within the string |

#### Difficulty dials

Difficulty is a function of **perceptual confusability**, controlled precisely:

- **Edit distance 1** is hardest; distance 3+ is trivial.
- **Confusable character classes**, hardest first: `0/O`, `1/l/I`, `5/S`, `rn/m`, `vv/w`,
  doubled-letter presence (`accommodate`/`acommodate`), transposition (`ie`/`ei`).
- **Difference position**: mid-string is hardest, initial is easiest (readers anchor on the first
  characters).
- **String length**: 8-14 characters is the useful band. Below 8 is too easy; above 14 becomes a
  test of patience rather than attention.

#### AD distractors

The distractor set *is* the item. Every option is a near-miss, each differing from the reference
by exactly one controlled perturbation drawn from the confusability list. There is no D-family
option in an AD item — a non-near-miss option would be free elimination.

**Machine generation is mandatory here.** These items are trivially generated and error-prone to
write by hand, and the key is provably correct by string equality.

---

### 4.5 Number series (NS)

Form: `a₁, a₂, a₃, a₄, ?`

#### NS rule vocabulary

| Rule | Form | Band floor |
|---|---|---|
| `NS-1` | Constant difference (`+k`, `−k`) | L9 |
| `NS-2` | Constant ratio (`×k`, `÷k`) | L10 |
| `NS-3` | Alternating two-sequence interleave | L11 |
| `NS-4` | Second-difference constant (`+1, +2, +3, …`) | L11 |
| `NS-5` | Two-step composite (`×2 then −1`) | L12 |
| `NS-6` | Additive recurrence (each term = sum of prior two) | L12 |
| `NS-7` | Alternating operation (`×2, −3, ×2, −3, …`) | L13/14 |
| `NS-8` | Difference sequence is itself a named pattern | Adult |

#### Validity gate for NS

1. **Uniqueness of the minimal rule.** Four given terms must not admit a second rule of equal or
   lower complexity that yields a different fifth term. **This is a real risk with only four
   terms and it must be checked programmatically, not by eye** — fit every rule in the vocabulary
   to the stem and confirm exactly one matches.
2. **Show at least four terms** when the rule is two-step; three terms underdetermine it.
3. **Arithmetic floor** per band (§5). No exponents below L12, no negatives below L12, no
   fractions in series below L13/14.

#### NS distractors

| Family | Form | Error |
|---|---|---|
| **IC-onestep** | Applies step 1 of a two-step rule and stops | Forgot the second operation |
| **IC-offby** | Right rule, off by one | Arithmetic slip |
| **WP-linear** | Applies the *first* difference to all terms as if the series were linear | Assumed constant difference |
| **WP-direction** | Right magnitude, wrong sign | Read the direction backwards |
| **R-last** | Repeats the final given term | Perseveration |

---

### 4.6 Letter series (LS)

**Adult test only. Explicitly excluded from the child banks** — the child instrument's
quantitative battery uses number series only.

#### LS rule vocabulary

| Rule | Form |
|---|---|
| `LS-1` | Fixed alphabetic step (`A, C, E, G, ?`) |
| `LS-2` | Alternating steps (`A, B, D, E, G, ?`) |
| `LS-3` | Two-letter groups, each letter on its own step (`AZ, BY, CX, ?`) |
| `LS-4` | Position-mirrored pairs (letter *n* paired with letter *27−n*) |
| `LS-5` | Step size itself increments (`A, B, D, G, K, ?`) |

#### Validity gate for LS

1. **Do not wrap the alphabet** unless the wrap is visible in the given terms. A hidden Z→A wrap
   is a gotcha, not a difficulty.
2. **No letter-to-number semantics** (A=1) unless the item states it — that is a code item, not a
   series item.
3. Uniqueness checked the same way as NS: fit all `LS-*` rules, require exactly one match.

Distractors follow NS: off-by-one letter (`IC-offby`), wrong direction (`WP-direction`), correct
letter from the wrong position in a two-letter group (`IC-partial`).

---

### 4.7 Number analogy (NA)

Form: `[a → b]  [c → d]  [e → ?]`. Five per child bank.

#### NA rule vocabulary

| Rule | Form | Band floor |
|---|---|---|
| `NA-1` | Single additive (`+k`, `−k`) | L9 |
| `NA-2` | Single multiplicative (`×k`, `÷k` exact) | L10 |
| `NA-3` | Two-step (`×k then +m`) | L11 |
| `NA-4` | Two-step with subtraction (`×k then −m`) | L12 |
| `NA-5` | Division then adjustment (`÷k then ±m`) | L12 |
| `NA-6` | Ratio-preserving with non-unit ratio (`×3/2`) | L13/14 |

**Constraint inherited from the existing house calibration doc** (`video/content/cogat-timing-difficulty.md`),
which established via CCSS that whole-number exponents are Grade 6+ (6.EE.A.1) and Grade 5
exponents are limited to powers of ten (5.NBT.2): **no squares or cubes below L12, no negatives
below L12.** That precedent is sound and this document inherits it rather than relitigating it.

#### NA distractors — the mapping is unusually clean here

| Family | Form | Error |
|---|---|---|
| **IC-firststep** | `×k` applied, `+m` forgotten | Stopped after one step |
| **IC-secondstep** | `+m` applied to `e` directly, `×k` skipped | Applied the visible increment only |
| **WP-additive** | Treats a multiplicative rule as additive: takes `b−a` and adds it to `e` | Assumed the relation was a difference |
| **IC-offby** | Right rule, ±1 | Arithmetic slip |
| **R-pair** | The `d` value from the previous pair | Copied the adjacent answer |

---

### 4.8 Word problem (WP)

Adult test only, and the largest maths block.

#### WP rule vocabulary

| Rule | Structure | Difficulty |
|---|---|---|
| `WP-1` | Single-operation | Low |
| `WP-2` | Two-operation, sequential | Low-mid |
| `WP-3` | Ratio / proportion | Mid |
| `WP-4` | Percentage of a base | Mid |
| `WP-5` | Percentage *change*, incl. successive changes | Mid-high |
| `WP-6` | Rate × time (incl. combined rates / work) | High |
| `WP-7` | Weighted average | High |
| `WP-8` | Set overlap (two-set inclusion-exclusion) | High |
| `WP-9` | Simple counting / arrangement | High |

#### Validity gate for WP

1. **One solution path must be *sufficient*, and all valid paths must agree.** The classic defect
   is a problem where a second reading gives a different number. Solve it two ways.
2. **The arithmetic must be tractable in ~25 seconds without a calculator.** This is a reasoning
   test, not an arithmetic test. If the numbers are ugly, change them — difficulty must come from
   the *structure*, per P2.
3. **Percentage-change items must state the base unambiguously.** "Increased by 20%" and
   "increased to 20% more than" differ; ambiguity here is the commonest silent defect.
4. **No currency, no imperial units** (§9).

#### WP distractors

Each distractor is the answer produced by a *specific* wrong method — these are computed, not
invented:

| Family | Form |
|---|---|
| **WP-inverse** | Divided where multiplication was required, or vice versa |
| **WP-base** | Percentage taken of the wrong base (a very high-yield distractor in `WP-5`) |
| **IC-partial** | The intermediate value, correct but not the final answer. **The single most tempting distractor in any multi-step word problem** |
| **IC-offby** | Right method, one arithmetic slip |
| **WP-naive** | Averaging two rates directly instead of weighting (`WP-6`, `WP-7`) |
| **WP-doublecount** | Overlap counted twice (`WP-8`) |

---

### 4.9 Table and graph reading (TG)

#### TG rule vocabulary

| Rule | Task | Difficulty |
|---|---|---|
| `TG-1` | Single-cell lookup | Low |
| `TG-2` | Compare two cells | Low |
| `TG-3` | Aggregate a row or column | Mid |
| `TG-4` | Compute a derived quantity (per-unit, share of total) | Mid-high |
| `TG-5` | Percentage change between two cells | High |
| `TG-6` | Cross-reference two tables, or a table and a stated condition | High |
| `TG-7` | Identify which row satisfies a compound condition | High |

#### Validity gate for TG

1. **The question must name the operation unambiguously.** "Which grew most?" is ambiguous
   between absolute and relative growth. Say which.
2. **Every number needed is in the table.** No outside knowledge.
3. **Distractors must be computable from the table** — each is the result of a specific wrong
   read. An option that is not derivable from the data is free elimination.
4. **Table sizes:** 3-5 rows × 3-4 columns. Larger becomes a search task.

#### TG distractors

**WP-row/col** (read the adjacent row or column), **WP-base** (percentage of the wrong base),
**IC-partial** (a correct intermediate), **WP-absolute-vs-relative** (the answer to the *other*
reading of "most"). Note that the last one only belongs in items where the wording is
unambiguous — it is a legitimate distractor for a solver who read carelessly, but it is a defect
if the stem is genuinely ambiguous.

---

### 4.10 Figure matrix (FM)

3×3 grid, bottom-right cell missing. Three on the adult test, five per child bank — **25 of the
125 items, the largest single block, and the one with the strongest tooling.** See §7 for the
tooling findings.

#### FM rule vocabulary

Verified against the installed `matRiks` 0.1.5. Rules apply along rows (`hrules`) and columns
(`vrules`) independently; **the number of simultaneously active rules is the primary difficulty
dial**.

| Rule | Attribute varied | matRiks token | Band floor |
|---|---|---|---|
| `FM-1` | Shape identity | `shape` | L9 |
| `FM-2` | Element count | (composition) | L9 |
| `FM-3` | Fill / shading — white, grey, black | `shade` | L9 |
| `FM-4` | Size | `size` | L10 |
| `FM-5` | Position within the cell | `margin` | L10 |
| `FM-6` | Rotation (quarter turns) | `rotate` | L11 |
| `FM-7` | Line style — solid / dashed | `lty` | L11 |
| `FM-8` | Line weight | `lwd` | L12 |
| `FM-9` | Reflection | `reflect` | L12 |
| `FM-10` | Rotation at non-90° increments | `rotate` (k≠4) | L12 |
| `FM-11` | Distribution-of-three (Latin square: three values each appearing once per row and column) | (composition) | L12 |
| `FM-12` | Logical combination — AND / OR / XOR of the first two cells | `logic` | L13/14 |

#### Validity gate for FM — this is where matRiks needs help

`matRiks` will happily generate rule combinations that are **visually degenerate**. I confirmed
this by rendering one (§7). The gate:

1. **Occlusion check.** A `shade`→black rule applied to an outer element hides every inner
   element, which silently destroys any other rule operating on the inner element. **Reject any
   matrix where a rule becomes invisible in any row.** This was the very first matrix I generated,
   so it is not a rare edge case.
2. **Option distinctness.** Two options must not be visually identical. Measured rate: **43% of
   rule pairs produced at least one duplicated pair somewhere in the 11-option response set.**
   Deduplicate before selecting the four to ship.
3. **Failed-distractor check.** When matRiks cannot construct a distractor it emits a placeholder
   marked with a heavy X and raises a warning. These must never ship. Filter on the warning.
4. **Key integrity.** matRiks itself guards the fatal case — it detects when `R-Left` or `R-Top`
   would equal the correct response and refuses. Observed 12 times across the probe and **zero
   cases where a distractor silently equalled the key.** This is the strongest argument for using
   it over hand-rolling.
5. **Solvability from row 1 and row 2 alone.** Every rule must be inferable from the two complete
   rows; a rule visible only in the incomplete row is unsolvable.

#### FM distractor selection

matRiks generates ten distractors in the four families (§3). Select four options as
`Correct + one WP + one IC + one (R or D)`, preferring:

- **IC-Flip** where rotation is active (catches direction errors) — highest-yield IC
- **IC-Neg** where shading is active
- **IC-Inc** where the cell has multiple elements — *note it fails on single-element figures*
  (42 occurrences in the probe, the dominant warning)
- **R-Left** as the R option, since left-perseveration is the commonest matrix error
- **Difference** only as the fourth option, never as two

---

### 4.11 Figure series (FS)

Four figures in a row, pick the fifth. Adult test only.

Rule vocabulary is the `FM-*` set applied along a single axis. Difficulty is `FM` minus one,
because a linear series is easier than a grid at equal rule count — there is no column constraint
to cross-check, but also none to exploit.

**Validity gate:** four given terms, and the rule must be unambiguous from the first three, with
the fourth serving as confirmation. Distractors as `FM`.

---

### 4.12 Figural odd-one-out (OO)

Five figures, four share a property, one breaks it. Four on the adult test.

#### The dominant failure mode, and the gate for it

**A second defensible grouping.** If the five figures can be partitioned 4-1 on *any* attribute
other than the intended one, there are two defensible answers and the item is broken under P4.

This is fully machine-checkable and **must** be checked mechanically:

> For every attribute in the figure vocabulary (shape, count, fill, size, rotation, line style,
> symmetry, vertex count, position), partition the five figures by that attribute's value. If any
> attribute other than the intended one yields a 4-1 split, **reject the item**.

The check must include *derived* attributes that a solver might notice but a generator would not
enumerate — symmetry, vertex count, curved-versus-straight, convex-versus-concave. Under-
enumerating the attribute list is how this check gives false confidence.

**Difficulty dial:** the number of attributes held constant across all five. Holding many
constant makes the odd attribute salient (easy); holding few makes the solver search (hard).

---

### 4.13 Syllogism (SY)

Three on the adult test. Three options: `True` / `False` / `Cannot be determined`.

#### SY rule vocabulary

| Rule | Premise form | Valid conclusion? | Difficulty |
|---|---|---|---|
| `SY-1` | All A are B; x is A | x is B — **True** | Low |
| `SY-2` | No A are B; x is A | x is B — **False** | Low |
| `SY-3` | Some A are B; x is A | x is B — **Cannot be determined** | Mid |
| `SY-4` | All A are B; All B are C | All A are C — **True** | Mid |
| `SY-5` | All A are B; Some B are C | All A are C — **Cannot be determined** | Mid-high |
| `SY-6` | All A are B; x is not B | x is not A — **True** (contrapositive) | High |
| `SY-7` | All A are B; x is B | x is A — **Cannot be determined** (affirming the consequent) | High |
| `SY-8` | No A are B; Some C are B | Some C are not A — **True** | High |

#### Validity gate for SY

1. **Formal validity is the only criterion.** The conclusion must follow (or not) from the
   premises *as stated*, regardless of real-world truth.
2. **Use content that is real-world *neutral*.** If a conclusion is formally invalid but
   real-world true, solvers answer from belief rather than logic. This "belief bias" is the
   commonest defect in hand-written syllogisms. **Prefer abstract or invented categories** for
   the `Cannot be determined` items specifically — that is where belief bias does the most damage.
3. **"Cannot be determined" must be the key in roughly one third of items** — otherwise it becomes
   a throwaway option and the item degrades to a 2-way choice.

The three options *are* the distractor set: the two wrong options correspond to
**WP-overgeneralise** (treating "some" as "all", or affirming the consequent) and
**WP-negate** (reading a scope error as a contradiction).

---

### 4.14 Seating arrangement (SA)

**Exactly one item, placed at position 46 or later.**

#### SA rule vocabulary

| Rule | Constraint type |
|---|---|
| `SA-1` | Absolute position ("X is at one end") |
| `SA-2` | Adjacency ("X sits next to Y") |
| `SA-3` | Non-adjacency ("X does not sit next to Y") |
| `SA-4` | Relative order ("X is somewhere to the left of Y") |
| `SA-5` | Fixed gap ("exactly one seat between X and Y") |
| `SA-6` | Conditional ("if X is at position 3, then Y is at 5") |

#### Validity gate for SA

1. **Exactly one arrangement satisfies all constraints.** Verify by **brute-force enumeration of
   all permutations** — with 5-6 people this is 120-720 cases, trivially exhaustive. There is no
   excuse for shipping an SA item that has not been enumerated.
2. **The question must be answerable from the unique arrangement**, and each distractor must be a
   position that is occupied in *some* arrangement satisfying a *subset* of the constraints —
   i.e. the answer you get from dropping one constraint. That is a real error and makes a
   genuinely tempting option.
3. **Linear, 5-6 people, 4-5 constraints.** Circular arrangements add a rotational-symmetry
   subtlety that is a poor use of the single slot.

---

## 5. The child difficulty gradient

The brief asked that a Grade 3 item be distinguishable from a Grade 6 one **by inspection rather
than by vibes**. The tables below are written to be used that way: each band has a marker you can
check by looking at the item, without knowing what the generator intended.

### 5.1 Verbal analogy gradient

| Band | Grade | Relations allowed | Vocabulary | **Inspection marker** |
|---|---|---|---|---|
| **L9** | 3 | `VA-R1`–`R3` | Tier 1, concrete | **Both terms name things you can point at.** `puppy : dog` |
| **L10** | 4 | + `R4`–`R7` | Tier 1 + early Tier 2 | Still concrete, but one term may be a place or a role rather than an object. `baker : bakery` |
| **L11** | 5 | + `R8`, `R9` | Tier 2 academic | **An instrument, a measurement, or a cause-effect chain appears.** `thermometer : temperature` |
| **L12** | 6 | + `R10`, `R11` | Tier 2, morphologically complex | **The solver must rank on a scale or handle a two-step category jump.** `warm : scorching` |
| **L13/14** | 7-8 | + `R12`, `R13` | Tier 3 low-frequency | **At least one term is an abstract noun or a low-frequency adjective.** `mendacious : truth` |

The single fastest check: **count the abstract nouns.** Zero → L9-L10. One → L11-L12. Two → L13/14.

### 5.2 Number analogy gradient

| Band | Grade | Rule form | Magnitude | Operations | **Inspection marker** |
|---|---|---|---|---|---|
| **L9** | 3 | One step | ≤ 20 | `+`, `−`, `×2` | **Computable on fingers.** |
| **L10** | 4 | One step | ≤ 50 | `+ − × ÷` (exact) | One operation, but needs a times-table fact. |
| **L11** | 5 | Two step | ≤ 100 | `×` then `+` | **Two operations appear; both small.** |
| **L12** | 6 | Two step | ≤ 150 | `×`/`÷` then `±` | Two operations, one with a larger multiplier or a division. |
| **L13/14** | 7-8 | Two step or non-unit ratio | ≤ 300 | Combined `×`/`÷`, ratios like `×3/2` | **Requires holding an intermediate value in memory.** |

The fastest check: **count the operations, then check the largest number.** One op and under 50 →
L9-L10. Two ops → L11+. Two ops with a three-digit number → L13/14.

Per P2, the load here is **working memory, not arithmetic**. An L13/14 item is harder than an L9
item because you must hold a partial result, not because the sums are bigger. If an item is hard
only because the numbers are awkward, it is mis-scaled.

### 5.3 Figure matrix gradient

| Band | Grade | Simultaneous rules | Rules allowed | **Inspection marker** |
|---|---|---|---|---|
| **L9** | 3 | 1 | `FM-1`, `FM-2`, `FM-3` | **Exactly one thing changes across a row.** |
| **L10** | 4 | 1-2 | + `FM-4`, `FM-5` | Two things change, independently, both visible in row 1. |
| **L11** | 5 | 2 | + `FM-6`, `FM-7` | **Rotation appears, in quarter turns only.** |
| **L12** | 6 | 2-3 | + `FM-8`–`FM-11` | **A distribution-of-three (Latin square) appears, or rotation is not 90°.** |
| **L13/14** | 7-8 | 3 | + `FM-12` | **Row 3 cannot be solved without combining information from two earlier rows** (a logical AND/OR/XOR). |

The fastest check: **count how many attributes differ between the first and second cell of row 1.**
One → L9-L10. Two → L11-L12. Three, or a logical operation → L13/14.

### 5.4 Cross-cutting band constraints

| Band | Arithmetic ceiling | Vocabulary ceiling | Reading load |
|---|---|---|---|
| L9 | Two-digit `+`/`−`, `×2` | Tier 1 | ≤ 12 words per stem |
| L10 | Times tables to 10, exact division | Tier 1 + early Tier 2 | ≤ 14 |
| L11 | Two-step whole-number, no exponents, no negatives | Tier 2 | ≤ 16 |
| L12 | Exponents and negatives permitted (CCSS 6.EE.A.1) | Tier 2 | ≤ 18 |
| L13/14 | Ratios, non-unit fractions | Tier 3, capped (§9) | ≤ 20 |

**Timing sanity check.** 15 items in 5 minutes is 20 seconds per item. Every band constraint above
must be satisfiable within 20 seconds by a typical child in that grade. **The reading-load ceiling
exists because of this** — a stem the child cannot read in 6 seconds leaves no time to reason,
which converts the item from a reasoning measure into a reading-speed measure.

---

## 6. The adult difficulty curve

50 items, 15 minutes, single interleaved stream. One point per item, no penalty for guessing.

### 6.1 Composition

| Domain | Items | Types |
|---|---|---|
| Verbal | 18 | Sentence completion 9, verbal analogy 4, antonym 2, attention to detail 3 |
| Maths and logic | 17 | Word problem 9, table/graph 4, number series 3, letter series 1 |
| Spatial and abstract | 11 | Figural odd-one-out 4, figure series 4, figure matrix 3 |
| Logic puzzles | 4 | Syllogism 3, seating arrangement 1 |

### 6.2 The curve

Difficulty rises monotonically in five blocks of ten. Each block's ceiling becomes the next
block's floor.

| Items | Tier | Character |
|---|---|---|
| 1-10 | Warm-up | Single-rule items. `SC-1a`, `NS-1`/`NS-2`, `WP-1`, one-rule `FM`. A prepared adult clears these at ~12 s each. |
| 11-20 | Easy-moderate | Two-step arithmetic, `SC-1b` contrast, two-rule figures. |
| 21-30 | Moderate | `SC-1d`/`SC-1f`, `WP-3`/`WP-4`, `TG-3`/`TG-4`, three-rule figures, first syllogism. |
| 31-40 | Hard | `SC-2b`, `WP-5`/`WP-6`, `TG-5`, `NS-5`–`NS-7`, distribution-of-three matrices. |
| 41-50 | Very hard | `SC-2c`, `WP-7`–`WP-9`, `TG-6`, `SY-6`–`SY-8`, logical-operator matrices, and the seating item at 46+. |

### 6.3 Interleaving rules

- **No two consecutive items of the same type.** This is the CCAT-like property and it is the
  point of a single stream.
- **No three consecutive items from the same domain.**
- The **seating item sits at 46 or later** — it is the most time-expensive item on the test and
  placing it early would wreck pacing for everyone who does not skip it.
- **Answer positions must be balanced.** Across 50 items, each option position should be the key
  10-15 times, with no run of three identical positions. This is an audit in §8, not a hope.

### 6.4 A note on the time limit

15 minutes for 50 items is **18 seconds per item**, and that is deliberately not enough for most
people to finish — that is how the instrument works. But it has a design consequence that
constrains every rule above: **difficulty must come from the reasoning step, never from the
reading time.** A word problem with a 60-word stem is a hard item for the wrong reason. Stems
stay short; the difficulty goes into the structure.

---

## 7. matRiks: findings from an actual install

The brief asked whether `matRiks` installs cleanly and what its rule set looks like, "since that
determines whether the visual items are cheap or expensive". I installed it and probed it rather
than guessing. Here is what I found.

### 7.1 Install: clean

| Step | Result |
|---|---|
| `brew install r` | **Clean, 33 seconds** (bottled; R 4.6.1 arm64) |
| `install.packages("matRiks")` | **Clean, ~3.5 minutes** — 45 transitive dependencies, no compilation failures, no manual intervention |
| Version / licence | **0.1.5**, `MIT + file LICENSE` — confirmed from installed package metadata, matching the brief's assumption |
| Generate + render a 3×3 matrix with distractors | **Works first try** |

**Verdict on the tooling question: figure matrices are cheap.** Cheaper than any other item type
on the test, in fact — they are the only type where the answer key is *generated* rather than
asserted, which under P1 makes them the safest items in the whole set.

### 7.2 The rule set

`mat_apply(figure, hrules =, vrules =)` accepts these rule tokens, extracted from the installed
source:

```
identity   size   shade   rotate   reflect   shape   lty   lwd   fill   margin
logic(AND) logic(OR) logic(XOR)
```

Rules compose horizontally and vertically independently, and figures compose via `cof()`
(concatenation of figures), so multi-element cells with per-element rules are available. Roughly
40 built-in primitive shapes (`square`, `hexagon`, `pentagon`, `star`, `malta`, `pacman`,
`lily`, arcs, S-curves, bow-ties, …), which is more visual vocabulary than 25 items need.

This maps cleanly onto the `FM-1`–`FM-12` vocabulary in §4.10.

### 7.3 The distractor typology — the most valuable find

`response_list()` returns **11 responses: the correct answer plus 10 distractors**, tagged:

```
correct
r_left  r_top  r_diag        ← Repetition   (3)
wp_copy  wp_matrix           ← Wrong Principle (2)
ic_neg  ic_flip  ic_size  ic_inc   ← Incomplete Correlate (4)
difference                   ← Difference   (1)
```

**This typology is the origin of §3**, which I then extended across every other item type. That
is the highest-leverage thing to come out of the install: it gives the verbal and quantitative
distractors a principled parent scheme instead of ad-hoc invention, and it is the part of this
document I would keep if I could keep only one page.

### 7.4 Measured yield, and the defects you must filter

I ran two probes and recorded every warning and every duplicate: a **broad** one (5 base figures ×
63 rule pairs = 315 combinations, of which 175 were valid) and a **narrow** one (56 rule pairs on a
three-element figure, to isolate which distractor family fails and why). **Generation is cheap;
raw output is not shippable.** Three filters are mandatory:

| Finding | Rate | Consequence |
|---|---|---|
| **A distractor silently equals the correct answer** | **0 of 315** (broad probe) | matRiks self-polices the fatal case. It *detects* when `R-Left` or `R-Top` would equal the key (12 times in the narrow probe) and refuses to emit it, raising a warning instead. **This is the single best argument for using it over hand-rolling.** |
| `ic_inc` fails on single-element figures | 42 occurrences — the dominant warning | Use multi-element cells (`cof()`) whenever you want `IC-Inc`, or select a different IC distractor |
| Some distractor duplicates another option | **43% of valid combinations** (75 of 175, broad probe) | Deduplicate the 11-option set before selecting 4. Mandatory. |
| Invalid rule pairs error outright | 14 of 56 pairs (narrow probe) | Mostly `shape`/`logic` needing a 3-figure `cof()`. Validate rule pairs against figure arity first. |
| **Visually degenerate matrices** | Hit on the **first** matrix I generated | `shade`→black on an outer element **occludes every inner element**, silently destroying any rule operating on it. The matrix renders, no warning is raised, and the item is unsolvable. **This is the dangerous one because it is silent.** Requires the occlusion check in §4.10. |

The last row is the one to take seriously. matRiks warns you about distractor problems but it does
**not** know whether the resulting picture is legible. A human or a rendered-image check must look
at every matrix. At 25 matrices that is a few minutes of eyeballing, which is entirely affordable
— but it is not optional, and it does not scale to hundreds of items without a real image check.

### 7.5 Output is directly serialisable — no image pipeline needed

A matRiks figure is a flat, declarative geometry record. One cell:

```json
{"shape":["square","triangle"],"size.x":[5.56,2.06],"size.y":[5.56,2.06],
 "rotation":[2.36,3.14],"pos.x":[0,0],"pos.y":[0,0],"lty":[1,1],"lwd":[3,3],
 "nv":[4,3],"shade":[null,null],"visible":[1,1],
 "tag":[["simple","fill","d.ext","rotate"],["simple","fill","d.ext","rotate"]]}
```

**349 bytes per cell.** A full item — nine grid cells plus four options — is about **4.5 KB of
JSON**. Rotation is in radians, `nv` is the vertex count, `shade` is the fill.

This is renderable directly as SVG in the browser. **We do not need to ship PNGs**, which means no
image pipeline, no asset hosting, no resolution problem, and figures that scale and theme with the
site. It also means the website agent's schema needs a figure-geometry node type, which is worth
telling them **before** they finalise the schema — it is the one piece of information in this
document that has a deadline.

### 7.6 Recommended division of labour

- **Figure matrices (25 items):** generate with matRiks, filter per §4.10, export geometry to JSON.
- **Figure series and figural odd-one-out (8 items):** the same geometry vocabulary, but the
  matRiks API is matrix-shaped. Cheaper to emit the same JSON shape directly from a small script
  using the `FM-*` rules than to bend `mat_apply` into a linear series. Same rule provenance, same
  file format.
- **`IMak`:** skip it. GPL-3, and it covers figural analogies, which is not a type on either
  instrument. No need to take on the licence obligation.

---

## 8. Verification protocol

Ordered by how much damage the defect does. P1 says the key is sacred; this is how that is
enforced.

### Tier 1 — Key integrity (blocking)

| Item types | Method |
|---|---|
| Figure matrix | **Generated key.** matRiks computes cell 9 from the rules; the key cannot be mistyped. Assert that the shipped key is byte-identical to `correct(m)`. |
| Number series, letter series, number analogy | **Independent re-solver.** A second implementation fits every rule in the vocabulary to the stem, and must (a) find exactly one match and (b) agree with the declared key. This catches both a wrong key *and* an ambiguous stem in one pass. |
| Word problem, table/graph | **Structured recomputation.** Each item carries a machine-evaluable expression for its answer; the harness evaluates it and compares to the key. The stem's numbers must be the *same literals* the expression uses — no transcription. |
| Seating arrangement | **Brute-force enumeration** of all permutations. Assert exactly one satisfies the constraints. |
| Syllogism | **Model enumeration.** Enumerate all set-membership models consistent with the premises; assert the conclusion holds in all (True), none (False), or some-but-not-all (Cannot be determined). |
| Attention to detail | **String equality.** The key is provable. |
| Figural odd-one-out | **Exhaustive partition check** (§4.12) — every attribute, including derived ones. |

### Tier 2 — Handwritten verbal items (the residual risk)

Sentence completion, verbal analogy, and antonyms cannot be machine-keyed. They get a four-pass
process, and the passes must be **separated in time or by role**, because the value comes from not
remembering what you intended.

1. **Rule conformance.** Does the item instantiate the rule recorded in its provenance field? An
   item that drifted from its rule is an item whose difficulty is unknown.
2. **Adversarial defence.** For each *distractor*, argue as hard as possible that it is correct.
   This is the pass that catches P4 violations, and it is the only one that reliably does. Written
   out, not done in the head — the discipline of writing the argument is what surfaces the second
   reading. If the argument succeeds, the item is broken even though the intended key is "better".
3. **Gate checklist.** The type's validity gate (§4.1, §4.2, §4.3), item by item, mechanically.
   The cover test and the deletion test for SC are the high-yield ones.
4. **Cold re-solve.** Solve the item without looking at the key, ideally after a gap. Disagreement
   between the cold solve and the key is a defect until proven otherwise — do not resolve it by
   deciding the cold solve was careless.

**The `SC-1c` example in §4.1 is a real instance of pass 2 working.** I wrote that item intending
B, and working through the negations while writing the distractor rationales showed the key is
actually A. It is left in the document as evidence that the pass earns its cost, and it is the
basis for the negation cap that rule now carries. **An unaided writer would have shipped it.**

### Tier 3 — Bank-level audits (across all 125 items)

| Audit | Method | Threshold |
|---|---|---|
| Duplicate items | Normalised signature (lowercase, strip punctuation, sort options) hashed within each bank and across all six | Zero collisions |
| Overlap with the existing 1,544-item video bank | Same signature scheme against `video/content/master-question-bank.json` | Zero — reused items would be visibly recycled content |
| Answer-position balance | Count keys per position, per bank | Each position 20-30% of keys; no run of three |
| Key-length bias | Mean key length vs mean distractor length | Within 10% |
| Distractor rationale coverage | Every distractor has a written error sentence (§3.3) | 100%, no exceptions |
| Distractor family composition | Parse the family tags | No item with two D-family options |
| Cultural neutrality | Blocklist scan plus review (§9) | Zero hits |
| Reading load | Word count per stem against the band ceiling (§5.4) | Zero over |
| Difficulty monotonicity (adult) | Declared tier vs item index | Non-decreasing across blocks of ten |

**Note on what this protocol cannot do.** Every check above verifies *internal* consistency —
that the key follows from the rules, that the item is unambiguous, that the bank is balanced. None
of them verifies that an item is at the *difficulty* it claims. That requires response data. See
§10.

---

## 9. Cultural and regional neutrality

The instrument is taken by children in more than one country. An item that a child in one country
can answer from background knowledge and a child in another cannot is measuring nationality.

### Blocklist — never appears in any item

Currency symbols and named currencies · imperial units (inch, foot, mile, pound, ounce, gallon,
Fahrenheit) · national sports and their scoring (baseball, cricket, gridiron) · national holidays,
civics, government structures, historical figures · brand names and trademarks · school-system
terms that do not travel (*sophomore*, *GCSE*, *hall pass*, *recess* as a fixed noun) · named
places, rivers, mountains · food items that are regional staples · idioms that do not translate
across English variants · regional spellings where the difference could bear on the answer.

### Positive rules

- **Metric only.** Metres, kilograms, litres, degrees Celsius.
- **Quantities without currency.** Count objects, or use a neutral unit (*tokens*, *points*).
  A price problem can always be rewritten as a count problem without losing the structure.
- **Universal referents.** Animals, plants, weather, body parts, common tools, shapes, colours,
  family roles, time. These are the safe vocabulary base for `VA-R1`–`R7`.
- **Culture-free abstractions for hard verbal items.** At L13/14 and at the top of the adult
  verbal block, reach for **Latin/Greek-rooted academic vocabulary** rather than culturally
  embedded vocabulary. `penurious` is hard but not national. An idiomatic phrasal verb is easier
  but travels far worse.

### The tension, stated honestly

Rules 4 and the vocabulary tier in §5.1 pull against each other. Tier 3 words are, by definition,
low-frequency — and low-frequency words are the ones most likely to be met in one curriculum and
not another. **Vocabulary tier is therefore capped**: an L13/14 or adult verbal item may use at
most **one** Tier 3 word, it must be a word derivable from common roots (`mendacious` ← *mendacity*,
Romance-language cognates), and the item must remain solvable by a solver who knows the *root* but
not the word. If the item collapses without exact knowledge of a rare word, it is a vocabulary
test, which violates P2 as well as this section.

---

## 10. Where I expect quality to suffer

The part of the report I would read first. Ordered by expected damage, which is roughly
`(probability of defect) × (items affected) × (how hard it is to spot by eye)`.

### High risk

**1. Sentence completion — 9 adult items, and the type most likely to ship a second defensible
answer.**

This is the biggest risk on the test and it is not close. The reasons are structural, not
incidental. Natural language is underdetermined by default: a well-written sentence usually admits
more than one sensible completion, and the writer's job is to *close* every reading except one,
which is the opposite of how good prose is normally written. We also have no prior art — the 38
existing items are one-blank definitional items at kid level, i.e. the easiest rung, and they tell
us nothing about the top of the range.

Concretely: **I expect roughly one in six of my first drafts to have a defensible second answer**,
and the ones at the hard end will be worse than the ones at the easy end, because `SC-2c` and
`SC-1c` are exactly where ambiguity hides. §4.1 already contains one instance — an item I wrote
intending B where the key is actually A, caught only by writing out the distractor rationales.
I left it in the document rather than fixing it silently, because it is the most honest evidence
I can offer about the base rate.

**What will actually survive the user's eye:** the easy and mid SC items. **What will not:** any
two-blank item where I got clever. Mitigation is the adversarial pass (§8 Tier 2, pass 2), and my
honest estimate is that it catches most but not all. **If the reviewer's time is limited, spend it
on items 41-50 of the adult test, and on the SC items specifically.**

**2. The child difficulty gradient is a design claim, not a measured one.**

§5 lets you reliably tell a Level 9 item from a Level 12 item — the inspection markers do work,
and that is a genuine improvement over vibes. What it *cannot* tell you is whether a Level 11 item
is actually at the 50th percentile for a Grade 5 child. That requires response data from children,
and we have none.

The specific risk is **compression at the top**: L12 and L13/14 may be much closer in real
difficulty than the taxonomy implies, because "three simultaneous rules" and "two simultaneous
rules plus a Latin square" may be experienced as equally hard. Equally, the L9 band may be too
easy — a Grade 3 child who can read at all may clear one-rule items at ceiling, which would make
that bank uninformative. **Ceiling effects at L9 and compression at L12-L13/14 are the two most
likely calibration failures**, and neither is visible by inspection. The only real fix is piloting.

**3. Tier 3 vocabulary at L13/14 — a direct conflict between two requirements.**

The brief wants `mendacious : truth :: penurious : ?` as the Grade 7-8 marker, and it is the right
*shape*. But a word that rare is exactly the kind of word one curriculum teaches and another does
not, which is the §9 problem. The cap in §9 is my attempt to hold both requirements at once and
**it is the weakest compromise in this document**. I expect the reviewer to reject a couple of
L13/14 verbal items on the grounds that a real Grade 7 would not know the word, and I think that
judgement will be correct when they make it. Budget for replacing 2-3 of the 25 child verbal
analogy items.

### Medium risk

**4. Antonyms — only 2 items, but a high per-item defect rate.**

Clean single-dimension antonymy essentially runs out above Tier 1. Most interesting adult words
are opposable on two dimensions at once (§4.3, the `candid` case), and the resulting item has two
defensible answers. §4.3 tells you to stay at Tier 2, which lowers the defect rate at the cost of
these being the two least impressive items on the test. **I think that is the right trade and the
reviewer may disagree** — if they push for harder antonyms, the defect rate goes up sharply and I
would want that to be an explicit decision rather than a drift.

**5. Figural odd-one-out — the second-grouping problem.**

Four adult items. The failure mode is a second attribute that also partitions the five figures
4-1, giving two defensible answers. It is fully machine-checkable (§4.12) and I would normally
call it low risk — **except that the check is only as good as the attribute list**, and the
attributes a human notices (symmetry, curved-vs-straight, "looks like an arrow") are not the
attributes a generator enumerates. An under-enumerated check gives false confidence, which is
worse than no check. Expect one of the four to need replacing after human review.

**6. Word problems at items 41-50 — unintended second solution paths.**

`WP-7` through `WP-9` (weighted average, set overlap, counting) are the types where a plausible
alternative reading of the stem yields a different number. Machine verification confirms the key
matches the *intended* method; it says nothing about whether a second method is also defensible.
This needs the same adversarial pass as the verbal items, and it is easy to skip because the items
*feel* objective. They are not — the arithmetic is objective, the reading of the stem is not.

### Low risk

**7. Figure matrices — 25 items, and I expect these to be the best items in the set.**

Generated keys (P1 satisfied structurally), a published distractor typology, and matRiks
self-policing the fatal case (zero silent key collisions in 315 probes). The residual risk is
*aesthetic* rather than logical: the silent occlusion defect in §7.4 produces an unsolvable item
that raises no warning, so every matrix must be looked at. At 25 items that is affordable.

**8. Attention to detail, number/letter series, syllogisms, seating.**

All provably keyed. The seating item is brute-force enumerable, syllogisms are model-checkable,
series have an independent re-solver, and AD items are string equality. The only risk here is
**boredom**: AD items in particular are mechanically safe and can read as filler. If the reviewer
objects to any of these, it will be on interest grounds, not correctness.

### The thing I would change about the brief

**Sentence completion at 9 items is a lot of exposure to our weakest type.** If the reviewer finds
the SC items disappointing, the honest fix is not to write nine better ones — it is to move two or
three of those slots into verbal analogy, which is the type where we have 362 items of prior art
and a much lower defect rate. That would cost a little authenticity against the real instrument's
composition and buy a meaningful amount of quality. I would not make that call unilaterally, but I
would want it on the table **before** generation rather than after, because it is much cheaper to
decide now.
