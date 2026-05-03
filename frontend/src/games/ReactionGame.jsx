import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";

const TOTAL_ROUNDS = 10;
const MIN_WAIT = 900;
const MAX_WAIT = 2400;
const FALSE_START_PENALTY = 1000; // ms equivalent added

/**
 * ReactionGame — 10 rounds. Wait for the green pulse, click as fast as you can.
 * Clicking before the pulse counts as a false start.
 *
 * Props:
 *   onComplete({ score, reactionTime, falseStarts })
 */
export default function ReactionGame({ onComplete }) {
    const containerRef = useRef(null);
    const gameRef = useRef(null);
    const [round, setRound] = useState(0); // 0..TOTAL_ROUNDS
    const [lastTime, setLastTime] = useState(null);
    const [avg, setAvg] = useState(null);
    const [falseStarts, setFalseStarts] = useState(0);
    const [running, setRunning] = useState(false);
    const completedRef = useRef(false);

    useEffect(() => {
        completedRef.current = false;

        const state = {
            phase: "idle", // idle | waiting | go | clicked
            waitTimer: null,
            startGoTime: 0,
            times: [],
            falseStarts: 0,
            round: 0,
        };

        const SCENE = {
            key: "ReactionScene",
            create() {
                const w = this.scale.width;
                const h = this.scale.height;

                // Pitch background
                this.bg = this.add.rectangle(w / 2, h / 2, w, h, 0x121418);

                // Center circle
                this.target = this.add.circle(w / 2, h / 2, Math.min(w, h) * 0.28, 0x6b7280);
                this.target.setStrokeStyle(2, 0xffffff, 0.3);
                this.target.setInteractive({ useHandCursor: true });

                // Halo
                this.halo = this.add.circle(w / 2, h / 2, Math.min(w, h) * 0.34, 0xffffff, 0);
                this.halo.setStrokeStyle(1, 0xffffff, 0.1);

                // Center text
                this.titleText = this.add.text(w / 2, h / 2 - 12, "TAP TO START", {
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: "44px",
                    fontStyle: "900",
                    color: "#FFFFFF",
                }).setOrigin(0.5);
                this.subText = this.add.text(w / 2, h / 2 + 30, "10 ROUNDS · WAIT FOR GREEN", {
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "12px",
                    color: "#FFFFFF66",
                    letterSpacing: "0.2em",
                }).setOrigin(0.5);

                // HUD
                this.hudRound = this.add.text(24, 18, `ROUND  00 / ${String(TOTAL_ROUNDS).padStart(2, "0")}`, {
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "12px",
                    color: "#FFFFFF99",
                });
                this.hudLast = this.add.text(w - 24, 18, "LAST  ---", {
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "12px",
                    color: "#FFFFFF99",
                }).setOrigin(1, 0);

                // Click handler on entire scene (so false starts mid-wait are caught)
                this.input.on("pointerdown", () => this._handleClick());

                this._handleClick = () => {
                    if (state.phase === "idle") {
                        this._beginRound();
                    } else if (state.phase === "waiting") {
                        // FALSE START
                        state.falseStarts += 1;
                        setFalseStarts(state.falseStarts);
                        this._showFalseStart();
                    } else if (state.phase === "go") {
                        const t = this.time.now - state.startGoTime;
                        state.times.push(t);
                        setLastTime(t);
                        this._showSuccess(t);
                    }
                };

                this._beginRound = () => {
                    state.phase = "waiting";
                    this.target.setFillStyle(0xe63946);
                    this.titleText.setText("WAIT…");
                    this.titleText.setColor("#FFFFFF");
                    this.subText.setText("DON'T JUMP THE GUN");
                    this.subText.setColor("#FFFFFF55");
                    const delay = Phaser.Math.Between(MIN_WAIT, MAX_WAIT);
                    state.waitTimer = this.time.delayedCall(delay, () => {
                        state.phase = "go";
                        state.startGoTime = this.time.now;
                        this.target.setFillStyle(0x23883c);
                        this.titleText.setText("TAP!");
                        this.titleText.setColor("#23883C");
                        this.subText.setText("");
                        // pulse
                        this.tweens.add({
                            targets: this.halo,
                            scale: 1.15,
                            alpha: 0.0,
                            duration: 600,
                            ease: "Cubic.Out",
                            onStart: () => {
                                this.halo.setStrokeStyle(2, 0x23883c, 0.7);
                                this.halo.setScale(1);
                            },
                        });
                    });
                };

                this._showSuccess = (ms) => {
                    state.phase = "shown";
                    this.target.setFillStyle(0x0055ff);
                    this.titleText.setText(`${Math.round(ms)} MS`);
                    this.titleText.setColor("#FFFFFF");
                    this.subText.setText(state.round < TOTAL_ROUNDS - 1 ? "TAP FOR NEXT ROUND" : "FINAL ROUND COMPLETE");
                    this.subText.setColor("#FFFFFFAA");

                    state.round += 1;
                    setRound(state.round);
                    this.hudRound.setText(
                        `ROUND  ${String(state.round).padStart(2, "0")} / ${String(TOTAL_ROUNDS).padStart(2, "0")}`
                    );
                    this.hudLast.setText(`LAST  ${Math.round(ms)}MS`);

                    if (state.round >= TOTAL_ROUNDS) {
                        this._finishGame();
                    } else {
                        // Next round will start on next click
                        state.phase = "idle";
                    }
                };

                this._showFalseStart = () => {
                    state.phase = "shown";
                    this.cameras.main.flash(220, 230, 57, 70);
                    this.target.setFillStyle(0xe63946);
                    this.titleText.setText("FALSE START");
                    this.titleText.setColor("#E63946");
                    this.subText.setText("TAP TO RETRY THIS ROUND");
                    this.subText.setColor("#E6394699");
                    if (state.waitTimer) state.waitTimer.remove();
                    state.phase = "idle";
                };

                this._finishGame = () => {
                    state.phase = "done";
                    const sum = state.times.reduce((a, b) => a + b, 0);
                    const avgT = state.times.length ? sum / state.times.length : 0;
                    const adjusted = avgT + state.falseStarts * FALSE_START_PENALTY * 0.05; // light penalty into avg
                    // Score: 1000 if avg <= 200ms, 0 if avg >= 600ms (linear)
                    const clamped = Math.max(200, Math.min(600, adjusted));
                    const sc = Math.round(((600 - clamped) / 400) * 1000);
                    setAvg(avgT);
                    this.titleText.setText(`${Math.round(avgT)} MS`);
                    this.subText.setText("DRILL COMPLETE");
                    this.subText.setColor("#23883C");
                    if (!completedRef.current && typeof onComplete === "function") {
                        completedRef.current = true;
                        onComplete({
                            score: Math.max(0, sc),
                            reactionTime: avgT,
                            falseStarts: state.falseStarts,
                        });
                    }
                };

                setRunning(true);
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
        gameRef.current = game;

        return () => {
            try {
                game.destroy(true);
            } catch (e) {
                /* noop */
            }
            gameRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div data-testid="reaction-game" className="border border-white/10 bg-ps-surface">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 md:px-6">
                <div className="flex items-center gap-4">
                    <span className="ps-label">Reaction Drill</span>
                    <span className="font-mono text-xs text-white/60" data-testid="reaction-round">
                        ROUND {String(round).padStart(2, "0")} / {TOTAL_ROUNDS}
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="ps-label hidden md:inline">Last</span>
                    <span className="font-mono text-xs text-white" data-testid="reaction-last">
                        {lastTime != null ? `${Math.round(lastTime)} MS` : "—"}
                    </span>
                    <span className="ps-label hidden md:inline">False Starts</span>
                    <span className="font-mono text-xs text-ps-defender" data-testid="reaction-false-starts">
                        {falseStarts}
                    </span>
                </div>
            </div>
            <div
                ref={containerRef}
                data-testid="reaction-game-canvas"
                className="h-[460px] w-full select-none"
            />
            {running && avg != null && (
                <div className="border-t border-white/10 px-4 py-3 md:px-6">
                    <span className="ps-label">Average reaction</span>
                    <span className="ml-3 font-mono text-base text-ps-blue" data-testid="reaction-avg">
                        {Math.round(avg)} MS
                    </span>
                </div>
            )}
        </div>
    );
}
