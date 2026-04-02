import { useState, useEffect } from "react";
import {
  Vote,
  Shield,
  BarChart3,
  Users,
  ChevronRight,
  CheckCircle2,
  Crown,
  User,
  ClipboardList,
  Coins,
  Lock,
  Zap,
  Eye,
  Fingerprint,
  ArrowRight,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface LandingProps {
  onGetStarted: () => void;
}

function AnimatedCounter({ target, duration = 2000, suffix = "" }: { target: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.5 }
    );

    const el = document.getElementById(`counter-${target}`);
    if (el) observer.observe(el);

    return () => observer.disconnect();
  }, [target, hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [hasStarted, target, duration]);

  return (
    <span id={`counter-${target}`}>
      {count}{suffix}
    </span>
  );
}

export default function Landing({ onGetStarted }: LandingProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: Fingerprint,
      title: "Secure Authentication",
      description: "Login securely using your University Roll Number and verified credentials. Your identity is protected at every step.",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: Shield,
      title: "One-Vote Guarantee",
      description: "Each student can vote exactly once, enforced at the database level. No duplicates, no manipulation.",
      gradient: "from-emerald-500 to-teal-500",
    },
    {
      icon: BarChart3,
      title: "Live Results",
      description: "Watch election results update in real-time with beautiful charts, percentages, and progress indicators.",
      gradient: "from-violet-500 to-purple-500",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Built with modern technology for instant page loads, smooth interactions, and responsive design on any device.",
      gradient: "from-amber-500 to-orange-500",
    },
  ];

  const positions = [
    {
      icon: Crown,
      title: "President",
      description: "Lead the association and represent student interests",
      color: "bg-blue-600",
      lightColor: "bg-blue-50 text-blue-700",
    },
    {
      icon: User,
      title: "Vice President",
      description: "Support leadership and drive student initiatives",
      color: "bg-indigo-500",
      lightColor: "bg-indigo-50 text-indigo-700",
    },
    {
      icon: ClipboardList,
      title: "Secretary",
      description: "Manage communications and organizational records",
      color: "bg-amber-500",
      lightColor: "bg-amber-50 text-amber-700",
    },
    {
      icon: Coins,
      title: "Treasurer",
      description: "Oversee finances and budget allocation",
      color: "bg-emerald-500",
      lightColor: "bg-emerald-50 text-emerald-700",
    },
  ];

  const steps = [
    {
      step: "01",
      title: "Authenticate",
      description: "Enter your University Roll Number and verify your identity securely",
      icon: Lock,
    },
    {
      step: "02",
      title: "Choose Candidates",
      description: "Browse candidates for each position and make your selections",
      icon: Users,
    },
    {
      step: "03",
      title: "Cast Your Vote",
      description: "Review your choices and submit your ballot with confidence",
      icon: Vote,
    },
    {
      step: "04",
      title: "View Results",
      description: "Watch live results update in real-time as votes are counted",
      icon: Eye,
    },
  ];

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950">
          {/* Animated grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
          {/* Glowing orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse-slow animation-delay-2000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl" />
        </div>

        {/* Floating vote cards decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-[10%] w-16 h-20 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 animate-float animation-delay-1000 hidden md:block" />
          <div className="absolute top-40 right-[15%] w-12 h-16 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 animate-float animation-delay-3000 hidden md:block" />
          <div className="absolute bottom-32 left-[20%] w-14 h-18 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 animate-float animation-delay-2000 hidden md:block" />
          <div className="absolute bottom-40 right-[10%] w-10 h-14 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 animate-float animation-delay-4000 hidden md:block" />
        </div>

        <div className={`relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-8 animate-fade-in-up">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm text-blue-200 font-medium">Elections 2025 are Live</span>
          </div>

          {/* Logo */}
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 p-2">
              <img
                src="https://www.adcet.ac.in/uploads/1676968661.png"
                alt="ADCET Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
            <span className="text-white">AISA</span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-300 bg-clip-text text-transparent">
              Elections 2025
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-blue-200/80 max-w-2xl mx-auto mb-4 leading-relaxed">
            AI & DS Student Association, ADCET
          </p>
          <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed">
            Your vote shapes the future. Cast your ballot securely, transparently, and in real-time.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button
              onClick={onGetStarted}
              size="lg"
              className="group bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105"
            >
              <Vote className="mr-2 h-5 w-5" />
              Vote Now
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <a
              href="#how-it-works"
              className="inline-flex items-center text-blue-300 hover:text-white font-medium transition-colors px-6 py-3"
            >
              Learn how it works
              <ChevronRight className="ml-1 h-4 w-4" />
            </a>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-lg mx-auto">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white">
                <AnimatedCounter target={4} />
              </div>
              <div className="text-xs sm:text-sm text-slate-400 mt-1">Positions</div>
            </div>
            <div className="text-center border-x border-white/10">
              <div className="text-2xl sm:text-3xl font-bold text-white">
                <AnimatedCounter target={100} suffix="%" />
              </div>
              <div className="text-xs sm:text-sm text-slate-400 mt-1">Secure</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white">
                <AnimatedCounter target={5} suffix="s" />
              </div>
              <div className="text-xs sm:text-sm text-slate-400 mt-1">Live Updates</div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/20 rounded-full flex items-start justify-center p-1.5">
            <div className="w-1.5 h-3 bg-white/40 rounded-full animate-scroll-dot" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 sm:py-28 bg-slate-50 relative">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-blue-50 rounded-full px-4 py-1.5 mb-4">
              <Star className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Why Choose Us</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Built for Trust & Transparency
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Every feature is designed to ensure your voice is heard fairly, securely, and without compromise.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <Card
                key={feature.title}
                className="group border-0 shadow-sm hover:shadow-xl transition-all duration-500 bg-white overflow-hidden animate-slide-up"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-start space-x-4">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-blue-700 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-slate-600 text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Positions Section */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-indigo-50 rounded-full px-4 py-1.5 mb-4">
              <Users className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-medium text-indigo-700">Open Positions</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Shape Your Student Council
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Vote for the leaders who will represent AI & DS students in four key positions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {positions.map((position, index) => (
              <div
                key={position.title}
                className="group relative animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center hover:border-blue-300 hover:shadow-lg transition-all duration-300 h-full">
                  <div className={`w-14 h-14 ${position.color} rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <position.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {position.title}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {position.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 sm:py-28 bg-slate-950 text-white relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-4 border border-white/10">
              <Zap className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-300">Simple Process</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Four simple steps to make your voice count. The entire process takes less than 2 minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {steps.map((step, index) => (
              <div
                key={step.step}
                className="group relative animate-slide-up"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 h-full">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <span className="text-4xl font-black text-blue-500/30 group-hover:text-blue-500/50 transition-colors">
                        {step.step}
                      </span>
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <step.icon className="h-5 w-5 text-blue-400" />
                        <h3 className="text-lg font-semibold text-white">
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-slate-400 text-sm leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges / Key Highlights Section */}
      <section className="py-16 sm:py-20 bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {[
              { icon: Shield, label: "End-to-End Secure", sublabel: "Database-level protection" },
              { icon: Vote, label: "One Vote Per Student", sublabel: "Enforced uniqueness" },
              { icon: BarChart3, label: "Real-Time Updates", sublabel: "Every 5 seconds" },
              { icon: Users, label: "All Years Welcome", sublabel: "2nd, 3rd & Final Year" },
            ].map((badge) => (
              <div key={badge.label} className="text-center group">
                <div className="w-12 h-12 mx-auto mb-3 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                  <badge.icon className="h-6 w-6 text-slate-600 group-hover:text-blue-600 transition-colors" />
                </div>
                <div className="text-sm font-semibold text-slate-900">{badge.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{badge.sublabel}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 sm:py-28 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
        </div>

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 mb-8 border border-white/20">
            <CheckCircle2 className="h-4 w-4 text-green-300" />
            <span className="text-sm text-white/90 font-medium">Voting is Open Now</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Ready to Make <br className="hidden sm:block" />Your Voice Heard?
          </h2>
          <p className="text-lg text-blue-100/80 mb-10 max-w-xl mx-auto">
            Join your fellow AI & DS students in shaping the future of AISA. Every vote matters.
          </p>

          <Button
            onClick={onGetStarted}
            size="lg"
            className="group bg-white text-blue-700 hover:bg-blue-50 px-10 py-7 text-lg font-bold rounded-xl shadow-2xl shadow-black/20 hover:scale-105 transition-all duration-300"
          >
            <Vote className="mr-2 h-5 w-5" />
            Cast Your Vote Now
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>

          <p className="text-sm text-blue-200/60 mt-6">
            Secure. Transparent. Your vote, your choice.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 py-10 sm:py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center p-1.5">
                <img
                  src="https://www.adcet.ac.in/uploads/1676968661.png"
                  alt="ADCET"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-left">
                <div className="text-white font-bold text-sm">AISA Elections</div>
                <div className="text-slate-500 text-xs">AI & DS Student Association</div>
              </div>
            </div>
            <div className="w-16 h-px bg-slate-800 mb-4" />
            <p className="text-slate-500 text-sm">
              Annasaheb Dange College of Engineering and Technology, Ashta
            </p>
            <p className="text-slate-600 text-xs mt-2">
              Built with transparency and trust for AISA, ADCET
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
