import React, { useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/authContext";
import { FaChartBar, FaPiggyBank, FaUserShield, FaArrowRight, FaSignInAlt, FaSignOutAlt, FaWallet } from "react-icons/fa";

const Landing = () => {
  const { currentUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

    return (
      <div className="min-h-screen bg-fin-background font-sans">
        {/* Header / Navbar */}
        <header className="sticky top-0 z-50 w-full bg-fin-surface border-b border-fin-outline-variant px-4 sm:px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-fin-text-main">
                FINMATE
              </span>
            </div>

            {/* Mobile menu button */}
            <button 
              className="md:hidden p-2 text-fin-text-variant"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
              )}
            </button>

            <nav className={`md:block ${mobileMenuOpen ? 'absolute top-full left-0 right-0 bg-fin-surface border-b border-fin-outline-variant p-4 fin-shadow-md' : 'hidden'}`}>
              <ul className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                <li><a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-xs font-medium text-fin-text-variant hover:text-fin-text-main uppercase tracking-wider cursor-pointer">Features</a></li>
                {currentUser ? (
                  <>
                    <li><Link to="/expense-tracker" onClick={() => setMobileMenuOpen(false)} className="text-xs font-medium text-fin-text-variant hover:text-fin-text-main uppercase tracking-wider">EXPENSES</Link></li>
                    <li><Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="text-xs font-medium text-fin-text-variant hover:text-fin-text-main uppercase tracking-wider">Dashboard</Link></li>
                    <li>
                      <button
                        onClick={() => { logout(); setMobileMenuOpen(false); }}
                        className="text-xs font-medium text-red-600 hover:text-red-700 uppercase tracking-wider"
                      >
                        Logout
                      </button>
                    </li>
                  </>
                ) : (
                  <li>
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2 bg-fin-primary text-white rounded-fin-sm text-xs font-medium uppercase tracking-wider hover:bg-fin-primary-container transition-colors">
                      Login
                    </Link>
                  </li>
                )}
              </ul>
            </nav>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative pt-12 sm:pt-16 lg:pt-20 pb-16 sm:pb-24 overflow-hidden bg-gradient-to-b from-fin-surface to-fin-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="relative z-10 space-y-6 sm:space-y-8 order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fin-surface-low border border-fin-outline-variant text-fin-text-variant text-xs font-semibold uppercase tracking-widest">
                ● Financial Intelligence Simplified
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-fin-text-main leading-[1.1] tracking-tight">
                Know Your <span className="text-fin-primary">Money</span>,<br />
                Shape Your <span className="text-fin-accent">Future</span>
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-fin-text-variant leading-relaxed max-w-lg">
                Finmate transforms your raw bank statements into actionable intelligence.
                Track expenses, trim waste, and build a personalized investment portfolio.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                {currentUser ? (
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="px-5 sm:px-6 py-3 bg-fin-primary text-white rounded-fin-md font-semibold text-base sm:text-lg hover:bg-fin-primary-container transition-all flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    Go to Dashboard <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/register')}
                    className="px-6 sm:px-8 py-3 sm:py-4 bg-fin-primary text-white rounded-fin-md font-semibold text-base sm:text-lg hover:bg-fin-primary-container transition-all flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    Start your journey <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </button>
                )}
              </div>
            </div>

            <div className="relative order-1 lg:order-2 hidden sm:block">
              <div className="absolute -inset-10 bg-gradient-to-tr from-fin-surface-low to-fin-surface rounded-full blur-3xl opacity-60"></div>
              <div className="relative grid grid-cols-2 gap-3">
                <div className="p-4 bg-fin-surface rounded-fin-md border border-fin-outline-variant fin-shadow-sm space-y-3">
                  <div className="p-2 bg-fin-surface-low text-fin-text-variant w-fit rounded"><FaChartBar /></div>
                  <div className="space-y-1">
                    <p className="text-xs text-fin-text-variant font-medium uppercase tracking-wider">Growth</p>
                    <p className="text-xl font-bold text-fin-text-main">+12.5%</p>
                  </div>
                </div>
                <div className="p-4 bg-fin-surface rounded-fin-md border border-fin-outline-variant fin-shadow-sm space-y-3 mt-4">
                  <div className="p-2 bg-fin-surface-low text-fin-text-variant w-fit rounded"><FaPiggyBank /></div>
                  <div className="space-y-1">
                    <p className="text-xs text-fin-text-variant font-medium uppercase tracking-wider">Surplus</p>
                    <p className="text-xl font-bold text-fin-text-main">₹12,450</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services / Use Cases */}
        <section id="features" className="py-16 bg-fin-surface-low">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-sm font-semibold text-fin-text-variant uppercase tracking-[0.2em]">Our Services</h2>
              <h3 className="text-2xl md:text-3xl font-bold text-fin-text-main tracking-tight">Everything You Need to <span className="text-fin-text-variant">Thrive</span></h3>
              <p className="text-sm text-fin-text-variant max-w-xl mx-auto">
                Enterprise-grade tools to ensure your financial health is always at its peak.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-fin-md bg-fin-surface border border-fin-outline-variant hover:border-fin-outline hover:fin-shadow-sm transition-all">
                <div className="p-2.5 bg-fin-surface-low text-fin-text-main rounded-fin-sm w-fit mb-3">
                  <FaChartBar className="text-lg" />
                </div>
                <h4 className="text-base font-semibold text-fin-text-main mb-2">Statement Intelligence</h4>
                <p className="text-fin-text-variant leading-relaxed text-xs">
                  Automatically group expenses into smart categories from any bank statement.
                </p>
              </div>

              <div className="p-5 rounded-fin-md bg-fin-surface border border-fin-outline-variant hover:border-fin-outline hover:fin-shadow-sm transition-all">
                <div className="p-2.5 bg-fin-surface-low text-fin-text-main rounded-fin-sm w-fit mb-3">
                  <FaPiggyBank className="text-lg" />
                </div>
                <h4 className="text-base font-semibold text-fin-text-main mb-2">Optimization Center</h4>
                <p className="text-fin-text-variant leading-relaxed text-xs">
                  Visualize surplus and find areas to optimize your spending.
                </p>
              </div>

              <div className="p-5 rounded-fin-md bg-fin-surface border border-fin-outline-variant hover:border-fin-outline hover:fin-shadow-sm transition-all">
                <div className="p-2.5 bg-fin-surface-low text-fin-text-main rounded-fin-sm w-fit mb-3">
                  <FaUserShield className="text-lg" />
                </div>
                <h4 className="text-base font-semibold text-fin-text-main mb-2">Personalized Portfolio</h4>
                <p className="text-fin-text-variant leading-relaxed text-xs">
                  Custom strategies aligned with your risk comfort level.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Super Simple Footer */}
        <footer className="py-6 border-t border-fin-outline-variant bg-fin-surface">
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm font-semibold text-fin-text-variant tracking-widest">FINMATE</div>
            <p className="text-xs text-fin-text-variant opacity-60">&copy; 2025 Finmate. All rights reserved.</p>
            <div className="flex gap-6 text-xs font-medium text-fin-text-variant">
              <a href="#" className="hover:text-fin-text-main">Privacy</a>
              <a href="#" className="hover:text-fin-text-main">Terms</a>
            </div>
          </div>
        </footer>
      </div>
    );
};

export default Landing;

;
