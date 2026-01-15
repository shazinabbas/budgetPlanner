// In-memory cache service for budget planner
// This replaces backend API calls temporarily

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

// In-memory cache store
class CacheStore {
  constructor() {
    this.expenses = [];
    this.categories = JSON.parse(JSON.stringify(defaultCategories));
    this.income = JSON.parse(JSON.stringify(defaultIncome));
    this.paymentMethods = JSON.parse(JSON.stringify(defaultPaymentMethods));
    this.budgetLimits = JSON.parse(JSON.stringify(defaultBudgetLimits));
    this.listeners = new Map();
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

  // Expenses
  getExpenses() {
    return [...this.expenses];
  }

  addExpense(expense) {
    const newExpense = {
      id: `exp_${Date.now()}`,
      ...expense,
      createdAt: new Date().toISOString()
    };
    this.expenses.unshift(newExpense);
    this.notify('expenses', this.expenses);
    return newExpense;
  }

  addExpenses(expenses) {
    this.expenses.unshift(...expenses);
    this.notify('expenses', this.expenses);
    return expenses;
  }

  updateExpense(expenseId, updates) {
    const index = this.expenses.findIndex(e => e.id === expenseId);
    if (index !== -1) {
      this.expenses[index] = { ...this.expenses[index], ...updates };
      this.notify('expenses', this.expenses);
      return this.expenses[index];
    }
    return null;
  }

  deleteExpense(expenseId) {
    const index = this.expenses.findIndex(e => e.id === expenseId);
    if (index !== -1) {
      this.expenses.splice(index, 1);
      this.notify('expenses', this.expenses);
      return true;
    }
    return false;
  }

  // Categories
  getCategories() {
    return JSON.parse(JSON.stringify(this.categories));
  }

  updateCategories(categories) {
    this.categories = JSON.parse(JSON.stringify(categories));
    this.notify('categories', this.categories);
    return this.categories;
  }

  // Income
  getIncome() {
    return JSON.parse(JSON.stringify(this.income));
  }

  updateIncome(income) {
    this.income = JSON.parse(JSON.stringify(income));
    this.notify('income', this.income);
    return this.income;
  }

  // Payment Methods
  getPaymentMethods() {
    return [...this.paymentMethods];
  }

  addPaymentMethod(method) {
    const newMethod = {
      id: `pm_${Date.now()}`,
      ...method
    };
    this.paymentMethods.push(newMethod);
    this.notify('paymentMethods', this.paymentMethods);
    return newMethod;
  }

  // Budget Limits
  getBudgetLimits() {
    return JSON.parse(JSON.stringify(this.budgetLimits));
  }

  updateBudgetLimits(limits) {
    this.budgetLimits = JSON.parse(JSON.stringify(limits));
    this.notify('budgetLimits', this.budgetLimits);
    return this.budgetLimits;
  }

  // Clear all data
  reset() {
    this.expenses = [];
    this.categories = JSON.parse(JSON.stringify(defaultCategories));
    this.income = JSON.parse(JSON.stringify(defaultIncome));
    this.paymentMethods = JSON.parse(JSON.stringify(defaultPaymentMethods));
    this.budgetLimits = JSON.parse(JSON.stringify(defaultBudgetLimits));
    this.notify('expenses', this.expenses);
    this.notify('categories', this.categories);
    this.notify('income', this.income);
    this.notify('paymentMethods', this.paymentMethods);
    this.notify('budgetLimits', this.budgetLimits);
  }
}

// Create and export singleton instance
export const cacheStore = new CacheStore();

export default cacheStore;
