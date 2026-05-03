import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";

/**
 * DecisionGame — Top-down freeze-frame scenarios.
 * Player chooses PASS / SHOOT / DRIBBLE. Limited time per scenario.
 *
 * Each scenario describes:
 *   striker (blue) position
 *   defender (red) position closing in
 *   teammate (white) position
 *   goal area
 *   correct action
 *   reasoning (shown after answer)
 */

const SCENARIOS = [
    {
        id: 1,
        title: "Striker boxed in, teammate free",
        striker: { x: 0.6, y: 0.5 },
        defender: { x: 0.5, y: 0.5 },
        teammate: { x: 0.78, y: 0.4 },
        correct: "pass",
        reason: "Defender right on you. The teammate has space and a better angle on goal — pass.",
        timeLimit: 4500,
    },
    {
        id: 2,
        title: "1v1 vs keeper",
        striker: { x: 0.78, y: 0.5 },
        defender: { x: 0.55, y: 0.6 },
        teammate: { x: 0.6, y: 0.35 },
        correct: "shoot",
        reason: "Clear sight of goal, defender too far back. Shoot — first time.",
        timeLimit: 3500,
    },
    {
        id: 3,
        title: "Teammate marked, gap ahead",
        striker: { x: 0.42, y: 0.5 },
        defender: { x: 0.6, y: 0.55 },
        teammate: { x: 0.55, y: 0.42 },
        correct: "dribble",
        reason: "Teammate is shadowed. Defender slightly off-line. Dribble into the gap.",
        timeLimit: 4500,
    },
    {
        id: 4,
        title: "Cross-pitch overload",
        striker: { x: 0.55, y: 0.65 },
        defender: { x: 0.5, y: 0.55 },
        teammate: { x: 0.82, y: 0.3 },
        correct: "pass",
        reason: "Far-side teammate is wide open. Switch the play — pass.",
        timeLimit: 4500,
    },
    {
        id: 5,
        title: "Edge of box, half a yard",
        striker: { x: 0.7, y: 0.45 },
        defender: { x: 0.78, y: 0.5 },
        teammate: { x: 0.55, y: 0.55 },
        correct: "shoot",
        reason: "You've stolen a yard. Don't overthink — shoot before defender recovers.",
        timeLimit: 3500,
    },
];

const ACTIONS = [
    { key: "pass", label: "PASS", color: "#23883C" },
    { key: "shoot", label: "SHOOT", color: "#DC1E28" },
    { key: "dribble", label: "DRIBBLE", color: "#E6B800" },
];

export default function DecisionGame({ onComplete }) {
    const containerRef = useRef(null);
    const gameRef = useRef(null);
    const [idx, setIdx] = useState(0);
    const [feedback, setFeedback] = useState(null); // { correct, reason, picked }
    const [results, setResults] = useState([]); // { picked, correct, ms }
    const [done, setDone] = useState(false);
    const completedRef = useRef(false);

    // Build the Phaser scene — re-renders when idx changes via key prop on parent? We instead control via state hooks + redraw.
    useEffect(() => {
        if (!containerRef.current) return;

        const sceneState = {
            scenarioIdx: 0,
            startTime: 0,
            timer: null,
            timeoutHandle: null,
            objects: {},
        };

        const drawScenario = (scene, scenarioIndex) => {
            const w = scene.scale.width;
            const h = scene.scale.height;
            const sc = SCENARIOS[scenarioIndex];

            // Clear previous
            scene.children.removeAll();

            // Pitch background
            const bg = scene.add.rectangle(w / 2, h / 2, w, h, 0x0e2d1a);
            bg.setStrokeStyle(0);

            // Subtle pitch stripes
            for (let i = 0; i < 8; i++) {
                const stripe = scene.add.rectangle(
                    (w / 8) * (i + 0.5),
                    h / 2,
                    w / 8,
                    h,
                    i % 2 === 0 ? 0x10331f : 0x0a2615
                );
                stripe.setAlpha(0.6);
            }

            // Center line
            scene.add.line(0, 0, w / 2, 0, w / 2, h, 0xffffff, 0.2).setLineWidth(1);
            // Center circle
            const cc = scene.add.circle(w / 2, h / 2, 60, 0x000000, 0);
            cc.setStrokeStyle(1, 0xffffff, 0.2);

            // Goal area (right side)
            const goalH = h * 0.4;
            scene.add
                .rectangle(w - 60, h / 2, 120, goalH, 0xffffff, 0)
                .setStrokeStyle(1, 0xffffff, 0.3);
            scene.add
                .rectangle(w - 25, h / 2, 50, goalH * 0.55, 0xffffff, 0)
                .setStrokeStyle(1, 0xffffff, 0.4);
            // Goal posts
            scene.add.rectangle(w - 4, h / 2 - 35, 4, 4, 0xffffff);
            scene.add.rectangle(w - 4, h / 2 + 35, 4, 4, 0xffffff);

            // Players
            const sx = sc.striker.x * w;
            const sy = sc.striker.y * h;
            const dx = sc.defender.x * w;
            const dy = sc.defender.y * h;
            const tx = sc.teammate.x * w;
            const ty = sc.teammate.y * h;

            // Striker (red) - YOU / home kit
            scene.add.circle(sx, sy, 16, 0xdc1e28).setStrokeStyle(2, 0xffffff, 0.9);
            scene.add.text(sx, sy - 30, "YOU", {
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "10px",
                color: "#FFFFFF",
            }).setOrigin(0.5);
            // Ball at striker feet
            scene.add.circle(sx + 14, sy + 14, 5, 0xffffff).setStrokeStyle(1, 0x000000, 0.4);

            // Defender (black away kit)
            scene.add.circle(dx, dy, 16, 0x0a0a0a).setStrokeStyle(2, 0xffffff, 0.6);
            scene.add.text(dx, dy - 30, "DEF", {
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "10px",
                color: "#FFFFFF",
            }).setOrigin(0.5);

            // Teammate (white kit with red outline)
            scene.add.circle(tx, ty, 16, 0xffffff).setStrokeStyle(2, 0xdc1e28, 0.9);
            scene.add.text(tx, ty - 30, "TEAM", {
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "10px",
                color: "#FFFFFFCC",
            }).setOrigin(0.5);

            // Pass line dashed
            const dash = scene.add.graphics();
            dash.lineStyle(1, 0x23883c, 0.45);
            const segs = 16;
            for (let i = 0; i < segs; i += 2) {
                const t1 = i / segs;
                const t2 = (i + 1) / segs;
                dash.beginPath();
                dash.moveTo(sx + (tx - sx) * t1, sy + (ty - sy) * t1);
                dash.lineTo(sx + (tx - sx) * t2, sy + (ty - sy) * t2);
                dash.strokePath();
            }

            // Shot line dashed
            const shot = scene.add.graphics();
            shot.lineStyle(1, 0xdc1e28, 0.4);
            const goalCx = w - 8;
            const goalCy = h / 2;
            for (let i = 0; i < segs; i += 2) {
                const t1 = i / segs;
                const t2 = (i + 1) / segs;
                shot.beginPath();
                shot.moveTo(sx + (goalCx - sx) * t1, sy + (goalCy - sy) * t1);
                shot.lineTo(sx + (goalCx - sx) * t2, sy + (goalCy - sy) * t2);
                shot.strokePath();
            }

            // Title overlay
            scene.add.text(24, 18, sc.title, {
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "20px",
                fontStyle: "700",
                color: "#FFFFFF",
            });
            scene.add.text(24, 44, `SCENARIO ${scenarioIndex + 1} / ${SCENARIOS.length}`, {
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "10px",
                color: "#FFFFFF66",
            });

            // Time bar
            const barWidth = w - 48;
            scene.add.rectangle(24 + barWidth / 2, h - 18, barWidth, 4, 0xffffff, 0.08);
            const bar = scene.add.rectangle(24, h - 18, barWidth, 4, 0xdc1e28);
            bar.setOrigin(0, 0.5);

            scene.tweens.add({
                targets: bar,
                scaleX: 0,
                duration: sc.timeLimit,
                ease: "Linear",
            });
        };

        const SCENE = {
            key: "DecisionScene",
            create() {
                this._draw = drawScenario;
                this._draw(this, sceneState.scenarioIdx);
            },
        };

        const config = {
            type: Phaser.AUTO,
            parent: containerRef.current,
            backgroundColor: "#0A0A0A",
            scale: {
                mode: Phaser.Scale.RESIZE,
                autoCenter: Phaser.Scale.CENTER_BOTH,
                width: containerRef.current?.clientWidth || 800,
                height: 460,
            },
            scene: SCENE,
        };

        const game = new Phaser.Game(config);
        gameRef.current = { game, sceneState, drawScenario };

        // expose redraw on idx change via window event
        const handler = (e) => {
            const scene = game.scene.getScene("DecisionScene");
            if (scene && typeof e.detail?.idx === "number") {
                drawScenario(scene, e.detail.idx);
            }
        };
        window.addEventListener("ps:decision-redraw", handler);

        return () => {
            window.removeEventListener("ps:decision-redraw", handler);
            try {
                game.destroy(true);
            } catch (err) {
                /* noop */
            }
            gameRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Track scenario start time
    const startTimeRef = useRef(Date.now());

    useEffect(() => {
        startTimeRef.current = Date.now();
        // redraw scene
        window.dispatchEvent(new CustomEvent("ps:decision-redraw", { detail: { idx } }));

        // Timeout — auto-fail if no answer
        const sc = SCENARIOS[idx];
        if (!sc) return;
        const t = setTimeout(() => {
            handleAnswer(null);
        }, sc.timeLimit + 200);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idx]);

    const handleAnswer = (action) => {
        if (feedback) return; // already answered
        const sc = SCENARIOS[idx];
        const ms = Date.now() - startTimeRef.current;
        const correct = action === sc.correct;
        const next = [...results, { picked: action, correct, ms }];
        setResults(next);
        setFeedback({ correct, reason: sc.reason, picked: action });

        setTimeout(() => {
            setFeedback(null);
            if (idx + 1 < SCENARIOS.length) {
                setIdx(idx + 1);
            } else {
                // finish
                const correctCount = next.filter((r) => r.correct).length;
                const total = SCENARIOS.length;
                const avgTime =
                    next.reduce((a, b) => a + b.ms, 0) / Math.max(1, next.length);
                // score: 80% accuracy + 20% speed bonus
                const accuracyScore = (correctCount / total) * 80;
                const avgClamped = Math.max(800, Math.min(3500, avgTime));
                const speedScore = ((3500 - avgClamped) / 2700) * 20;
                const score = Math.round(accuracyScore + speedScore);

                setDone(true);
                if (!completedRef.current && typeof onComplete === "function") {
                    completedRef.current = true;
                    onComplete({
                        score,
                        correct: correctCount,
                        total,
                        avgTime,
                    });
                }
            }
        }, 1600);
    };

    const sc = SCENARIOS[idx];

    return (
        <div data-testid="decision-game" className="border border-white/10 bg-ps-surface">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 md:px-6">
                <div className="flex items-center gap-4">
                    <span className="ps-label">Decision Drill</span>
                    <span className="font-mono text-xs text-white/60" data-testid="decision-progress">
                        SCENARIO {idx + 1} / {SCENARIOS.length}
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="ps-label hidden md:inline">Correct</span>
                    <span className="font-mono text-xs text-ps-turf" data-testid="decision-correct">
                        {results.filter((r) => r.correct).length} / {results.length}
                    </span>
                </div>
            </div>

            <div className="relative">
                <div
                    ref={containerRef}
                    data-testid="decision-game-canvas"
                    className="h-[460px] w-full select-none"
                />
                {feedback && (
                    <div
                        data-testid="decision-feedback"
                        className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm"
                    >
                        <div className="ps-card max-w-md p-8 text-center">
                            <p
                                className={[
                                    "ps-label",
                                    feedback.correct ? "text-ps-turf" : "text-ps-defender",
                                ].join(" ")}
                            >
                                {feedback.correct ? "Correct" : feedback.picked == null ? "Time up" : "Incorrect"}
                            </p>
                            <p className="mt-3 font-heading text-2xl font-bold uppercase text-white">
                                {sc.correct.toUpperCase()}
                            </p>
                            <p className="mt-3 text-sm text-white/65">{feedback.reason}</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-3 gap-px border-t border-white/10 bg-white/10">
                {ACTIONS.map((a) => (
                    <button
                        key={a.key}
                        data-testid={`decision-action-${a.key}`}
                        onClick={() => handleAnswer(a.key)}
                        disabled={!!feedback || done}
                        className="bg-ps-surface px-4 py-5 font-heading text-base font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                        style={{
                            borderBottom: `2px solid ${a.color}`,
                        }}
                    >
                        {a.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
