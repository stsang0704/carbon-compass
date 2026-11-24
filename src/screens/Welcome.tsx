import { BrandLockup } from "../components/Illustrations";

export function Welcome({ onGetStarted, onSignIn }: { onGetStarted: () => void; onSignIn: () => void }) {
  return (
    <div className="phone grow-welcome">
      <BrandLockup className="grow-brand" />
      <div className="grow-copy">
        <h1>Grow Your Impact.</h1>
        <p>Small changes. Collective impact.</p>
      </div>
      <div className="grow-art" aria-hidden="true">
        <WelcomeLandscape />
      </div>
      <div className="grow-actions">
        <button className="btn-primary" type="button" onClick={onGetStarted}>
          Get Started
        </button>
        <button className="btn-secondary grow-sign-in" type="button" onClick={onSignIn}>
          Sign In
        </button>
      </div>
    </div>
  );
}

function WelcomeLandscape() {
  return (
    <svg className="grow-scene" viewBox="0 0 360 340" preserveAspectRatio="xMidYMax meet">
      <circle cx="262" cy="36" r="26" fill="#f6e3a1" />
      <path d="M0 168c48-36 92-28 140-46 54-20 96-8 140-28 28-12 54-10 80-4v250H0V168z" fill="#dff5e6" />
      <path d="M0 206c62-40 110-18 168-36 52-16 96 6 132-10 24-10 42-8 60-2v182H0V206z" fill="#d9eec8" />
      <path d="M0 248c70-28 120-8 176-22 48-12 90 8 124-6 22-8 42-6 60 0v120H0V248z" fill="#c9ea83" />
      <path d="M188 196c28-16 52-10 78-18 8 10 10 22 6 32-28 6-52 2-78-6-4-2-6-6-6-8z" fill="#b7d7a2" />
      <g fill="#7db86a">
        <path d="M-8 250c28-34 52-36 78-18 8 18-6 40-28 52-30 8-58-6-50-34z" />
        <path d="M36 268c22-28 48-26 64-8 4 22-16 42-42 46-28 2-40-16-22-38z" />
        <path d="M92 286c26-18 48-8 58 8 2 20-18 34-44 32-24-2-32-22-14-40z" />
        <ellipse cx="214" cy="292" rx="46" ry="22" />
        <ellipse cx="168" cy="304" rx="34" ry="16" />
      </g>
      <g fill="#9ccc88">
        <ellipse cx="18" cy="292" rx="28" ry="16" />
        <ellipse cx="78" cy="308" rx="36" ry="18" />
        <ellipse cx="248" cy="308" rx="40" ry="16" />
      </g>
      <g transform="translate(92 130)">
        <path d="M18 46 46 22l34 24v8H14v-8z" fill="#3f8f6b" />
        <rect x="22" y="50" width="44" height="40" rx="2" fill="#fffaf3" />
        <path d="M36 62h14v14H36z" fill="none" stroke="#173e38" strokeWidth="1.6" />
        <path d="M43 62v14M36 69h14" stroke="#173e38" strokeWidth="1.4" />
        <path d="M58 28c8-12 16-16 20-24" fill="none" stroke="#146b4e" strokeWidth="2" strokeLinecap="round" />
        <path d="M70 12c6 2 10 8 8 14-6-2-10-6-8-14z" fill="#7db86a" />
        <path d="M78 16c6 4 8 10 4 14-4-4-8-8-4-14z" fill="#9ccc88" />
      </g>
      <g fill="none" stroke="#173e38" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="224" cy="288" r="21" />
        <circle cx="302" cy="288" r="21" />
        <path d="M224 288 246 250" />
        <path d="M246 250v-10" />
        <path d="M230 240h22" />
        <path d="M246 250 284 246" />
        <path d="M284 246 302 288" />
        <path d="M246 250 262 288 302 288" />
        <path d="M284 246v-12" />
        <path d="M274 232c8-4 18-2 22 2" />
      </g>
      <g fill="#3f8f6b">
        <path d="M18 214c-8-22-2-36 12-44 2 16-2 26-12 44z" />
        <path d="M28 208c12-16 26-20 38-16-10 14-20 18-34 16-2 6-4 6-4 0z" />
        <path d="M48 248c-6-16 2-28 14-34 0 14-4 22-14 34z" />
        <path d="M58 246c10-12 22-14 30-8-8 10-16 12-26 8-2 4-4 4-4 0z" />
      </g>
      <path d="M16 230c4 16 2 28-2 36" fill="none" stroke="#5f9a58" strokeWidth="2" strokeLinecap="round" />
      <path d="M52 262c2 12 1 20-2 26" fill="none" stroke="#5f9a58" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
