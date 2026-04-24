import React from "react";
import { useNavigate } from "react-router-dom";
import { 
  FaArrowLeft, 
  FaCreditCard, 
  FaUniversity, 
  FaChartPie, 
  FaLock, 
  FaChartLine, 
  FaGlobe, 
  FaShieldAlt, 
  FaBriefcase, 
  FaBitcoin,
  FaPlayCircle,
  FaBookOpen,
  FaLightbulb,
  FaRobot,
  FaCheckCircle
} from "react-icons/fa";

const InvestmentKnowledgeCenter = () => {
  const navigate = useNavigate();
  const [learningPlan, setLearningPlan] = React.useState([]);
  const [isLoadingPlan, setIsLoadingPlan] = React.useState(true);
  const [selectedStep, setSelectedStep] = React.useState(null);

  const fetchLearningPlan = React.useCallback(async () => {
    try {
      setIsLoadingPlan(true);
      const response = await fetch('http://localhost:8080/api/knowledge/learning-plan', {
        method: 'GET',
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setLearningPlan(data);
        }
      }
    } catch (error) {
      console.error("Error fetching learning plan:", error);
    } finally {
      setIsLoadingPlan(false);
    }
  }, []);

  React.useEffect(() => {
    fetchLearningPlan();
  }, [fetchLearningPlan]);

  const data = [
    {
      title: "Credit Score",
      desc: "A number representing creditworthiness based on financial history. A high score unlocks better loan rates and credit cards.",
      video: "https://www.youtube.com/embed/71iaNlskCc0",
      icon: <FaCreditCard />,
      category: "Fundamentals"
    },
    {
      title: "RD (Recurring Deposit)",
      desc: "A safe savings option where you deposit a fixed amount monthly and earn guaranteed interest over a fixed period.",
      video: "https://www.youtube.com/embed/PgXyNdWnkik",
      icon: <FaUniversity />,
      category: "Savings"
    },
    {
      title: "Mutual Funds",
      desc: "An investment vehicle pooling money from multiple investors to invest in a diversified range of stocks and bonds.",
      video: "https://www.youtube.com/embed/PbldLCsspgE",
      icon: <FaChartPie />,
      category: "Investment"
    },
    {
      title: "FD (Fixed Deposit)",
      desc: "A low-risk financial instrument where you lock in a sum of money for a fixed duration at a predetermined interest rate.",
      video: "https://www.youtube.com/embed/r3JAa9ztDYA",
      icon: <FaLock />,
      category: "Savings"
    },
    {
      title: "Stock Market",
      desc: "A marketplace where ownership in publicly listed companies (shares) is traded, offering high long-term growth potential.",
      video: "https://www.youtube.com/embed/p7HKvqRI_Bo",
      icon: <FaChartLine />,
      category: "Equity"
    },
    {
      title: "Index Funds",
      desc: "Passive funds that track market indices like Nifty 50, offering diversified market exposure with very low management fees.",
      video: "https://www.youtube.com/embed/sbaMMXSAnT0",
      icon: <FaGlobe />,
      category: "Investment"
    },
    {
      title: "Debt Funds",
      desc: "Mutual funds that invest in fixed-income securities like government bonds, offering more stability than equity funds.",
      video: "https://www.youtube.com/embed/7jLip-C8SQs",
      icon: <FaShieldAlt />,
      category: "Fixed Income"
    },
    {
      title: "Smallcase Portfolios",
      desc: "Ready-to-invest thematic portfolios of stocks and ETFs, curated by experts to reflect specific market narratives.",
      video: "https://www.youtube.com/embed/H213DbTyDrU&t=92s",
      icon: <FaBriefcase />,
      category: "Strategy"
    },
    {
      title: "Crypto",
      desc: "Digital assets built on blockchain technology. Offers high potential returns but comes with extreme volatility and risk.",
      video: "https://www.youtube.com/embed/Zoz9gvhLgpM",
      icon: <FaBitcoin />,
      category: "Alternative"
    },
  ];

  return (
    <div className="min-h-screen bg-fin-background flex flex-col">
      {/* Header */}
      <div className="bg-fin-surface border-b border-fin-outline-variant px-4 sm:px-6 md:px-8 py-3 sm:py-4 shadow-sm flex flex-col sm:flex-row items-start sm:justify-between sticky top-0 z-50 gap-3">
        <div className="flex items-center gap-3 sm:gap-4">
          <button 
            onClick={() => navigate("/dashboard")}
            className="p-2 rounded-fin-md bg-fin-surface-low text-fin-text-variant hover:text-fin-text-main hover:bg-fin-surface-low/80 transition-all"
          >
            <FaArrowLeft className="text-sm" />
          </button>
          <div className="flex align-center gap-[10px]">
            <h1 className="text-base sm:text-lg font-semibold text-fin-text-main tracking-wide">Knowledge Hub</h1>
            <p className="text-xs text-fin-text-variant font-medium uppercase tracking-wider flex items-center gap-2">
              <FaBookOpen className="text-fin-primary" /> 
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-fin-md bg-fin-surface-low text-fin-text-variant text-xs font-medium uppercase tracking-wider">
            {data.length} Lessons
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 w-full">
        {/* Welcome Banner */}
        <div className="mb-8 p-5 md:p-8 rounded-fin-lg bg-fin-surface flex items-center justify-between border border-fin-outline-variant shadow-sm relative overflow-hidden">
          <div className="relative z-10 max-w-xl">
            <h2 className="text-xl md:text-2xl font-semibold text-fin-text-main mb-2">
              Wealth Creation
            </h2>
            <p className="text-fin-text-variant text-sm leading-relaxed">
              Curated financial wisdom to help you make informed decisions about your investments.
            </p>
          </div>
          <div className="relative z-10 p-3 rounded-fin-md border border-fin-outline-variant/50">
            <FaLightbulb className="text-xl text-fin-text-variant" />
          </div>
        </div>

        {/* AI Suggested Learning Plan Header */}
        <div className="mb-10 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-fin-full bg-fin-surface-low text-fin-text-variant text-[10px] font-semibold uppercase tracking-widest mb-4">
            <FaRobot /> Personalized for You
          </div>
          <h2 className="text-2xl font-semibold text-fin-text-main mb-2">AI Suggested Learning Plan</h2>
          <p className="text-fin-text-variant text-sm max-w-2xl">
            Our agent has analyzed your current risk profile and suggested assets to curate a fast-track educational journey. Click any step to deep-dive.
          </p>
        </div>

        <div className="mb-8 md:mb-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 relative">
             {/* Progress Connector Line */}
             <div className="hidden md:block absolute top-[44px] left-[10%] right-[10%] h-0.5 bg-fin-outline-variant -z-0"></div>
            
             {isLoadingPlan ? (
               Array(4).fill(0).map((_, i) => (
                 <div key={i} className="bg-fin-surface border border-fin-outline-variant rounded-fin-md p-6 h-48 animate-pulse flex flex-col gap-4">
                    <div className="w-10 h-10 bg-fin-surface-low rounded-full"></div>
                    <div className="h-4 bg-fin-surface-low rounded w-2/3"></div>
                    <div className="h-3 bg-fin-surface-low rounded w-full"></div>
                 </div>
               ))
             ) : learningPlan.map((step, idx) => (
               <div 
                 key={idx} 
                 onClick={() => setSelectedStep(step)}
                 group="true"
                 className="group relative bg-fin-surface rounded-fin-md p-6 shadow-sm border border-fin-outline-variant hover:border-fin-primary/30 transition-all z-10 cursor-pointer hover:-translate-y-1"
               >
                 <div className="flex items-center justify-between mb-4">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shadow-sm transition-transform group-hover:scale-110 ${
                      idx === 0 ? 'bg-fin-primary text-white' : 'bg-fin-surface-low text-fin-text-variant'
                    }`}>
                      {step.step || idx + 1}
                    </div>
                    {(idx === 0 || step.content) && (
                      <span className="text-[9px] font-semibold text-fin-primary uppercase tracking-widest bg-fin-primary/10 px-2 py-1 rounded-fin-md">
                        {idx === 0 ? 'Start' : 'Deep Dive'}
                      </span>
                    )}
                 </div>
                 
                 <h4 className="text-sm font-semibold text-fin-text-main mb-2 group-hover:text-fin-primary transition-colors leading-tight">
                    {step.title}
                 </h4>
                 <p className="text-[11px] text-fin-text-variant leading-relaxed mb-4 line-clamp-2">
                    {step.description}
                 </p>
                 
                 <div className="mt-auto flex items-center justify-between">
                    <span className="text-[9px] font-medium text-fin-text-variant uppercase tracking-tight flex items-center gap-1.5">
                       <FaCheckCircle className={idx === 0 ? "text-fin-primary" : "text-fin-outline-variant"} />
                       {step.target}
                    </span>
                    <button className="text-[10px] font-semibold text-fin-primary opacity-0 group-hover:opacity-100 transition-opacity">
                       Read More →
                    </button>
                 </div>
               </div>
             ))}
         </div>
         
         {/* Stability Fallback if manual refresh needed */}
         {!isLoadingPlan && learningPlan.length === 0 && (
           <div className="text-center py-12 bg-fin-surface rounded-fin-md border border-dashed border-fin-outline-variant mt-4">
              <p className="text-fin-text-variant text-xs font-semibold uppercase tracking-widest mb-4">Initial loading failed</p>
              <button 
                onClick={fetchLearningPlan}
                className="px-6 py-2 bg-fin-primary text-white text-xs font-semibold rounded-fin-md shadow-sm hover:bg-fin-primary/90 transition-colors"
              >
                Generate Plan Now
              </button>
           </div>
         )}
      </div>

      {/* Learning Step Modal */}
      {selectedStep && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
           <div 
             className="absolute inset-0 bg-black/50"
             onClick={() => setSelectedStep(null)}
           ></div>
           <div className="relative bg-fin-surface w-full max-w-2xl rounded-fin-lg shadow-xl overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-fin-outline-variant">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-fin-md bg-fin-primary text-white flex items-center justify-center font-semibold shadow-sm">
                       {selectedStep.step}
                    </div>
                    <div>
                       <h3 className="text-lg font-semibold text-fin-text-main">{selectedStep.title}</h3>
                       <span className="text-[10px] font-medium text-fin-text-variant uppercase tracking-widest">{selectedStep.target}</span>
                    </div>
                 </div>
                 <button 
                   onClick={() => setSelectedStep(null)}
                   className="p-2 rounded-fin-md hover:bg-fin-surface-low text-fin-text-variant hover:text-fin-text-main transition-all"
                 >
                   <div className="w-6 h-6 flex items-center justify-center text-lg">×</div>
                 </button>
              </div>
              
              <div className="p-6 md:p-8 max-h-[70vh] overflow-y-auto">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-fin-md bg-fin-surface-low text-fin-text-variant text-[10px] font-semibold uppercase tracking-widest mb-6">
                    <FaCheckCircle /> Goal: Master this Strategy
                 </div>
                 <div className="text-fin-text-variant text-base leading-relaxed space-y-4 italic mb-8 border-l-4 border-fin-outline-variant pl-6">
                    "{selectedStep.description}"
                 </div>
                 <div className="text-fin-text-variant text-base leading-relaxed whitespace-pre-line">
                    {selectedStep.content}
                 </div>
                 
                 <div className="mt-12 p-5 rounded-fin-md bg-fin-surface-low border border-fin-outline-variant flex items-start gap-4">
                    <div className="p-2 bg-fin-surface rounded-fin-md text-fin-primary">
                      <FaRobot size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-fin-text-variant uppercase tracking-widest mb-1">Coach Note</p>
                      <p className="text-sm text-fin-text-variant">This content is dynamically generated based on your portfolio. As your assets grow, your roadmap will evolve.</p>
                    </div>
                 </div>
              </div>
              
              <div className="p-6 border-t border-fin-outline-variant flex justify-end">
                 <button 
                   onClick={() => setSelectedStep(null)}
                   className="px-8 py-3 bg-fin-primary text-white font-semibold text-xs rounded-fin-md hover:bg-fin-primary/90 transition-all"
                 >
                   Got it, thanks!
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Categories Section */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 w-full pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 pb-12">
          {data.map((item, index) => (
            <div 
              key={index}
              className="group bg-fin-surface grayscale rounded-fin-lg p-4 sm:p-5 shadow-sm border border-fin-outline-variant hover:border-fin-primary/30 transition-all flex flex-col cursor-pointer hover:grayscale-0"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="p-3 rounded-fin-md bg-fin-surface-low text-fin-primary transition-transform group-hover:scale-110"
                  >
                    {React.cloneElement(item.icon, { size: 20 })}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-fin-text-main group-hover:text-fin-primary transition-colors">
                      {item.title}
                    </h3>
                    <span className="text-[10px] font-medium text-fin-text-variant uppercase tracking-widest px-2 py-0.5 bg-fin-surface-low rounded-fin-md">
                      {item.category}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-fin-text-variant mb-4 leading-relaxed flex-1">
                {item.desc}
              </p>

              <div className="relative group/video overflow-hidden rounded-fin-md bg-fin-surface-low aspect-video mb-4">
                <iframe
                  className="w-full h-full border-0"
                  src={item.video}
                  title={item.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              
              <div className="flex items-center gap-2">
                <FaPlayCircle className="text-fin-text-variant" />
                <span className="text-[10px] font-medium text-fin-text-variant uppercase tracking-tight">Video Lesson</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </div>
  );
};

export default InvestmentKnowledgeCenter;