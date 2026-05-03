import { Link } from "react-router-dom";
import { Check, Sparkles } from "lucide-react";

const BASIC = {
    name: "Basic",
    price: "£19",
    period: "/month",
    tagline: "Everything you need to start training cognitively.",
    features: [
        "Reaction speed drills",
        "Scanning ability training",
        "Decision-making under pressure",
        "Football intelligence scoring",
        "Global & club leaderboard access",
    ],
    cta: "Start Free Demo",
    href: "/demo",
};

const ADVANCED = {
    name: "Advanced",
    price: "Contact",
    period: "for price",
    tagline: "Squad-wide cognitive performance for clubs & academies.",
    features: [
        "Everything in Basic",
        "Expanded drill library (more games)",
        "Advanced analytics dashboard",
        "Personalised training insights",
        "Club challenge tools (expanded)",
    ],
    coming: "AI Coaching",
    cta: "Contact Sales",
    href: "/contact",
};

function FeatureRow({ children, accent = false }) {
    return (
        <li className="flex items-start gap-3 py-2 text-sm text-white/75">
            <span
                className={[
                    "mt-0.5 grid h-4 w-4 flex-none place-items-center border",
                    accent
                        ? "border-ps-turf bg-ps-turf/10 text-ps-turf"
                        : "border-white/15 bg-white/5 text-white",
                ].join(" ")}
            >
                <Check size={11} strokeWidth={3} />
            </span>
            <span dangerouslySetInnerHTML={{ __html: children }} />
        </li>
    );
}

export default function PricingCards({ compact = false }) {
    return (
        <div
            data-testid="pricing-cards"
            className={[
                "mx-auto grid max-w-5xl grid-cols-1 gap-5 lg:grid-cols-2",
                compact ? "" : "",
            ].join(" ")}
        >
            {/* BASIC */}
            <div data-testid="pricing-card-basic" className="ps-card relative p-8">
                <p className="ps-label">{BASIC.name} Plan</p>
                <div className="mt-3 flex items-baseline gap-1">
                    <span className="font-heading text-6xl font-black text-white">
                        {BASIC.price}
                    </span>
                    <span className="font-body text-base text-white/55">
                        {BASIC.period}
                    </span>
                </div>
                <p className="mt-3 max-w-sm text-sm text-white/55">
                    {BASIC.tagline}
                </p>

                <ul className="mt-8 border-t border-white/5 pt-4">
                    {BASIC.features.map((f) => (
                        <FeatureRow key={f}>{f}</FeatureRow>
                    ))}
                </ul>

                <Link to={BASIC.href} className="mt-8 inline-block">
                    <button
                        data-testid="pricing-cta-basic"
                        className="ps-btn-secondary w-full"
                    >
                        {BASIC.cta}
                    </button>
                </Link>
            </div>

            {/* ADVANCED */}
            <div
                data-testid="pricing-card-advanced"
                className="ps-trace-border relative bg-ps-bg p-8"
                style={{ borderRadius: 4 }}
            >
                <div className="relative z-10">
                    <div className="flex items-center justify-between">
                        <p className="ps-label">{ADVANCED.name} Plan</p>
                        <span className="inline-flex items-center gap-1 border border-ps-turf/40 bg-ps-turf/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-ps-turf">
                            <Sparkles size={11} /> {ADVANCED.coming} · Coming Soon
                        </span>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="font-heading text-5xl font-black text-white">
                            {ADVANCED.price}
                        </span>
                        <span className="font-body text-base text-white/55">
                            {ADVANCED.period}
                        </span>
                    </div>
                    <p className="mt-3 max-w-sm text-sm text-white/55">
                        {ADVANCED.tagline}
                    </p>

                    <ul className="mt-8 border-t border-white/5 pt-4">
                        {ADVANCED.features.map((f, i) => (
                            <FeatureRow key={f} accent={i === 0}>
                                {f}
                            </FeatureRow>
                        ))}
                        <li className="mt-2 flex items-start gap-3 py-2 text-sm text-white/65">
                            <span className="mt-0.5 grid h-4 w-4 flex-none place-items-center border border-ps-turf/40 bg-ps-turf/10 text-ps-turf">
                                <Sparkles size={10} />
                            </span>
                            <span>
                                <strong className="text-ps-turf">AI Coaching</strong>
                                <span className="ml-1 text-white/55">
                                    — personalised recommendations & adaptive
                                    difficulty (coming soon)
                                </span>
                            </span>
                        </li>
                    </ul>

                    <Link to={ADVANCED.href} className="mt-8 inline-block">
                        <button
                            data-testid="pricing-cta-advanced"
                            className="ps-btn-primary w-full"
                        >
                            {ADVANCED.cta}
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
