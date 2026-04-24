import React, { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/authContext'
import { showSuccess, showError, showLoading } from '../context/ToastContext'
import { FaChartLine, FaPiggyBank, FaInfoCircle, FaCheck, FaChevronRight } from 'react-icons/fa'
import { jsPDF } from 'jspdf'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

const API_BASE = 'http://localhost:8080/api'

const Portfolio = () => {
  const navigate = useNavigate()
  const { currentUser, logout } = useContext(AuthContext)
  
  const [activeTab, setActiveTab] = useState('samples')
  const [selectedPortfolio, setSelectedPortfolio] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const [samplePortfolios, setSamplePortfolios] = useState([])
  const [personalPortfolio, setPersonalPortfolio] = useState(null)
  const [userSurplus, setUserSurplus] = useState(5000)
  const [userRiskProfile, setUserRiskProfile] = useState(null)
  const [showGrowthChart, setShowGrowthChart] = useState(false)
  const [assetPrices, setAssetPrices] = useState({})

  useEffect(() => {
    if (!currentUser) {
      navigate('/login')
      return
    }
    fetchPortfolios()
    fetchUserProfile()
    fetchLivePrices()
    
    // Listen for data updates from other pages (Dashboard, etc.)
    const handleDataUpdate = () => {
      fetchPortfolios()
      fetchUserProfile()
    }
    window.addEventListener('dataUpdated', handleDataUpdate)
    return () => window.removeEventListener('dataUpdated', handleDataUpdate)
  }, [currentUser])

  const fetchPortfolios = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`${API_BASE}/portfolio/samples`, {
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        setSamplePortfolios(data.samples || [])
        setUserSurplus(data.user_surplus || 5000)
        
        const recommended = data.samples?.find(p => p.is_recommended)
        if (recommended) {
          selectPortfolio(recommended, 'sample')
        }
      }
    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUserProfile = async () => {
    try {
      const res = await fetch(`${API_BASE}/risk-profile`, {
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        setUserRiskProfile(data)
      }
    } catch (err) {
      console.error('Profile fetch error:', err)
    }
  }

  const fetchLivePrices = async () => {
    try {
      const res = await fetch(`${API_BASE}/portfolio/prices?symbols=RELIANCE,HDFCBANK,TCS,INFY,SBIN`, {
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        setAssetPrices(data.prices || {})
      }
    } catch (err) {
      console.error('Price fetch error:', err)
    }
  }

  const selectPortfolio = async (portfolio, type) => {
    if (type === 'sample') {
      try {
        const res = await fetch(`${API_BASE}/portfolio/sample/${portfolio.slug}`, {
          credentials: 'include'
        })
        if (res.ok) {
          const data = await res.json()
          setSelectedPortfolio({ ...data, type: 'sample' })
        }
      } catch (err) {
        setSelectedPortfolio({ ...portfolio, type: 'sample' })
      }
    } else {
      setSelectedPortfolio({ ...portfolio, type })
    }
    setShowGrowthChart(true)
  }

  const generatePersonalPortfolio = async () => {
    setIsGenerating(true)
    showLoading('Generating your portfolio...')
    
    try {
      const res = await fetch(`${API_BASE}/portfolio/personalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          monthly_investment: userSurplus,
          risk_category: selectedPortfolio?.risk_category || 'Moderate'
        })
      })
      
      if (res.ok) {
        const data = await res.json()
        setPersonalPortfolio(data)
        setSelectedPortfolio({ ...data, type: 'personal' })
        setActiveTab('personal')
        showSuccess('Portfolio generated!')
      } else {
        showError('Failed to generate portfolio')
      }
    } catch (err) {
      showError('Error generating portfolio')
    } finally {
      setIsGenerating(false)
    }
  }

  const applyPortfolio = async () => {
    if (!selectedPortfolio) return
    setIsSaving(true)
    
    try {
      const res = await fetch(`${API_BASE}/portfolio/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: selectedPortfolio.type,
          slug: selectedPortfolio.slug || 'custom',
          assets: selectedPortfolio.assets,
          allocation: selectedPortfolio.allocation,
          monthly_investment: selectedPortfolio.monthly_investment || userSurplus,
          expected_return: selectedPortfolio.expected_return
        })
      })
      
      if (res.ok) {
        showSuccess('Portfolio saved successfully!')
      } else {
        showError('Failed to save portfolio')
      }
    } catch (err) {
      showError('Error saving portfolio')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleExportPDF = async () => {
    if (!selectedPortfolio) {
      showError('Select a portfolio first')
      return
    }

    showLoading('Generating PDF...')
    
    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const margin = 15
      let yPos = 20

      // Colors
      const primaryColor = [99, 102, 241] // fin-primary
      const textColor = [30, 41, 59]
      const grayColor = [100, 116, 139]

      // Header
      doc.setFillColor(...primaryColor)
      doc.rect(0, 0, pageWidth, 35, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text('Portfolio Summary', margin, 18)
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Generated on ${new Date().toLocaleDateString('en-IN')}`, margin, 28)
      
      yPos = 45

      // Reset text color
      doc.setTextColor(...textColor)

      // Portfolio Name
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text(selectedPortfolio.name, margin, yPos)
      yPos += 8

      // Tagline
      doc.setFontSize(10)
      doc.setFont('helvetica', 'italic')
      if (selectedPortfolio.tagline) {
        doc.setTextColor(...grayColor)
        doc.text(`"${selectedPortfolio.tagline}"`, margin, yPos)
        doc.setTextColor(...textColor)
        yPos += 8
      }

      // Quick Stats Box
      doc.setFillColor(249, 250, 251)
      doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 25, 3, 3, 'F')
      
      yPos += 8
      const statsX = margin + 5
      
      // Monthly Investment
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...grayColor)
      doc.text('MONTHLY INVESTMENT', statsX, yPos)
      doc.setTextColor(...textColor)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      const monthlyAmt = selectedPortfolio.monthly_investment || userSurplus
      doc.text(`₹${monthlyAmt.toLocaleString('en-IN')}`, statsX, yPos + 6)

      // Expected Return
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...grayColor)
      doc.text('EXPECTED RETURN', statsX + 50, yPos)
      doc.setTextColor(34, 197, 94) // green
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text(`~${selectedPortfolio.expected_return}%`, statsX + 50, yPos + 6)

      // Risk Level
      doc.setTextColor(...grayColor)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text('RISK LEVEL', statsX + 100, yPos)
      doc.setTextColor(...primaryColor)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text(selectedPortfolio.risk_level || 'Moderate', statsX + 100, yPos + 6)

      yPos += 35

      // Allocation Section
      doc.setTextColor(...textColor)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('Asset Allocation', margin, yPos)
      yPos += 8

      // Allocation bars
      const barWidth = pageWidth - 2 * margin
      const barHeight = 12
      
      // Low Risk
      const lowPct = selectedPortfolio.allocation?.low || 50
      doc.setFillColor(99, 102, 241, 150)
      doc.rect(margin, yPos, (lowPct / 100) * barWidth, barHeight, 'F')
      doc.setFontSize(8)
      doc.setTextColor(255, 255, 255)
      if (lowPct > 10) doc.text(`${lowPct}%`, margin + 3, yPos + 8)
      
      // Mid Risk
      const midPct = selectedPortfolio.allocation?.mid || 30
      doc.setFillColor(99, 102, 241, 200)
      doc.rect(margin + (lowPct / 100) * barWidth, yPos, (midPct / 100) * barWidth, barHeight, 'F')
      if (midPct > 10) doc.text(`${midPct}%`, margin + (lowPct / 100) * barWidth + 3, yPos + 8)
      
      // High Risk
      const highPct = selectedPortfolio.allocation?.high || 20
      doc.setFillColor(99, 102, 241)
      doc.rect(margin + ((lowPct + midPct) / 100) * barWidth, yPos, (highPct / 100) * barWidth, barHeight, 'F')
      if (highPct > 10) doc.text(`${highPct}%`, margin + ((lowPct + midPct) / 100) * barWidth + 3, yPos + 8)

      yPos += 18

      // Allocation Legend
      doc.setTextColor(...textColor)
      doc.setFontSize(9)
      const legendY = yPos
      
      doc.setFillColor(99, 102, 241, 150)
      doc.circle(margin + 3, legendY - 1, 2, 'F')
      doc.text(`Low Risk: ${lowPct}%`, margin + 8, legendY)
      
      doc.setFillColor(99, 102, 241, 200)
      doc.circle(margin + 50, legendY - 1, 2, 'F')
      doc.text(`Mid Risk: ${midPct}%`, margin + 55, legendY)
      
      doc.setFillColor(99, 102, 241)
      doc.circle(margin + 100, legendY - 1, 2, 'F')
      doc.text(`High Risk: ${highPct}%`, margin + 105, legendY)

      yPos += 15

      // Investments Section
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('Your Investments', margin, yPos)
      yPos += 8

      // Assets table header
      doc.setFillColor(249, 250, 251)
      doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F')
      
      doc.setFontSize(9)
      doc.setTextColor(...grayColor)
      doc.text('Investment', margin + 3, yPos + 5.5)
      doc.text('Allocation', margin + 90, yPos + 5.5)
      doc.text('Return', margin + 120, yPos + 5.5)
      
      yPos += 8

      // Assets rows
      doc.setTextColor(...textColor)
      selectedPortfolio.assets?.forEach((asset, idx) => {
        if (yPos > 270) {
          doc.addPage()
          yPos = 20
        }
        
        // Alternate row background
        if (idx % 2 === 0) {
          doc.setFillColor(249, 250, 251)
          doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F')
        }
        
        doc.setFontSize(9)
        doc.text(asset.name?.substring(0, 35) || '', margin + 3, yPos + 5.5)
        doc.text(`${asset.allocation}%`, margin + 90, yPos + 5.5)
        doc.text(`~${asset.return_rate}%`, margin + 120, yPos + 5.5)
        
        yPos += 8
      })

      // Growth Projections
      yPos += 10
      if (yPos > 240) {
        doc.addPage()
        yPos = 20
      }

      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('Growth Projections', margin, yPos)
      yPos += 10

      // Projections table
      const projections = selectedPortfolio.growth_data?.yearly_projections || []
      projections.forEach((proj, idx) => {
        if (yPos > 270) {
          doc.addPage()
          yPos = 20
        }

        doc.setFillColor(idx % 2 === 0 ? 249 : 255, idx % 2 === 0 ? 250 : 255, idx % 2 === 0 ? 251 : 255)
        doc.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F')
        
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text(proj.label || `${proj.years} years`, margin + 5, yPos + 6.5)
        
        doc.setFont('helvetica', 'normal')
        doc.text(`Invested: ₹${(proj.invested || proj.total_invested || 0).toLocaleString('en-IN')}`, margin + 45, yPos + 6.5)
        
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(34, 197, 94)
        doc.text(`Value: ₹${(proj.value || proj.future_value || 0).toLocaleString('en-IN')}`, margin + 95, yPos + 6.5)
        
        doc.setTextColor(...grayColor)
        doc.setFont('helvetica', 'normal')
        doc.text(`+₹${(proj.gains || 0).toLocaleString('en-IN')}`, margin + 150, yPos + 6.5)
        
        doc.setTextColor(...textColor)
        yPos += 10
      })

      // Footer
      const pageCount = doc.internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(...grayColor)
        doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, 290, { align: 'center' })
        doc.text('Generated by FinMate - Portfolio Builder', pageWidth / 2, 295, { align: 'center' })
      }

      // Save the PDF
      const fileName = `FinMate_Portfolio_${selectedPortfolio.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(fileName)
      
      showSuccess('Portfolio PDF downloaded!')
    } catch (err) {
      console.error('PDF export error:', err)
      showError('Failed to export PDF')
    }
  }

  const getRiskLabel = () => {
    if (!userRiskProfile?.risk_category) return 'Not set'
    const labels = { 1: 'Conservative', 2: 'Moderate', 3: 'Aggressive' }
    return labels[userRiskProfile.risk_category] || 'Moderate'
  }

  const getRiskColor = () => {
    if (!userRiskProfile?.risk_category) return 'bg-fin-outline-variant text-fin-text-variant'
    const colors = { 1: 'bg-fin-primary/10 text-fin-primary', 2: 'bg-fin-primary/10 text-fin-primary', 3: 'bg-fin-primary/10 text-fin-primary' }
    return colors[userRiskProfile.risk_category] || 'bg-fin-primary/10 text-fin-primary'
  }

  const getChartData = () => {
    if (!selectedPortfolio?.growth_data?.yearly_projections) return []
    return selectedPortfolio.growth_data.yearly_projections.map(p => ({
      name: p.label || `${p.years}y`,
      invested: p.invested || p.total_invested,
      value: p.value || p.future_value,
      gains: p.gains
    }))
  }

  const chartData = getChartData()

  const fmtINR = (val) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`
    return `₹${val}`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-fin-background flex items-center justify-center cursor-wait">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fin-primary mx-auto mb-4"></div>
          <p className="text-fin-text-variant text-sm">Loading portfolios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-fin-background">
      {/* Navbar - Matching Dashboard exactly */}
      <nav className="w-full h-16 flex items-center justify-between px-5 py-3 bg-fin-surface border-b border-fin-outline-variant">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-fin-text-variant uppercase tracking-wider">
            WELCOME, {currentUser?.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-fin-surface-low rounded-full transition-colors cursor-pointer"
            title="Home"
          >
            <svg className="w-5 h-5 text-fin-text-main" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-10v10a1 1 0 01-1 1h-3m-1 4a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1"></path>
            </svg>
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="p-2 hover:bg-fin-surface-low rounded-full transition-colors cursor-pointer"
            title="Profile"
          >
            <svg className="w-5 h-5 text-fin-text-main" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
          </button>
          <button
            onClick={handleExportPDF}
            className="p-2 hover:bg-fin-surface-low rounded-full transition-colors cursor-pointer"
            title="Export PDF"
          >
            <svg className="w-5 h-5 text-fin-text-main" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
            </svg>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded text-xs font-medium transition-colors uppercase tracking-wider cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex flex-col lg:flex-row min-h-[calc(100vh-75px)]">
        
        {/* Left Panel - Portfolio List */}
        <div className="w-full lg:w-5/12 p-5 space-y-4 lg:border-r lg:border-fin-outline-variant">
          
          {/* Header */}
          <header className="mb-4">
            <h2 className="text-2xl font-bold text-fin-primary tracking-tight">Portfolio Builder</h2>
            <p className="text-xs text-fin-text-variant font-medium uppercase tracking-wider">Personal Investment Hub</p>
          </header>

          {/* User Risk Profile Card */}
          <div className="bg-fin-surface rounded-fin-xl p-5 fin-shadow-sm border border-fin-outline-variant cursor-default">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-fin-primary/10 rounded-full">
                <svg className="w-5 h-5 text-fin-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.06z"></path>
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs text-fin-text-variant uppercase tracking-wider">Your Risk Profile</p>
                <p className="font-bold text-fin-text-main">{getRiskLabel()}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRiskColor()}`}>
                {userRiskProfile?.risk_score || 50} score
              </span>
            </div>
            <div className="mt-3 flex gap-4 text-xs text-fin-text-variant">
              <div>
                <span className="font-medium text-fin-text-main">₹{(userRiskProfile?.monthly_income || 0).toLocaleString()}</span>
                <span className="ml-1">/month</span>
              </div>
              <div>
                <span className="font-medium text-fin-text-main">{userRiskProfile?.age || 25}</span>
                <span className="ml-1">years old</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('samples')}
              className={`flex-1 py-2.5 px-4 rounded-fin-sm text-xs font-semibold transition-colors uppercase tracking-wider cursor-pointer ${
                activeTab === 'samples'
                  ? 'bg-fin-primary text-white'
                  : 'bg-fin-surface text-fin-text-variant hover:bg-fin-surface-low cursor-pointer'
              }`}
            >
              Sample Portfolios
            </button>
            <button
              onClick={() => setActiveTab('personal')}
              className={`flex-1 py-2.5 px-4 rounded-fin-sm text-xs font-semibold transition-colors uppercase tracking-wider cursor-pointer ${
                activeTab === 'personal'
                  ? 'bg-fin-primary text-white'
                  : 'bg-fin-surface text-fin-text-variant hover:bg-fin-surface-low cursor-pointer'
              }`}
            >
              AI Suggested
            </button>
          </div>

          {/* Portfolio List */}
          {activeTab === 'samples' ? (
            <div className="space-y-3">
              {samplePortfolios.map((portfolio) => (
                <button
                  key={portfolio.slug}
                  onClick={() => selectPortfolio(portfolio, 'sample')}
                  className={`w-full text-left p-4 rounded-fin-xl border transition-all fin-shadow-sm cursor-pointer ${
                    selectedPortfolio?.slug === portfolio.slug && activeTab === 'samples'
                      ? 'border-fin-primary bg-fin-primary/5'
                      : 'border-fin-outline-variant bg-fin-surface hover:border-fin-primary/50 cursor-pointer'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 cursor-pointer">
                        <h3 className="font-bold text-fin-text-main text-sm">{portfolio.name}</h3>
                        {portfolio.is_recommended && (
                          <span className="text-[10px] bg-fin-primary/10 text-fin-primary px-2 py-0.5 rounded-full font-medium cursor-pointer">
                            For You
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-fin-primary italic mb-2">{portfolio.tagline}</p>
                      <p className="text-xs text-fin-text-variant">{portfolio.description}</p>
                      
                      <div className="flex flex-wrap gap-3 mt-3 text-[11px] text-fin-text-variant">
                        <span className="flex items-center gap-1 cursor-pointer">
                          <FaPiggyBank className="text-fin-primary cursor-pointer" />
                          {portfolio.risk_level} Risk
                        </span>
                        <span className="cursor-pointer">{portfolio.time_horizon}</span>
                        <span className="text-fin-primary font-medium cursor-pointer">~{portfolio.expected_return}% returns</span>
                      </div>
                    </div>
                    <FaChevronRight className="text-fin-text-variant mt-1 cursor-pointer" />
                  </div>
                  
                  {/* Allocation Bar - Using fin-primary theme colors */}
                  <div className="mt-3 flex h-1.5 rounded-full overflow-hidden bg-fin-outline-variant">
                    <div className="bg-fin-primary/60" style={{ width: `${portfolio.allocation?.low || 50}%` }} />
                    <div className="bg-fin-primary/80" style={{ width: `${portfolio.allocation?.mid || 30}%` }} />
                    <div className="bg-fin-primary" style={{ width: `${portfolio.allocation?.high || 20}%` }} />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-fin-primary to-fin-primary-container rounded-fin-xl p-5 text-white">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <FaChartLine />
                  AI Suggested Portfolio
                </h2>
                <p className="text-sm opacity-90 mt-2">
                  Get a personalized portfolio based on your {getRiskLabel().toLowerCase()} risk profile
                </p>
                <button
                  onClick={generatePersonalPortfolio}
                  disabled={isGenerating}
                  className="mt-4 w-full bg-white text-fin-primary font-semibold py-3 px-6 rounded-fin-sm hover:opacity-90 transition-all disabled:opacity-50 text-sm cursor-pointer"
                >
                  {isGenerating ? (
                    <span className="flex items-center justify-center gap-2 cursor-wait">
                      <span className="animate-spin cursor-wait">⟳</span>
                      Generating...
                    </span>
                  ) : (
                    'Generate My Portfolio'
                  )}
                </button>
              </div>
              
              {personalPortfolio && (
                <button
                  onClick={() => selectPortfolio(personalPortfolio, 'personal')}
                  className={`w-full text-left p-4 rounded-fin-xl border transition-all fin-shadow-sm cursor-pointer ${
                    selectedPortfolio?.type === 'personal'
                      ? 'border-fin-primary bg-fin-primary/5'
                      : 'border-fin-outline-variant bg-fin-surface cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-fin-text-main text-sm">{personalPortfolio.name}</h3>
                      <p className="text-xs text-fin-primary mt-1">{personalPortfolio.tagline}</p>
                      <p className="text-xs text-fin-text-variant mt-2 line-clamp-2">{personalPortfolio.reasoning}</p>
                    </div>
                    <FaChevronRight className="text-fin-text-variant cursor-pointer" />
                  </div>
                  <div className="mt-3 flex gap-3 text-xs">
                    <span className="text-fin-primary font-medium cursor-pointer">~{personalPortfolio.expected_return}% expected</span>
                    <span className="text-fin-text-variant cursor-pointer">₹{personalPortfolio.monthly_investment?.toLocaleString()}/mo</span>
                  </div>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Panel - Portfolio Details */}
        <div className="w-full lg:w-7/12 p-5 lg:p-6">
          {selectedPortfolio ? (
            <div className="space-y-5">
              
              {/* Portfolio Header Card */}
              <div className="bg-fin-surface rounded-fin-xl p-5 fin-shadow-sm border border-fin-outline-variant cursor-default">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-fin-text-main">{selectedPortfolio.name}</h2>
                    <p className="text-sm text-fin-primary italic">"{selectedPortfolio.tagline}"</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-fin-primary/10 text-fin-primary cursor-default`}>
                    {selectedPortfolio.risk_level || 'Moderate'} Risk
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-5 text-sm">
                  <div>
                    <span className="text-xs text-fin-text-variant uppercase tracking-wider">Monthly</span>
                    <p className="font-bold text-fin-text-main">₹{((selectedPortfolio.monthly_investment || userSurplus) || userSurplus).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-xs text-fin-text-variant uppercase tracking-wider">Expected Return</span>
                    <p className="font-bold text-fin-primary">~{selectedPortfolio.expected_return}%</p>
                  </div>
                  <div>
                    <span className="text-xs text-fin-text-variant uppercase tracking-wider">Time Horizon</span>
                    <p className="font-bold text-fin-text-main">{selectedPortfolio.time_horizon || '3-5 saal'}</p>
                  </div>
                </div>
              </div>

              {/* Allocation Card */}
              <div className="bg-fin-surface rounded-fin-xl p-5 fin-shadow-sm border border-fin-outline-variant cursor-default">
                <h3 className="text-sm font-bold text-fin-text-main mb-4 flex items-center gap-2">
                  <FaChartLine className="text-fin-primary" />
                  Asset Allocation
                </h3>
                
                <div className="flex h-4 rounded-full overflow-hidden bg-fin-outline-variant">
                  {selectedPortfolio.allocation && (
                    <>
                      <div className="bg-fin-primary/60 h-full flex items-center justify-center text-white text-[10px] font-bold" style={{ width: `${selectedPortfolio.allocation.low || 50}%` }}>
                        {selectedPortfolio.allocation.low || 50}%
                      </div>
                      <div className="bg-fin-primary/80 h-full flex items-center justify-center text-white text-[10px] font-bold" style={{ width: `${selectedPortfolio.allocation.mid || 30}%` }}>
                        {selectedPortfolio.allocation.mid || 30}%
                      </div>
                      <div className="bg-fin-primary h-full flex items-center justify-center text-white text-[10px] font-bold" style={{ width: `${selectedPortfolio.allocation.high || 20}%` }}>
                        {selectedPortfolio.allocation.high || 20}%
                      </div>
                    </>
                  )}
                </div>
                
                <div className="flex justify-between mt-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-fin-primary/60 cursor-pointer"></div>
                    <span className="text-fin-text-variant cursor-default">Low Risk ({selectedPortfolio.allocation?.low || 50}%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-fin-primary/80 cursor-pointer"></div>
                    <span className="text-fin-text-variant cursor-default">Mid Risk ({selectedPortfolio.allocation?.mid || 30}%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-fin-primary cursor-pointer"></div>
                    <span className="text-fin-text-variant cursor-default">High Risk ({selectedPortfolio.allocation?.high || 20}%)</span>
                  </div>
                </div>
              </div>

              {/* Assets Card */}
              <div className="bg-fin-surface rounded-fin-xl p-5 fin-shadow-sm border border-fin-outline-variant cursor-default">
                <h3 className="text-sm font-bold text-fin-text-main mb-4">Your Investments</h3>
                <div className="space-y-3">
                  {selectedPortfolio.assets?.map((asset, idx) => (
                    <div key={idx} className="bg-fin-surface-low rounded-fin-md p-3 cursor-default">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-fin-text-main text-sm">{asset.name}</h4>
                            {assetPrices[asset.symbol] && (
                              <span className="text-xs text-fin-primary font-medium cursor-default">{assetPrices[asset.symbol].price}</span>
                            )}
                          </div>
                          <p className="text-xs text-fin-text-variant mt-1">{asset.description}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium bg-fin-primary/10 text-fin-primary cursor-default`}>
                            {asset.allocation}%
                          </span>
                          <p className="text-xs text-fin-primary mt-1">~{asset.return_rate}% return</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Growth Chart Card */}
              {showGrowthChart && chartData.length > 0 && (
                <div className="bg-fin-surface rounded-fin-xl p-5 fin-shadow-sm border border-fin-outline-variant cursor-default">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-fin-text-main flex items-center gap-2">
                      <FaChartLine className="text-fin-primary" />
                      Growth Trajectory
                    </h3>
                    <span className="text-xs text-fin-text-variant">@ {selectedPortfolio.expected_return}% p.a.</span>
                  </div>
                  
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#6b7280" />
                        <YAxis tick={{ fontSize: 11 }} stroke="#6b7280" tickFormatter={fmtINR} />
                        <Tooltip formatter={(value) => [fmtINR(value), 'Value']} />
                        <Area type="monotone" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} name="Future Value" />
                        <Area type="monotone" dataKey="invested" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.15} name="Invested" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    {chartData.map((data, idx) => (
                      <div key={idx} className="text-center bg-fin-surface-low rounded-fin-md p-2 cursor-default">
                        <p className="text-[10px] text-fin-text-variant uppercase tracking-wider">{data.name}</p>
                        <p className="font-bold text-fin-text-main text-sm">{fmtINR(data.value)}</p>
                        <p className="text-[10px] text-fin-primary">+{fmtINR(data.gains)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Apply Button */}
              <button
                onClick={applyPortfolio}
                disabled={isSaving}
                className={`w-full py-4 rounded-fin-md font-semibold text-sm flex items-center justify-center gap-2 transition-all fin-shadow-sm cursor-pointer ${
                  isSaving ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-fin-primary text-white hover:bg-fin-primary-container cursor-pointer'
                }`}
              >
                {isSaving ? (
                  <>
                    <span className="animate-spin cursor-wait">⟳</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <FaCheck />
                    Apply This Portfolio
                  </>
                )}
              </button>

              {/* Pro Tip */}
              <div className="bg-fin-primary/5 border border-fin-primary/20 rounded-fin-xl p-4 cursor-default">
                <div className="flex items-start gap-3">
                  <FaInfoCircle className="text-fin-primary mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-fin-text-main">Pro Tip</p>
                    <p className="text-xs text-fin-text-variant mt-1">
                      Start with SIP in index funds - it's the simplest way to build wealth over time!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="p-4 bg-fin-surface rounded-full mb-4 cursor-default">
                <FaChartLine className="w-8 h-8 text-fin-text-variant" />
              </div>
              <p className="text-fin-text-variant text-sm cursor-default">Select a portfolio to see details</p>
              <p className="text-fin-text-variant/60 text-xs mt-1 cursor-default">Choose from samples or generate your own</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default Portfolio