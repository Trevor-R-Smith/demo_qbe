import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const HERO_BG =
    "https://static.prod-images.emergentagent.com/jobs/11e47a01-0d53-49e0-ad4f-66f4f563ae1a/images/b5cce675b74563cbf47387876ca99736f077927f8020fd618691164647e38b8a.png";

export default function Hero() {
    return (
        <section
            data-testid="hero-section"
            className="relative overflow-hidden border-b border-white/10"
        >
            {/* Background pitch texture */}
            <div
                className="absolute inset-0 opacity-30"
                style={{
                    backgroundImage: `url(${HERO_BG})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-ps-bg via-ps-bg/85 to-ps-bg/40" />
            <div className="absolute inset-0 ps-grid opacity-40" />

            <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 py-20 md:py-28 lg:grid-cols-12">
                <div className="lg:col-span-8">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 border border-white/10 bg-ps-surface px-3 py-1.5"
                    >
                        <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-ps-turf" />
                        <span className="ps-label text-white/70">
                            Cognitive Football Training · Built for Clubs &amp; Schools
                        </span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.05 }}
                        className="ps-section-title mt-6 text-5xl text-white sm:text-6xl md:text-7xl lg:text-[88px]"
                    >
                        THINK QUICKER.
                        <br />
                        <span className="text-ps-blue">MOVE SMARTER.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.15 }}
                        className="mt-6 max-w-2xl font-body text-base leading-relaxed text-white/65 md:text-lg"
                    >
                        PlaySharp is the cognitive training platform for modern
                        football. Short, measurable drills that sharpen reaction
                        speed, scanning, decision-making, and football
                        intelligence — all in the browser.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.25 }}
                        className="mt-10 flex flex-wrap items-center gap-3"
                    >
                        <Link to="/demo" data-testid="hero-cta-start-demo">
                            <button className="ps-btn-primary inline-flex items-center gap-2">
                                Start Demo <ArrowRight size={16} />
                            </button>
                        </Link>
                        <Link to="/pricing" data-testid="hero-cta-pricing">
                            <button className="ps-btn-secondary">
                                View Pricing
                            </button>
                        </Link>
                        <Link to="/contact" data-testid="hero-cta-contact">
                            <button className="ps-btn-secondary">
                                Contact Us
                            </button>
                        </Link>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.7, delay: 0.4 }}
                        className="mt-12 grid max-w-2xl grid-cols-3 gap-6 border-t border-white/10 pt-6"
                    >
                        <div>
                            <div className="ps-metric text-2xl md:text-4xl">
                                250<span className="text-ps-blue">ms</span>
                            </div>
                            <div className="ps-label mt-1">Avg Reaction Goal</div>
                        </div>
                        <div>
                            <div className="ps-metric text-2xl md:text-4xl">
                                10<span className="text-white/30">/10</span>
                            </div>
                            <div className="ps-label mt-1">Drill Rounds</div>
                        </div>
                        <div>
                            <div className="ps-metric text-2xl md:text-4xl">
                                &lt;60<span className="text-ps-turf">s</span>
                            </div>
                            <div className="ps-label mt-1">To Understand</div>
                        </div>
                    </motion.div>
                </div>

                {/* Right side mock HUD */}
                <motion.div
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="hidden lg:col-span-4 lg:block"
                >
                    <div className="ps-card relative h-full overflow-hidden p-6">
                        <div className="flex items-center justify-between">
                            <span className="ps-label">LIVE SESSION</span>
                            <span className="font-mono text-xs text-ps-turf">● REC</span>
                        </div>
                        <div className="mt-6">
                            <div className="ps-label">PLAYER</div>
                            <div className="mt-1 font-heading text-2xl font-bold text-white">
                                MARCUS J. — #9
                            </div>
                            <div className="text-xs text-white/45">South London FC</div>
                        </div>
                        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-5">
                            <div>
                                <div className="ps-label">REACTION</div>
                                <div className="ps-metric text-2xl text-ps-blue">238ms</div>
                            </div>
                            <div>
                                <div className="ps-label">DECISIONS</div>
                                <div className="ps-metric text-2xl text-white">87%</div>
                            </div>
                            <div>
                                <div className="ps-label">SCAN RATE</div>
                                <div className="ps-metric text-2xl text-ps-turf">4.2/s</div>
                            </div>
                            <div>
                                <div className="ps-label">FOOTBALL IQ</div>
                                <div className="ps-metric text-2xl text-white">912</div>
                            </div>
                        </div>
                        <div className="mt-6 border-t border-white/10 pt-4">
                            <div className="flex items-center justify-between text-xs text-white/45">
                                <span className="font-mono">SESSION 4 · WK 12</span>
                                <span className="font-mono text-ps-turf">+18 IQ</span>
                            </div>
                            <div className="mt-2 flex h-2 overflow-hidden bg-white/5">
                                <div className="h-full w-[78%] bg-ps-blue" />
                                <div className="h-full w-[10%] bg-ps-turf" />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
