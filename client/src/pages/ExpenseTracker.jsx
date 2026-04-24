import React, { useState, useEffect, useContext, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaPlus, FaTrash, FaArrowLeft, FaCheck, FaSearch, FaEdit, FaDownload, FaTimes } from 'react-icons/fa'
import { AuthContext } from '../context/authContext'
import { showError, showSuccess } from '../context/ToastContext'

const ExpenseTracker = () => {
  const navigate = useNavigate()
  const { currentUser } = useContext(AuthContext)
  const [expenses, setExpenses] = useState([])
  const [groupedExpenses, setGroupedExpenses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [exportMonth, setExportMonth] = useState('')

  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    type: 'debit',
    date: new Date().toISOString().split('T')[0]
  })

  const [selectedExpenses, setSelectedExpenses] = useState([])
  const [editingExpense, setEditingExpense] = useState(null)

  useEffect(() => {
    if (!currentUser) {
      navigate('/login')
      return
    }
    fetchExpenses()
    fetchGroupedExpenses()
  }, [currentUser])

  const userId = currentUser?.id || 0

  useEffect(() => {
    if (!currentUser) {
      navigate('/login')
      return
    }
    fetchExpenses()
    fetchGroupedExpenses()
  }, [currentUser])

  const fetchExpenses = async () => {
    try {
      const url = `http://localhost:8080/api/expenses?user_id=${userId}`
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setExpenses(data)
      }
    } catch (error) {
      console.error('Error fetching expenses:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchGroupedExpenses = async () => {
    try {
      const url = `http://localhost:8080/api/expenses/grouped?user_id=${userId}`
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setGroupedExpenses(data)
      }
    } catch (error) {
      console.error('Error fetching grouped expenses:', error)
    }
  }

  const filteredExpenses = useMemo(() => {
    if (!searchQuery.trim()) return groupedExpenses
    
    const query = searchQuery.toLowerCase().trim()
    
    return groupedExpenses.map(monthGroup => ({
      ...monthGroup,
      transactions: monthGroup.transactions.filter(expense => {
        const descMatch = expense.description?.toLowerCase().includes(query)
        const dateStr = expense.date || ''
        const dayMatch = dateStr.includes(query)
        const monthMatch = monthGroup.month.toLowerCase().includes(query)
        return descMatch || dayMatch || monthMatch
      })
    })).filter(monthGroup => monthGroup.transactions.length > 0)
  }, [groupedExpenses, searchQuery])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const payload = { ...formData, user_id: userId }
      const response = await fetch('http://localhost:8080/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        showSuccess('Expense added successfully!')
        setFormData({
          amount: '',
          description: '',
          type: 'debit',
          date: new Date().toISOString().split('T')[0]
        })
        setShowForm(false)
        fetchExpenses()
        fetchGroupedExpenses()
      } else {
        const data = await response.json()
        showError(data.detail || 'Failed to add expense')
      }
    } catch (error) {
      console.error('Error creating expense:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!editingExpense) return
    setIsSubmitting(true)

    try {
      const payload = { ...formData, user_id: userId }
      const response = await fetch(`http://localhost:8080/api/expenses/${editingExpense.id}?user_id=${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        showSuccess('Expense updated successfully!')
        setEditingExpense(null)
        setFormData({
          amount: '',
          description: '',
          type: 'debit',
          date: new Date().toISOString().split('T')[0]
        })
        setShowForm(false)
        fetchExpenses()
        fetchGroupedExpenses()
      } else {
        const data = await response.json()
        showError(data.detail || 'Failed to update expense')
      }
    } catch (error) {
      console.error('Error updating expense:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      const url = `http://localhost:8080/api/expenses/${id}?user_id=${userId}`
      const response = await fetch(url, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (response.ok) {
        showSuccess('Expense deleted!')
        fetchExpenses()
        fetchGroupedExpenses()
        setSelectedExpenses(prev => prev.filter(eid => eid !== id))
      } else {
        const data = await response.json()
        showError(data.detail || 'Failed to delete expense')
      }
    } catch (error) {
      console.error('Error deleting expense:', error)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedExpenses.length === 0) return
    
    try {
      const deletePromises = selectedExpenses.map(id => 
        fetch(`http://localhost:8080/api/expenses/${id}?user_id=${userId}`, {
          method: 'DELETE',
          credentials: 'include'
        })
      )
      
      await Promise.all(deletePromises)
      showSuccess(`${selectedExpenses.length} expenses deleted!`)
      setSelectedExpenses([])
      fetchExpenses()
      fetchGroupedExpenses()
    } catch (error) {
      console.error('Error bulk deleting expenses:', error)
    }
  }

  const handleExportCSV = (monthToExport) => {
    const allTransactions = []
    
    if (monthToExport) {
      const selectedGroup = groupedExpenses.find(mg => mg.month === monthToExport)
      if (selectedGroup) {
        selectedGroup.transactions.forEach(expense => {
          allTransactions.push(expense)
        })
      }
    } else {
      groupedExpenses.forEach(monthGroup => {
        monthGroup.transactions.forEach(expense => {
          allTransactions.push(expense)
        })
      })
    }

    if (allTransactions.length === 0) {
      showError('No transactions to export')
      return
    }

    const headers = ['Date', 'Description', 'Withdrawal', 'Deposit', 'Balance']
    const csvRows = [headers.join(',')]

    allTransactions.forEach(expense => {
      const date = expense.date || ''
      const description = expense.description || ''
      const amount = expense.amount || 0
      
      const withdrawal = expense.type === 'debit' ? amount : 0
      const deposit = expense.type === 'credit' ? amount : 0
      
      const row = [
        `"${date}"`,
        `"${description.replace(/"/g, '""')}"`,
        withdrawal,
        deposit,
        0
      ]
      csvRows.push(row.join(','))
    })

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = monthToExport 
      ? `expenses_${monthToExport.replace(' ', '_')}.csv`
      : `expenses_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    showSuccess(monthToExport ? `Exported ${monthToExport}!` : 'CSV exported successfully!')
  }

  const toggleSelectExpense = (id) => {
    setSelectedExpenses(prev => 
      prev.includes(id) 
        ? prev.filter(eid => eid !== id)
        : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    const allIds = []
    groupedExpenses.forEach(monthGroup => {
      monthGroup.transactions.forEach(expense => {
        allIds.push(expense.id)
      })
    })
    
    if (selectedExpenses.length === allIds.length) {
      setSelectedExpenses([])
    } else {
      setSelectedExpenses(allIds)
    }
  }

  const getTotalAmount = (transactions) => {
    return transactions.reduce((sum, t) => {
      return t.type === 'credit' ? sum + t.amount : sum - t.amount
    }, 0)
  }

  const openEditForm = (expense) => {
    setEditingExpense(expense)
    setFormData({
      amount: expense.amount?.toString() || '',
      description: expense.description || '',
      type: expense.type || 'debit',
      date: expense.date || new Date().toISOString().split('T')[0]
    })
    setShowForm(true)
  }

  const openAddForm = () => {
    setEditingExpense(null)
    setFormData({
      amount: '',
      description: '',
      type: 'debit',
      date: new Date().toISOString().split('T')[0]
    })
    setShowForm(true)
  }

  return (
    <div className='main-dashboard max-w-screen bg-fin-background min-h-screen'>
      <div className="navbar w-full flex items-center justify-between px-4 sm:px-5 py-3 bg-fin-surface border-b border-fin-outline-variant gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 bg-fin-surface-low rounded-fin-md text-fin-text-variant hover:text-fin-text-main hover:bg-fin-surface-low/80 transition-colors"
          >
            <FaArrowLeft />
          </button>
          <h1 className='text-sm font-semibold text-fin-text-main tracking-wide'>Expense Tracker</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={exportMonth}
              onChange={(e) => {
                if (e.target.value) {
                  handleExportCSV(e.target.value)
                  setExportMonth('')
                }
              }}
              className="appearance-none bg-fin-surface-low px-3 py-1.5 pr-8 rounded-fin-md text-xs font-medium text-fin-text-variant border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-fin-primary"
            >
              <option value="">Export</option>
              {groupedExpenses.map((mg, i) => (
                <option key={i} value={mg.month}>{mg.month}</option>
              ))}
            </select>
            <FaDownload className="absolute right-2 top-1/2 -translate-y-1/2 text-fin-text-variant pointer-events-none w-3 h-3" />
          </div>
          <button
            onClick={() => handleExportCSV('')}
            className="px-3 py-1.5 rounded-fin-md transition-colors flex items-center gap-2 text-xs font-medium uppercase tracking-wider bg-fin-primary text-white hover:bg-fin-primary/90"
          >
            <FaPlus />
            Add
          </button>
        </div>
      </div>

      <div className="main flex flex-col p-3 sm:p-5 gap-4 sm:gap-6 overflow-y-auto">
        {showForm && (
          <div className="bg-fin-surface rounded-fin-lg p-5 shadow-sm border border-fin-outline-variant">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-fin-text-main uppercase tracking-wide">
                {editingExpense ? 'Edit Expense' : 'Add New Expense'}
              </h3>
              <button
                onClick={() => { setShowForm(false); setEditingExpense(null); }}
                className="p-1 text-fin-text-variant hover:text-fin-text-main"
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={editingExpense ? handleUpdate : handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-fin-text-variant uppercase tracking-wider mb-2">Amount</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="Enter amount"
                    required
                    className="w-full px-3 py-2.5 border border-fin-outline-variant rounded-fin-md text-sm focus:border-fin-primary focus:outline-none bg-fin-background"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-fin-text-variant uppercase tracking-wider mb-2">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2.5 border border-fin-outline-variant rounded-fin-md text-sm focus:border-fin-primary focus:outline-none bg-fin-background"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-fin-text-variant uppercase tracking-wider mb-2">Description</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="e.g., Grocery shopping, Salary, etc."
                  required
                  className="w-full px-3 py-2.5 border border-fin-outline-variant rounded-fin-md text-sm focus:border-fin-primary focus:outline-none bg-fin-background"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-fin-text-variant uppercase tracking-wider mb-2">Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value="debit"
                      checked={formData.type === 'debit'}
                      onChange={handleInputChange}
                      className="accent-fin-primary"
                    />
                    <span className="text-sm font-medium text-fin-text-variant">Debit (Expense)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value="credit"
                      checked={formData.type === 'credit'}
                      onChange={handleInputChange}
                      className="accent-fin-primary"
                    />
                    <span className="text-sm font-medium text-fin-text-variant">Credit (Income)</span>
                  </label>
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-2.5 rounded-fin-md text-sm font-medium text-white uppercase tracking-wider transition-colors ${
                  isSubmitting 
                    ? 'bg-fin-text-variant cursor-not-allowed' 
                    : 'bg-fin-primary hover:bg-fin-primary/90'
                }`}
              >
                {isSubmitting ? 'Saving...' : (editingExpense ? 'Update Expense' : 'Save Expense')}
              </button>
            </form>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-fin-surface rounded-fin-lg p-4 shadow-sm border border-fin-outline-variant">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-fin-text-variant" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by description, date, or month (e.g., January or 25)"
              className="w-full pl-10 pr-4 py-2.5 border border-fin-outline-variant rounded-fin-md text-sm focus:border-fin-primary focus:outline-none bg-fin-background"
            />
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedExpenses.length > 0 && (
          <div className="bg-fin-surface rounded-fin-lg p-4 shadow-sm border border-fin-outline-variant flex items-center justify-between">
            <span className="text-sm font-medium text-fin-text-main">
              {selectedExpenses.length} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSelectAll}
                className="px-3 py-1.5 rounded-fin-md text-xs font-medium text-fin-text-variant hover:text-fin-text-main border border-fin-outline-variant hover:border-fin-text-variant transition-colors"
              >
                {selectedExpenses.length === expenses.length ? 'Deselect All' : 'Select All'}
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 rounded-fin-md text-xs font-medium text-white bg-red-500 hover:bg-red-600 transition-colors flex items-center gap-1"
              >
                <FaTrash /> Delete
              </button>
              <button
                onClick={() => setSelectedExpenses([])}
                className="px-3 py-1.5 rounded-fin-md text-xs font-medium text-fin-text-variant hover:text-fin-text-main transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        <div className="bg-fin-surface rounded-fin-lg p-5 shadow-sm border border-fin-outline-variant">
          <h3 className="text-base font-semibold text-fin-text-main mb-4 flex items-center gap-2">
            Transactions by Month
          </h3>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-fin-primary rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-fin-primary rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 bg-fin-primary rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-8 text-fin-text-variant">
              <p>{searchQuery ? 'No matching transactions found.' : 'No expenses yet. Add your first expense to get started.'}</p>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredExpenses.map((monthGroup, monthIndex) => (
                <div key={monthIndex} className="border border-fin-outline-variant rounded-fin-lg overflow-hidden">
                  <div className="bg-fin-surface-low px-4 py-3 flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-fin-text-main">{monthGroup.month}</h4>
                    <span className={`text-sm font-semibold ${
                      getTotalAmount(monthGroup.transactions) >= 0 ? 'text-green-600' : 'text-fin-text-main'
                    }`}>
                      ₹{Math.abs(getTotalAmount(monthGroup.transactions)).toLocaleString()}
                      {getTotalAmount(monthGroup.transactions) < 0 ? ' spent' : ' saved'}
                    </span>
                  </div>
                  <div className="divide-y divide-fin-outline-variant/50">
                    {monthGroup.transactions.map((expense, idx) => (
                      <div 
                        key={idx} 
                        className={`p-4 flex items-center justify-between hover:bg-fin-surface-low transition-colors ${
                          selectedExpenses.includes(expense.id) ? 'bg-fin-primary/5' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleSelectExpense(expense.id)}
                            className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                              selectedExpenses.includes(expense.id) 
                                ? 'bg-fin-primary border-fin-primary text-white' 
                                : 'border-fin-outline-variant hover:border-fin-primary'
                            }`}
                          >
                            {selectedExpenses.includes(expense.id) && <FaCheck className="w-3 h-3" />}
                          </button>
                          <div>
                            <p className="text-sm font-medium text-fin-text-main">{expense.description}</p>
                            <p className="text-xs text-fin-text-variant">{expense.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-sm font-semibold ${
                            expense.type === 'credit' ? 'text-green-600' : 'text-fin-text-main'
                          }`}>
                            {expense.type === 'credit' ? '+' : '-'}₹{expense.amount.toLocaleString()}
                          </span>
                          <button
                            onClick={() => openEditForm(expense)}
                            className="p-1.5 text-fin-text-variant hover:text-fin-primary transition-colors"
                            title="Edit"
                          >
                            <FaEdit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(expense.id)}
                            className="p-1.5 text-fin-text-variant hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <FaTrash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ExpenseTracker