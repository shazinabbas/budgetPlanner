// Mock data for budget planner app - will be replaced with API calls later

export const mockIncomeData = {
  id: '1',
  source: 'Primary Job',
  amount: 82000,
  currency: 'INR',
  date: '2024-01-01'
};

export const mockCategories = {
  needs: {
    id: 'needs',
    name: 'Needs',
    subcategories: [
      { id: 'rent', name: 'Rent', budgetLimit: 25000 },
      { id: 'utilities', name: 'Utilities', budgetLimit: 3000 },
      { id: 'groceries', name: 'Groceries', budgetLimit: 8000 },
      { id: 'transportation', name: 'Transportation', budgetLimit: 4000 },
      { id: 'insurance', name: 'Insurance', budgetLimit: 2000 }
    ]
  },
  wants: {
    id: 'wants', 
    name: 'Wants',
    subcategories: [
      { id: 'entertainment', name: 'Entertainment', budgetLimit: 5000 },
      { id: 'dining', name: 'Dining Out', budgetLimit: 4000 },
      { id: 'shopping', name: 'Shopping', budgetLimit: 6000 },
      { id: 'hobbies', name: 'Hobbies', budgetLimit: 3000 }
    ]
  },
  investments: {
    id: 'investments',
    name: 'Investments', 
    subcategories: [
      { id: 'stocks', name: 'Stocks', budgetLimit: 10000 },
      { id: 'mutual_funds', name: 'Mutual Funds', budgetLimit: 8000 },
      { id: 'savings', name: 'Savings', budgetLimit: 15000 },
      { id: 'emergency_fund', name: 'Emergency Fund', budgetLimit: 5000 },
      { id: 'gold', name: 'Gold', budgetLimit: 3000 }
    ]
  }
};

export const mockPaymentMethods = [
  { id: 'cash', name: 'Cash', type: 'cash' },
  { id: 'gpay', name: 'Google Pay', type: 'upi' },
  { id: 'phonepe', name: 'PhonePe', type: 'upi' },
  { id: 'paytm', name: 'Paytm', type: 'upi' },
  { id: 'neft', name: 'NEFT', type: 'neft' },
  { id: 'hdfc_credit', name: 'HDFC Credit Card', type: 'credit', dueDate: '15' },
  { id: 'sbi_credit', name: 'SBI Credit Card', type: 'credit', dueDate: '25' }
];

export const mockExpenses = [
  {
    id: '1',
    amount: 22000,
    description: 'Monthly Rent',
    category: 'needs',
    subcategory: 'rent',
    paymentMethod: 'neft',
    date: '2024-07-01',
    createdAt: '2024-07-01T10:00:00Z'
  },
  {
    id: '2', 
    amount: 2500,
    description: 'Electricity Bill',
    category: 'needs',
    subcategory: 'utilities',
    paymentMethod: 'gpay',
    date: '2024-07-05',
    createdAt: '2024-07-05T15:30:00Z'
  },
  {
    id: '3',
    amount: 1200,
    description: 'Movie Theater',
    category: 'wants',
    subcategory: 'entertainment', 
    paymentMethod: 'hdfc_credit',
    date: '2024-07-10',
    createdAt: '2024-07-10T20:00:00Z'
  },
  {
    id: '4',
    amount: 5000,
    description: 'SIP Investment',
    category: 'investments',
    subcategory: 'mutual_funds',
    paymentMethod: 'neft',
    date: '2024-07-15',
    createdAt: '2024-07-15T09:00:00Z'
  },
  {
    id: '5',
    amount: 3500,
    description: 'Grocery Shopping',
    category: 'needs',
    subcategory: 'groceries',
    paymentMethod: 'phonepe',
    date: '2024-07-12',
    createdAt: '2024-07-12T11:20:00Z'
  }
];

export const mockBudgetLimits = {
  monthly: 75000,
  savings_goal: 20000
};

export const mockMonthlyData = [
  { month: 'Jan', income: 82000, expenses: 68000, savings: 14000 },
  { month: 'Feb', income: 82000, expenses: 72000, savings: 10000 },
  { month: 'Mar', income: 82000, expenses: 65000, savings: 17000 },
  { month: 'Apr', income: 82000, expenses: 70000, savings: 12000 },
  { month: 'May', income: 82000, expenses: 74000, savings: 8000 },
  { month: 'Jun', income: 82000, expenses: 69000, savings: 13000 },
  { month: 'Jul', income: 82000, expenses: 34200, savings: 47800 }
];