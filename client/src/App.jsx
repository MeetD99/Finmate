import React from 'react'
import {BrowserRouter, Route, Routes} from "react-router-dom"
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import { AuthContextProvider } from "./context/authContext";
import { ToasterProvider } from "./context/ToastContext";
import { ChatProvider } from "./context/ChatContext";
import RiskAppetite from './pages/RiskAppetite'
import Portfolio from './pages/Porfolio'
import InvestmentKnowledgeCenter from './pages/InvestmentKnowledgeCenter'
import Landing from './pages/Landing'
import ExpenseTracker from './pages/ExpenseTracker'
import Profile from './pages/Profile'

const App = () => {
  return (
    <AuthContextProvider>
      <ToasterProvider>
        <ChatProvider>
        <BrowserRouter>
        <Routes>
          <Route path='/' element={<Landing />}></Route>
          <Route path='/dashboard' element={<Dashboard />}></Route>
          <Route path='/login' element={<Login />}></Route>
          <Route path='/register' element={<Register />}></Route>
          <Route path='/risk_profile' element={<RiskAppetite />}/>
          <Route path='/personalised-portfolio' element={<Portfolio />}/>
          <Route path='/knowledge-center' element={<InvestmentKnowledgeCenter />}/>
          <Route path='/expense-tracker' element={<ExpenseTracker />}/>
          <Route path='/profile' element={<Profile />}/>
        </Routes>
        </BrowserRouter>
        </ChatProvider>
      </ToasterProvider>
    </AuthContextProvider>
  )
}

export default App