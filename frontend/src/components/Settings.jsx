import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ArrowLeft, Plus, Edit3, Trash2, Save, X, AlertCircle, Settings as SettingsIcon } from 'lucide-react';
import { cacheStore } from '../services/cache';
import { updateSettings } from '../services/syncService';
import { useToast } from '../hooks/use-toast';
import { cn } from '../lib/utils';

const Settings = ({ onBack, onUpdate }) => {
  const [categories, setCategories] = useState(cacheStore.getCategories());
  const [paymentMethods, setPaymentMethods] = useState(cacheStore.getPaymentMethods());
  const { toast } = useToast();

  // Category states
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryFormData, setCategoryFormData] = useState({ id: '', name: '' });

  // Subcategory states
  const [isSubcategoryDialogOpen, setIsSubcategoryDialogOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [selectedCategoryForSub, setSelectedCategoryForSub] = useState(null);
  const [subcategoryFormData, setSubcategoryFormData] = useState({ id: '', name: '', budgetLimit: 0 });

  // Payment method states
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [paymentFormData, setPaymentFormData] = useState({ id: '', name: '', type: 'cash' });

  // Category functions
  const handleAddCategory = () => {
    setEditingCategory(null);
    setCategoryFormData({ id: '', name: '' });
    setIsCategoryDialogOpen(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryFormData({ id: category.id, name: category.name });
    setIsCategoryDialogOpen(true);
  };

  const handleSaveCategory = () => {
    if (!categoryFormData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Category name is required",
        variant: "destructive"
      });
      return;
    }

    const newCategories = { ...categories };
    const categoryId = editingCategory ? categoryFormData.id : categoryFormData.name.toLowerCase().replace(/\s+/g, '_');

    if (!editingCategory && newCategories[categoryId]) {
      toast({
        title: "Category Exists",
        description: "A category with this ID already exists",
        variant: "destructive"
      });
      return;
    }

    if (editingCategory) {
      newCategories[categoryId].name = categoryFormData.name;
    } else {
      newCategories[categoryId] = {
        id: categoryId,
        name: categoryFormData.name,
        subcategories: []
      };
    }

    updateSettings('categories', newCategories);
    setCategories(newCategories);
    setIsCategoryDialogOpen(false);

    toast({
      title: editingCategory ? "Category Updated" : "Category Added",
      description: `${categoryFormData.name} has been ${editingCategory ? 'updated' : 'added'} successfully.`,
    });
  };

  const handleDeleteCategory = (categoryId) => {
    if (window.confirm(`Are you sure you want to delete this category? This cannot be undone.`)) {
      const newCategories = { ...categories };
      delete newCategories[categoryId];
      updateSettings('categories', newCategories);
      setCategories(newCategories);

      toast({
        title: "Category Deleted",
        description: "Category has been deleted successfully.",
      });
    }
  };

  // Subcategory functions
  const handleAddSubcategory = (categoryId) => {
    setSelectedCategoryForSub(categoryId);
    setEditingSubcategory(null);
    setSubcategoryFormData({ id: '', name: '', budgetLimit: 0 });
    setIsSubcategoryDialogOpen(true);
  };

  const handleEditSubcategory = (categoryId, subcategory) => {
    setSelectedCategoryForSub(categoryId);
    setEditingSubcategory(subcategory);
    setSubcategoryFormData({ ...subcategory });
    setIsSubcategoryDialogOpen(true);
  };

  const handleSaveSubcategory = () => {
    if (!subcategoryFormData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Subcategory name is required",
        variant: "destructive"
      });
      return;
    }

    const newCategories = { ...categories };
    const subcategoryId = editingSubcategory ? subcategoryFormData.id : subcategoryFormData.name.toLowerCase().replace(/\s+/g, '_');

    if (!editingSubcategory) {
      const exists = newCategories[selectedCategoryForSub].subcategories.some(sub => sub.id === subcategoryId);
      if (exists) {
        toast({
          title: "Subcategory Exists",
          description: "A subcategory with this ID already exists",
          variant: "destructive"
        });
        return;
      }

      newCategories[selectedCategoryForSub].subcategories.push({
        id: subcategoryId,
        name: subcategoryFormData.name,
        budgetLimit: parseFloat(subcategoryFormData.budgetLimit) || 0
      });
    } else {
      const subIndex = newCategories[selectedCategoryForSub].subcategories.findIndex(
        sub => sub.id === editingSubcategory.id
      );
      newCategories[selectedCategoryForSub].subcategories[subIndex] = {
        id: subcategoryId,
        name: subcategoryFormData.name,
        budgetLimit: parseFloat(subcategoryFormData.budgetLimit) || 0
      };
    }

    updateSettings('categories', newCategories);
    setCategories(newCategories);
    setIsSubcategoryDialogOpen(false);

    toast({
      title: editingSubcategory ? "Subcategory Updated" : "Subcategory Added",
      description: `${subcategoryFormData.name} has been ${editingSubcategory ? 'updated' : 'added'} successfully.`,
    });
  };

  const handleDeleteSubcategory = (categoryId, subcategoryId) => {
    if (window.confirm(`Are you sure you want to delete this subcategory?`)) {
      const newCategories = { ...categories };
      newCategories[categoryId].subcategories = newCategories[categoryId].subcategories.filter(
        sub => sub.id !== subcategoryId
      );
      updateSettings('categories', newCategories);
      setCategories(newCategories);

      toast({
        title: "Subcategory Deleted",
        description: "Subcategory has been deleted successfully.",
      });
    }
  };

  // Payment method functions
  const handleAddPayment = () => {
    setEditingPayment(null);
    setPaymentFormData({ id: '', name: '', type: 'cash' });
    setIsPaymentDialogOpen(true);
  };

  const handleEditPayment = (payment) => {
    setEditingPayment(payment);
    setPaymentFormData({ ...payment });
    setIsPaymentDialogOpen(true);
  };

  const handleSavePayment = () => {
    if (!paymentFormData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Payment method name is required",
        variant: "destructive"
      });
      return;
    }

    const newPayments = [...paymentMethods];
    const paymentId = editingPayment ? paymentFormData.id : paymentFormData.name.toLowerCase().replace(/\s+/g, '_');

    if (!editingPayment) {
      const exists = newPayments.some(pm => pm.id === paymentId);
      if (exists) {
        toast({
          title: "Payment Method Exists",
          description: "A payment method with this ID already exists",
          variant: "destructive"
        });
        return;
      }

      newPayments.push({
        id: paymentId,
        name: paymentFormData.name,
        type: paymentFormData.type
      });
    } else {
      const pmIndex = newPayments.findIndex(pm => pm.id === editingPayment.id);
      newPayments[pmIndex] = {
        id: paymentId,
        name: paymentFormData.name,
        type: paymentFormData.type
      };
    }

    updateSettings('paymentMethods', newPayments);
    setPaymentMethods(newPayments);
    setIsPaymentDialogOpen(false);

    toast({
      title: editingPayment ? "Payment Method Updated" : "Payment Method Added",
      description: `${paymentFormData.name} has been ${editingPayment ? 'updated' : 'added'} successfully.`,
    });
  };

  const handleDeletePayment = (paymentId) => {
    if (window.confirm(`Are you sure you want to delete this payment method?`)) {
      const newPayments = paymentMethods.filter(pm => pm.id !== paymentId);
      updateSettings('paymentMethods', newPayments);
      setPaymentMethods(newPayments);

      toast({
        title: "Payment Method Deleted",
        description: "Payment method has been deleted successfully.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
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

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
            <SettingsIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Settings</h1>
            <p className="text-slate-600">Manage categories, subcategories, and payment methods</p>
          </div>
        </div>

        <Tabs defaultValue="categories" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="subcategories">Subcategories</TabsTrigger>
            <TabsTrigger value="payments">Payment Methods</TabsTrigger>
          </TabsList>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Manage Categories</CardTitle>
                    <CardDescription>Add, edit, or remove expense categories</CardDescription>
                  </div>
                  <Button onClick={handleAddCategory} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Category
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.values(categories).map(category => (
                    <div key={category.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-sm">
                          {category.name}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {category.subcategories.length} subcategories
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCategory(category)}
                          className="hover:bg-blue-50"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCategory(category.id)}
                          className="hover:bg-red-50 text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {Object.keys(categories).length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <p>No categories found. Click "Add Category" to create one.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subcategories Tab */}
          <TabsContent value="subcategories" className="space-y-4">
            {Object.values(categories).map(category => (
              <Card key={category.id} className="border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <CardDescription>Manage subcategories for {category.name}</CardDescription>
                    </div>
                    <Button 
                      onClick={() => handleAddSubcategory(category.id)} 
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Subcategory
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {category.subcategories.map(subcategory => (
                      <div key={subcategory.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-sm">{subcategory.name}</span>
                          {subcategory.budgetLimit > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              Budget: ₹{subcategory.budgetLimit.toLocaleString('en-IN')}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditSubcategory(category.id, subcategory)}
                            className="hover:bg-blue-50"
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSubcategory(category.id, subcategory.id)}
                            className="hover:bg-red-50 text-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {category.subcategories.length === 0 && (
                      <div className="text-center py-6 text-gray-500 text-sm">
                        <p>No subcategories yet. Click "Add Subcategory" to create one.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Payment Methods Tab */}
          <TabsContent value="payments" className="space-y-4">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Manage Payment Methods</CardTitle>
                    <CardDescription>Add, edit, or remove payment methods</CardDescription>
                  </div>
                  <Button onClick={handleAddPayment} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Payment Method
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {paymentMethods.map(payment => (
                    <div key={payment.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{payment.name}</span>
                        <Badge variant="outline" className="text-xs capitalize">
                          {payment.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditPayment(payment)}
                          className="hover:bg-blue-50"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePayment(payment.id)}
                          className="hover:bg-red-50 text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {paymentMethods.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <p>No payment methods found. Click "Add Payment Method" to create one.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Category Dialog */}
        <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
              <DialogDescription>
                {editingCategory ? 'Update category details' : 'Create a new expense category'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="category-name" className="flex items-center gap-2">
                  Category Name *
                  {!categoryFormData.name.trim() && (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                </Label>
                <Input
                  id="category-name"
                  placeholder="e.g., Healthcare, Education"
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  className={cn(!categoryFormData.name.trim() && "border-red-500")}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSaveCategory} className="bg-gradient-to-r from-blue-500 to-blue-600">
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Subcategory Dialog */}
        <Dialog open={isSubcategoryDialogOpen} onOpenChange={setIsSubcategoryDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSubcategory ? 'Edit Subcategory' : 'Add New Subcategory'}</DialogTitle>
              <DialogDescription>
                {editingSubcategory ? 'Update subcategory details' : 'Create a new subcategory'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="subcategory-name" className="flex items-center gap-2">
                  Subcategory Name *
                  {!subcategoryFormData.name.trim() && (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                </Label>
                <Input
                  id="subcategory-name"
                  placeholder="e.g., Doctor Visits, Online Courses"
                  value={subcategoryFormData.name}
                  onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, name: e.target.value })}
                  className={cn(!subcategoryFormData.name.trim() && "border-red-500")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget-limit">Budget Limit (Optional)</Label>
                <Input
                  id="budget-limit"
                  type="number"
                  placeholder="Enter budget limit in ₹"
                  value={subcategoryFormData.budgetLimit}
                  onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, budgetLimit: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsSubcategoryDialogOpen(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSaveSubcategory} className="bg-gradient-to-r from-blue-500 to-blue-600">
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Payment Method Dialog */}
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPayment ? 'Edit Payment Method' : 'Add New Payment Method'}</DialogTitle>
              <DialogDescription>
                {editingPayment ? 'Update payment method details' : 'Create a new payment method'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="payment-name" className="flex items-center gap-2">
                  Payment Method Name *
                  {!paymentFormData.name.trim() && (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                </Label>
                <Input
                  id="payment-name"
                  placeholder="e.g., Axis Credit Card, PayPal"
                  value={paymentFormData.name}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, name: e.target.value })}
                  className={cn(!paymentFormData.name.trim() && "border-red-500")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-type">Type</Label>
                <select
                  id="payment-type"
                  value={paymentFormData.type}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="credit">Credit Card</option>
                  <option value="debit">Debit Card</option>
                  <option value="neft">NEFT/RTGS</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSavePayment} className="bg-gradient-to-r from-blue-500 to-blue-600">
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Settings;
