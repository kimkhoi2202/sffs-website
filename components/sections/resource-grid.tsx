"use client";

import { useMemo, useState, type ReactNode } from "react";
import { type LucideIcon, Download, FileText, Mail, Presentation, Search, Sheet } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Heading } from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/quiz/reveal";

type ResourceAccent = "blue" | "mint" | "coral" | "yellow";

type ResourceGridBackground =
  | "paper"
  | "cream"
  | "ink"
  | "blue"
  | "mint"
  | "coral"
  | "yellow"
  | "gray";

export interface Resource {
  /** Card title. */
  title: string;
  /** One or two sentences describing the resource. */
  description: string;
  /** Short label shown in the badge, e.g. "Template", "Spreadsheet", "Guide". */
  type?: string;
  /** Where the download/detail link points. When set, the whole card is clickable. */
  href?: string;
  /** Button label. Defaults to "Download". */
  cta?: string;
  /** lucide icon for the tile. Defaults to a document icon. */
  icon?: LucideIcon;
  /** Accent color for the icon tile + badge. Defaults to a rotating accent. */
  accent?: ResourceAccent;
}

export interface ResourceGridProps {
  eyebrow?: string;
  title?: string;
  intro?: string;
  resources?: Resource[];
  /** Max columns on large screens. Grid steps 1 → 2 → this value. Default 3. */
  columns?: 1 | 2 | 3;
  background?: ResourceGridBackground;
  /** Fade + rise the inner content on scroll; disable to render statically. */
  revealContent?: boolean;
  className?: string;
  id?: string;
  /**
   * When true, render on-brand pill filter chips derived from each resource's
   * `type` (plus an "All" chip) and filter the grid to the selected type.
   * Default false, the grid renders exactly as the static server version.
   */
  filterable?: boolean;
  /**
   * When true, render a bordered pill search `<Input>` that filters the grid by
   * title/description (case-insensitive). Default false, no search UI.
   */
  searchable?: boolean;
}

const ACCENTS: readonly ResourceAccent[] = ["blue", "mint", "coral", "yellow"];

const accentTileClass: Record<ResourceAccent, string> = {
  blue: "bg-blue",
  mint: "bg-mint",
  coral: "bg-coral",
  yellow: "bg-yellow",
};

const columnsClass: Record<1 | 2 | 3, string> = {
  1: "",
  2: "md:grid-cols-2",
  3: "md:grid-cols-2 lg:grid-cols-3",
};

const DEFAULT_RESOURCES: Resource[] = [
  {
    title: "Cold Email Templates",
    type: "Template",
    icon: Mail,
    href: "/resources/cold-email-templates",
    cta: "Get it free",
    description:
      "Twenty plug-and-play cold emails written to get opens and replies. Swipe them, drop in your details, and hit send.",
  },
  {
    title: "Pipeline Tracker",
    type: "Spreadsheet",
    icon: Sheet,
    href: "/resources/pipeline-tracker",
    description:
      "A clean spreadsheet to track every deal, stage, and next step, so nothing slips through the cracks before quarter-end.",
  },
  {
    title: "Discovery Call Playbook",
    type: "Guide",
    icon: FileText,
    href: "/resources/discovery-call-playbook",
    description:
      "The question framework top reps use to run discovery calls that surface real pain and set up an easy close.",
  },
  {
    title: "Objection Handling Deck",
    type: "Deck",
    icon: Presentation,
    href: "/resources/objection-handling-deck",
    cta: "Get it free",
    description:
      "A slide-by-slide script for the twelve objections you hear most, with language you can say word for word.",
  },
  {
    title: "Follow-up Cadence Kit",
    type: "Template",
    icon: Mail,
    href: "/resources/follow-up-cadence-kit",
    description:
      "A fourteen-day, multi-touch follow-up sequence you can paste straight into your CRM and start running today.",
  },
  {
    title: "Quota Planning Sheet",
    type: "Spreadsheet",
    icon: Sheet,
    href: "/resources/quota-planning-sheet",
    description:
      "Reverse-engineer your number. Plug in your averages and see exactly how much activity your quota really takes.",
  },
];

export function ResourceGrid({
  eyebrow = "Free toolkit",
  title = "Resources to help you close more",
  intro = "Steal the templates, trackers, and playbooks our team actually uses. Every download is free, no ten-field form required, just tools you can put to work on your next call.",
  resources = DEFAULT_RESOURCES,
  columns = 3,
  background = "cream",
  revealContent = true,
  className,
  id,
  filterable = false,
  searchable = false,
}: ResourceGridProps = {}) {
  const items = resources.length > 0 ? resources : DEFAULT_RESOURCES;
  const interactive = filterable || searchable;

  const [activeType, setActiveType] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // Unique resource types, in first-appearance order, for the filter chips.
  const types = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const resource of items) {
      if (resource.type && !seen.has(resource.type)) {
        seen.add(resource.type);
        out.push(resource.type);
      }
    }
    return out;
  }, [items]);

  // Keep each card's original index so its rotating accent + tilt stay stable
  // as the list is filtered. With no flags, this is just the untouched list.
  const visible = useMemo(() => {
    const decorated = items.map((resource, index) => ({ resource, index }));
    if (!interactive) return decorated;
    const q = query.trim().toLowerCase();
    return decorated.filter(({ resource }) => {
      const matchesType = !activeType || resource.type === activeType;
      const matchesQuery =
        !q ||
        resource.title.toLowerCase().includes(q) ||
        resource.description.toLowerCase().includes(q);
      return matchesType && matchesQuery;
    });
  }, [items, interactive, activeType, query]);

  const showChips = filterable && types.length > 0;
  const showControls = searchable || showChips;

  return (
    <Section id={id} background={background} bordered className={className}>
      <Reveal stagger enabled={revealContent} className="mx-auto max-w-[46rem] text-center">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        {title ? (
          <Heading as={2} size="lg" className={cn(eyebrow && "mt-3")}>
            {title}
          </Heading>
        ) : null}
        {intro ? (
          <p className="mx-auto mt-4 max-w-[42rem] text-lg leading-relaxed opacity-80">
            {intro}
          </p>
        ) : null}
      </Reveal>

      {showControls ? (
        <div className="mt-8 flex flex-col items-center gap-4 md:mt-10">
          {searchable ? (
            <div className="relative mx-auto w-full max-w-md">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink"
                strokeWidth={2.5}
                aria-hidden="true"
              />
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search resources"
                aria-label="Search resources"
                className="pl-12 motion-reduce:transition-none"
              />
            </div>
          ) : null}

          {showChips ? (
            <div
              className="flex flex-wrap justify-center gap-3"
              role="group"
              aria-label="Filter resources by type"
            >
              <FilterChip
                active={activeType === null}
                onClick={() => setActiveType(null)}
              >
                All
              </FilterChip>
              {types.map((type) => (
                <FilterChip
                  key={type}
                  active={activeType === type}
                  onClick={() => setActiveType(type)}
                >
                  {type}
                </FilterChip>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {interactive ? (
        <p className="sr-only" role="status" aria-live="polite">
          {visible.length === 0
            ? "No resources match your filter or search."
            : `Showing ${visible.length} ${
                visible.length === 1 ? "resource" : "resources"
              }.`}
        </p>
      ) : null}

      {interactive && visible.length === 0 ? (
        <p className="mt-10 text-center text-lg font-bold md:mt-14">
          No resources match yet, try another filter or search term.
        </p>
      ) : (
        <Reveal
          as="ul"
          stagger
          enabled={revealContent}
          className={cn(
            "mt-10 grid list-none grid-cols-1 gap-6 md:mt-14 md:gap-8",
            columnsClass[columns],
          )}
        >
          {visible.map(({ resource, index }) => (
            <li key={`${resource.title}-${index}`} className="h-full">
              <ResourceCard resource={resource} index={index} />
            </li>
          ))}
        </Reveal>
      )}
    </Section>
  );
}

/** On-brand pill filter chip: paper by default, solid `ink` when active. */
function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "press inline-flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-full border-[2.5px] border-ink px-5 py-2.5 font-sans text-sm font-bold uppercase tracking-wide shadow-hard-xs",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ink",
        "motion-reduce:transition-none",
        active
          ? "bg-ink text-paper shadow-hard-sm focus-visible:ring-paper"
          : "bg-paper text-ink",
      )}
    >
      {children}
    </button>
  );
}

function ResourceCard({ resource, index }: { resource: Resource; index: number }) {
  const Icon = resource.icon ?? FileText;
  const accent = resource.accent ?? ACCENTS[index % ACCENTS.length];
  const cta = resource.cta ?? "Download";
  const tilt = index % 2 === 0 ? "-rotate-2" : "rotate-2";
  const href = resource.href;

  return (
    <Card
      color="paper"
      shadow="lg"
      padding="md"
      interactive
      className="group relative flex h-full flex-col gap-5"
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-[2.5px] border-ink shadow-hard-sm transition-transform duration-200 group-hover:rotate-0",
            tilt,
            accentTileClass[accent],
          )}
        >
          <Icon className="h-7 w-7" strokeWidth={2.5} aria-hidden="true" />
        </span>
        {resource.type ? (
          <Badge color={accent} size="sm" shadow="hard">
            {resource.type}
          </Badge>
        ) : null}
      </div>

      <div className="flex-1">
        <Heading as={3} size="sm">
          {resource.title}
        </Heading>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">{resource.description}</p>
      </div>

      <div>
        {href ? (
          // Stretched-link: the anchor's ::after overlay covers the whole card so it is
          // fully clickable. The button's own press transform is suppressed so only the
          // card presses (a live transform on the button would re-anchor the overlay).
          <Button
            href={href}
            variant="ink"
            size="sm"
            aria-label={`${cta}: ${resource.title}`}
            className="after:absolute after:inset-0 after:z-[1] after:content-[''] hover:transform-none! active:transform-none! hover:shadow-hard-sm! active:shadow-hard-sm!"
          >
            <Download className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
            {cta}
          </Button>
        ) : (
          <Button variant="ink" size="sm">
            <Download className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
            {cta}
          </Button>
        )}
      </div>
    </Card>
  );
}
