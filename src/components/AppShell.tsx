import { useRef, type KeyboardEvent, type MouseEvent, type PointerEvent, type ReactNode, type TouchEvent } from "react";
import { ChartPie, Leaf, TrendingDown, UsersRound, type LucideIcon } from "lucide-react";

export type Destination = "footprint" | "explore" | "impact" | "together";
export type PaneIndex = number;

const destinations: {
  id: Destination;
  label: string;
  icon: LucideIcon;
  tabs: string[];
}[] = [
  { id: "footprint", label: "My Footprint", icon: ChartPie, tabs: ["My Footprint"] },
  { id: "explore", label: "Explore", icon: Leaf, tabs: ["For You", "Browse", "Potential Impact"] },
  { id: "impact", label: "Your Impact", icon: TrendingDown, tabs: ["Your Progress"] },
  { id: "together", label: "Together", icon: UsersRound, tabs: ["Together"] },
];

type Props = {
  destination: Destination;
  panes: Record<Destination, PaneIndex>;
  onDestination: (destination: Destination) => void;
  onPane: (destination: Destination, pane: PaneIndex) => void;
  views: Record<Destination, ReactNode[]>;
};

export function AppShell({ destination, panes, onDestination, onPane, views }: Props) {
  return (
    <div className="app-shell">
      {destinations.map((item) => (
        <section
          key={item.id}
          className="destination"
          hidden={item.id !== destination}
          aria-label={item.label}
        >
          <ViewPair
            labels={item.tabs}
            pane={panes[item.id]}
            onPane={(pane) => onPane(item.id, pane)}
            views={views[item.id]}
          />
        </section>
      ))}
      <nav className="bottom-nav" aria-label="Main">
        {destinations.map((item) => {
          const active = item.id === destination;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`bottom-nav-item ${active ? "is-active" : ""}`}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => onDestination(item.id)}
            >
              <Icon size={22} strokeWidth={1.75} absoluteStrokeWidth aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function ViewPair({
  labels,
  pane,
  onPane,
  views,
}: {
  labels: string[];
  pane: PaneIndex;
  onPane: (pane: PaneIndex) => void;
  views: ReactNode[];
}) {
  const count = labels.length;
  const index = Math.min(Math.max(pane, 0), Math.max(count - 1, 0));
  const multiple = count > 1;
  const start = useRef<{
    x: number;
    y: number;
    ignore: boolean;
    pane: HTMLElement | null;
    scrollTop: number;
  } | null>(null);
  const suppressClick = useRef(false);

  function begin(x: number, y: number, target: EventTarget | null) {
    const pane = target instanceof Element ? target.closest(".view-pane") : null;
    start.current = {
      x,
      y,
      ignore: ignoreSwipe(target),
      pane: pane instanceof HTMLElement ? pane : null,
      scrollTop: pane instanceof HTMLElement ? pane.scrollTop : 0,
    };
  }

  function finish(x: number, y: number) {
    const origin = start.current;
    start.current = null;
    if (!origin || origin.ignore) return;
    if (origin.pane && Math.abs(origin.pane.scrollTop - origin.scrollTop) > 8) return;
    const dx = x - origin.x;
    const dy = y - origin.y;
    if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy)) return;
    suppressClick.current = true;
    window.setTimeout(() => {
      suppressClick.current = false;
    }, 400);
    window.getSelection()?.removeAllRanges();
    const last = labels.length - 1;
    const next = dx < 0 ? Math.min(last, index + 1) : Math.max(0, index - 1);
    if (next !== index) onPane(next);
  }

  function cancel() {
    start.current = null;
  }

  function onClickCapture(event: MouseEvent) {
    if (!suppressClick.current) return;
    suppressClick.current = false;
    event.preventDefault();
    event.stopPropagation();
  }

  function onTabsKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const last = count - 1;
    let next: PaneIndex | null = null;
    if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    else if (event.key === "ArrowRight" || event.key === "ArrowDown") next = index >= last ? 0 : index + 1;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = index <= 0 ? last : index - 1;
    else return;
    if (next === index) return;
    event.preventDefault();
    onPane(next);
    const tabs = event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    tabs[next]?.focus();
  }

  function onTouchStart(event: TouchEvent) {
    const touch = event.touches[0];
    if (!touch) return;
    begin(touch.clientX, touch.clientY, event.target);
  }

  function onTouchEnd(event: TouchEvent) {
    const touch = event.changedTouches[0];
    if (!touch) return;
    finish(touch.clientX, touch.clientY);
  }

  function onPointerDown(event: PointerEvent) {
    if (event.pointerType === "touch" || event.button !== 0) return;
    begin(event.clientX, event.clientY, event.target);
  }

  function onPointerUp(event: PointerEvent) {
    if (event.pointerType === "touch") return;
    finish(event.clientX, event.clientY);
  }

  return (
    <div className="view-pair">
      {multiple ? (
        <div
          className={`view-tabs ${count > 2 ? "is-wide" : ""}`}
          role="tablist"
          aria-label="Views"
          onKeyDown={onTabsKeyDown}
        >
          {labels.map((label, tabIndex) => {
            const active = index === tabIndex;
            const slug = tabSlug(label);
            return (
              <button
                key={label}
                id={`tab-${slug}`}
                className={`view-tab ${active ? "is-active" : ""}`}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`panel-${slug}`}
                tabIndex={active ? 0 : -1}
                onClick={() => onPane(tabIndex)}
              >
                {label}
              </button>
            );
          })}
        </div>
      ) : null}
      <div
        className="view-stage"
        onTouchStart={multiple ? onTouchStart : undefined}
        onTouchEnd={multiple ? onTouchEnd : undefined}
        onTouchCancel={multiple ? cancel : undefined}
        onPointerDown={multiple ? onPointerDown : undefined}
        onPointerUp={multiple ? onPointerUp : undefined}
        onPointerCancel={multiple ? cancel : undefined}
        onClickCapture={multiple ? onClickCapture : undefined}
      >
        <div className="view-track" style={{ transform: `translateX(-${index * 100}%)` }}>
          {views.map((view, viewIndex) => {
            const slug = tabSlug(labels[viewIndex] ?? `view-${viewIndex}`);
            const active = index === viewIndex;
            return (
              <div
                key={labels[viewIndex] ?? viewIndex}
                id={multiple ? `panel-${slug}` : undefined}
                className="view-pane"
                role={multiple ? "tabpanel" : undefined}
                aria-labelledby={multiple ? `tab-${slug}` : undefined}
                inert={!active}
                aria-hidden={!active}
              >
                {view}
              </div>
            );
          })}
        </div>
      </div>
      {multiple ? (
        <div className="view-dots">
          {labels.map((label, dotIndex) => {
            const active = index === dotIndex;
            return (
              <button
                key={label}
                className={`view-dot ${active ? "is-active" : ""}`}
                type="button"
                aria-label={`Show ${label}`}
                aria-current={active ? "step" : undefined}
                onClick={() => onPane(dotIndex)}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function ignoreSwipe(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest("input, textarea, select, button, a, svg, canvas, label, summary, [data-no-swipe]"),
  );
}

function tabSlug(label: string): string {
  return label.toLowerCase().replace(/\s+/g, "-");
}
