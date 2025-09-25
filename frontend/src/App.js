import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/toaster";
import { useToast } from "./hooks/use-toast";
import Dashboard from "./components/Dashboard";
import ExpenseForm from "./components/ExpenseForm";
import Reports from "./components/Reports";

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [expenses, setExpenses] = useState([]);
  const { toast } = useToast();

  // Load expenses from localStorage on app start
  useEffect(() => {
    const savedExpenses = localStorage.getItem('budgetPlannerExpenses');
    if (savedExpenses) {
      try {
        setExpenses(JSON.parse(savedExpenses));
      } catch (error) {
        console.error('Error loading expenses from localStorage:', error);
      }
    }
  }, []);

  // Save expenses to localStorage whenever expenses change
  useEffect(() => {
    localStorage.setItem('budgetPlannerExpenses', JSON.stringify(expenses));
  }, [expenses]);

  const handleAddExpense = (expenseData) => {
    setExpenses(prev => [expenseData, ...prev]);
    setCurrentView('dashboard');
    toast({
      title: "Expense Added Successfully!",
      description: `Added ${expenseData.description} for ₹${expenseData.amount.toLocaleString('en-IN')}`,
    });
  };

  const handleAddIncome = () => {
    toast({
      title: "Income Management",
      description: "Income management will be available in the next update. Currently showing mock income of ₹82,000.",
    });
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard 
            onAddExpense={() => setCurrentView('add-expense')}
            onAddIncome={handleAddIncome}
            onViewReports={() => setCurrentView('reports')}
            expenses={expenses}
          />
        );
      case 'add-expense':
        return (
          <ExpenseForm 
            onBack={() => setCurrentView('dashboard')}
            onSave={handleAddExpense}
          />
        );
      case 'reports':
        return (
          <Reports 
            onBack={() => setCurrentView('dashboard')}
            expenses={expenses}
          />
        );
      default:
        return (
          <Dashboard 
            onAddExpense={() => setCurrentView('add-expense')}
            onAddIncome={handleAddIncome}
            onViewReports={() => setCurrentView('reports')}
            expenses={expenses}
          />
        );
    }
  };

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/*" element={renderCurrentView()} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;
