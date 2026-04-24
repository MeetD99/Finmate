import React, { useState, useContext } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AuthContext } from '../context/authContext'
import MoneyBuddy from '../components/MoneyBuddy'

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

const Dashboard = () => {
  const { currentUser, logout, setCurrentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [surplus, setSurplus] = useState(() => {
    const riskData = localStorage.getItem('riskAppetiteData');
    if (riskData) {
      const parsed = JSON.parse(riskData);
      return parsed.trim_data?.total_trim || 0;
    }
    return 0;
  });
  const [luxury, setLuxury] = useState(0);
  const [nonMandatory, setNonMandatory] = useState(0);
  const [uploadResults, setUploadResults] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [localStorageData, setLocalStorageData] = useState(() => {
    const saved = localStorage.getItem('finmateData');
    return saved ? JSON.parse(saved) : [];
  });
  const [chartData, setChartData] = useState([]);
  const [dbTransactions, setDbTransactions] = useState([]);
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const [isSavingTrim, setIsSavingTrim] = useState(false);
  const [portfolioTrimData, setPortfolioTrimData] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [currentViewDate, setCurrentViewDate] = useState(null); // {month, year} or null for latest
  const [hasRiskProfile, setHasRiskProfile] = useState(() => {
    return currentUser?.has_risk_profile || !!localStorage.getItem('riskAppetiteData');
  });

  // Import from Expense Tracker modal
  const [showImportModal, setShowImportModal] = useState(false)
  const [expenseTrackerExpenses, setExpenseTrackerExpenses] = useState([])
  const [selectedImportIds, setSelectedImportIds] = useState([])
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(false)

  // Goal State
  const [activeGoal] = useState({
    name: "Emergency Fund",
    target: 100000,
    current: 45000,
    deadline: "Dec 2025"
  });

  // Net Worth Goal State
  const [netWorthGoal, setNetWorthGoal] = useState(1000000);
  const [currentNetWorth] = useState(0);

  // Tooltip popup state
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipMessage, setTooltipMessage] = useState('');

  // Colors for pie chart - similar tones (indigo shades)
  const COLORS = ['#4338ca', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'];

  // Function to show tooltip popup
  const showTooltipPopup = (message) => {
    setTooltipMessage(message);
    setShowTooltip(true);
    setTimeout(() => {
      setShowTooltip(false);
    }, 3000); // Hide after 3 seconds
  };

  // Process category data for pie chart
  const getCategoryData = (transactions) => {
    if (!transactions || transactions.length === 0) return [];

    const categoryTotals = {};
    transactions.forEach(transaction => {
      const category = transaction.category;
      const amount = transaction.amount;

      if (categoryTotals[category]) {
        categoryTotals[category] += amount;
      } else {
        categoryTotals[category] = amount;
      }
    });

    return Object.entries(categoryTotals).map(([category, amount], index) => ({
      name: category,
      value: amount,
      color: COLORS[index % COLORS.length]
    }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && (selectedFile.type === "text/csv" || selectedFile.name.endsWith(".xlsx"))) {
      setFile(selectedFile);
    } else {
      alert("Please upload a valid CSV or Excel file.");
    }
  };

  const handleDeleteFile = () => {
    setFile(null);
  };

  const handleAnalyze = async () => {
    if (!file) {
      alert("Please select a file first");
      return;
    }

    setIsUploading(true);
    setUploadResults(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:8080/api/upload-excel', {
        method: 'POST',
        body: formData,
        credentials: 'include' // Include cookies for authentication
      });

      const result = await response.json();

      if (response.ok) {
        setUploadResults(result);

        // Calculate trim from actual categorized transactions
        let luxuryTotal = 0;
        let nonMandatoryTotal = 0;
        result.transactions.forEach(t => {
          if (t.type === 'Withdraw') {
            if (t.category === 'Luxury/Discretionary') {
              luxuryTotal += t.amount;
            } else if (t.category === 'Non-Mandatory') {
              nonMandatoryTotal += t.amount;
            }
          }
        });

        // Set trim sliders based on suggested trim percentages from backend
        const trimData = result.trim?.trim_data;
        const luxuryPct = trimData?.luxury_trim_pct || 20;
        const nonMandatoryPct = trimData?.nonmand_trim_pct || 15;

        // Update sliders and surplus
        setLuxury(luxuryPct);
        setNonMandatory(nonMandatoryPct);
        
        // Calculate total surplus from backend or fallback
        const totalSurplus = trimData?.total_trim || (suggestedLuxuryTrim + suggestedNonMandatoryTrim);
        setSurplus(totalSurplus);

        // Save to localStorage
        const newData = {
          month: result.statistics.month,
          year: result.statistics.year,
          spending: result.statistics.total_spending,
          savings: result.statistics.total_savings,
          transactions: result.transactions,
          trim_data: trimData || {
            luxury_total: luxuryTotal,
            nonmandatory_total: nonMandatoryTotal,
            luxury_trim_pct: 20,
            nonmand_trim_pct: 15,
            luxury_trim_value: suggestedLuxuryTrim,
            nonmand_trim_value: suggestedNonMandatoryTrim,
            total_trim: totalSurplus
          },
          timestamp: new Date().toISOString()
        };

        const updatedData = [...localStorageData, newData];
        setLocalStorageData(updatedData);
        localStorage.setItem('finmateData', JSON.stringify(updatedData));

        showTooltipPopup(`File processed! Found ₹${luxuryTotal} luxury + ₹${nonMandatoryTotal} non-mandatory. Suggested trim: ₹${totalSurplus}/mo`);

        // Refresh all data after successful upload
        refreshUserData();
        fetchChartData();
        fetchDbTransactions();
        fetchPortfolioData();
        fetchHistoryList();
        
        // Notify Portfolio page to refresh samples
        window.dispatchEvent(new CustomEvent('dataUpdated'));
      } else {
        showTooltipPopup(`Error: ${result.detail}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      showTooltipPopup('Error uploading file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  
  // If no portfolio, ensure riskAppetiteData is not leaking from another user
  React.useEffect(() => {
    if (!hasRiskProfile) {
      localStorage.removeItem('riskAppetiteData');
    }
  }, [hasRiskProfile]);

  // Fetch chart data from API
  const fetchChartData = async () => {
    setIsLoadingChart(true);
    try {
      const response = await fetch('http://localhost:8080/api/summary/chart-data', {
        method: 'GET',
        credentials: 'include' // Include cookies for authentication
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Chart data received:', data);
        setChartData(data);
      } else {
        console.error('Failed to fetch chart data');
        // Fallback to empty array if API fails
        setChartData([]);
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
      setChartData([]);
    } finally {
      setIsLoadingChart(false);
    }
  };

  // Refresh user data to get updated risk profile status
  const refreshUserData = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/auth/me', {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData); // Update the current user context
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  const fetchDbTransactions = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/transactions', {
        method: 'GET',
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setDbTransactions(data);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const openImportModal = async () => {
    setShowImportModal(true)
    setIsLoadingExpenses(true)
    setSelectedImportIds([])
    try {
      const userId = currentUser?.id
      const url = userId 
        ? `http://localhost:8080/api/expenses/grouped?user_id=${userId}`
        : `http://localhost:8080/api/expenses/grouped?user_id=0`
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setExpenseTrackerExpenses(data)
      }
    } catch (error) {
      console.error('Error fetching expenses:', error)
    } finally {
      setIsLoadingExpenses(false)
    }
  }

  const handleImportFromExpenseTracker = async () => {
    if (selectedImportIds.length === 0) return
    setIsLoadingExpenses(true)
    try {
      const response = await fetch('http://localhost:8080/api/expenses/import-to-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ expense_ids: selectedImportIds })
      })
      if (response.ok) {
        const data = await response.json()
        showTooltipPopup(data.message)
        
        const stats = data.statistics
        const monthName = stats.month
        const year = stats.year
        
        const importedTransactions = data.imported.map(t => ({
          description: t.description,
          amount: t.amount,
          type: t.type,
          category: t.category,
          date: t.date,
          confidence: t.confidence,
          justification: t.justification,
          withdrawal: t.type === 'Withdraw' ? t.amount : 0,
          deposit: t.type === 'Deposit' ? t.amount : 0,
          balance: 0
        }))
        
        const savedData = localStorage.getItem('finmateData')
        let existingData = savedData ? JSON.parse(savedData) : []
        
        const monthIndex = existingData.findIndex(d => 
          d.month === monthName && d.year === parseInt(year)
        )
        
        if (monthIndex >= 0) {
          existingData[monthIndex].transactions = [
            ...existingData[monthIndex].transactions,
            ...importedTransactions
          ]
          existingData[monthIndex].spending = stats.total_spending
          existingData[monthIndex].savings = stats.total_savings
        } else {
          existingData.push({
            month: monthName,
            year: parseInt(year),
            spending: stats.total_spending,
            savings: stats.total_savings,
            transactions: importedTransactions,
            timestamp: new Date().toISOString()
          })
        }
        
        localStorage.setItem('finmateData', JSON.stringify(existingData))
        setLocalStorageData(existingData)
        
        setUploadResults({
          statistics: stats,
          transactions: importedTransactions
        })
        setCurrentViewDate({ month: monthName, year: parseInt(year) })
        
        const allTransactions = []
        existingData.forEach(entry => {
          if (entry.transactions) {
            allTransactions.push(...entry.transactions)
          }
        })
        setDbTransactions(allTransactions)
        
        setShowImportModal(false)
        setSelectedImportIds([])
        fetchHistoryList()
        
        // Refresh all data after successful import
        refreshUserData()
        fetchChartData()
        fetchDbTransactions()
        fetchPortfolioData()
      } else {
        const data = await response.json()
        showTooltipPopup(data.detail || 'Failed to import')
      }
    } catch (error) {
      console.error('Error importing:', error)
    } finally {
      setIsLoadingExpenses(false)
    }
  }

  const toggleImportSelection = (id) => {
    setSelectedImportIds(prev => 
      prev.includes(id) 
        ? prev.filter(eid => eid !== id)
        : [...prev, id]
    )
  }

  const fetchPortfolioData = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/portfolio', {
        method: 'GET',
        credentials: 'include'
      });
      const data = await response.json();

      if (response.ok && data.surplus !== undefined) {
        const luxPct = data.luxury_pct !== null && data.luxury_pct !== undefined ? data.luxury_pct : (data.l_trim > 0 ? 50 : 0);
        const nonmandPct = data.nonmand_pct !== null && data.nonmand_pct !== undefined ? data.nonmand_pct : (data.n_trim > 0 ? 50 : 0);

        setLuxury(luxPct);
        setNonMandatory(nonmandPct);
        setSurplus(data.surplus);
        setPortfolioTrimData(data);
      } else {
        setLuxury(50);
        setNonMandatory(50);
        setSurplus(0);
        setPortfolioTrimData(null);
      }
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
    }
  };

  const handleSaveTrim = async () => {
    setIsSavingTrim(true);
    try {
      const response = await fetch('http://localhost:8080/api/portfolio/trim', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          luxury_pct: luxury,
          nonmand_pct: nonMandatory,
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPortfolioTrimData(data);
        showTooltipPopup('Trim settings saved to database!');
      } else {
        showTooltipPopup('Failed to save trim settings.');
      }
    } catch (error) {
      console.error("Save trim error:", error);
      showTooltipPopup('Failed to save trim settings.');
    } finally {
      setIsSavingTrim(false);
    }
  };

  // Fetch chart data and refresh user data on component mount
  React.useEffect(() => {
    // Sync hasRiskProfile state with current data
    setHasRiskProfile(!!currentUser?.has_risk_profile || !!localStorage.getItem('riskAppetiteData'));
    
    fetchChartData();
    refreshUserData();
    fetchDbTransactions();
    fetchPortfolioData();
  }, []);

  // Listen for data updates (from uploads, etc.)
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshUserData();
        fetchChartData();
        fetchDbTransactions();
        fetchPortfolioData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Calculate dynamic surplus based on current slider values
  const calculateDynamicSurplus = () => {
    // Return 0 if no sliders set (trim starts at 0%)
    if (luxury === 0 && nonMandatory === 0) {
      return 0;
    }
    
    if (!portfolioTrimData) {
      return 0;
    }
    
    // Calculate trim based on slider percentages
    const originalLuxury = portfolioTrimData.l_trim / (portfolioTrimData.luxury_pct / 100 || 1);
    const originalNonmandatory = portfolioTrimData.n_trim / (portfolioTrimData.nonmand_pct / 100 || 1);

    const newLuxuryTrim = originalLuxury * (luxury / 100);
    const newNonmandatoryTrim = originalNonmandatory * (nonMandatory / 100);

    return newLuxuryTrim + newNonmandatoryTrim;
  };

  // Update surplus whenever sliders change
  React.useEffect(() => {
    const newSurplus = calculateDynamicSurplus();
    setSurplus(newSurplus);
  }, [luxury, nonMandatory]);

  // Listen for storage changes to update sliders when risk appetite data is updated
  React.useEffect(() => {
    const handleStorageChange = () => {
      const riskData = localStorage.getItem('riskAppetiteData');
      if (riskData) {
        const parsed = JSON.parse(riskData);
        if (parsed.trim_data) {
          setLuxury(parsed.trim_data.luxury_trim_pct || 50);
          setNonMandatory(parsed.trim_data.nonmand_trim_pct || 50);
          setSurplus(parsed.trim_data.total_trim || 0);
        }
      } else {
        // If risk data is cleared, reset to defaults
        setLuxury(50);
        setNonMandatory(50);
        setSurplus(0);
      }

      // Check if user data has been updated with has_risk_profile
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.has_risk_profile) {
          setCurrentUser(parsedUser);
        }
      }

      // Update localStorage data if it exists
      const saved = localStorage.getItem('finmateData');
      setLocalStorageData(saved ? JSON.parse(saved) : []);
    };

    // Listen for storage events
    window.addEventListener('storage', handleStorageChange);

    // Also check on component mount
    handleStorageChange();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [setCurrentUser]);

  // Handle locked element clicks
  const handleLockedClick = () => {
    if (!hasRiskProfile) {
      navigate("/risk_profile");
    }
  };

  const fetchHistoryList = async () => {
    try {
      setIsLoadingHistory(true);
      const response = await fetch('http://localhost:8080/api/portfolio/history', {
        method: 'GET',
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setHistoryList(data);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleLoadHistoricalData = async (month, year) => {
    try {
      setIsLoadingChart(true);
      const response = await fetch(`http://localhost:8080/api/portfolio/history/${month}/${year}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        // Update the current view results
        setUploadResults(data);
        // Also update dbTransactions so the pie chart updates
        setDbTransactions(data.transactions);
        setCurrentViewDate({ month, year });
        showTooltipPopup(`Loaded data for ${month} ${year}`);
      } else {
        showTooltipPopup("Failed to load historical data");
      }
    } catch (error) {
      console.error("Error loading historical data:", error);
    } finally {
      setIsLoadingChart(false);
    }
  };

  // Fetch insights and history on mount
  React.useEffect(() => {
    fetchHistoryList();
  }, []);

  // Fetch all transactions from localStorage for pie chart on mount
  React.useEffect(() => {
    const savedData = localStorage.getItem('finmateData');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      const allTransactions = [];
      parsed.forEach(entry => {
        if (entry.transactions) {
          allTransactions.push(...entry.transactions);
        }
      });
      if (allTransactions.length > 0) {
        setDbTransactions(allTransactions);
      }
    }
  }, []);

  const handleNavigateToPortfolio = () => {
    navigate("/personalised-portfolio")
  }

  const handlenavigateToKnowledge = () => {
    navigate("/knowledge-center")
  }

    return (
    <div className="min-h-screen bg-fin-background">
      {/* Navbar */}
      <nav className="w-full h-16 flex items-center justify-between px-5 py-3 bg-fin-surface border-b border-fin-outline-variant">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-fin-text-variant uppercase tracking-wider">WELCOME, {currentUser?.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {currentUser && (
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-fin-surface-low rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-fin-text-main" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-10v10a1 1 0 01-1 1h-3m-1 4a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1"></path></svg>
            </button>
          )}
          {currentUser && (
            <button
              onClick={() => navigate('/profile')}
              className="p-2 hover:bg-fin-surface-low rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-fin-text-main" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            </button>
          )}
          {currentUser && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded text-xs font-medium transition-colors uppercase tracking-wider"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
              Logout
            </button>
          )}
        </div>
      </nav>
      <header className="px-4 sm:px-5 py-3">
        <h2 className="text-xl sm:text-2xl font-semibold text-fin-primary">Dashboard</h2>
        <p className="text-xs text-fin-text-variant">Personal Financial Intelligence Hub</p>
      </header>
      <main className="flex flex-col lg:flex-row px-4 sm:px-5 pb-5 gap-4 sm:gap-6">
        {/* Left Column - 70% */}
        <div className="flex-[7] flex flex-col gap-4 sm:gap-5">

          {/* Money Buddy Chat - Extracted Component */}
          <div 
            className={`relative w-full bg-fin-surface rounded-fin-lg p-4 sm:p-5 fin-shadow-sm border border-fin-outline-variant ${!hasRiskProfile ? 'cursor-pointer' : ''}`}
            onClick={!hasRiskProfile ? handleLockedClick : undefined}
          >
            {!hasRiskProfile && (
              <div className="absolute inset-0 bg-fin-surface/80 backdrop-blur-[1px] rounded-fin-lg flex items-center justify-center z-10">
                <div className="text-center p-3 bg-fin-surface/95 rounded-fin-lg fin-shadow-sm border border-fin-primary/20">
                  <svg className="w-6 h-6 text-fin-primary mx-auto mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                  <p className="text-fin-text-main font-bold text-xs">Complete Risk Profile</p>
                </div>
              </div>
            )}
            <MoneyBuddy compact />
          </div>

          {/* Data Source Card */}
          <div className="w-full bg-fin-surface rounded-fin-lg p-4 sm:p-5 fin-shadow-sm border border-fin-outline-variant">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-fin-text-variant uppercase tracking-wider flex items-center gap-2">
                <svg className="w-4 h-4 text-fin-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                Data Source
              </h3>
              <button
                onClick={openImportModal}
                className="text-xs font-bold text-fin-primary hover:underline"
              >
                Import
              </button>
            </div>

            {!file ? (
              <div className="flex flex-col gap-4">
                <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-fin-outline-variant rounded-fin-lg p-5 bg-gray-50/30 hover:bg-gray-50 transition-colors">
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer bg-fin-primary hover:bg-fin-primary-container text-white font-bold px-5 py-2.5 rounded-fin-md fin-shadow-sm transition-all active:scale-95 text-sm"
                  >
                    Upload File
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".csv, .xlsx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <p className="text-[10px] text-fin-text-variant text-center mt-2">
                    CSV/Excel: Date, Description, Withdrawal, Deposit, Balance
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2 items-center justify-between">
                  <p className="text-sm font-medium text-fin-text-main">{file.name}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAnalyze}
                      disabled={isUploading}
                      className={`px-3 py-1.5 rounded-fin-md text-sm cursor-pointer ${isUploading
                        ? 'bg-gray-300 text-fin-text-variant cursor-pointer'
                        : 'bg-fin-primary text-white'
                        }`}
                    >
                      {isUploading ? 'Processing...' : 'Analyze'}
                    </button>
                    <button
                      onClick={handleDeleteFile}
                      className="text-fin-text-variant text-lg transition cursor-pointer p-1"
                      title="Remove file"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Results - Always visible if exist */}
            {uploadResults && (
              <div className="mt-4 pt-4 border-t border-fin-outline-variant">
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="p-2 bg-fin-surface-low rounded-fin-md border border-fin-outline-variant/50">
                    <p className="text-[9px] text-fin-text-variant font-bold uppercase tracking-wider">Spending</p>
                    <p className="text-sm font-bold text-fin-text-main">₹{uploadResults.statistics.total_spending.toLocaleString()}</p>
                  </div>
                  <div className="p-2 bg-fin-surface-low rounded-fin-md border border-fin-outline-variant/50">
                    <p className="text-[9px] text-fin-text-variant font-bold uppercase tracking-wider">Savings</p>
                    <p className="text-sm font-bold text-green-600">₹{uploadResults.statistics.total_savings.toLocaleString()}</p>
                  </div>
                </div>

                {/* Sample Transactions */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-fin-text-variant uppercase tracking-widest">
                    {currentViewDate ? `${currentViewDate.month} ${currentViewDate.year}` : 'Sample Transactions'}
                  </h4>
                  <div className="space-y-1.5">
                    {uploadResults.transactions.slice(0, 3).map((transaction, index) => (
                      <div key={index} className="p-2 bg-fin-surface-low rounded-fin-md border border-fin-outline-variant/30 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-fin-text-main truncate">{transaction.description}</p>
                          <p className="text-[9px] text-fin-text-variant">{transaction.category}</p>
                        </div>
                        <div className="text-right ml-2">
                          <p className={`text-xs font-bold ${transaction.type === 'Withdraw' ? 'text-fin-text-main' : 'text-green-600'}`}>
                            {transaction.type === 'Withdraw' ? '-' : '+'}₹{transaction.amount}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* History List */}
            {historyList.length > 0 && (
              <div className={`mt-4 pt-4 border-t border-fin-outline-variant ${uploadResults ? '' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[10px] font-bold text-fin-text-variant uppercase tracking-widest">History</h4>
                  {currentViewDate && (
                    <button
                      onClick={() => {
                        setCurrentViewDate(null);
                        setUploadResults(null);
                        fetchDbTransactions();
                      }}
                      className="text-[9px] text-fin-primary font-bold hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 pr-2">
                  {historyList.slice(-5).map((data, index) => (
                    <button
                      key={index}
                      onClick={() => handleLoadHistoricalData(data.month, data.year)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-fin-md border text-xs font-medium transition-all ${currentViewDate?.month === data.month && currentViewDate?.year === data.year
                        ? 'bg-fin-primary/10 border-fin-primary text-fin-primary'
                        : 'bg-fin-surface-low border-fin-outline-variant/50 text-fin-text-main hover:border-fin-primary/30'
                        }`}
                    >
                      {data.month} {data.year}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Financial Flow Chart */}
          <div className="w-full bg-fin-surface rounded-fin-lg p-4 sm:p-5 fin-shadow-sm border border-fin-outline-variant flex-1 min-h-[280px]">
            <h3 className="text-sm font-bold text-fin-text-variant uppercase tracking-wider flex items-center gap-2 mb-4">
              <svg className="w-4 h-4 text-fin-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
              Financial Flow
            </h3>

            <div className="flex-1 w-full h-[200px]">
              {isLoadingChart ? (
                <div className="flex items-center justify-center w-full h-full">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-fin-primary rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-fin-primary rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-fin-primary rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 10 }} 
                      stroke="#6b7280" 
                      dy={10}
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }} 
                      stroke="#6b7280" 
                      tickFormatter={(value) => `₹${value >= 1000 ? value / 1000 + 'k' : value}`}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '6px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: '11px' }}
                      formatter={(value) => `₹${value?.toLocaleString()}`}
                    />
                    <Area type="monotone" dataKey="savings" stroke="#059669" fill="#059669" fillOpacity={0.15} name="Savings" />
                    <Area type="monotone" dataKey="spendings" stroke="#1e40af" fill="#1e40af" fillOpacity={0.15} name="Spending" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center w-full h-full border border-dashed border-fin-outline-variant">
                  <p className="text-fin-text-variant text-xs">Upload data to see financial flow</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - 30% */}
        <div className="flex-[3] flex flex-col gap-4 sm:gap-6">
          {/* Category Breakdown - Pie Chart */}
          <div className="w-full bg-fin-surface rounded-fin-lg p-4 sm:p-5 fin-shadow-sm border border-fin-outline-variant">
            <h3 className="text-sm font-bold text-fin-text-variant uppercase tracking-wider flex items-center gap-2 mb-4">
              <svg className="w-4 h-4 text-fin-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path></svg>
              Categories
            </h3>

            {dbTransactions && dbTransactions.length > 0 ? (
              <div className="w-full">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart width={200} height={200}>
                    <Pie
                      data={getCategoryData(dbTransactions)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={65}
                      innerRadius={20}
                      fill="#1e40af"
                      dataKey="value"
                    >
                      {getCategoryData(dbTransactions).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₹${value?.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Legend */}
                <div className="mt-2 grid grid-cols-2 gap-1">
                  {getCategoryData(dbTransactions).slice(0, 6).map((cat, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[10px]">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}></div>
                      <span className="text-fin-text-main truncate font-medium">{cat.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[160px] text-fin-text-variant">
                <p className="text-center text-xs">Upload data to see categories</p>
              </div>
            )}
          </div>

          {/* Optimization Controls */}
          <div
            className={`relative w-full bg-fin-surface rounded-fin-lg p-4 sm:p-5 fin-shadow-sm border border-fin-outline-variant ${!hasRiskProfile ? 'cursor-pointer' : ''}`}
            onClick={!hasRiskProfile ? handleLockedClick : undefined}
          >
            {!hasRiskProfile && (
              <div className="absolute inset-0 bg-fin-surface/80 backdrop-blur-[1px] rounded-fin-lg flex items-center justify-center z-10">
                <div className="text-center p-3 bg-fin-surface/95 rounded-fin-lg fin-shadow-sm border border-fin-primary/20">
                  <svg className="w-6 h-6 text-fin-primary mx-auto mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                  <p className="text-fin-text-main font-bold text-xs">Complete Risk Profile</p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-fin-text-variant uppercase tracking-wider flex items-center gap-2">
                <svg className="w-4 h-4 text-fin-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                Optimize
              </h3>
              {hasRiskProfile && portfolioTrimData && (
                <button
                  onClick={() => {
                    setLuxury(portfolioTrimData.luxury_pct || 50);
                    setNonMandatory(portfolioTrimData.nonmand_pct || 50);
                  }}
                  className="text-[10px] text-fin-text-variant hover:text-fin-primary underline"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="space-y-3">
              {/* Luxury Slider */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] font-semibold text-fin-text-variant uppercase tracking-wider">Luxury/Discretionary</label>
                  <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-200">
                    {Math.round(luxury)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={luxury}
                  onChange={(e) => setLuxury(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-100 rounded-fin-md appearance-none cursor-pointer accent-green-600 focus:outline-none"
                  disabled={!hasRiskProfile}
                />
              </div>

              {/* Non-Mandatory Slider */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] font-semibold text-fin-text-variant uppercase tracking-wider">Non-Mandatory</label>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-200">
                    {Math.round(nonMandatory)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={nonMandatory}
                  onChange={(e) => setNonMandatory(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-100 rounded-fin-md appearance-none cursor-pointer accent-blue-600 focus:outline-none"
                  disabled={!hasRiskProfile}
                />
              </div>
            </div>

            {/* Projected Surplus */}
            <div className="mt-4 pt-3 border-t border-fin-outline-variant">
              <div className="text-center">
                <p className="text-[9px] font-bold text-fin-text-variant uppercase tracking-widest mb-1">Monthly Surplus</p>
                <div className="text-2xl font-black text-green-600">
                  ₹{Math.round(surplus).toLocaleString()}
                </div>
              </div>
            </div>

            {hasRiskProfile && (
              <button
                onClick={handleSaveTrim}
                disabled={isSavingTrim}
                className={`w-full mt-3 py-2 rounded-fin-md text-xs font-bold uppercase tracking-wider transition-all ${isSavingTrim
                  ? 'bg-gray-200 text-fin-text-variant cursor-not-allowed'
                  : 'bg-fin-primary text-white hover:bg-fin-primary-container'
                  }`}
              >
                {isSavingTrim ? 'SAVING...' : 'LOCK SETTINGS'}
              </button>
            )}
          </div>

          {/* Goal Canvas - Dark Background */}
          <div className="w-full bg-[#1e293b] rounded-fin-lg p-4 sm:p-5 fin-shadow-sm border border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Goal Canvas</h3>
            </div>

            <div className="space-y-3">
              {/* Net Worth Goal Slider */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Net Worth Goal</label>
                  <span className="px-2 py-0.5 bg-slate-700 text-slate-200 rounded-full text-xs font-bold">
                    ₹{netWorthGoal >= 10000000 ? (netWorthGoal / 10000000).toFixed(1) + ' Cr' : (netWorthGoal / 100000).toFixed(0) + ' L'}
                  </span>
                </div>
                <input
                  type="range"
                  min="100000"
                  max="10000000"
                  step="100000"
                  value={netWorthGoal}
                  onChange={(e) => setNetWorthGoal(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-600 rounded-fin-md appearance-none cursor-pointer accent-slate-300 focus:outline-none"
                />
              </div>

              {/* Timeline Estimate */}
              <div className="p-3 bg-slate-800/50 rounded-fin-md border border-slate-700">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Estimated Timeline</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-white">
                    {surplus > 0 ? (
                      Math.floor((netWorthGoal - currentNetWorth) / surplus / 12) > 0 ?
                        `${Math.floor((netWorthGoal - currentNetWorth) / surplus / 12)}y ${Math.floor(((netWorthGoal - currentNetWorth) / surplus) % 12)}m` :
                        `${Math.ceil((netWorthGoal - currentNetWorth) / surplus)}m`
                    ) : '∞'}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">reach</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Surplus: <span className="text-slate-300 font-bold">₹{Math.round(surplus).toLocaleString()}</span>/mo
                </p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="w-full bg-fin-surface rounded-fin-lg p-4 sm:p-5 fin-shadow-sm border border-fin-outline-variant">
            <h3 className="text-sm font-bold text-fin-text-variant uppercase tracking-wider flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-fin-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
              Quick Links
            </h3>

            <div className="space-y-2">
              {/* Portfolio Link */}
              <button
                onClick={() => hasRiskProfile ? navigate('/personalised-portfolio') : navigate('/risk_profile')}
                className="w-full flex items-center gap-3 p-3 rounded-fin-md border border-fin-outline-variant/50 hover:border-fin-primary/30 hover:bg-fin-surface-low transition-all group text-left"
              >
                <div className="p-2 bg-fin-primary/10 text-fin-primary rounded-fin-md">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-fin-text-main">Smart Portfolio</p>
                  <p className="text-[9px] text-fin-text-variant">AI Asset Allocation</p>
                </div>
                {!hasRiskProfile && (
                  <svg className="w-4 h-4 text-fin-text-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                )}
                {hasRiskProfile && (
                  <svg className="w-4 h-4 text-fin-text-variant group-hover:text-fin-primary transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                )}
              </button>

              {/* Knowledge Center Link */}
              <button
                onClick={() => navigate('/knowledge-center')}
                className="w-full flex items-center gap-3 p-3 rounded-fin-md border border-fin-outline-variant/50 hover:border-green-500/30 hover:bg-green-50/30 transition-all group text-left"
              >
                <div className="p-2 bg-green-50 text-green-600 rounded-fin-md">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-fin-text-main">Knowledge Hub</p>
                  <p className="text-[9px] text-fin-text-variant">Financial Education</p>
                </div>
                <svg className="w-4 h-4 text-fin-text-variant group-hover:text-green-600 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
</button>
            </div>
          </div>
        </div>
      </main>

      {/* Tooltip Popup */}
      {showTooltip && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2 duration-300">
          <div className="bg-gray-800 text-white px-4 py-3 rounded-fin-md fin-shadow-md max-w-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <p className="text-sm">{tooltipMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Import from Expense Tracker Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowImportModal(false)}></div>
          <div className="relative bg-fin-surface rounded-fin-lg sm:rounded-fin-lg shadow-2xl w-full max-w-lg sm:max-w-2xl max-h-[85vh] sm:max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-3 sm:p-6 border-b border-fin-outline-variant">
              <h3 className="text-base sm:text-xl font-bold text-fin-text-main flex items-center gap-2">
                <span className="p-1.5 sm:p-2 bg-[#1e40af]/10 rounded-fin-md text-[#1e40af]">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                </span>
                <span className="hidden sm:inline">Import Transactions</span>
                <span className="sm:hidden">Import</span>
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-fin-text-variant hover:text-fin-text-variant text-xl sm:text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              {isLoadingExpenses ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-[#1e40af] rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-[#1e40af] rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 bg-[#1e40af] rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              ) : expenseTrackerExpenses.length === 0 ? (
                <div className="text-center py-8 text-fin-text-variant">
                  <p className="text-sm">No expenses found in Expense Tracker.</p>
                  <p className="text-xs mt-2">Add expenses in the Expense Tracker first.</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {expenseTrackerExpenses.map((monthGroup, monthIndex) => (
                    <div key={monthIndex} className="border border-fin-outline-variant rounded-fin-lg overflow-hidden">
                      <div className="bg-gray-50 px-3 sm:px-4 py-2 flex items-center justify-between">
                        <h4 className="text-sm font-bold text-fin-text-main">{monthGroup.month}</h4>
                        <span className="text-xs text-fin-text-variant">{monthGroup.transactions.length} txns</span>
                      </div>
                      <div className="divide-y divide-gray-50 max-h-40 sm:max-h-48 overflow-y-auto">
                        {monthGroup.transactions.map((expense, idx) => (
                          <div 
                            key={idx}
                            className={`p-2 sm:p-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer ${
                              selectedImportIds.includes(expense.id) ? 'bg-[#1e40af]/5' : ''
                            }`}
                            onClick={() => toggleImportSelection(expense.id)}
                          >
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className={`w-4 sm:w-5 h-4 sm:h-5 rounded border flex items-center justify-center ${
                                selectedImportIds.includes(expense.id) 
                                  ? 'bg-[#1e40af] border-[#1e40af] text-white' 
                                  : 'border-gray-300'
                              }`}>
                                {selectedImportIds.includes(expense.id) && (
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                )}
                              </div>
                              <div>
                                <p className="text-xs sm:text-sm font-semibold text-fin-text-main">{expense.description}</p>
                                <p className="text-xs text-fin-text-variant">{expense.date}</p>
                              </div>
                            </div>
                            <span className={`text-xs sm:text-sm font-bold ${
                              expense.type === 'credit' ? 'text-[#059669]' : 'text-fin-text-main'
                            }`}>
                              {expense.type === 'credit' ? '+' : '-'}₹{expense.amount.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-fin-outline-variant flex items-center justify-between">
              <p className="text-sm text-fin-text-variant">
                {selectedImportIds.length} selected
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 rounded-fin-md text-fin-text-variant hover:text-fin-text-main transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportFromExpenseTracker}
                  disabled={selectedImportIds.length === 0 || isLoadingExpenses}
                  className={`px-6 py-2 rounded-fin-md font-bold text-white transition-colors ${
                    selectedImportIds.length === 0 || isLoadingExpenses
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-[#1e40af] hover:bg-[#726abb]'
                  }`}
                >
                  Import Selected
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
