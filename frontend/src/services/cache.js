// IndexedDB-backed storage service with cloud sync hooks
// Future-proof: Ready for Firebase/Supabase integration
// Uses hybrid memory + IndexedDB for synchronous API

import { openDB } from 'idb';

const DB_NAME = 'budgetPlannerDB';
const DB_VERSION = 1;

// Default data structures
const defaultCategories = {
  needs: {
    id: 'needs',
    name: 'Needs',
    subcategories: [
      { id: 'rent', name: 'Rent', budgetLimit: 0 },
      { id: 'utilities', name: 'Utilities', budgetLimit: 0 },
      { id: 'groceries', name: 'Groceries', budgetLimit: 0 },
      { id: 'transportation', name: 'Transportation', budgetLimit: 0 },
      { id: 'insurance', name: 'Insurance', budgetLimit: 0 }
    ]
  },
  wants: {
    id: 'wants',
    name: 'Wants',
    subcategories: [
      { id: 'entertainment', name: 'Entertainment', budgetLimit: 0 },
      { id: 'dining', name: 'Dining Out', budgetLimit: 0 },
      { id: 'shopping', name: 'Shopping', budgetLimit: 0 },
      { id: 'hobbies', name: 'Hobbies', budgetLimit: 0 }
    ]
  },
  investments: {
    id: 'investments',
    name: 'Investments',
    subcategories: [
      { id: 'stocks', name: 'Stocks', budgetLimit: 0 },
      { id: 'mutual_funds', name: 'Mutual Funds', budgetLimit: 0 },
      { id: 'savings', name: 'Savings', budgetLimit: 0 },
      { id: 'emergency_fund', name: 'Emergency Fund', budgetLimit: 0 },
      { id: 'gold', name: 'Gold', budgetLimit: 0 }
    ]
  }
};

const defaultPaymentMethods = [
  { id: 'cash', name: 'Cash', type: 'cash' },
  { id: 'gpay', name: 'Google Pay', type: 'upi' },
  { id: 'phonepe', name: 'PhonePe', type: 'upi' },
  { id: 'paytm', name: 'Paytm', type: 'upi' },
  { id: 'neft', name: 'NEFT', type: 'neft' },
  { id: 'hdfc_credit', name: 'HDFC Credit Card', type: 'credit', dueDate: '15' },
  { id: 'sbi_credit', name: 'SBI Credit Card', type: 'credit', dueDate: '25' }
];

const defaultIncome = {
  id: '1',
  source: '',
  amount: 0,
  currency: 'INR',
  date: new Date().toISOString().split('T')[0]
};

const defaultBudgetLimits = {
  monthly: 0,
  savings_goal: 0
};

// Initialize IndexedDB
async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create object stores
      if (!db.objectStoreNames.contains('expenses')) {
        const expenseStore = db.createObjectStore('expenses', { keyPath: 'id' });
        expenseStore.createIndex('date', 'date');
        expenseStore.createIndex('category', 'category');
        expenseStore.createIndex('syncStatus', 'syncStatus');
        expenseStore.createIndex('lastModified', 'lastModified');
      }

      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    },
  });
}

// In-memory cache store with IndexedDB persistence
class CacheStore {
  constructor() {
    this.db = null;
    this.listeners = new Map();
    this.syncEnabled = false; // Will be true when cloud sync is added
    this.syncQueue = [];

    // In-memory cache (for synchronous access)
    this.cache = {
      expenses: [],
      categories: JSON.parse(JSON.stringify(defaultCategories)),
      income: JSON.parse(JSON.stringify(defaultIncome)),
      paymentMethods: JSON.parse(JSON.stringify(defaultPaymentMethods)),
      budgetLimits: JSON.parse(JSON.stringify(defaultBudgetLimits))
    };

    // Ready state for async data load
    this.ready = false;
    this.readyListeners = [];

    // Initialize DB and load data
    this.initializeDB();
  }

  async initializeDB() {
    try {
      this.db = await initDB();
      // Load data from IndexedDB into memory cache
      await this.loadFromDB();
      this.ready = true;
      // Notify all ready listeners
      this.readyListeners.forEach(fn => fn());
      // Notify all data listeners to trigger UI update
      this.notify('expenses', this.cache.expenses);
      this.notify('categories', this.cache.categories);
      this.notify('income', this.cache.income);
      this.notify('paymentMethods', this.cache.paymentMethods);
      this.notify('budgetLimits', this.cache.budgetLimits);
      console.log('✅ IndexedDB initialized and data loaded');
    } catch (error) {
      console.error('❌ Failed to initialize IndexedDB:', error);
    }
  }

  // Subscribe to ready event (for UI to wait for data)
  onReady(fn) {
    if (this.ready) {
      fn();
    } else {
      this.readyListeners.push(fn);
    }
  }

  async loadFromDB() {
    // Load expenses
    const expenses = await this.db.getAll('expenses');
    if (expenses && expenses.length > 0) {
      this.cache.expenses = expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // Load settings
    const categories = await this.getSetting('categories');
    if (categories) this.cache.categories = categories;
    else await this.setSetting('categories', defaultCategories);

    const paymentMethods = await this.getSetting('paymentMethods');
    if (paymentMethods) this.cache.paymentMethods = paymentMethods;
    else await this.setSetting('paymentMethods', defaultPaymentMethods);

    const income = await this.getSetting('income');
    if (income) this.cache.income = income;
    else await this.setSetting('income', defaultIncome);

    const budgetLimits = await this.getSetting('budgetLimits');
    if (budgetLimits) this.cache.budgetLimits = budgetLimits;
    else await this.setSetting('budgetLimits', defaultBudgetLimits);
  }

  // Settings helpers
  async getSetting(key) {
    if (!this.db) await this.initializeDB();
    try {
      const result = await this.db.get('settings', key);
      return result ? result.value : null;
    } catch (error) {
      console.error(`Error getting setting ${key}:`, error);
      return null;
    }
  }

  async setSetting(key, value) {
    if (!this.db) await this.initializeDB();
    try {
      await this.db.put('settings', { key, value });
    } catch (error) {
      console.error(`Error setting ${key}:`, error);
    }
  }

  // Subscription system for reactive updates
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    this.listeners.get(key).push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(key);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  notify(key, data) {
    if (this.listeners.has(key)) {
      this.listeners.get(key).forEach(callback => callback(data));
    }
  }

  // 🔄 SYNC HOOKS (Ready for Firebase/Supabase)
  async queueSync(operation) {
    if (!this.syncEnabled) return;
    
    // TODO: When cloud sync is enabled, add to sync queue
    this.syncQueue.push({
      ...operation,
      timestamp: Date.now(),
      status: 'pending'
    });
    
    // Attempt sync
    await this.processSyncQueue();
  }

  async processSyncQueue() {
    if (!this.syncEnabled || this.syncQueue.length === 0) return;
    
    // TODO: Implement when Firebase/Supabase is added
    // This will sync pending changes to cloud
    console.log('📡 Sync queue:', this.syncQueue.length, 'items');
  }

  // Expenses CRUD (Synchronous API with async persistence)
  getExpenses() {
    return [...this.cache.expenses];
  }

  addExpense(expense) {
    const newExpense = {
      id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...expense,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      syncStatus: 'pending'
    };

    // Update memory cache immediately
    this.cache.expenses.unshift(newExpense);
    this.notify('expenses', this.cache.expenses);

    // Persist to IndexedDB asynchronously
    this.persistExpense(newExpense);

    return newExpense;
  }

  async persistExpense(expense) {
    if (!this.db) return;
    
    try {
      await this.db.add('expenses', expense);
      
      // Queue for cloud sync
      await this.queueSync({
        type: 'CREATE',
        collection: 'expenses',
        data: expense
      });
    } catch (error) {
      console.error('Error persisting expense:', error);
    }
  }

  addExpenses(expenses) {
    const newExpenses = expenses.map(expense => ({
      id: expense.id || `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...expense,
      createdAt: expense.createdAt || new Date().toISOString(),
      lastModified: new Date().toISOString(),
      syncStatus: 'pending'
    }));

    // Update memory cache immediately
    this.cache.expenses.unshift(...newExpenses);
    this.notify('expenses', this.cache.expenses);

    // Persist to IndexedDB asynchronously
    this.persistExpenses(newExpenses);

    return newExpenses;
  }

  async persistExpenses(expenses) {
    if (!this.db) return;
    
    try {
      const tx = this.db.transaction('expenses', 'readwrite');
      await Promise.all(expenses.map(exp => tx.store.add(exp)));
      await tx.done;

      // Queue for cloud sync
      for (const expense of expenses) {
        await this.queueSync({
          type: 'CREATE',
          collection: 'expenses',
          data: expense
        });
      }
    } catch (error) {
      console.error('Error persisting expenses:', error);
    }
  }

  updateExpense(expenseId, updates) {
    const index = this.cache.expenses.findIndex(e => e.id === expenseId);
    if (index === -1) return null;

    const updatedExpense = {
      ...this.cache.expenses[index],
      ...updates,
      lastModified: new Date().toISOString(),
      syncStatus: 'pending'
    };

    // Update memory cache immediately
    this.cache.expenses[index] = updatedExpense;
    this.notify('expenses', this.cache.expenses);

    // Persist to IndexedDB asynchronously
    this.persistExpenseUpdate(updatedExpense, expenseId, updates);

    return updatedExpense;
  }

  async persistExpenseUpdate(updatedExpense, expenseId, updates) {
    if (!this.db) return;
    
    try {
      await this.db.put('expenses', updatedExpense);

      // Queue for cloud sync
      await this.queueSync({
        type: 'UPDATE',
        collection: 'expenses',
        id: expenseId,
        data: updates
      });
    } catch (error) {
      console.error('Error persisting expense update:', error);
    }
  }

  deleteExpense(expenseId) {
    const index = this.cache.expenses.findIndex(e => e.id === expenseId);
    if (index === -1) return false;

    // Update memory cache immediately
    this.cache.expenses.splice(index, 1);
    this.notify('expenses', this.cache.expenses);

    // Persist to IndexedDB asynchronously
    this.persistExpenseDelete(expenseId);

    return true;
  }

  async persistExpenseDelete(expenseId) {
    if (!this.db) return;
    
    try {
      await this.db.delete('expenses', expenseId);

      // Queue for cloud sync
      await this.queueSync({
        type: 'DELETE',
        collection: 'expenses',
        id: expenseId
      });
    } catch (error) {
      console.error('Error persisting expense delete:', error);
    }
  }

  // Categories (Synchronous API)
  getCategories() {
    return JSON.parse(JSON.stringify(this.cache.categories));
  }

  updateCategories(categories) {
    this.cache.categories = JSON.parse(JSON.stringify(categories));
    this.notify('categories', this.cache.categories);

    // Persist asynchronously
    this.setSetting('categories', categories).then(() => {
      this.queueSync({
        type: 'UPDATE',
        collection: 'settings',
        key: 'categories',
        data: categories
      });
    });

    return this.cache.categories;
  }

  // Income (Synchronous API)
  getIncome() {
    return JSON.parse(JSON.stringify(this.cache.income));
  }

  updateIncome(income) {
    this.cache.income = JSON.parse(JSON.stringify(income));
    this.notify('income', this.cache.income);

    // Persist asynchronously
    this.setSetting('income', income).then(() => {
      this.queueSync({
        type: 'UPDATE',
        collection: 'settings',
        key: 'income',
        data: income
      });
    });

    return this.cache.income;
  }

  // Payment Methods (Synchronous API)
  getPaymentMethods() {
    return [...this.cache.paymentMethods];
  }

  addPaymentMethod(method) {
    const newMethod = {
      id: `pm_${Date.now()}`,
      ...method
    };
    
    this.cache.paymentMethods.push(newMethod);
    this.notify('paymentMethods', this.cache.paymentMethods);

    // Persist asynchronously
    this.setSetting('paymentMethods', this.cache.paymentMethods);

    return newMethod;
  }

  // Budget Limits (Synchronous API)
  getBudgetLimits() {
    return JSON.parse(JSON.stringify(this.cache.budgetLimits));
  }

  updateBudgetLimits(limits) {
    this.cache.budgetLimits = JSON.parse(JSON.stringify(limits));
    this.notify('budgetLimits', this.cache.budgetLimits);

    // Persist asynchronously
    this.setSetting('budgetLimits', limits).then(() => {
      this.queueSync({
        type: 'UPDATE',
        collection: 'settings',
        key: 'budgetLimits',
        data: limits
      });
    });

    return this.cache.budgetLimits;
  }

  // Clear all data (for testing/reset)
  async reset() {
    // Clear memory cache
    this.cache.expenses = [];
    this.cache.categories = JSON.parse(JSON.stringify(defaultCategories));
    this.cache.income = JSON.parse(JSON.stringify(defaultIncome));
    this.cache.paymentMethods = JSON.parse(JSON.stringify(defaultPaymentMethods));
    this.cache.budgetLimits = JSON.parse(JSON.stringify(defaultBudgetLimits));

    // Notify all listeners
    this.notify('expenses', this.cache.expenses);
    this.notify('categories', this.cache.categories);
    this.notify('income', this.cache.income);
    this.notify('paymentMethods', this.cache.paymentMethods);
    this.notify('budgetLimits', this.cache.budgetLimits);

    // Clear IndexedDB
    if (!this.db) return;
    
    try {
      // Clear expenses
      const tx = this.db.transaction('expenses', 'readwrite');
      await tx.store.clear();
      await tx.done;

      // Reset settings
      await this.setSetting('categories', defaultCategories);
      await this.setSetting('paymentMethods', defaultPaymentMethods);
      await this.setSetting('income', defaultIncome);
      await this.setSetting('budgetLimits', defaultBudgetLimits);

      console.log('✅ Data reset successfully');
    } catch (error) {
      console.error('Error resetting data:', error);
    }
  }

  // 🔄 CLOUD SYNC METHODS (To be implemented with Firebase/Supabase)
  async enableCloudSync(config) {
    // TODO: Initialize Firebase/Supabase client
    // this.cloudClient = initializeApp(config);
    this.syncEnabled = true;
    console.log('☁️ Cloud sync enabled (placeholder)');
  }

  async syncToCloud() {
    if (!this.syncEnabled) return;
    // TODO: Sync all local data to cloud
    console.log('☁️ Syncing to cloud (placeholder)');
  }

  async syncFromCloud() {
    if (!this.syncEnabled) return;
    // TODO: Pull cloud data and merge with local
    console.log('☁️ Syncing from cloud (placeholder)');
  }
}

// Create and export singleton instance
export const cacheStore = new CacheStore();

export default cacheStore;
