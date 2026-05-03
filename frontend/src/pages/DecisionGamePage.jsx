import { useState } from "react";
import DecisionGame from "@/games/DecisionGame";
import { Link } from "react-router-dom";
import { submitScore } from "@/services/api";
import { toast } from "sonner";

const CLUBS = ["South London FC", "Croydon Juniors", "Elite Academy"];

export default function DecisionGamePage() {
    const [name, setName] = useState("");
    const [club, setClub] = useState(CLUBS[0]);
    const [started, setStarted] = useState(false);
    const [result, setResult] = useState(null);

    const handleComplete = async (r) => {
        setResult(r);
        try {
            await submitScore({
                name: name.trim(),
                club,
                gameType: "decision",
                score: r.score,
            });
            toast.success(`Score saved (${r.score}/100)`);
        } catch {
            toast.error("Couldn't save score");
        }
    };

    return (
        <div data-testid="decision-game-page" className="mx-auto max-w-7xl px-6 py-12">
            <p className="ps-label">Drill</p>
            <h1 className="ps-section-title mt-3 text-4xl text-white md:text-5xl">
                Decision Game
            </h1>
            <p className="mt-3 max-w-xl text-sm text-white/60">
                Freeze-frame scenarios. Defender closing, teammate available,
                pressure rising. Pick the right action — pass, shoot, or
                dribble.
            </p>

            {!started && (
                <div className="ps-card mt-10 max-w-2xl p-8">
                    <p className="ps-label">Player setup</p>
                    <input
                        data-testid="decision-input-name"
                        className="ps-input mt-4"
                        type="text"
                        placeholder="Player name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <div className="mt-6">
                        <p className="ps-label">Club</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {CLUBS.map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setClub(c)}
                                    data-testid={`decision-club-${c.replace(/\s/g, "-")}`}
                                    className={[
                                        "border px-4 py-2 font-heading text-xs font-bold uppercase tracking-[0.16em]",
                                        club === c
                                            ? "border-ps-blue bg-ps-blue/10 text-white"
                                            : "border-white/10 bg-ps-surface text-white/65",
                                    ].join(" ")}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button
                        data-testid="decision-start-button"
                        onClick={() => setStarted(true)}
                        disabled={!name.trim()}
                        className="ps-btn-primary mt-8 disabled:opacity-50"
                    >
                        Begin Drill
                    </button>
                </div>
            )}

            {started && !result && (
                <div className="mt-10">
                    <DecisionGame onComplete={handleComplete} />
                </div>
            )}

            {result && (
                <div data-testid="decision-result" className="mt-10 grid gap-4 md:grid-cols-3">
                    <div className="ps-card p-6">
                        <p className="ps-label">Score</p>
                        <div className="ps-metric mt-3 text-ps-turf">
                            {result.score}<span className="text-white/30">/100</span>
                        </div>
                    </div>
                    <div className="ps-card p-6">
                        <p className="ps-label">Correct</p>
                        <div className="ps-metric mt-3 text-white">
                            {result.correct}/{result.total}
                        </div>
                    </div>
                    <div className="ps-card p-6">
                        <p className="ps-label">Avg decision time</p>
                        <div className="ps-metric mt-3 text-ps-blue">
                            {Math.round(result.avgTime)}ms
                        </div>
                    </div>
                    <div className="md:col-span-3 flex flex-wrap gap-3">
                        <button
                            data-testid="decision-restart"
                            onClick={() => {
                                setResult(null);
                                setStarted(false);
                            }}
                            className="ps-btn-secondary"
                        >
                            Run Again
                        </button>
                        <Link to="/leaderboard">
                            <button className="ps-btn-primary">View Leaderboard</button>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
