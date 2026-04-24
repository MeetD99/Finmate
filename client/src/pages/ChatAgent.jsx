import React from 'react';
import MoneyBuddy from '../components/MoneyBuddy';
import { Link } from 'react-router-dom';

const ChatAgent = () => {
  return (
    <div className="min-h-screen bg-fin-background">
      <nav className="bg-fin-surface border-b border-fin-outline-variant px-4 sm:px-5 py-3 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-fin-primary">FinMate</h1>
        </Link>
        <Link
          to="/dashboard"
          className="text-sm text-fin-text-variant hover:text-fin-primary"
        >
          ← Dashboard
        </Link>
      </nav>

      <main className="px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl font-semibold text-fin-primary">
              FinMate
            </h1>
            <p className="text-xs sm:text-sm text-fin-text-variant mt-1">
              Your personal AI advisor for investments, taxes & financial planning
            </p>
          </div>

          <MoneyBuddy />
        </div>
      </main>
    </div>
  );
};

export default ChatAgent;