import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/toaster";
import { useToast } from "./hooks/use-toast";
import Dashboard from "./components/Dashboard";
import ExpenseForm from "./components/ExpenseForm";
import Reports from "./components/Reports";
import TransactionList from "./components/TransactionList";
import { mockCategories } from "./utils/mockData";

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState(mockCategories);
  const { toast } = useToast();

  // Load expenses from localStorage on app start
  useEffect(() => {
    const savedExpenses = localStorage.getItem('budgetPlannerExpenses');
    const savedCategories = localStorage.getItem('budgetPlannerCategories');
    
    if (savedExpenses) {
      try {
        setExpenses(JSON.parse(savedExpenses));
      } catch (error) {
        console.error('Error loading expenses from localStorage:', error);
      }
    }
    
    if (savedCategories) {
      try {
        setCategories(JSON.parse(savedCategories));
      } catch (error) {
        console.error('Error loading categories from localStorage:', error);
        setCategories(mockCategories);
      }
    }
  }, []);

  // Save expenses to localStorage whenever expenses change
  useEffect(() => {
    localStorage.setItem('budgetPlannerExpenses', JSON.stringify(expenses));
  }, [expenses]);

  // Save categories to localStorage whenever categories change
  useEffect(() => {
    localStorage.setItem('budgetPlannerCategories', JSON.stringify(categories));
  }, [categories]);

  const handleAddExpense = (expenseData) => {
    setExpenses(prev => [expenseData, ...prev]);
    setCurrentView('dashboard');
    toast({
      title: "Expense Added Successfully!",
      description: `Added ${expenseData.description} for ₹${expenseData.amount.toLocaleString('en-IN')}`,
    });
  };

  const handleUpdateExpense = (expenseId, updateData) => {
    setExpenses(prev => prev.map(expense => 
      expense.id === expenseId ? { ...expense, ...updateData } : expense
    ));
  };

  const handleDeleteExpense = (expenseId) => {
    setExpenses(prev => prev.filter(expense => expense.id !== expenseId));
  };

  const handleBulkImport = (transactions) => {
    setExpenses(prev => [...transactions, ...prev]);
  };

  const handleBulkCreate = (transactions) => {
    setExpenses(prev => [...transactions, ...prev]);
    toast({
      title: "Bulk Create Successful!",
      description: `Created ${transactions.length} transaction(s) successfully.`,
    });
  };

  const handleCategoriesUpdate = (newCategories) => {
    setCategories(newCategories);
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
            onViewTransactions={() => setCurrentView('transactions')}
            expenses={expenses}
            categories={categories}
          />
        );
      case 'add-expense':
        return (
          <ExpenseForm 
            onBack={() => setCurrentView('dashboard')}
            onSave={handleAddExpense}
            categories={categories}
          />
        );
      case 'reports':
        return (
          <Reports 
            onBack={() => setCurrentView('dashboard')}
            expenses={expenses}
            categories={categories}
          />
        );
      case 'transactions':
        return (
          <TransactionList
            expenses={expenses}
            onUpdate={handleUpdateExpense}
            onDelete={handleDeleteExpense}
            onBulkUpdate={() => {}} // Handled internally by TransactionList
            onBulkImport={handleBulkImport}
            onBulkCreate={handleBulkCreate}
            onCategoriesUpdate={handleCategoriesUpdate}
            categories={categories}
            onBack={() => setCurrentView('dashboard')}
          />
        );
      default:
        return (
          <Dashboard 
            onAddExpense={() => setCurrentView('add-expense')}
            onAddIncome={handleAddIncome}
            onViewReports={() => setCurrentView('reports')}
            onViewTransactions={() => setCurrentView('transactions')}
            expenses={expenses}
            categories={categories}
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
