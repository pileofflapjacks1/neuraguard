import { HowItWorksPanel } from "@/components/how-it-works-panel";
import { NEURABRIDGE_WS_CONTRACT } from "@/lib/adapter/neurabridge-stub";
import Link from "next/link";

export default function HowItWorksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">How NeuraGuard works</h1>
        <p className="mt-1 max-w-3xl text-sm text-guard-muted">
          Educational overview of the computer-side pipeline. Everything is a
          research simulation on synthetic or mock intention streams — never
          real implant signals.
        </p>
      </div>

      {/* Architecture diagram (SVG) */}
      <div className="guard-card overflow-x-auto">
        <h2 className="mb-3 text-sm font-semibold">Architecture</h2>
        <svg
          viewBox="0 0 900 180"
          className="mx-auto w-full max-w-4xl text-xs"
          role="img"
          aria-label="Pipeline: Stream Ingest to Action Dispatcher"
        >
          <defs>
            <marker
              id="arrow"
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L6,3 L0,6 Z" fill="#22d3ee" />
            </marker>
          </defs>
          {[
            { x: 20, label: "Stream\nIngest" },
            { x: 200, label: "Feature\nExtractor" },
            { x: 380, label: "State\nEstimator" },
            { x: 560, label: "Policy\nEngine" },
            { x: 740, label: "Action\nDispatcher" },
          ].map((b, i) => (
            <g key={b.label}>
              <rect
                x={b.x}
                y={40}
                width={120}
                height={70}
                rx={12}
                fill="#0f141c"
                stroke="#22d3ee"
                strokeWidth={1.5}
              />
              {b.label.split("\n").map((line, li) => (
                <text
                  key={line}
                  x={b.x + 60}
                  y={70 + li * 16}
                  textAnchor="middle"
                  fill="#e8eef7"
                  fontSize={13}
                  fontFamily="system-ui, sans-serif"
                >
                  {line}
                </text>
              ))}
              {i < 4 ? (
                <line
                  x1={b.x + 120}
                  y1={75}
                  x2={b.x + 180}
                  y2={75}
                  stroke="#22d3ee"
                  strokeWidth={2}
                  markerEnd="url(#arrow)"
                />
              ) : null}
            </g>
          ))}
          <text
            x={450}
            y={150}
            textAnchor="middle"
            fill="#8b9bb0"
            fontSize={12}
            fontFamily="system-ui, sans-serif"
          >
            All stages run in-browser on synthetic / CSV / mock WebSocket data
          </text>
        </svg>
      </div>

      <HowItWorksPanel />

      <div className="guard-card space-y-3">
        <h2 className="text-sm font-semibold">Neurabridge adapter (stub)</h2>
        <p className="text-sm text-guard-muted">
          Soft integration shape for suite middleware. Map{" "}
          <code className="kbd">velocity_2d</code> /{" "}
          <code className="kbd">class_label</code> events into{" "}
          <code className="kbd">IntentionSample</code>. See{" "}
          <code className="text-cyan-200">src/lib/adapter/neurabridge-stub.ts</code>.
        </p>
        <div className="space-y-2">
          <div className="guard-label">Inbound examples</div>
          {NEURABRIDGE_WS_CONTRACT.inbound.map((line) => (
            <pre
              key={line}
              className="overflow-x-auto rounded-lg bg-guard-bg p-2 font-mono text-xs text-emerald-200/90"
            >
              {line}
            </pre>
          ))}
        </div>
      </div>

      <div className="guard-card space-y-2 text-sm">
        <h2 className="text-sm font-semibold">Safety framing</h2>
        <ul className="list-disc space-y-1 pl-5 text-guard-muted">
          <li>Not a medical device (not SaMD).</li>
          <li>Not implant firmware or vendor SDK.</li>
          <li>Not affiliated with Neuralink or any implant company.</li>
          <li>All MVP data is synthetic or user-provided mock CSV/WS.</li>
        </ul>
        <Link href="/disclaimer" className="text-cyan-300">
          Read the full disclaimer →
        </Link>
      </div>
    </div>
  );
}
