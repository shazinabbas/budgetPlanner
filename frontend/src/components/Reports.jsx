import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { ArrowLeft, Download, Filter, TrendingUp, Calendar, IndianRupee } from 'lucide-react';
import { cacheStore } from '../services/cache';
import { useToast } from '../hooks/use-toast';

const Reports = ({ onBack }) => {
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { toast } = useToast();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Get available months from actual transactions
  const availableMonths = useMemo(() => {
    const expenses = cacheStore.getExpenses();
    const monthSet = new Set();
    
    expenses.forEach(expense => {
      const date = new Date(expense.date);
      const month = date.toLocaleString('en-US', { month: 'short' }); // Jan, Feb, etc.
      const year = date.getFullYear();
      monthSet.add(`${month}-${year}`);
    });
    
    // Convert to array and sort by date (newest first)
    const monthsArray = Array.from(monthSet).sort((a, b) => {
      const [monthA, yearA] = a.split('-');
      const [monthB, yearB] = b.split('-');
      const monthMap = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      };
      
      const dateA = new Date(parseInt(yearA), monthMap[monthA]);
      const dateB = new Date(parseInt(yearB), monthMap[monthB]);
      
      return dateB - dateA; // Newest first
    });
    
    return monthsArray;
  }, []);

  const monthlyStats = useMemo(() => {
    const allExpenses = cacheStore.getExpenses();
    const categories = cacheStore.getCategories();
    const paymentMethods = cacheStore.getPaymentMethods();
    
    // Filter by selected month if not "all"
    let expenses = allExpenses;
    if (selectedMonth !== 'all') {
      const [monthName, year] = selectedMonth.split('-');
      const monthMap = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      };
      const monthIndex = monthMap[monthName];
      
      expenses = allExpenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === monthIndex && expenseDate.getFullYear() === parseInt(year);
      });
    }
    
    // Separate income and expenses
    const expenseTransactions = expenses.filter(e => e.category !== 'income');
    const incomeTransactions = expenses.filter(e => e.category === 'income');
    
    const totalExpenses = expenseTransactions.reduce((sum, expense) => sum + expense.amount, 0);
    const totalIncome = incomeTransactions.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Category breakdown (expenses only)
    const categoryBreakdown = Object.keys(categories)
      .filter(id => id !== 'income')
      .map(categoryId => {
        const categoryExpenses = expenseTransactions.filter(expense => expense.category === categoryId);
        const categoryTotal = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        
        return {
          id: categoryId,
          name: categories[categoryId].name,
          total: categoryTotal,
          percentage: totalExpenses > 0 ? ((categoryTotal / totalExpenses) * 100).toFixed(1) : 0,
          transactions: categoryExpenses.length
        };
      })
      .filter(cat => cat.total > 0); // Only show categories with expenses

    const paymentMethodBreakdown = paymentMethods.map(method => {
      const methodExpenses = expenseTransactions.filter(expense => expense.paymentMethod === method.id);
      const methodTotal = methodExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      return {
        ...method,
        total: methodTotal,
        percentage: totalExpenses > 0 ? ((methodTotal / totalExpenses) * 100).toFixed(1) : 0,
        transactions: methodExpenses.length
      };
    }).filter(method => method.total > 0);

    return {
      totalExpenses,
      totalIncome,
      netSavings: totalIncome - totalExpenses,
      categoryBreakdown,
      paymentMethodBreakdown
    };
  }, [selectedMonth]);

  const filteredExpenses = useMemo(() => {
    let expenses = cacheStore.getExpenses();
    
    // Filter by month
    if (selectedMonth !== 'all') {
      const [monthName, year] = selectedMonth.split('-');
      const monthMap = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      };
      const monthIndex = monthMap[monthName];
      
      expenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === monthIndex && expenseDate.getFullYear() === parseInt(year);
      });
    }
    
    // Filter by category
    return expenses.filter(expense =>
      selectedCategory === 'all' || expense.category === selectedCategory
    );
  }, [selectedCategory, selectedMonth]);

  const handleExportCSV = () => {
    const categories = cacheStore.getCategories();
    const paymentMethods = cacheStore.getPaymentMethods();
    
    // CSV headers
    const headers = ['Date', 'Description', 'Category', 'Subcategory', 'Amount', 'Payment Method'];
    
    // CSV rows
    const rows = filteredExpenses.map(expense => {
      const category = categories[expense.category];
      const subcategory = category?.subcategories.find(s => s.id === expense.subcategory);
      const paymentMethod = paymentMethods.find(p => p.id === expense.paymentMethod);
      
      return [
        expense.date,
        `"${expense.description.replace(/"/g, '""')}"`,
        category?.name || expense.category,
        subcategory?.name || expense.subcategory,
        expense.category === 'income' ? expense.amount : -expense.amount,
        paymentMethod?.name || expense.paymentMethod
      ].join(',');
    });
    
    const csv = [headers.join(','), ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `report_${selectedCategory}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Successful!",
      description: `Exported ${filteredExpenses.length} transaction(s) to CSV.`,
    });
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
                  <option value="all">All Months</option>
                  {availableMonths.length > 0 && <option disabled>───────────</option>}
                  {availableMonths.map(monthYear => {
                    const [month, year] = monthYear.split('-');
                    return (
                      <option key={monthYear} value={monthYear}>
                        {month} {year}
                      </option>
                    );
                  })}
                  {availableMonths.length === 0 && (
                    <option disabled>No transactions yet</option>
                  )}
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
                  {Object.values(cacheStore.getCategories()).map(category => (
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
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> Monthly trends feature will show historical data once you have transactions across multiple months.
                      Current data shows this month's totals.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Current Month</span>
                      <span className="text-slate-600">
                        Savings: {formatCurrency(monthlyStats.netSavings)} 
                        {monthlyStats.totalIncome > 0 ? 
                          ` (${((monthlyStats.netSavings / monthlyStats.totalIncome) * 100).toFixed(1)}%)` : 
                          ''
                        }
                      </span>
                    </div>
                    <div className="relative h-8 bg-slate-100 rounded-lg overflow-hidden">
                      <div 
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-red-400 to-red-500"
                        style={{ 
                          width: monthlyStats.totalIncome > 0 ? 
                            `${Math.min((monthlyStats.totalExpenses / monthlyStats.totalIncome) * 100, 100)}%` : 
                            '0%' 
                        }}
                      />
                      {monthlyStats.netSavings > 0 && (
                        <div 
                          className="absolute right-0 top-0 h-full bg-gradient-to-r from-green-400 to-green-500"
                          style={{ 
                            width: monthlyStats.totalIncome > 0 ? 
                              `${(monthlyStats.netSavings / monthlyStats.totalIncome) * 100}%` : 
                              '0%' 
                          }}
                        />
                      )}
                    </div>
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Expenses: {formatCurrency(monthlyStats.totalExpenses)}</span>
                      <span>Income: {formatCurrency(monthlyStats.totalIncome)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-800">Total Expenses</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {formatCurrency(monthlyStats.totalExpenses)}
                      </p>
                    </div>
                    <IndianRupee className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-800">Average Monthly Savings</p>
                      <p className="text-2xl font-bold text-green-900">
                        {formatCurrency(cacheStore.getIncome().amount - monthlyStats.totalExpenses)}
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
                      <p className="text-2xl font-bold text-purple-900">{cacheStore.getExpenses().length}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            {/* Income Section */}
            {monthlyStats.totalIncome > 0 && (
              <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100">
                <CardHeader>
                  <CardTitle className="text-emerald-800">Income</CardTitle>
                  <CardDescription>Total income received</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-emerald-700">Income</h4>
                        <Badge variant="secondary" className="bg-emerald-200 text-emerald-800">
                          {cacheStore.getExpenses().filter(e => e.category === 'income').length} transactions
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-emerald-700 text-lg">+{formatCurrency(monthlyStats.totalIncome)}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Expense Categories */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Expense Categories</CardTitle>
                <CardDescription>How much you're spending in each category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {monthlyStats.categoryBreakdown.length > 0 ? (
                    monthlyStats.categoryBreakdown.map(category => (
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
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      No expense categories with transactions yet.
                    </div>
                  )}
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
                  All your expenses {selectedCategory !== 'all' && `in ${cacheStore.getCategories()[selectedCategory]?.name}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredExpenses.length > 0 ? (
                    filteredExpenses.map(expense => {
                      const isIncome = expense.category === 'income';
                      return (
                        <div key={expense.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                          <div className="flex flex-col space-y-1">
                            <span className="font-medium text-slate-800">{expense.description}</span>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Badge variant="outline" className="text-xs">
                                {cacheStore.getCategories()[expense.category]?.name}
                              </Badge>
                              <span>•</span>
                              <span className="capitalize">
                                {cacheStore.getCategories()[expense.category]?.subcategories.find(s => s.id === expense.subcategory)?.name || expense.subcategory}
                              </span>
                              <span>•</span>
                              <span>{cacheStore.getPaymentMethods().find(pm => pm.id === expense.paymentMethod)?.name}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-semibold ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {isIncome ? '+' : '-'}{formatCurrency(expense.amount)}
                            </div>
                            <div className="text-xs text-slate-500">
                              {new Date(expense.date).toLocaleDateString('en-IN')}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      No transactions found for the selected filters.
                    </div>
                  )}
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