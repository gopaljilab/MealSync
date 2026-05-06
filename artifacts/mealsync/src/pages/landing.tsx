import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const smoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
                MealSync
              </span>
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="#about" onClick={(e) => smoothScroll(e, 'about')} className="text-slate-600 hover:text-green-600 font-medium transition-colors">About</a>
              <a href="#architecture" onClick={(e) => smoothScroll(e, 'architecture')} className="text-slate-600 hover:text-green-600 font-medium transition-colors">Architecture</a>
              <a href="#contact" onClick={(e) => smoothScroll(e, 'contact')} className="text-slate-600 hover:text-green-600 font-medium transition-colors">Contact</a>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" className="font-semibold text-green-700 hover:text-green-800 hover:bg-green-50">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-full px-6">Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-green-800 bg-green-100 mb-8 animate-fade-in">
          <span className="flex w-2 h-2 rounded-full bg-green-600 mr-2"></span>
          Now connecting PGs and NGOs seamlessly
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight max-w-4xl">
          MealSync: Connecting PG Surplus to <span className="text-green-600">NGO Needs</span>
        </h1>
        <p className="text-xl md:text-2xl text-slate-600 mb-10 max-w-2xl mx-auto font-light">
          Smart food prediction and redistribution system. We help PGs reduce waste and ensure surplus meals reach those who need them most.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link href="/register">
            <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20">
              Get Started
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg h-14 px-8 rounded-full border-2 border-slate-200 hover:border-green-600 hover:text-green-700 hover:bg-green-50">
              Log In to Dashboard
            </Button>
          </Link>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">The Problem & The Solution</h2>
            <div className="w-20 h-1.5 bg-green-500 mx-auto mt-4 rounded-full"></div>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-sm">
              <div className="text-red-500 text-4xl mb-4">📉</div>
              <h3 className="text-2xl font-bold mb-4 text-slate-900">The Problem</h3>
              <p className="text-slate-600 text-lg leading-relaxed">
                Paying Guests (PGs) and hostels often prepare meals based on rough estimates, leading to significant daily food waste. Meanwhile, numerous NGOs struggle to secure reliable sources of food to feed the hungry. The gap between surplus and shortage remains unbridged due to a lack of communication and logistics.
              </p>
            </div>
            <div className="bg-green-50 p-8 rounded-3xl border border-green-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-green-200 opacity-50 blur-2xl"></div>
              <div className="text-green-600 text-4xl mb-4 relative z-10">💡</div>
              <h3 className="text-2xl font-bold mb-4 text-slate-900 relative z-10">The Solution</h3>
              <p className="text-slate-700 text-lg leading-relaxed relative z-10">
                MealSync uses an intelligent prediction system based on resident feedback to optimize food preparation. When surplus is inevitable, the platform instantly connects PG owners with local NGOs, facilitating swift and organized redistribution of meals before they go to waste.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section id="architecture" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">How MealSync Works</h2>
            <div className="w-20 h-1.5 bg-green-500 mx-auto mt-4 rounded-full"></div>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">A seamless flow from residents to those in need.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Connecting lines for desktop */}
            <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-0.5 bg-green-200 -z-0 -translate-y-1/2"></div>
            
            {/* Step 1 */}
            <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-slate-200 shadow-sm text-center relative z-10 hover:-translate-y-1 transition-transform duration-300">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 shadow-inner">1</div>
              <h4 className="font-bold text-lg mb-2 text-slate-900">Resident Input</h4>
              <p className="text-sm text-slate-600">Residents confirm their attendance and meal preferences via the app.</p>
            </div>
            
            {/* Step 2 */}
            <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-slate-200 shadow-sm text-center relative z-10 hover:-translate-y-1 transition-transform duration-300">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 shadow-inner">2</div>
              <h4 className="font-bold text-lg mb-2 text-slate-900">Smart Prediction</h4>
              <p className="text-sm text-slate-600">The PG Owner dashboard calculates exactly how much food is needed.</p>
            </div>
            
            {/* Step 3 */}
            <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-slate-200 shadow-sm text-center relative z-10 hover:-translate-y-1 transition-transform duration-300">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 shadow-inner">3</div>
              <h4 className="font-bold text-lg mb-2 text-slate-900">Surplus Alert</h4>
              <p className="text-sm text-slate-600">If there are leftover meals, the system notifies nearby NGOs.</p>
            </div>
            
            {/* Step 4 */}
            <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-slate-200 shadow-sm text-center relative z-10 hover:-translate-y-1 transition-transform duration-300">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 shadow-inner">4</div>
              <h4 className="font-bold text-lg mb-2 text-slate-900">Redistribution</h4>
              <p className="text-sm text-slate-600">NGOs accept requests and pick up fresh food to distribute it.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-green-600 text-white rounded-3xl p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-green-500 opacity-50 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-green-700 opacity-50 blur-3xl"></div>
            
            <h2 className="text-3xl font-bold mb-4 relative z-10">Ready to make an impact?</h2>
            <p className="text-green-100 mb-8 relative z-10 text-lg">
              Join the MealSync network today and be part of the solution.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
              <Button size="lg" className="bg-white text-green-700 hover:bg-slate-50 font-bold px-8 rounded-full">
                Contact Us
              </Button>
              <Button size="lg" variant="outline" className="border-green-400 text-white hover:bg-green-500 hover:text-white font-bold px-8 rounded-full">
                hello@mealsync.com
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-8 text-center text-slate-400">
        <p>© {new Date().getFullYear()} MealSync. All rights reserved.</p>
      </footer>
    </div>
  );
}
