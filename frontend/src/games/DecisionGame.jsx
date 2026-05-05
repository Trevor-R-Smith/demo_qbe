import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";

/**
 * DecisionGame — animated, realistic football scenarios.
 *
 * Each scenario:
 *   1. Static setup (players drawn on pitch)
 *   2. Short animation (players make runs / close down) — 1.5-2s
 *   3. Freeze + show A/B/C decision prompt
 *   4. User picks → feedback overlay with correct answer + reasoning
 *
 * Props: onComplete({ score, correct, total, avgTime })
 */

const PITCH = { bg: 0x0c2e17, stripeA: 0x103e1f, stripeB: 0x0a2515, line: 0xffffff };
const KIT = {
    home: 0xdc1e28, // YOU — red
    homeStroke: 0xffffff,
    opp: 0x0a0a0a, // opponent — black
    oppStroke: 0xffffff,
    team: 0xffffff, // teammate — white
    teamStroke: 0xdc1e28,
    keeper: 0xf4c430, // yellow keeper kit
    keeperStroke: 0x0a0a0a,
    ball: 0xffffff,
};

/** Scenario definitions */
const SCENARIOS = [
    {
        id: "striker_1v1",
        title: "1v1 With the Keeper",
        subtitle: "You're through on goal — defender beaten — keeper rushing out",
        attack: "right",
        setup: [
            { id: "you", kit: "home", x: 0.28, y: 0.5, label: "YOU", hasBall: true },
            { id: "def", kit: "opp", x: 0.40, y: 0.42, label: "DEF" },
            { id: "gk", kit: "keeper", x: 0.94, y: 0.5, label: "GK" },
        ],
        anim: [
            { id: "you", to: { x: 0.70, y: 0.5 }, duration: 1800 },
            { id: "def", to: { x: 0.58, y: 0.46 }, duration: 1800 },
            { id: "gk", to: { x: 0.83, y: 0.5 }, duration: 1800 },
        ],
        question: "Keeper is committed. Defender trailing. What's your decision?",
        options: [
            {
                key: "A",
                label: "Shoot hard and low",
                correct: false,
                reason: "Keeper has set his base and closed the angle. A blasted shot from 6 yards is more likely to hit the keeper than find the net.",
            },
            {
                key: "B",
                label: "Dribble around the keeper",
                correct: true,
                reason: "Keeper has committed forward. Touch past him into the empty net — the modern striker's highest-percentage finish.",
            },
            {
                key: "C",
                label: "Chip the keeper",
                correct: false,
                reason: "At 6 yards with the keeper upright, a chip is premature flair. Save that for when the keeper is deep.",
            },
        ],
    },
    {
        id: "winger_byline",
        title: "Winger to the Byline",
        subtitle: "Two strikers waiting in the box, full-back overlapping late",
        attack: "right",
        setup: [
            { id: "you", kit: "home", x: 0.50, y: 0.18, label: "YOU", hasBall: true },
            { id: "def", kit: "opp", x: 0.56, y: 0.22, label: "DEF" },
            { id: "fb", kit: "home", x: 0.40, y: 0.25, label: "FB" },
            { id: "s1", kit: "home", x: 0.83, y: 0.38, label: "ST" },
            { id: "s2", kit: "home", x: 0.82, y: 0.56, label: "ST" },
            { id: "cb1", kit: "opp", x: 0.86, y: 0.42, label: "CB" },
            { id: "cb2", kit: "opp", x: 0.86, y: 0.60, label: "CB" },
            { id: "gk", kit: "keeper", x: 0.94, y: 0.5, label: "GK" },
        ],
        anim: [
            { id: "you", to: { x: 0.87, y: 0.20 }, duration: 1800 },
            { id: "def", to: { x: 0.84, y: 0.24 }, duration: 1800 },
            { id: "fb", to: { x: 0.65, y: 0.20 }, duration: 1800 },
            { id: "s1", to: { x: 0.85, y: 0.40 }, duration: 1600 },
            { id: "s2", to: { x: 0.84, y: 0.58 }, duration: 1600 },
        ],
        question: "You're at the byline, two strikers in the box. Choose your delivery.",
        options: [
            {
                key: "A",
                label: "Cut inside and shoot",
                correct: false,
                reason: "Angle is almost zero from the byline. Strikers are queued up — serve them, don't be greedy.",
            },
            {
                key: "B",
                label: "Cross into the 6-yard box",
                correct: true,
                reason: "Two strikers, two CBs, keeper in no-man's land. Low, hard cross across the 6-yard line — textbook.",
            },
            {
                key: "C",
                label: "Cutback to the overlapping full-back",
                correct: false,
                reason: "Full-back hasn't arrived yet. Waiting loses the moment — strikers are already making their runs.",
            },
        ],
    },
    {
        id: "defender_offside",
        title: "Defender Last Man",
        subtitle: "Opposition midfielder about to play through-ball behind your line",
        attack: "left",
        setup: [
            { id: "opp_mid", kit: "opp", x: 0.72, y: 0.50, label: "MID", hasBall: true },
            { id: "opp_striker", kit: "opp", x: 0.48, y: 0.55, label: "ST" },
            { id: "you", kit: "home", x: 0.38, y: 0.48, label: "YOU" },
            { id: "cb", kit: "home", x: 0.38, y: 0.35, label: "CB" },
            { id: "lb", kit: "home", x: 0.38, y: 0.22, label: "LB" },
            { id: "rb", kit: "home", x: 0.38, y: 0.72, label: "RB" },
            { id: "gk", kit: "keeper", x: 0.08, y: 0.5, label: "GK" },
        ],
        anim: [
            { id: "opp_striker", to: { x: 0.30, y: 0.55 }, duration: 1400 },
            { id: "opp_mid", to: { x: 0.68, y: 0.50 }, duration: 1400 },
        ],
        question: "Their striker is making a diagonal run in behind. You're the last man. What do you do?",
        options: [
            {
                key: "A",
                label: "Step up and play offside",
                correct: true,
                reason: "Striker is clearly breaking early. Entire back-line pushes up 2 yards before the through-ball — offside trap.",
            },
            {
                key: "B",
                label: "Drop deep and track the striker",
                correct: false,
                reason: "Dropping concedes 15 yards of space into the box — now they're in shooting range with momentum.",
            },
            {
                key: "C",
                label: "Sprint back to the goal line",
                correct: false,
                reason: "Panic move. You abandon the line and gift the striker a clear run at goal.",
            },
        ],
    },
    {
        id: "counter_midfielder",
        title: "Transition — Midfielder On the Ball",
        subtitle: "Ball just won back in your own half. Opponents out of shape.",
        attack: "right",
        setup: [
            { id: "you", kit: "home", x: 0.32, y: 0.50, label: "YOU", hasBall: true },
            { id: "striker", kit: "home", x: 0.52, y: 0.40, label: "ST" },
            { id: "winger", kit: "home", x: 0.46, y: 0.75, label: "LW" },
            { id: "cm", kit: "home", x: 0.36, y: 0.28, label: "CM" },
            { id: "opp1", kit: "opp", x: 0.40, y: 0.55, label: "OPP" },
            { id: "opp2", kit: "opp", x: 0.55, y: 0.50, label: "OPP" },
            { id: "opp_cb", kit: "opp", x: 0.78, y: 0.50, label: "CB" },
            { id: "gk", kit: "keeper", x: 0.94, y: 0.5, label: "GK" },
        ],
        anim: [
            { id: "striker", to: { x: 0.72, y: 0.38 }, duration: 1600 },
            { id: "winger", to: { x: 0.65, y: 0.72 }, duration: 1600 },
            { id: "opp1", to: { x: 0.44, y: 0.54 }, duration: 1400 },
            { id: "opp2", to: { x: 0.52, y: 0.51 }, duration: 1400 },
        ],
        question: "Striker sprinting through the middle. Winger overlapping wide. Opponents closing.",
        options: [
            {
                key: "A",
                label: "Slide a through-ball to the striker",
                correct: true,
                reason: "Counter's pace beats the reorganising defence. Early vertical ball in behind before their CB gets cover.",
            },
            {
                key: "B",
                label: "Switch wide to the winger",
                correct: false,
                reason: "A wide switch is safe but slow — it lets the opposition's defence reset and neutralise the counter.",
            },
            {
                key: "C",
                label: "Slow it down, pass back to CM",
                correct: false,
                reason: "Kills the transition. The moment a counter stops, the advantage is gone — you just let them get back in shape.",
            },
        ],
    },
    {
        id: "free_kick_edge",
        title: "Free Kick — Edge of the Box",
        subtitle: "22 yards out, slight left angle. Wall forming. 2 big CBs in the box.",
        attack: "right",
        setup: [
            { id: "you", kit: "home", x: 0.70, y: 0.42, label: "YOU", hasBall: true },
            { id: "s1", kit: "home", x: 0.84, y: 0.42, label: "ST" },
            { id: "s2", kit: "home", x: 0.84, y: 0.58, label: "ST" },
            { id: "fb", kit: "home", x: 0.62, y: 0.28, label: "FB" },
            { id: "wall1", kit: "opp", x: 0.80, y: 0.40, label: "W" },
            { id: "wall2", kit: "opp", x: 0.80, y: 0.46, label: "W" },
            { id: "wall3", kit: "opp", x: 0.80, y: 0.52, label: "W" },
            { id: "wall4", kit: "opp", x: 0.80, y: 0.58, label: "W" },
            { id: "cb1", kit: "opp", x: 0.88, y: 0.46, label: "CB" },
            { id: "cb2", kit: "opp", x: 0.88, y: 0.54, label: "CB" },
            { id: "gk", kit: "keeper", x: 0.94, y: 0.52, label: "GK" },
        ],
        anim: [
            { id: "s1", to: { x: 0.86, y: 0.44 }, duration: 1400 },
            { id: "s2", to: { x: 0.86, y: 0.56 }, duration: 1400 },
            { id: "fb", to: { x: 0.70, y: 0.28 }, duration: 1400 },
        ],
        question: "Keeper guarding near post. Two strikers attacking the 6-yard box. What's on?",
        options: [
            {
                key: "A",
                label: "Whip it into the 6-yard box",
                correct: true,
                reason: "Two tall strikers queueing up in the box, keeper pinned to near post — a whipped delivery into that channel is the highest-percentage goal.",
            },
            {
                key: "B",
                label: "Shoot around the wall",
                correct: false,
                reason: "22 yards with 4 in the wall and the keeper set near-post is tough. Only attempt if your dead-ball striker is elite.",
            },
            {
                key: "C",
                label: "Short — roll it to the overlapping full-back",
                correct: false,
                reason: "Full-back isn't in a crossing position yet. Loses the set-piece threat and gives the defence time to reset.",
            },
        ],
    },
    {
        id: "midfield_press",
        title: "High Press Trigger",
        subtitle: "Opposition CB received a loose back-pass. You're nearest.",
        attack: "right",
        setup: [
            { id: "opp_cb", kit: "opp", x: 0.20, y: 0.50, label: "CB", hasBall: true },
            { id: "opp_fb", kit: "opp", x: 0.28, y: 0.20, label: "FB" },
            { id: "opp_mid", kit: "opp", x: 0.40, y: 0.50, label: "MID" },
            { id: "opp_gk", kit: "keeper", x: 0.07, y: 0.50, label: "GK" },
            { id: "you", kit: "home", x: 0.42, y: 0.50, label: "YOU" },
            { id: "lw", kit: "home", x: 0.48, y: 0.22, label: "LW" },
            { id: "rw", kit: "home", x: 0.48, y: 0.78, label: "RW" },
            { id: "cm", kit: "home", x: 0.58, y: 0.55, label: "CM" },
        ],
        anim: [
            { id: "you", to: { x: 0.32, y: 0.50 }, duration: 1500 },
            { id: "lw", to: { x: 0.38, y: 0.24 }, duration: 1500 },
            { id: "rw", to: { x: 0.38, y: 0.78 }, duration: 1500 },
        ],
        question: "CB is under pressure with a heavy touch. Your wingers are closing the full-backs.",
        options: [
            {
                key: "A",
                label: "Sprint at the CB and pressure the ball",
                correct: true,
                reason: "Press trigger. CB's touch is poor, passing lanes to full-backs are closed — force the mistake or a long ball you'll recover.",
            },
            {
                key: "B",
                label: "Cut the passing lane to the midfielder",
                correct: false,
                reason: "Good idea in general — but here the CB has time to switch or play long because you're not applying direct pressure.",
            },
            {
                key: "C",
                label: "Drop back into shape",
                correct: false,
                reason: "Massive wasted opportunity. The back-pass was the trigger — dropping off lets them play out calmly.",
            },
        ],
    },
];

/* ============ Phaser helpers ============ */

function drawPitch(scene, attack) {
    const w = scene.scale.width;
    const h = scene.scale.height;

    // Base pitch + stripes
    scene.add.rectangle(w / 2, h / 2, w, h, PITCH.bg);
    for (let i = 0; i < 8; i++) {
        const stripe = scene.add.rectangle(
            (w / 8) * (i + 0.5),
            h / 2,
            w / 8,
            h,
            i % 2 === 0 ? PITCH.stripeA : PITCH.stripeB
        );
        stripe.setAlpha(0.55);
    }

    const line = (x1, y1, x2, y2, alpha = 0.3) => {
        const g = scene.add.graphics();
        g.lineStyle(2, PITCH.line, alpha);
        g.beginPath();
        g.moveTo(x1, y1);
        g.lineTo(x2, y2);
        g.strokePath();
    };

    // Centre line
    line(w / 2, 6, w / 2, h - 6, 0.3);
    scene.add.circle(w / 2, h / 2, 58, 0x000000, 0).setStrokeStyle(2, PITCH.line, 0.3);

    // Goal + boxes (either side depending on attack direction — but always draw both goals)
    const drawGoalBox = (side) => {
        const isLeft = side === "left";
        const baseX = isLeft ? 0 : w;
        const sign = isLeft ? 1 : -1;
        // 18-yard box
        scene.add
            .rectangle(baseX + sign * 82, h / 2, 164, h * 0.62, 0x000000, 0)
            .setStrokeStyle(2, PITCH.line, 0.35);
        // 6-yard box
        scene.add
            .rectangle(baseX + sign * 32, h / 2, 64, h * 0.32, 0x000000, 0)
            .setStrokeStyle(2, PITCH.line, 0.45);
        // Penalty spot
        scene.add.circle(baseX + sign * 66, h / 2, 2, PITCH.line);
        // Goal posts
        const goalH = h * 0.14;
        scene.add.rectangle(baseX + sign * 3, h / 2 - goalH / 2, 4, 4, PITCH.line);
        scene.add.rectangle(baseX + sign * 3, h / 2 + goalH / 2, 4, 4, PITCH.line);
        // Goal frame
        scene.add
            .rectangle(baseX + sign * 12, h / 2, 24, goalH, 0x000000, 0)
            .setStrokeStyle(2, PITCH.line, 0.7);
    };
    drawGoalBox("left");
    drawGoalBox("right");

    // Arrow of play (subtle) at top
    const arrowY = 22;
    const arrowG = scene.add.graphics();
    arrowG.lineStyle(1, 0xffffff, 0.25);
    if (attack === "right") {
        arrowG.lineBetween(w / 2 - 28, arrowY, w / 2 + 28, arrowY);
        arrowG.lineBetween(w / 2 + 22, arrowY - 4, w / 2 + 28, arrowY);
        arrowG.lineBetween(w / 2 + 22, arrowY + 4, w / 2 + 28, arrowY);
    } else {
        arrowG.lineBetween(w / 2 + 28, arrowY, w / 2 - 28, arrowY);
        arrowG.lineBetween(w / 2 - 22, arrowY - 4, w / 2 - 28, arrowY);
        arrowG.lineBetween(w / 2 - 22, arrowY + 4, w / 2 - 28, arrowY);
    }
    scene.add.text(w / 2, arrowY + 12, "ATTACK", {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "9px",
        color: "#FFFFFF66",
        letterSpacing: "0.2em",
    }).setOrigin(0.5);
}

function placePlayer(scene, p, w, h) {
    const kit = p.kit === "keeper" ? KIT.keeper : p.kit === "opp" ? KIT.opp : p.kit === "team" ? KIT.team : KIT.home;
    const stroke =
        p.kit === "keeper"
            ? KIT.keeperStroke
            : p.kit === "opp"
                ? KIT.oppStroke
                : p.kit === "team"
                    ? KIT.teamStroke
                    : KIT.homeStroke;

    const x = p.x * w;
    const y = p.y * h;
    const container = scene.add.container(x, y);

    const shadow = scene.add.ellipse(0, 12, 26, 8, 0x000000, 0.4);
    const circle = scene.add.circle(0, 0, 14, kit).setStrokeStyle(2, stroke, 0.9);
    const label = scene.add.text(0, -26, p.label, {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "9px",
        color: p.id === "you" ? "#FFFFFF" : "#FFFFFFBB",
        letterSpacing: "0.15em",
    }).setOrigin(0.5);

    container.add([shadow, circle, label]);
    container.setData("playerId", p.id);

    if (p.hasBall) {
        // Ball at feet — offset toward direction of attack
        const ball = scene.add.circle(10, 10, 4.5, KIT.ball).setStrokeStyle(1, 0x000000, 0.5);
        container.add(ball);
        container.setData("ball", ball);
    }

    return container;
}

/* ============ Component ============ */

export default function DecisionGame({ onComplete }) {
    const containerRef = useRef(null);
    const gameRef = useRef(null);
    const [idx, setIdx] = useState(0);
    const [phase, setPhase] = useState("animating"); // animating | deciding | feedback
    const [feedback, setFeedback] = useState(null); // { correct, option, scenarioIdx }
    const [results, setResults] = useState([]);
    const [done, setDone] = useState(false);
    const completedRef = useRef(false);
    const decideAtRef = useRef(Date.now());

    const sc = SCENARIOS[idx];

    /* Initialize Phaser game once */
    useEffect(() => {
        if (!containerRef.current) return;

        const SCENE = {
            key: "DecisionScene",
            create() {
                this._players = {};
                this._renderScenario = (scenarioIndex) => {
                    const w = this.scale.width;
                    const h = this.scale.height;
                    // clear + redraw
                    this.children.removeAll();
                    this.tweens.killAll();
                    this._players = {};

                    const s = SCENARIOS[scenarioIndex];
                    drawPitch(this, s.attack);

                    s.setup.forEach((p) => {
                        this._players[p.id] = placePlayer(this, p, w, h);
                    });

                    // Title overlay
                    this.add.text(18, 14, s.title, {
                        fontFamily: "'Sofia Sans Extra Condensed', 'Barlow Condensed', sans-serif",
                        fontSize: "22px",
                        fontStyle: "700",
                        color: "#FFFFFF",
                    });
                    this.add.text(18, 40, `SCENARIO ${scenarioIndex + 1} / ${SCENARIOS.length}`, {
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "10px",
                        color: "#FFFFFF66",
                    });

                    // Fire animations after a beat
                    this.time.delayedCall(350, () => {
                        s.anim.forEach((step) => {
                            const target = this._players[step.id];
                            if (!target) return;
                            this.tweens.add({
                                targets: target,
                                x: step.to.x * w,
                                y: step.to.y * h,
                                duration: step.duration,
                                ease: "Sine.InOut",
                            });
                        });
                    });
                };
                this._renderScenario(0);
            },
        };

        const game = new Phaser.Game({
            type: Phaser.AUTO,
            parent: containerRef.current,
            backgroundColor: "#0A0A0A",
            scale: {
                mode: Phaser.Scale.RESIZE,
                autoCenter: Phaser.Scale.CENTER_BOTH,
                width: containerRef.current?.clientWidth || 800,
                height: 480,
            },
            scene: SCENE,
        });
        gameRef.current = game;

        const handler = (e) => {
            const scene = game.scene.getScene("DecisionScene");
            if (scene && typeof e.detail?.idx === "number" && scene._renderScenario) {
                scene._renderScenario(e.detail.idx);
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

    /* On scenario change — trigger Phaser redraw + schedule decision phase */
    useEffect(() => {
        setPhase("animating");
        setFeedback(null);
        window.dispatchEvent(new CustomEvent("ps:decision-redraw", { detail: { idx } }));

        const maxDur = Math.max(350, ...sc.anim.map((a) => a.duration));
        const t = setTimeout(() => {
            setPhase("deciding");
            decideAtRef.current = Date.now();
        }, maxDur + 350);

        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idx]);

    const handlePick = (opt) => {
        if (phase !== "deciding") return;
        const ms = Date.now() - decideAtRef.current;
        const correct = !!opt.correct;
        const entry = { picked: opt.key, correct, ms };
        const next = [...results, entry];
        setResults(next);
        setFeedback({ correct, option: opt, reason: opt.reason, picked: opt.key });
        setPhase("feedback");

        setTimeout(() => {
            if (idx + 1 < SCENARIOS.length) {
                setIdx(idx + 1);
            } else {
                setDone(true);
                const correctCount = next.filter((r) => r.correct).length;
                const total = SCENARIOS.length;
                const avgTime = next.reduce((a, b) => a + b.ms, 0) / Math.max(1, next.length);
                // 80% accuracy + 20% speed bonus (faster = better; target <3500ms)
                const accuracyScore = (correctCount / total) * 80;
                const avgClamped = Math.max(800, Math.min(4000, avgTime));
                const speedScore = ((4000 - avgClamped) / 3200) * 20;
                const score = Math.round(accuracyScore + speedScore);
                if (!completedRef.current && typeof onComplete === "function") {
                    completedRef.current = true;
                    onComplete({ score, correct: correctCount, total, avgTime });
                }
            }
        }, 2200);
    };

    const correctOption = sc.options.find((o) => o.correct);

    return (
        <div data-testid="decision-game" className="border border-white/10 bg-ps-surface">
            {/* HUD */}
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

            {/* Phaser canvas */}
            <div className="relative">
                <div
                    ref={containerRef}
                    data-testid="decision-game-canvas"
                    className="h-[480px] w-full select-none"
                />

                {/* Phase badge (top-right over canvas) */}
                <div className="pointer-events-none absolute right-4 top-4 flex items-center gap-2">
                    <span
                        className={[
                            "inline-block h-1.5 w-1.5 rounded-full",
                            phase === "animating"
                                ? "animate-pulse bg-ps-red"
                                : phase === "deciding"
                                    ? "animate-pulse bg-white"
                                    : "bg-ps-turf",
                        ].join(" ")}
                    />
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/70">
                        {phase === "animating" ? "Play in motion…" : phase === "deciding" ? "Decide" : "Feedback"}
                    </span>
                </div>

                {/* Question overlay (slides in when deciding) */}
                {phase === "deciding" && (
                    <div
                        data-testid="decision-question"
                        className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/75 to-transparent px-6 pb-6 pt-12"
                    >
                        <p className="ps-label text-ps-red">Question</p>
                        <p className="mt-2 max-w-3xl font-display text-xl font-bold uppercase leading-tight text-white md:text-2xl">
                            {sc.question}
                        </p>
                    </div>
                )}

                {/* Feedback overlay */}
                {phase === "feedback" && feedback && (
                    <div
                        data-testid="decision-feedback"
                        className="absolute inset-0 flex items-center justify-center bg-black/75 backdrop-blur-sm"
                    >
                        <div
                            className="mx-6 max-w-lg border p-8 text-center"
                            style={{
                                borderColor: feedback.correct ? "#23883C" : "#DC1E28",
                                background: "#0A0A0A",
                            }}
                        >
                            <p
                                className={[
                                    "ps-label",
                                    feedback.correct ? "text-ps-turf" : "text-ps-red",
                                ].join(" ")}
                            >
                                {feedback.correct ? "✓  Correct read" : "✗  Wrong call"}
                            </p>
                            <p className="mt-3 font-display text-xs uppercase tracking-[0.22em] text-white/40">
                                {feedback.correct
                                    ? `You chose ${feedback.picked}`
                                    : `You chose ${feedback.picked} — correct was ${correctOption?.key}: "${correctOption?.label}"`}
                            </p>
                            <p className="mt-4 font-body text-sm leading-relaxed text-white/80">
                                {feedback.reason}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* A/B/C option buttons */}
            <div className="grid grid-cols-1 gap-px border-t border-white/10 bg-white/10 md:grid-cols-3">
                {sc.options.map((o, i) => (
                    <button
                        key={`${idx}-${o.key}`}
                        data-testid={`decision-option-${o.key}`}
                        onClick={() => handlePick(o)}
                        disabled={phase !== "deciding" || done}
                        className={[
                            "group flex items-start gap-3 bg-ps-surface px-5 py-5 text-left transition-colors disabled:cursor-not-allowed",
                            phase === "deciding"
                                ? "hover:bg-ps-red/10"
                                : "opacity-45",
                        ].join(" ")}
                    >
                        <span
                            className={[
                                "grid h-8 w-8 flex-none place-items-center border font-display text-sm font-black uppercase",
                                phase === "deciding"
                                    ? i === 0
                                        ? "border-ps-red bg-ps-red text-white"
                                        : i === 1
                                            ? "border-white bg-white text-black"
                                            : "border-ps-turf bg-ps-turf text-white"
                                    : "border-white/20 bg-white/5 text-white/60",
                            ].join(" ")}
                        >
                            {o.key}
                        </span>
                        <span className="flex-1 font-display text-sm font-bold uppercase leading-tight tracking-[0.08em] text-white md:text-base">
                            {o.label}
                        </span>
                    </button>
                ))}
            </div>

            {/* Subtitle line below buttons */}
            <div className="border-t border-white/5 px-5 py-3 text-[11px] uppercase tracking-[0.2em] text-white/45">
                <span className="text-ps-red">●</span> {sc.subtitle}
            </div>
        </div>
    );
}
