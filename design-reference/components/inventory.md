# Component Inventory — what pages can assemble from

All components render great with **zero required props** (built-in placeholder data) and accept
typed props to override. Import primitives from `@/components/ui/*`, sections from
`@/components/sections/*`. Client components are marked `[client]`.

## Primitives (`@/components/ui/`)
| Import | Key props |
|---|---|
| `Container` | `size: page\|prose\|form\|full` |
| `Section` | `background: paper\|cream\|ink\|blue\|mint\|coral\|yellow\|gray`, `padding: sm\|md\|lg\|none`, `bordered`, `container`, `id` |
| `Button` | `variant: blue\|coral\|yellow\|mint\|ink\|paper\|outline`, `size: sm\|md\|lg`, `href?` |
| `Badge` | `color`, `size: sm\|md`, `shadow: none\|hard` |
| `Eyebrow` | children |
| `Heading` | `as: 1..4`, `size: display\|xl\|lg\|md\|sm`, `uppercase` |
| `Card` | `color`, `shadow: none\|sm\|md\|lg`, `padding: none\|sm\|md\|lg`, `interactive` |
| `Input`,`Textarea`,`Label`,`Field` | standard field props |
| `Placeholder` | `color`, `aspect` (e.g. "16/9"), `label` |
| `Marquee` | `speed`, `gap`, `reverse` |
| `Avatar` | `initials`, `color`, `size: sm\|md\|lg\|xl` |

Layout: `SiteHeader`, `SiteFooter`, `Logo` (already mounted in root layout — pages do NOT add them).

## Sections (`@/components/sections/`)
| Import | File | Usage |
|---|---|---|
| `Hero` | hero.tsx | `<Hero title subtitle primaryCta secondaryCta mediaLabel background />` |
| `HeroSplit` | hero-split.tsx | `<HeroSplit title body bullets cta reverse background />` |
| `PageHero` | page-hero.tsx | `<PageHero eyebrow title subtitle cta align background />` |
| `LogoCloud` | logo-cloud.tsx | `<LogoCloud variant="marquee\|grid" label companies background />` |
| `StatBand` | stat-band.tsx | `<StatBand eyebrow title stats background />` |
| `FeatureGrid` | feature-grid.tsx | `<FeatureGrid eyebrow title intro columns features background />` |
| `Bento` | bento.tsx | `<Bento eyebrow title description background />` |
| `Steps` | steps.tsx | `<Steps eyebrow title steps background />` |
| `Testimonials`, `TestimonialMarquee` | testimonials.tsx | `<Testimonials … />`, `<TestimonialMarquee reverse speed />` |
| `QuoteFeature` | quote-feature.tsx | `<QuoteFeature quote name role background />` |
| `Pricing` | pricing.tsx | `<Pricing eyebrow title tiers background />` |
| `Faq` `[client]` | faq.tsx | `<Faq eyebrow title items background />` |
| `FeatureTabs` `[client]` | feature-tabs.tsx | `<FeatureTabs eyebrow title tabs background />` |
| `CtaBand` | cta-band.tsx | `<CtaBand title subtitle primaryCta secondaryCta align background />` |
| `NewsletterSignup` `[client]` | newsletter-signup.tsx | `<NewsletterSignup variant="hero\|inline" title subtitle background />` |
| `CourseCard`, `CourseGrid` | course-card.tsx | `<CourseGrid eyebrow title courses columns background />` |
| `PodcastEpisode`, `PodcastList` | podcast.tsx | `<PodcastList eyebrow title episodes featured background />` |
| `Instructors` | instructors.tsx | `<Instructors eyebrow title people columns background />` |
| `Comparison` | comparison.tsx | `<Comparison title theirPoints ourPoints background />` |
| `MarqueeHeadline` | marquee-headline.tsx | `<MarqueeHeadline text background speed reverse />` |
| `VideoFeature` | video-feature.tsx | `<VideoFeature title caption layout background />` |
| `ResourceGrid` | resource-grid.tsx | `<ResourceGrid eyebrow title resources columns background />` |
| `BookHero` | book-hero.tsx | `<BookHero title subtitle price bullets primaryCta background />` |
| `SponsorTiers` | sponsor-tiers.tsx | `<SponsorTiers eyebrow title tiers background />` |

## Color rhythm guidance
Stacked sections should alternate backgrounds so adjacent blocks contrast — e.g.
`blue → paper → cream → mint → ink → yellow → paper`. Never place two identical-colored
`bordered` sections back to back. Use `MarqueeHeadline` as a punchy divider between big blocks.
