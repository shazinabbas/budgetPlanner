import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { ArrowLeft, Save, Wallet } from 'lucide-react';
import { cacheStore } from '../services/cache';
import { useToast } from '../hooks/use-toast';

const IncomeForm = ({ onBack, onSave }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    source: '',
    amount: '',
    currency: 'INR',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    // Load current income data
    const currentIncome = cacheStore.getIncome();
    setFormData({
      source: currentIncome.source || '',
      amount: currentIncome.amount || '',
      currency: currentIncome.currency || 'INR',
      date: currentIncome.date || new Date().toISOString().split('T')[0]
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? value : value
    }));
  };

  const handleSave = () => {
    if (!formData.source.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter an income source",
        variant: "destructive"
      });
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid amount",
        variant: "destructive"
      });
      return;
    }

    const incomeData = {
      id: '1',
      source: formData.source,
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      date: formData.date
    };

    cacheStore.updateIncome(incomeData);
    
    toast({
      title: "Income Updated!",
      description: `${formData.source} - ₹${parseFloat(formData.amount).toLocaleString('en-IN')}`,
    });

    if (onSave) {
      onSave(incomeData);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
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
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Wallet className="w-6 h-6" />
              Manage Income
            </CardTitle>
            <CardDescription className="text-green-100">
              Set up and track your monthly income
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 p-6">
            {/* Income Source */}
            <div className="space-y-2">
              <Label htmlFor="source" className="text-slate-700">Income Source</Label>
              <Input
                id="source"
                name="source"
                placeholder="e.g., Primary Job, Freelance, Investment Returns"
                value={formData.source}
                onChange={handleChange}
                className="border-slate-300"
              />
              <p className="text-xs text-slate-500">
                Describe where your income comes from
              </p>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-slate-700">Monthly Amount</Label>
              <div className="flex items-center gap-2">
                <span className="text-xl font-semibold text-slate-700">₹</span>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  placeholder="0"
                  value={formData.amount}
                  onChange={handleChange}
                  className="border-slate-300 text-lg"
                  min="0"
                  step="100"
                />
              </div>
              <p className="text-xs text-slate-500">
                Enter your monthly income amount
              </p>
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <Label htmlFor="currency" className="text-slate-700">Currency</Label>
              <Input
                id="currency"
                name="currency"
                value={formData.currency}
                disabled
                className="border-slate-300 bg-slate-50"
              />
              <p className="text-xs text-slate-500">
                Currently set to Indian Rupee (INR)
              </p>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date" className="text-slate-700">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                className="border-slate-300"
              />
              <p className="text-xs text-slate-500">
                When this income is typically received
              </p>
            </div>

            {/* Summary */}
            {formData.amount && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-900">
                  <span className="font-semibold">Monthly Income:</span>{' '}
                  <span className="text-lg font-bold text-green-700">
                    ₹{parseFloat(formData.amount || 0).toLocaleString('en-IN')}
                  </span>
                </p>
                <p className="text-sm text-green-800 mt-2">
                  <span className="font-semibold">Annual Income:</span>{' '}
                  <span className="text-lg font-bold text-green-700">
                    ₹{(parseFloat(formData.amount || 0) * 12).toLocaleString('en-IN')}
                  </span>
                </p>
              </div>
            )}

            {/* Save Button */}
            <Button
              onClick={handleSave}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold h-10 rounded-lg flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Income
            </Button>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader>
            <CardTitle className="text-blue-900">Income Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-blue-800">
            <p>• Your income is used to calculate remaining budget and savings</p>
            <p>• Update this whenever your income changes</p>
            <p>• All your budget calculations are based on this amount</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IncomeForm;
