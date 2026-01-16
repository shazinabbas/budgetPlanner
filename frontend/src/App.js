import React, { useState, useEffect } from "react";
import "./App.css";
import { Toaster } from "./components/ui/toaster";
import { useToast } from "./hooks/use-toast";
import Dashboard from "./components/Dashboard";
import TransactionForm from "./components/TransactionForm";
import Reports from "./components/Reports";
import TransactionList from "./components/TransactionList";
import Settings from "./components/Settings";
import { cacheStore } from "./services/cache";
import { addTransaction, updateTransaction, deleteTransaction, bulkAddTransactions, updateSettings } from "./services/syncService";

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

  const handleAddExpense = async (expenseData) => {
    await addTransaction(expenseData);
    setCurrentView('dashboard');
    const isIncome = expenseData.category === 'income';
    toast({
      title: `${isIncome ? 'Income' : 'Expense'} Added Successfully!`,
      description: `Added ${expenseData.description} for ₹${expenseData.amount.toLocaleString('en-IN')}`,
    });
  };

  const handleUpdateExpense = async (expenseId, updateData) => {
    await updateTransaction(expenseId, updateData);
  };

  const handleDeleteExpense = async (expenseId) => {
    await deleteTransaction(expenseId);
  };

  const handleBulkImport = async (transactions) => {
    await bulkAddTransactions(transactions);
  };

  const handleBulkCreate = async (transactions) => {
    await bulkAddTransactions(transactions);
    toast({
      title: "Bulk Create Successful!",
      description: `Created ${transactions.length} transaction(s) successfully.`,
    });
  };

  const handleCategoriesUpdate = async (newCategories) => {
    await updateSettings('categories', newCategories);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard 
            onAddExpense={() => setCurrentView('add-expense')}
            onViewReports={() => setCurrentView('reports')}
            onViewTransactions={() => setCurrentView('transactions')}
            onSettings={() => setCurrentView('settings')}
            expenses={expenses}
            categories={categories}
          />
        );
      case 'add-expense':
        return (
          <TransactionForm 
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
      case 'settings':
        return (
          <Settings
            onBack={() => setCurrentView('dashboard')}
            onUpdate={handleCategoriesUpdate}
          />
        );
      default:
        return (
          <Dashboard 
            onAddExpense={() => setCurrentView('add-expense')}
            onViewReports={() => setCurrentView('reports')}
            onViewTransactions={() => setCurrentView('transactions')}
            onSettings={() => setCurrentView('settings')}
            expenses={expenses}
            categories={categories}
          />
        );
    }
  };

  return (
    <div className="App">
      {renderCurrentView()}
      <Toaster />
    </div>
  );
}

export default App;
