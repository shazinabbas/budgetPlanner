import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Plus, TrendingUp, TrendingDown, Wallet, Target, PieChart } from 'lucide-react';
import { mockExpenses, mockIncomeData, mockBudgetLimits, mockCategories } from '../utils/mockData';

const Dashboard = ({ onAddExpense, onAddIncome, onViewReports, onViewTransactions, expenses, categories }) => {
  const [income, setIncome] = useState(null);
  const [budgetData, setBudgetData] = useState({});

  useEffect(() => {
    // Load income data and calculate budget
    setIncome(mockIncomeData);
    calculateBudgetData();
  }, [expenses]);

  const calculateBudgetData = () => {
    const currentExpenses = expenses.length > 0 ? expenses : mockExpenses;
    const totalExpenses = currentExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalIncome = mockIncomeData.amount;
    const remainingBudget = totalIncome - totalExpenses;
    const savingsProgress = (remainingBudget / mockBudgetLimits.savings_goal) * 100;
    
    setBudgetData({
      totalExpenses,
      totalIncome,
      remainingBudget,
      savingsProgress: Math.min(savingsProgress, 100)
    });
  };

  const getCategoryExpenses = (categoryId) => {
    return mockExpenses
      .filter(expense => expense.category === categoryId)
      .reduce((sum, expense) => sum + expense.amount, 0);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Budget Planner</h1>
            <p className="text-slate-600">Track your income, expenses, and achieve your financial goals</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={onAddIncome}
              variant="outline" 
              className="flex items-center gap-2 hover:bg-green-50 border-green-200 text-green-700"
            >
              <Plus className="w-4 h-4" />
              Add Income
            </Button>
            <Button 
              onClick={onAddExpense}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add Expense
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-800">Total Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-900">
                {formatCurrency(budgetData.totalIncome || 0)}
              </div>
              <p className="text-xs text-emerald-700 mt-1">Monthly income</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-rose-50 to-rose-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-rose-800">Total Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-rose-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-900">
                {formatCurrency(budgetData.totalExpenses || 0)}
              </div>
              <p className="text-xs text-rose-700 mt-1">This month</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Remaining Budget</CardTitle>
              <Wallet className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">
                {formatCurrency(budgetData.remainingBudget || 0)}
              </div>
              <p className="text-xs text-blue-700 mt-1">Available to spend</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">Savings Goal</CardTitle>
              <Target className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">
                {budgetData.savingsProgress?.toFixed(1) || 0}%
              </div>
              <Progress 
                value={budgetData.savingsProgress || 0} 
                className="mt-2 h-2"
              />
              <p className="text-xs text-purple-700 mt-1">
                Goal: {formatCurrency(mockBudgetLimits.savings_goal)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Category Overview */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <PieChart className="w-5 h-5" />
              Category Breakdown
            </CardTitle>
            <CardDescription>
              Your spending across different categories this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.values(mockCategories).map(category => {
                const categoryTotal = getCategoryExpenses(category.id);
                const categoryBudget = category.subcategories.reduce((sum, sub) => sum + sub.budgetLimit, 0);
                const percentage = (categoryTotal / categoryBudget) * 100;
                
                return (
                  <div key={category.id} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-slate-700 capitalize">{category.name}</h4>
                      <Badge 
                        variant={percentage > 90 ? "destructive" : percentage > 70 ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {percentage.toFixed(0)}%
                      </Badge>
                    </div>
                    <Progress value={Math.min(percentage, 100)} className="h-2" />
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>{formatCurrency(categoryTotal)}</span>
                      <span>{formatCurrency(categoryBudget)} budget</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-slate-800">Recent Transactions</CardTitle>
            <CardDescription>Your latest income and expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expenses.slice(0, 5).map(expense => (
                <div key={expense.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-800">{expense.description}</span>
                    <span className="text-sm text-slate-600 capitalize">
                      {mockCategories[expense.category]?.name} • {expense.subcategory}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-rose-600">
                      -{formatCurrency(expense.amount)}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(expense.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={onViewReports}
            >
              View All Transactions
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;