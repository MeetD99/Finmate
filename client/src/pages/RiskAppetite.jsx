import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {FaUserCircle, FaUsers, FaBriefcase, FaLock} from "react-icons/fa";

const RiskAppetite = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    age: "",
    income: "",
    dependents: "",
    employment: "",
    emergencyFund: "",
    horizon: "",
    volatility: "",
    growth: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchExistingProfile();
  }, []);

  const fetchExistingProfile = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/risk-profile", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        if (data.age) {
          setFormData({
            age: String(data.age),
            income: String(data.monthly_income),
            dependents: String(data.dependants),
            employment: data.employment_type === 1 ? "Salaried" : data.employment_type === 2 ? "Self-Employed" : "Business",
            emergencyFund: String(data.EMI_burden || 6),
            horizon: "5-10 years",
            volatility: "Moderate",
            growth: "Balanced",
          });
        }
      }
    } catch (error) {
      console.log("No existing profile found");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:8080/api/risk-appetite/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const result = await response.json();
        // Only save risk result and advice - NO trim_data (it's based on fallback data)
        localStorage.setItem('riskAppetiteData', JSON.stringify({
          risk_result: result.risk_result,
          llm_advice: result.llm_advice,
          trim_data: null, // Will be calculated after transaction upload
          trim_advisory: result.trim_advisory,
          timestamp: new Date().toISOString()
        }));

        // Directly update localStorage user object with has_risk_profile = true
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userObj = JSON.parse(storedUser);
          userObj.has_risk_profile = true;
          localStorage.setItem('user', JSON.stringify(userObj));
        }
        
        window.dispatchEvent(new CustomEvent('storage'));
        navigate('/dashboard');
      } else {
        const error = await response.json();
        alert(`Error: ${error.detail}`);
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('Error submitting form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-fin-surface flex flex-col lg:flex-row">
      {/* Left Panel: Branded Sidebar */}
      <div className="lg:w-[40%] bg-fin-primary p-6 lg:p-20 flex flex-col justify-between text-white relative overflow-hidden order-2 lg:order-1">
        <div className="relative z-10">
          <button 
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-xs lg:text-sm font-bold uppercase tracking-widest mb-6 lg:mb-12"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            <span className="hidden sm:inline">Back to Dashboard</span>
          </button>
          
          <div className="mb-6 lg:mb-8">
            <div className="w-12 h-12 lg:w-16 lg:h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4 lg:mb-6 backdrop-blur-md border border-white/10">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
            </div>
            <h1 className="text-3xl lg:text-5xl font-bold tracking-tight leading-tight mb-4 lg:mb-6">
              Profile your <span className="text-fin-accent">Potential.</span>
            </h1>
            <p className="text-sm lg:text-lg text-white/80 font-medium leading-relaxed max-w-md">
              Complete your risk assessment to unlock personalized AI insights and dynamic wealth projections.
            </p>
          </div>
        </div>

        <div className="relative z-10 hidden lg:block">
          <div className="flex items-center gap-4 p-6 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-2xl bg-fin-accent text-white flex items-center justify-center text-xl shadow-lg shadow-fin-accent/20">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Growth Engine</p>
              <p className="text-sm font-medium">100% Data-Driven Advisory</p>
            </div>
          </div>
        </div>

        {/* Abstract shapes */}
        <div className="absolute top-0 right-0 w-64 lg:w-96 h-64 lg:h-96 bg-white/5 rounded-full -mr-24 lg:-mr-48 -mt-24 lg:-mt-48 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-32 lg:w-64 h-32 lg:h-64 bg-fin-accent/10 rounded-full -ml-16 lg:-ml-32 -mb-16 lg:-mb-32 blur-3xl"></div>
      </div>

      {/* Right Panel: Scrollable Form */}
      <div className="flex-1 overflow-y-auto lg:h-screen order-1 lg:order-2">
        <div className="max-w-xl mx-auto py-8 lg:py-16 px-4 lg:px-8">
          <div className="mb-8 lg:mb-10">
            <h2 className="text-xl lg:text-2xl font-black text-gray-800 tracking-tight mb-2 uppercase">Risk Appetite Form</h2>
            <p className="text-gray-400 text-xs lg:text-sm font-medium">Please provide accurate details for the best AI advice.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Demographics Section */}
            <div>
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <FaUserCircle className="text-[#8884d8]" /> Personal Foundations
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Current Age</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    placeholder="e.g. 25"
                    className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-[#8884d8] focus:ring-0 transition-all text-sm font-medium text-gray-800 placeholder:text-gray-300"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Monthly Income (₹)</label>
                  <input
                    type="number"
                    name="income"
                    value={formData.income}
                    onChange={handleChange}
                    placeholder="e.g. 50000"
                    className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-[#8884d8] focus:ring-0 transition-all text-sm font-medium text-gray-800 placeholder:text-gray-300"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Responsibility Section */}
            <div>
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <FaUsers className="text-[#8884d8]" /> Financial Responsibilities
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Dependents</label>
                  <input
                    type="number"
                    name="dependents"
                    value={formData.dependents}
                    onChange={handleChange}
                    placeholder="No. of people"
                    className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-[#8884d8] focus:ring-0 transition-all text-sm font-medium text-gray-800 placeholder:text-gray-300"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Employment Type</label>
                  <select
                    name="employment"
                    value={formData.employment}
                    onChange={handleChange}
                    className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-[#8884d8] focus:ring-0 transition-all text-sm font-medium text-gray-800 cursor-pointer"
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="Salaried">Salaried Professional</option>
                    <option value="Self-Employed">Self-Employed</option>
                    <option value="Business">Business Owner</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Strategic Section */}
            <div>
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <FaBriefcase className="text-[#8884d8]" /> Investment Strategy
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Emergency Fund</label>
                  <input
                    type="number"
                    name="emergencyFund"
                    value={formData.emergencyFund}
                    onChange={handleChange}
                    placeholder="Months covered"
                    className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-[#8884d8] focus:ring-0 transition-all text-sm font-medium text-gray-800 placeholder:text-gray-300"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Horizon (Years)</label>
                  <input
                    type="number"
                    name="horizon"
                    value={formData.horizon}
                    onChange={handleChange}
                    placeholder="e.g. 5"
                    className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-[#8884d8] focus:ring-0 transition-all text-sm font-medium text-gray-800 placeholder:text-gray-300"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Volatility Tolerance</label>
                <select
                  name="volatility"
                  value={formData.volatility}
                  onChange={handleChange}
                  className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-[#8884d8] focus:ring-0 transition-all text-sm font-medium text-gray-800 cursor-pointer"
                  required
                >
                  <option value="">Select Level</option>
                  <option value="Low">Low - Safety First</option>
                  <option value="Medium">Medium - Balanced</option>
                  <option value="High">High - Growth Oriented</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Growth Preference</label>
                <select
                  name="growth"
                  value={formData.growth}
                  onChange={handleChange}
                  className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-[#8884d8] focus:ring-0 transition-all text-sm font-medium text-gray-800 cursor-pointer"
                  required
                >
                  <option value="">Select Pace</option>
                  <option value="Slow">Steady & Slow</option>
                  <option value="Balanced">Balanced Growth</option>
                  <option value="Rapid">Rapid Appreciation</option>
                </select>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full py-5 bg-[#8884d8] text-white font-black uppercase tracking-widest rounded-2xl shadow-2xl shadow-[#8884d8]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 mt-4 flex items-center justify-center gap-3"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Finalizing Profile...
                </>
              ) : (
                <>Build My Portfolio <FaLock className="text-[10px] opacity-40" /></>
              )}
            </button>
          </form>
          
          <p className="mt-8 text-center text-[10px] font-bold text-gray-300 uppercase tracking-widest">
            Secured by Finmate Neural Engine
          </p>
        </div>
      </div>
    </div>
  );
};

export default RiskAppetite;