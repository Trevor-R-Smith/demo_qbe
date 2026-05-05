import { useEffect, useState } from "react";
import ReactionGame from "@/games/ReactionGame";
import DecisionGame from "@/games/DecisionGame";
import Leaderboard from "@/components/Leaderboard";
import ClubClaimModal from "@/components/ClubClaimModal";
import { Link } from "react-router-dom";
import { Activity, Brain, Trophy, ArrowRight } from "lucide-react";
import { submitScore } from "@/services/api";
import { toast } from "sonner";

const STEPS = [
    { key: "intro", label: "Setup" },
    { key: "reaction", label: "Reaction" },
    { key: "decision", label: "Decision" },
    { key: "leaderboard", label: "Leaderboard" },
];

export default function Demo() {
    const [step, setStep] = useState("intro");
    const [name, setName] = useState("");
    const [club, setClub] = useState("");
    const [age, setAge] = useState("");
    const [reactionResult, setReactionResult] = useState(null);
    const [decisionResult, setDecisionResult] = useState(null);
    const [isNewClub, setIsNewClub] = useState(false);
    const [canonicalClub, setCanonicalClub] = useState("");
    const [claimOpen, setClaimOpen] = useState(false);
    const [claimShown, setClaimShown] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const stepIdx = STEPS.findIndex((s) => s.key === step);

    const submit = async (gameType, payload) => {
        if (!name.trim() || !club.trim()) return;
        try {
            const parsedAge = age ? Number(age) : null;
            const res = await submitScore({
                name: name.trim(),
                club: club.trim(),
                ...(parsedAge && parsedAge >= 6 && parsedAge <= 99 ? { age: parsedAge } : {}),
                gameType,
                score: payload.score,
                reactionTime: payload.reactionTime ?? null,
            });
            if (res?.club) setCanonicalClub(res.club);
            if (res?.isNewClub) setIsNewClub(true);
            setRefreshKey((k) => k + 1);
            toast.success(
                gameType === "reaction"
                    ? `Reaction saved (${Math.round(payload.reactionTime)}ms)`
                    : `Decision saved (${payload.score}/100)`
            );
        } catch {
            toast.error("Couldn't save score (continuing demo)");
        }
    };

    const handleReactionDone = (result) => {
        setReactionResult(result);
        submit("reaction", result);
    };
    const handleDecisionDone = (result) => {
        setDecisionResult(result);
        submit("decision", result);
    };

    // When we land on the leaderboard step with a new club, show the claim modal once.
    useEffect(() => {
        if (step === "leaderboard" && isNewClub && !claimShown) {
            const t = setTimeout(() => {
                setClaimOpen(true);
                setClaimShown(true);
            }, 900);
            return () => clearTimeout(t);
        }
    }, [step, isNewClub, claimShown]);

    return (
        <div data-testid="demo-page">
            {/* Stepper */}
            <section className="border-b border-white/10 bg-ps-surface/40">
                <div className="mx-auto max-w-7xl px-6 py-6">
                    <div className="flex items-center gap-3 overflow-x-auto">
                        {STEPS.map((s, i) => {
                            const active = i === stepIdx;
                            const done = i < stepIdx;
                            return (
                                <div
                                    key={s.key}
                                    className="flex flex-none items-center gap-3"
                                >
                                    <span
                                        className={[
                                            "grid h-7 w-7 place-items-center border font-mono text-xs",
                                            active
                                                ? "border-ps-red bg-ps-red text-white"
                                                : done
                                                    ? "border-ps-turf bg-ps-turf/10 text-ps-turf"
                                                    : "border-white/15 bg-ps-surface text-white/40",
                                        ].join(" ")}
                                    >
                                        {i + 1}
                                    </span>
                                    <span
                                        className={[
                                            "font-heading text-xs font-bold uppercase tracking-[0.2em]",
                                            active
                                                ? "text-white"
                                                : done
                                                    ? "text-white/65"
                                                    : "text-white/35",
                                        ].join(" ")}
                                    >
                                        {s.label}
                                    </span>
                                    {i < STEPS.length - 1 && (
                                        <span className="h-px w-8 bg-white/15" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-12">
                {step === "intro" && (
                    <div data-testid="demo-step-intro" className="grid grid-cols-1 gap-10 lg:grid-cols-12">
                        <div className="lg:col-span-7">
                            <p className="ps-label">PlaySharp · 60s Demo</p>
                            <h1 className="ps-section-title mt-3 text-5xl text-white md:text-6xl">
                                Reaction → Decision → Leaderboard.
                            </h1>
                            <p className="mt-5 max-w-xl text-base text-white/65">
                                You'll run a 10-round reaction drill, a 5-scenario
                                decision drill, then see your score on the global
                                leaderboard. Built to take under 60 seconds.
                            </p>

                            <div className="mt-10 grid grid-cols-3 gap-4">
                                <div className="ps-card p-4">
                                    <Activity size={16} className="text-ps-red" />
                                    <p className="ps-label mt-3">Step 1</p>
                                    <p className="mt-1 font-heading text-base font-bold uppercase text-white">
                                        Reaction
                                    </p>
                                </div>
                                <div className="ps-card p-4">
                                    <Brain size={16} className="text-ps-red" />
                                    <p className="ps-label mt-3">Step 2</p>
                                    <p className="mt-1 font-heading text-base font-bold uppercase text-white">
                                        Decision
                                    </p>
                                </div>
                                <div className="ps-card p-4">
                                    <Trophy size={16} className="text-ps-turf" />
                                    <p className="ps-label mt-3">Step 3</p>
                                    <p className="mt-1 font-heading text-base font-bold uppercase text-white">
                                        Rank
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-5">
                            <div className="ps-card p-8">
                                <p className="ps-label">Player setup</p>
                                <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        <label className="ps-label" htmlFor="demo-name">Player name</label>
                                        <input
                                            id="demo-name"
                                            data-testid="demo-input-name"
                                            className="ps-input mt-2"
                                            type="text"
                                            placeholder="e.g. Marcus J."
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="ps-label" htmlFor="demo-age">Age</label>
                                        <input
                                            id="demo-age"
                                            data-testid="demo-input-age"
                                            className="ps-input mt-2"
                                            type="number"
                                            min="6"
                                            max="99"
                                            placeholder="e.g. 17"
                                            value={age}
                                            onChange={(e) => setAge(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="mt-6">
                                    <label className="ps-label" htmlFor="demo-club">Club / School</label>
                                    <input
                                        id="demo-club"
                                        data-testid="demo-input-club"
                                        className="ps-input mt-2"
                                        type="text"
                                        placeholder="e.g. South London FC"
                                        value={club}
                                        onChange={(e) => setClub(e.target.value)}
                                    />
                                </div>
                                <button
                                    data-testid="demo-start-button"
                                    disabled={!name.trim() || !club.trim()}
                                    onClick={() => setStep("reaction")}
                                    className="ps-btn-primary mt-8 inline-flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Start Demo <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {step === "reaction" && (
                    <div data-testid="demo-step-reaction">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <p className="ps-label">Step 1 / 3</p>
                                <h2 className="font-heading text-3xl font-bold uppercase text-white">
                                    Reaction Drill
                                </h2>
                            </div>
                            <button
                                data-testid="demo-skip-reaction"
                                onClick={() => setStep("decision")}
                                className="ps-btn-secondary"
                            >
                                Skip →
                            </button>
                        </div>
                        <ReactionGame
                            onComplete={(r) => {
                                handleReactionDone(r);
                                setStep("decision");
                            }}
                        />
                    </div>
                )}

                {step === "decision" && (
                    <div data-testid="demo-step-decision">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <p className="ps-label">Step 2 / 3</p>
                                <h2 className="font-heading text-3xl font-bold uppercase text-white">
                                    Decision Drill
                                </h2>
                            </div>
                            <button
                                data-testid="demo-skip-decision"
                                onClick={() => setStep("leaderboard")}
                                className="ps-btn-secondary"
                            >
                                Skip →
                            </button>
                        </div>
                        <DecisionGame
                            onComplete={(r) => {
                                handleDecisionDone(r);
                                setStep("leaderboard");
                            }}
                        />
                    </div>
                )}

                {step === "leaderboard" && (
                    <div data-testid="demo-step-leaderboard">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <p className="ps-label">Step 3 / 3 · Complete</p>
                                <h2 className="font-heading text-3xl font-bold uppercase text-white">
                                    Your performance
                                </h2>
                            </div>
                            <Link to="/contact">
                                <button className="ps-btn-primary" data-testid="demo-finish-cta">
                                    Talk to Sales
                                </button>
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="ps-card p-6">
                                <p className="ps-label">Reaction</p>
                                <div className="ps-metric mt-3 text-ps-red">
                                    {reactionResult
                                        ? `${Math.round(reactionResult.reactionTime)}ms`
                                        : "—"}
                                </div>
                                <p className="mt-2 text-xs text-white/45">
                                    {reactionResult
                                        ? `Score ${reactionResult.score}/1000`
                                        : "Skipped"}
                                </p>
                            </div>
                            <div className="ps-card p-6">
                                <p className="ps-label">Decision</p>
                                <div className="ps-metric mt-3 text-ps-turf">
                                    {decisionResult ? `${decisionResult.score}/100` : "—"}
                                </div>
                                <p className="mt-2 text-xs text-white/45">
                                    {decisionResult
                                        ? `Correct: ${decisionResult.correct}/${decisionResult.total}`
                                        : "Skipped"}
                                </p>
                            </div>
                            <div className="ps-card p-6">
                                <p className="ps-label">Football IQ</p>
                                <div className="ps-metric mt-3 text-white">
                                    {(() => {
                                        const r = reactionResult?.score || 0;
                                        const d = decisionResult?.score || 0;
                                        const iq = Math.round(r * 0.6 + d * 4);
                                        return iq || "—";
                                    })()}
                                </div>
                                <p className="mt-2 text-xs text-white/45">
                                    Composite metric
                                </p>
                            </div>
                        </div>

                        <div className="mt-12">
                            <h3 className="font-heading text-2xl font-bold uppercase text-white">
                                Live Leaderboard
                            </h3>
                            <p className="ps-label mt-1">Filter by club or week</p>
                            <div className="mt-6">
                                <Leaderboard
                                    defaultGameType="reaction"
                                    embed
                                    refreshKey={refreshKey}
                                    highlightName={name}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </section>

            <ClubClaimModal
                open={claimOpen}
                club={canonicalClub || club.trim()}
                playerName={name}
                onClose={() => setClaimOpen(false)}
            />
        </div>
    );
}
