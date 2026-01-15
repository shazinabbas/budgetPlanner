import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/toaster";
import { useToast } from "./hooks/use-toast";
import Dashboard from "./components/Dashboard";
import ExpenseForm from "./components/ExpenseForm";
import IncomeForm from "./components/IncomeForm";
import Reports from "./components/Reports";
import TransactionList from "./components/TransactionList";
import { cacheStore } from "./services/cache";

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [expenses, setExpenses] = useState(() => cacheStore.getExpenses());
  const [categories, setCategories] = useState(() => cacheStore.getCategories());
  const { toast } = useToast();

  // Subscribe to cache changes
  useEffect(() => {
    const unsubscribeExpenses = cacheStore.subscribe('expenses', (data) => {
      setExpenses(data);
    });

    const unsubscribeCategories = cacheStore.subscribe('categories', (data) => {
      setCategories(data);
    });

    return () => {
      unsubscribeExpenses();
      unsubscribeCategories();
    };
  }, []);

  const handleAddExpense = (expenseData) => {
    cacheStore.addExpense(expenseData);
    setCurrentView('dashboard');
    toast({
      title: "Expense Added Successfully!",
      description: `Added ${expenseData.description} for ₹${expenseData.amount.toLocaleString('en-IN')}`,
    });
  };

  const handleUpdateExpense = (expenseId, updateData) => {
    cacheStore.updateExpense(expenseId, updateData);
  };

  const handleDeleteExpense = (expenseId) => {
    cacheStore.deleteExpense(expenseId);
  };

  const handleBulkImport = (transactions) => {
    cacheStore.addExpenses(transactions);
  };

  const handleBulkCreate = (transactions) => {
    cacheStore.addExpenses(transactions);
    toast({
      title: "Bulk Create Successful!",
      description: `Created ${transactions.length} transaction(s) successfully.`,
    });
  };

  const handleCategoriesUpdate = (newCategories) => {
    cacheStore.updateCategories(newCategories);
  };

  const handleAddIncome = () => {
    setCurrentView('add-income');
  };

  const handleSaveIncome = (incomeData) => {
    setCurrentView('dashboard');
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
      case 'add-income':
        return (
          <IncomeForm 
            onBack={() => setCurrentView('dashboard')}
            onSave={handleSaveIncome}
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
