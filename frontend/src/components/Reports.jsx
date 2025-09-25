import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { ArrowLeft, Download, Filter, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { mockExpenses, mockIncomeData, mockCategories, mockPaymentMethods, mockMonthlyData } from '../utils/mockData';

const Reports = ({ onBack }) => {
  const [selectedMonth, setSelectedMonth] = useState('Jul');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const monthlyStats = useMemo(() => {
    const currentMonthData = mockMonthlyData.find(data => data.month === selectedMonth);
    const totalExpenses = mockExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    const categoryBreakdown = Object.keys(mockCategories).map(categoryId => {
      const categoryExpenses = mockExpenses.filter(expense => expense.category === categoryId);
      const categoryTotal = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      return {
        id: categoryId,
        name: mockCategories[categoryId].name,
        total: categoryTotal,
        percentage: ((categoryTotal / totalExpenses) * 100).toFixed(1),
        transactions: categoryExpenses.length
      };
    });

    const paymentMethodBreakdown = mockPaymentMethods.map(method => {
      const methodExpenses = mockExpenses.filter(expense => expense.paymentMethod === method.id);
      const methodTotal = methodExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      return {
        ...method,
        total: methodTotal,
        percentage: ((methodTotal / totalExpenses) * 100).toFixed(1),
        transactions: methodExpenses.length
      };
    }).filter(method => method.total > 0);

    return {
      currentMonthData,
      totalExpenses,
      categoryBreakdown,
      paymentMethodBreakdown
    };
  }, [selectedMonth]);

  const filteredExpenses = useMemo(() => {
    return mockExpenses.filter(expense => 
      selectedCategory === 'all' || expense.category === selectedCategory
    );
  }, [selectedCategory]);

  const handleExportCSV = () => {
    const csvData = [
      ['Date', 'Description', 'Category', 'Subcategory', 'Payment Method', 'Amount'],
      ...filteredExpenses.map(expense => [
        expense.date,
        expense.description,
        mockCategories[expense.category]?.name || expense.category,
        expense.subcategory,
        mockPaymentMethods.find(pm => pm.id === expense.paymentMethod)?.name || expense.paymentMethod,
        expense.amount
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses_${selectedMonth}_2024.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    alert('PDF export functionality will be implemented in the backend integration phase.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Financial Reports</h1>
              <p className="text-slate-600">Analyze your spending patterns and trends</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={handleExportPDF} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Month</label>
                <select 
                  className="px-3 py-2 border rounded-md"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  {mockMonthlyData.map(data => (
                    <option key={data.month} value={data.month}>{data.month} 2024</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <select 
                  className="px-3 py-2 border rounded-md"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {Object.values(mockCategories).map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="payments">Payment Methods</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Monthly Trend Chart */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Monthly Trends
                </CardTitle>
                <CardDescription>Income, expenses, and savings over the past 7 months</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockMonthlyData.map((data, index) => (
                    <div key={data.month} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{data.month} 2024</span>
                        <span className="text-slate-600">
                          Savings: {formatCurrency(data.savings)} ({((data.savings / data.income) * 100).toFixed(1)}%)
                        </span>
                      </div>
                      <div className="relative h-8 bg-slate-100 rounded-lg overflow-hidden">
                        <div 
                          className="absolute left-0 top-0 h-full bg-gradient-to-r from-red-400 to-red-500"
                          style={{ width: `${(data.expenses / data.income) * 100}%` }}
                        />
                        <div 
                          className="absolute right-0 top-0 h-full bg-gradient-to-r from-green-400 to-green-500"
                          style={{ width: `${(data.savings / data.income) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Expenses: {formatCurrency(data.expenses)}</span>
                        <span>Income: {formatCurrency(data.income)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-800">Average Monthly Expense</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {formatCurrency(mockMonthlyData.reduce((sum, data) => sum + data.expenses, 0) / mockMonthlyData.length)}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-800">Average Monthly Savings</p>
                      <p className="text-2xl font-bold text-green-900">
                        {formatCurrency(mockMonthlyData.reduce((sum, data) => sum + data.savings, 0) / mockMonthlyData.length)}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-800">Total Transactions</p>
                      <p className="text-2xl font-bold text-purple-900">{mockExpenses.length}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
                <CardDescription>How much you're spending in each category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {monthlyStats.categoryBreakdown.map(category => (
                    <div key={category.id} className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold text-slate-700">{category.name}</h4>
                          <Badge variant="secondary">{category.transactions} transactions</Badge>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{formatCurrency(category.total)}</div>
                          <div className="text-sm text-slate-600">{category.percentage}%</div>
                        </div>
                      </div>
                      <Progress value={parseFloat(category.percentage)} className="h-3" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Payment Method Usage</CardTitle>
                <CardDescription>How you're paying for your expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {monthlyStats.paymentMethodBreakdown.map(method => (
                    <div key={method.id} className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold text-slate-700">{method.name}</h4>
                          <Badge variant={method.type === 'credit' ? 'destructive' : 'secondary'}>
                            {method.type.toUpperCase()}
                          </Badge>
                          <span className="text-sm text-slate-600">{method.transactions} transactions</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{formatCurrency(method.total)}</div>
                          <div className="text-sm text-slate-600">{method.percentage}%</div>
                        </div>
                      </div>
                      <Progress value={parseFloat(method.percentage)} className="h-3" />
                      {method.type === 'credit' && (
                        <p className="text-xs text-orange-600">Due date: {method.dueDate}th of each month</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>
                  All your expenses {selectedCategory !== 'all' && `in ${mockCategories[selectedCategory]?.name}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredExpenses.map(expense => (
                    <div key={expense.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="flex flex-col space-y-1">
                        <span className="font-medium text-slate-800">{expense.description}</span>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Badge variant="outline" className="text-xs">
                            {mockCategories[expense.category]?.name}
                          </Badge>
                          <span>•</span>
                          <span className="capitalize">{expense.subcategory}</span>
                          <span>•</span>
                          <span>{mockPaymentMethods.find(pm => pm.id === expense.paymentMethod)?.name}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-rose-600">
                          -{formatCurrency(expense.amount)}
                        </div>
                        <div className="text-xs text-slate-500">
                          {new Date(expense.date).toLocaleDateString('en-IN')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Reports;