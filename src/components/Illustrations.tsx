import { useId } from "react";
import type { ActivityScene, PortraitId } from "../data/together";

type SvgProps = { className?: string };

const portraits: Record<
  PortraitId,
  { skin: string; hair: string; shirt: string; bg: string; style: "short" | "bob" | "bun" | "curls" | "cap" }
> = {
  alex: { skin: "#f3c29a", hair: "#3a2c26", shirt: "#3c8f66", bg: "#f6dec8", style: "short" },
  jamie: { skin: "#e4ac7c", hair: "#2a211c", shirt: "#d08945", bg: "#f4d4b6", style: "curls" },
  maya: { skin: "#f6d0b4", hair: "#6b3044", shirt: "#d36b78", bg: "#f8e3d6", style: "bob" },
  lina: { skin: "#f0c4a0", hair: "#4a3428", shirt: "#7d6bb5", bg: "#f6e0d0", style: "bun" },
  sarah: { skin: "#f8d7bc", hair: "#2c241c", shirt: "#5c8f9a", bg: "#f8e6d6", style: "bob" },
  kevin: { skin: "#d9a67a", hair: "#1c1614", shirt: "#6d8f62", bg: "#efd0b2", style: "short" },
  sam: { skin: "#f2c8a4", hair: "#8a5a32", shirt: "#c47b6a", bg: "#f6deca", style: "cap" },
};

export function LogoLeaf({ className }: SvgProps) {
  return (
    <svg className={className} viewBox="0 0 28 28" aria-hidden="true">
      <path d="M14 25c-6-4-9-9-9-14 6 0 10 2 13 6 1-6 5-10 10-12-1 8-4 14-14 20z" fill="#3f8f6b" />
      <path d="M14 25c2-6 2-10 1-16" fill="none" stroke="#e7f6ec" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function HeaderBell({ className }: SvgProps) {
  return (
    <svg className={className} viewBox="0 0 28 28" aria-hidden="true">
      <path d="M8 18.5c0-4 1.6-6.2 3.2-7.4.4-2.2 1.6-3.6 2.8-3.6s2.4 1.4 2.8 3.6c1.6 1.2 3.2 3.4 3.2 7.4H8z" fill="none" stroke="#173e38" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M12.2 18.6a1.8 1.8 0 0 0 3.6 0" fill="none" stroke="#173e38" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="19.5" cy="8" r="2.3" fill="#e7a3a0" />
    </svg>
  );
}

export function HeaderPerson({ className }: SvgProps) {
  return (
    <svg className={className} viewBox="0 0 28 28" aria-hidden="true">
      <circle cx="14" cy="14" r="12" fill="#e7f3ea" />
      <circle cx="14" cy="12" r="4" fill="#f0c4a0" />
      <path d="M7.5 22c1.2-4 3.6-6 6.5-6s5.3 2 6.5 6" fill="#3f8f6b" />
    </svg>
  );
}

export function Landscape({ className }: SvgProps) {
  return (
    <svg className={className} viewBox="0 0 390 210" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <circle cx="312" cy="46" r="22" fill="#f6c453" />
      <g stroke="#f6c453" strokeWidth="3" strokeLinecap="round">
        <path d="M312 12v8" />
        <path d="M312 72v8" />
        <path d="M278 46h8" />
        <path d="M338 46h8" />
        <path d="M288 22l6 6" />
        <path d="M330 64l6 6" />
        <path d="M288 70l6-6" />
        <path d="M330 28l6-6" />
      </g>
      <path d="M0 118c70-42 120-28 176-46 62-20 110 4 214-8v146H0V118z" fill="#d9eec8" />
      <path d="M0 150c78-36 132-8 196-24 58-14 110 10 194-6v90H0v-60z" fill="#c3e2ad" />
      <path d="M0 176c60-18 110-4 160-16 40-10 80 6 120-4 30-8 70 2 110-8v62H0v-34z" fill="#b5d89c" />
      <g transform="translate(8 78)">
        <path d="M18 46c-2-18-8-30-18-40 14 2 22 12 20 26-8 2-14 6-2 14z" fill="#7db86a" />
        <path d="M22 48c8-16 20-24 34-30-8 16-16 22-30 24 2 6-2 8-4 6z" fill="#9ccc88" />
        <path d="M16 52c2 10 1 18-2 24" fill="none" stroke="#5f9a58" strokeWidth="2" strokeLinecap="round" />
      </g>
      <g transform="translate(332 24)">
        <path d="M28 18c12 2 20 12 18 24-14-2-22-12-18-24z" fill="#8fc47e" />
        <path d="M24 28c-12 4-16 16-10 24 10-8 14-16 10-24z" fill="#b7d7a2" />
        <path d="M20 58c8-10 16-14 28-16" fill="none" stroke="#6aaa62" strokeWidth="2" strokeLinecap="round" />
      </g>
      <g transform="translate(348 92)">
        <path d="M10 28c-8-14-4-24 6-28 2 12 0 20-6 28z" fill="#7dba6e" />
        <path d="M16 26c10-6 18-6 26 0-8 8-16 8-26 0z" fill="#a9d498" />
      </g>
    </svg>
  );
}

export function Portrait({ id, className }: { id: PortraitId; className?: string }) {
  const clip = `cc-face-${useId().replace(/:/g, "")}`;
  const look = portraits[id];
  return (
    <svg className={className ?? "cc-portrait"} viewBox="0 0 80 80" aria-hidden="true">
      <defs>
        <clipPath id={clip}>
          <circle cx="40" cy="40" r="40" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <rect width="80" height="80" fill={look.bg} />
        <Hair style={look.style} color={look.hair} />
        <circle cx="40" cy="40" r="16" fill={look.skin} />
        <Bangs style={look.style} color={look.hair} />
        <circle cx="34" cy="40" r="1.6" fill="#3a2e28" />
        <circle cx="46" cy="40" r="1.6" fill="#3a2e28" />
        <path d="M34.5 47c2 2.2 9 2.2 11 0" fill="none" stroke="#c47862" strokeWidth="1.5" strokeLinecap="round" />
        <ellipse cx="30" cy="44" rx="2.6" ry="1.4" fill="#ef9d88" opacity="0.7" />
        <ellipse cx="50" cy="44" rx="2.6" ry="1.4" fill="#ef9d88" opacity="0.7" />
        <path d="M8 84c4-22 14-30 32-30s28 8 32 30" fill={look.shirt} />
      </g>
    </svg>
  );
}

function Hair({ style, color }: { style: string; color: string }) {
  if (style === "bob") {
    return <path d="M18 46c0-22 8-36 22-36s22 14 22 36c-2 10-8 16-14 16 2-8 2-16-8-16s-10 8-8 16c-6 0-12-6-14-16z" fill={color} />;
  }
  if (style === "bun") {
    return (
      <g fill={color}>
        <circle cx="40" cy="16" r="8" />
        <path d="M20 42c1-18 8-30 20-30s19 12 20 30c-6-10-12-14-20-14s-14 4-20 14z" />
      </g>
    );
  }
  if (style === "curls") {
    return (
      <g fill={color}>
        <circle cx="22" cy="34" r="8" />
        <circle cx="28" cy="22" r="8" />
        <circle cx="40" cy="16" r="8" />
        <circle cx="52" cy="22" r="8" />
        <circle cx="58" cy="34" r="8" />
        <circle cx="24" cy="46" r="7" />
        <circle cx="56" cy="46" r="7" />
      </g>
    );
  }
  if (style === "cap") {
    return <path d="M22 40c1-16 8-26 18-26s17 10 18 26c-4-8-12-12-18-12s-14 4-18 12z" fill={color} />;
  }
  return <path d="M22 40c1-16 8-26 18-26s17 10 18 26c-4-8-12-12-18-12s-14 4-18 12z" fill={color} />;
}

function Bangs({ style, color }: { style: string; color: string }) {
  if (style === "cap") {
    return (
      <g>
        <path d="M24 36c6-14 26-16 34-4-8 2-14-2-18-2s-12 4-16 6z" fill="#e7b15a" />
        <path d="M22 34c8-4 28-6 38 2-2 3-8 2-12 0" fill="#f0c56a" />
      </g>
    );
  }
  if (style === "bob" || style === "bun") {
    return <path d="M26 36c4-8 8-10 14-10 4 6 8 6 14 2-6 2-8 6-14 6s-10-2-14 2z" fill={color} />;
  }
  return null;
}

export function SceneArt({ scene, className }: { scene: ActivityScene; className?: string }) {
  if (scene === "waste") return <WasteScene className={className} />;
  if (scene === "mend") return <MendScene className={className} />;
  if (scene === "bike") return <BikeArt className={className} />;
  if (scene === "flights") return <FlightScene className={className} />;
  if (scene === "thermostat") return <HomeScene className={className} />;
  return <SaladArt className={className} />;
}

export function SaladArt({ className }: SvgProps) {
  return (
    <svg className={className} viewBox="0 0 140 110" aria-hidden="true">
      <path d="M108 18c2 8-2 12-8 12" fill="none" stroke="#f0b429" strokeWidth="2" strokeLinecap="round" />
      <path d="M116 24c6 2 8 8 4 12" fill="none" stroke="#f0b429" strokeWidth="2" strokeLinecap="round" />
      <path d="M112 12l2 8" stroke="#f0b429" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="70" cy="96" rx="46" ry="8" fill="#ead7b8" />
      <path d="M28 62c0 22 16 36 42 36s42-14 42-36c-8 8-20 12-42 12S36 70 28 62z" fill="#f4f7f2" />
      <path d="M34 60c6-16 18-24 36-24s30 8 36 24c-10 6-22 8-36 8s-26-2-36-8z" fill="#d7efe0" />
      <path d="M46 52c6-10 14-14 24-12 2 8-2 16-10 20-8-2-14-4-14-8z" fill="#7dba6a" />
      <path d="M78 46c10-2 18 4 20 12-10 2-18-2-20-12z" fill="#9ccc78" />
      <path d="M58 58c8 2 12 8 10 16-8-2-12-8-10-16z" fill="#5fa86a" />
      <circle cx="52" cy="64" r="5" fill="#e15b4a" />
      <circle cx="86" cy="66" r="4.5" fill="#e15b4a" />
      <circle cx="70" cy="70" r="3.5" fill="#ef7d62" />
      <rect x="60" y="48" width="10" height="8" rx="2" fill="#f3e2b0" transform="rotate(-12 65 52)" />
      <rect x="74" y="54" width="10" height="8" rx="2" fill="#f6e7c0" transform="rotate(8 79 58)" />
      <rect x="48" y="70" width="9" height="7" rx="2" fill="#f8edd0" />
    </svg>
  );
}

function WasteScene({ className }: SvgProps) {
  return (
    <svg className={className} viewBox="0 0 140 110" aria-hidden="true">
      <ellipse cx="70" cy="90" rx="40" ry="8" fill="#ead7b8" />
      <path d="M36 70c2 16 14 26 34 26s32-10 34-26H36z" fill="#f7f4ee" />
      <path d="M40 68h60c-2 8-12 14-30 14s-28-6-30-14z" fill="#f3e2c4" />
      <path d="M52 58c6-8 12-10 18-6 2 6-2 12-8 14-6 0-10-4-10-8z" fill="#8bc47a" />
      <circle cx="78" cy="62" r="5" fill="#e15b4a" />
      <rect x="84" y="66" width="12" height="8" rx="2" fill="#f3e2b0" transform="rotate(12 90 70)" />
      <path d="M46 46c8-16 20-18 28-8" fill="none" stroke="#c9a06a" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function MendScene({ className }: SvgProps) {
  return (
    <svg className={className} viewBox="0 0 140 110" aria-hidden="true">
      <path d="M38 78c2-28 14-40 32-40s30 12 32 40c-8 8-20 12-32 12s-24-4-32-12z" fill="#f2b7b4" />
      <path d="M58 40c4-10 20-10 24 0" fill="none" stroke="#e98986" strokeWidth="4" strokeLinecap="round" />
      <path d="M70 48v28" stroke="#f8e8e6" strokeWidth="3" strokeLinecap="round" />
      <path d="M86 34c16 2 22 14 18 26" fill="none" stroke="#c9a06a" strokeWidth="3" strokeLinecap="round" />
      <path d="M104 28l6 10-8 2z" fill="#d7c2a4" />
      <circle cx="52" cy="62" r="2" fill="#e98986" />
    </svg>
  );
}

export function BikeArt({ className }: SvgProps) {
  return (
    <svg className={className} viewBox="0 0 140 110" aria-hidden="true">
      <circle cx="42" cy="74" r="18" fill="none" stroke="#6d5a93" strokeWidth="4" />
      <circle cx="100" cy="74" r="18" fill="none" stroke="#6d5a93" strokeWidth="4" />
      <path d="M42 74l22-30h22l14 30" fill="none" stroke="#7d6aa6" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M64 44h16" stroke="#7d6aa6" strokeWidth="4" strokeLinecap="round" />
      <path d="M78 44l-8 30" stroke="#7d6aa6" strokeWidth="4" strokeLinecap="round" />
      <circle cx="86" cy="44" r="3" fill="#8d7ab4" />
    </svg>
  );
}

function FlightScene({ className }: SvgProps) {
  return (
    <svg className={className} viewBox="0 0 140 110" aria-hidden="true">
      <path d="M18 78c28-6 52-8 104-4" fill="none" stroke="#d9c7ef" strokeWidth="8" strokeLinecap="round" />
      <path d="M34 70c22-18 40-24 62-22l10 16-28 2-8 16-10-14-26 2z" fill="#8d74b4" />
      <path d="M78 50l16-16 6 8-14 12z" fill="#b7a2d4" />
      <circle cx="108" cy="28" r="8" fill="#f6c453" />
    </svg>
  );
}

function HomeScene({ className }: SvgProps) {
  return (
    <svg className={`${className ?? ""} cc-home-art`.trim()} viewBox="0 0 140 110" aria-hidden="true">
      <path d="M34 52l36-24 36 24v36H34V52z" fill="currentColor" />
      <path d="M28 54l42-30 42 30" fill="none" stroke="currentColor" strokeWidth="6" strokeLinejoin="round" strokeLinecap="round" />
      <rect x="62" y="62" width="16" height="26" rx="2" fill="currentColor" />
      <rect x="42" y="60" width="12" height="10" rx="2" fill="#f7f1e2" />
      <path d="M104 70c0-10 8-16 8-16s8 6 8 16c0 8-8 14-8 14s-8-6-8-14z" fill="#7dba6a" />
      <path d="M112 78v16" stroke="#5f9a58" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function StatPeople({ className }: SvgProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="9" cy="8" r="3" fill="#3f8f6b" />
      <circle cx="16" cy="9" r="2.4" fill="#7dba6a" />
      <path d="M3.5 19c.6-4 2.8-6 5.5-6s4.9 2 5.5 6" fill="#3f8f6b" />
      <path d="M13 19c.4-3 1.8-4.6 3.4-4.6 1.5 0 2.8 1.4 3.2 4.6" fill="#7dba6a" />
    </svg>
  );
}

export function StatLeaf({ className }: SvgProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20C6 16 4 11 5 6c6 .4 9 3 10 8 1-5 4-8 8-8-1 7-4 12-11 14z" fill="#3f8f6b" />
    </svg>
  );
}

export function StatCloud({ className }: SvgProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 17h9a4 4 0 0 0 .4-8 5 5 0 0 0-9.6-1.2A3.5 3.5 0 0 0 8 17z" fill="#7eb8a2" />
    </svg>
  );
}

export function ImpactPlants({ className }: SvgProps) {
  return (
    <svg className={className} viewBox="0 0 320 90" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      <g transform="translate(-4 28)">
        <path d="M18 48C16 30 8 18 0 8c12 2 18 10 16 22-6 2-10 6 2 18z" fill="#8fc47e" />
        <path d="M20 46c8-14 18-20 30-24-8 12-14 18-26 20 2 4 0 6-4 4z" fill="#b7d7a2" />
        <path d="M16 50c1 8 0 14-2 20" fill="none" stroke="#5f9a58" strokeWidth="2" strokeLinecap="round" />
      </g>
      <g transform="translate(250 8)">
        <path d="M28 16c14 2 22 12 18 26-12-2-20-12-18-26z" fill="#7dba6e" />
        <path d="M24 28c-14 4-16 16-8 26 8-8 14-16 8-26z" fill="#a9d498" />
        <path d="M36 46c6 10 4 20 2 28" fill="none" stroke="#5f9a58" strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function CommentGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6.2 16.2 4.2 19.4V7.6A2.4 2.4 0 0 1 6.6 5.2h10.8A2.4 2.4 0 0 1 19.8 7.6v6.2a2.4 2.4 0 0 1-2.4 2.4H6.2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HeartGlyph({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 19s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PlusGlyph() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 2.5v11M2.5 8h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function CheckGlyph() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronGlyph() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
