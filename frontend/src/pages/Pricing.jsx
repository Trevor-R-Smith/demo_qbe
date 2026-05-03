import PricingCards from "@/components/PricingCards";
import ContactCTA from "@/components/ContactCTA";
import { Link } from "react-router-dom";

const FEATURES = [
    { label: "Reaction speed drills", basic: true, advanced: true },
    { label: "Scanning ability training", basic: true, advanced: true },
    { label: "Decision-making under pressure", basic: true, advanced: true },
    { label: "Football intelligence scoring", basic: true, advanced: true },
    { label: "Global & club leaderboard access", basic: true, advanced: true },
    { label: "Expanded drill library", basic: false, advanced: true },
    { label: "Advanced analytics dashboard", basic: false, advanced: true },
    { label: "Personalised training insights", basic: false, advanced: true },
    { label: "Club challenge tools (expanded)", basic: false, advanced: true },
    { label: "AI Coaching (coming soon)", basic: false, advanced: "soon" },
];

function Cell({ value }) {
    if (value === true)
        return (
            <span className="grid h-5 w-5 place-items-center border border-ps-turf/40 bg-ps-turf/10 text-ps-turf">
                ✓
            </span>
        );
    if (value === "soon")
        return (
            <span className="border border-ps-turf/40 bg-ps-turf/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ps-turf">
                Soon
            </span>
        );
    return (
        <span className="grid h-5 w-5 place-items-center border border-white/10 bg-white/5 text-white/30">
            —
        </span>
    );
}

export default function Pricing() {
    return (
        <div data-testid="pricing-page">
            <section className="border-b border-white/10">
                <div className="mx-auto max-w-7xl px-6 py-20">
                    <p className="ps-label">Pricing</p>
                    <h1 className="ps-section-title mt-3 text-5xl text-white md:text-6xl">
                        Choose your training plan.
                    </h1>
                    <p className="mt-4 max-w-xl text-base text-white/60">
                        Start free with the demo. Basic for individual players.
                        Advanced for clubs, academies, and schools wanting
                        squad-level performance.
                    </p>

                    <div className="mt-12">
                        <PricingCards />
                    </div>

                    <div className="mt-8 flex flex-wrap justify-center gap-3">
                        <Link to="/demo" data-testid="pricing-page-cta-demo">
                            <button className="ps-btn-secondary">
                                Start Free Demo
                            </button>
                        </Link>
                        <Link to="/contact" data-testid="pricing-page-cta-contact">
                            <button className="ps-btn-secondary">
                                Contact Sales
                            </button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Comparison */}
            <section className="border-b border-white/10">
                <div className="mx-auto max-w-5xl px-6 py-20">
                    <p className="ps-label text-center">Plan comparison</p>
                    <h2 className="ps-section-title mt-3 text-center text-3xl text-white md:text-4xl">
                        What's in each tier.
                    </h2>

                    <div className="mt-10 border border-white/10 bg-ps-surface">
                        <div className="grid grid-cols-12 border-b border-white/10 px-4 py-4 md:px-6">
                            <div className="col-span-6 ps-label">Feature</div>
                            <div className="col-span-3 ps-label text-center">Basic</div>
                            <div className="col-span-3 ps-label text-center text-ps-red">
                                Advanced
                            </div>
                        </div>
                        {FEATURES.map((f) => (
                            <div
                                key={f.label}
                                className="grid grid-cols-12 items-center border-b border-white/5 px-4 py-3 last:border-b-0 md:px-6"
                            >
                                <div className="col-span-6 font-body text-sm text-white/80">
                                    {f.label}
                                </div>
                                <div className="col-span-3 flex justify-center">
                                    <Cell value={f.basic} />
                                </div>
                                <div className="col-span-3 flex justify-center">
                                    <Cell value={f.advanced} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <ContactCTA />
        </div>
    );
}
