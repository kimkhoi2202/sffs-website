# Hermes ↔ SFFS attribution handoff (UTM scheme + short links)

> **Audience:** the Hermes social pipeline (a SEPARATE repo/system).
> **Status:** the website side is LIVE. This note is the contract Hermes implements
> to close the attribution loop. Wiring Hermes is a follow-up, **not** part of the
> website work. Nothing here needs a website change.

The website (PostHog project **524578**, US cloud) already:

- auto-captures `utm_*` as event properties and `$initial_utm_*` as person
  properties on the first pageview;
- derives a coarse `platform` super property (tiktok / instagram / youtube /
  direct / other) from `utm_source`, falling back to the referring domain;
- serves a per-post short-link redirect at **`/go/<postid>`** (see
  `app/go/[postid]/route.ts`).

Hermes just needs to (1) tag links with the scheme below and (2) point each
post at its `/go/<postid>` link.

---

## 1. Canonical UTM scheme

| Param          | Value                                             | Example                    |
| -------------- | ------------------------------------------------- | -------------------------- |
| `utm_source`   | platform                                          | `tiktok`, `instagram`      |
| `utm_medium`   | channel type                                      | `social_organic` (`social_paid` if boosted) |
| `utm_campaign` | series / month / theme                            | `2026-07_quiz_series`      |
| `utm_content`  | **the unique post ID** (per-post attribution key) | `ttk_7423991`, `ig_31842`  |
| `utm_term`     | **A/B hook / variant arm**                        | `hookA`, `thumbB`, `cta2`  |

Keep `utm_source` / `utm_medium` stable so "TikTok vs IG" and "organic vs paid"
stay clean. `utm_content` is the money field — it's what lets PostHog rank
**which post** converts, not just which gets views. `utm_term` feeds the brand's
A/B culture (which hook converts **on-site**, past the view).

### Example fully-tagged landing URL

```
https://www.smartfellaorfartsmella.com/?utm_source=tiktok&utm_medium=social_organic&utm_campaign=2026-07_quiz_series&utm_content=ttk_7423991&utm_term=hookA
```

---

## 2. Per-post short link (`/go/<postid>`) — recommended

TikTok makes only the **bio link** clickable (in-caption links are not); IG
allows bio + Story/link-sticker links. So per-post attribution can't rely on
unique in-caption URLs. Instead, mint ONE short link per post and rotate the bio
link (or a link-in-bio page) to the newest post.

The route 302-redirects to the tagged canonical landing URL, so you can change
the UTM mapping any time **without re-editing live posts**. It accepts either
short params or full `utm_*` (explicit `utm_*` wins). The post id in the path is
always used as `utm_content`.

| Short param | Maps to        | Default          |
| ----------- | -------------- | ---------------- |
| `s`         | `utm_source`   | `social`         |
| `m`         | `utm_medium`   | `social_organic` |
| `c`         | `utm_campaign` | _(omitted)_      |
| `t`         | `utm_term`     | _(omitted)_      |
| _path_      | `utm_content`  | `<postid>`       |

### Examples

```
# short-param form (recommended for bio links)
https://www.smartfellaorfartsmella.com/go/ttk_7423991?s=tiktok&c=2026-07_quiz_series&t=hookA

# → 302 →
https://www.smartfellaorfartsmella.com/?utm_source=tiktok&utm_medium=social_organic&utm_campaign=2026-07_quiz_series&utm_content=ttk_7423991&utm_term=hookA

# explicit utm_* also accepted (wins over short params)
https://www.smartfellaorfartsmella.com/go/ig_31842?utm_source=instagram&utm_term=thumbB
```

Benefits: clean bio link, per-post attribution even where only one link is
allowed, click counts at the redirect layer, and freedom to change UTMs later.

---

## 3. Fallback attribution (when UTMs are stripped)

Some in-app browsers strip params/referrers. Two belts already exist site-side:

1. `platform` is derived from the referring domain when `utm_source` is missing.
2. A **post-signup "How did you find us?" PostHog survey** self-reports
   attribution (TikTok / Instagram / friend / other), rescuing it when the
   technical signals fail.

Neither needs Hermes changes — they're mentioned so you know the coverage.

---

## 4. Convention checklist for Hermes

- [ ] Lowercase `utm_source` (`tiktok`, `instagram`).
- [ ] Keep `utm_medium=social_organic` (use `social_paid` only for boosted).
- [ ] Set `utm_campaign` per series/month (e.g. `2026-07_quiz_series`).
- [ ] Set `utm_content` to the **unique post ID** — this is non-negotiable for
      per-post attribution.
- [ ] Set `utm_term` to the hook/variant arm so on-site A/B wins are attributable.
- [ ] Mint one `/go/<postid>` link per post; rotate the TikTok bio link to the
      newest; use the per-post Story/bio link on IG.
