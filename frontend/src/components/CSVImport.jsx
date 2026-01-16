import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { Upload, Download, FileText, Check, X, AlertCircle, Plus } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { cacheStore } from '../services/cache';

const CSVImport = ({ onImport, onCategoriesUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [csvData, setCsvData] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const csvTemplate = `Date,Description,Amount,Category,Subcategory,Payment Method
2024-07-15,Monthly Rent,22000,needs,rent,neft
2024-07-12,Grocery Shopping,3500,needs,groceries,gpay
2024-07-10,Movie Tickets,1200,wants,entertainment,hdfc_credit
2024-07-15,SIP Investment,5000,investments,mutual_funds,neft`;

  const downloadTemplate = () => {
    const blob = new Blob([csvTemplate], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'budget_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const validateCSVRow = (row, rowIndex) => {
    const errors = [];
    if (!row.Date) errors.push(`Row ${rowIndex + 1}: Missing date`);
    if (!row.Description) errors.push(`Row ${rowIndex + 1}: Missing description`);
    if (!row.Amount || isNaN(parseFloat(row.Amount))) errors.push(`Row ${rowIndex + 1}: Invalid amount`);
    return errors;
  };

  const parseCSV = (csvText) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file is empty or has no data rows');
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const requiredHeaders = ['Date', 'Description', 'Amount'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
    }

    const data = [];
    const errors = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      const rowErrors = validateCSVRow(row, i - 1);
      errors.push(...rowErrors);
      
      data.push(row);
    }
    
    return { data, errors };
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    setIsProcessing(true);
    const reader = new FileReader();

    if (ext === 'csv') {
      reader.onload = (e) => {
        try {
          const csvText = e.target.result;
          const { data, errors } = parseCSV(csvText);
          setCsvData(data);
          setValidationErrors(errors);
          setIsProcessing(false);
          if (errors.length === 0) {
            toast({
              title: "CSV Parsed Successfully",
              description: `Found ${data.length} transactions ready to import.`,
            });
          }
        } catch (error) {
          setValidationErrors([error.message]);
          setIsProcessing(false);
          toast({
            title: "CSV Parse Error",
            description: error.message,
            variant: "destructive"
          });
        }
      };
      reader.readAsText(file);
    } else if (ext === 'xls' || ext === 'xlsx') {
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const XLSX = require('xlsx');
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const xlsRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // Header detection and transaction extraction
          let headerRowIdx = -1;
          let headerRow = null;
          for (let i = 0; i < xlsRows.length; i++) {
            const row = xlsRows[i].map(cell => String(cell).trim());
            if (
              row.length >= 7 &&
              row[0].replace(/\s/g, '').toLowerCase() === 'date' &&
              row[1].replace(/\s/g, '').toLowerCase() === 'narration' &&
              row[2].replace(/\s/g, '').toLowerCase().includes('chq') &&
              row[3].replace(/\s/g, '').toLowerCase().includes('value') &&
              row[4].replace(/\s/g, '').toLowerCase().includes('withdrawal') &&
              row[5].replace(/\s/g, '').toLowerCase().includes('deposit') &&
              row[6].replace(/\s/g, '').toLowerCase().includes('balance')
            ) {
              headerRowIdx = i;
              headerRow = row;
              break;
            }
          }
          console.log('HDFC XLS Transaction Header:', headerRow);
          if (headerRowIdx === -1) {
            setValidationErrors(['Could not find transaction header row in XLS file.']);
            setIsProcessing(false);
            return;
          }
          
          // Helper function to convert Excel date serial number to DD/MM/YY
          const excelDateToJSDate = (excelDate) => {
            // Excel date starts from 1900-01-01 (serial 1)
            const excelEpoch = new Date(Date.UTC(1899, 11, 30));
            const date = new Date(excelEpoch.getTime() + excelDate * 86400 * 1000);
            const day = String(date.getUTCDate()).padStart(2, '0');
            const month = String(date.getUTCMonth() + 1).padStart(2, '0');
            const year = String(date.getUTCFullYear()).slice(-2);
            return `${day}/${month}/${year}`;
          };
          
          const transactions = [];
          for (let i = headerRowIdx + 1; i < xlsRows.length; i++) {
            const row = xlsRows[i];
            if (!row || row.length < 7 || !row[0]) continue;
            
            // Skip rows that don't have a valid date in the first column
            const dateValue = row[0];
            const dateStr = String(dateValue).trim();
            
            // Check if it's a valid date format (DD/MM/YY or DD/MM/YYYY or Excel date number)
            const isDateString = /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(dateStr);
            const isExcelDate = typeof dateValue === 'number' && dateValue > 1 && dateValue < 100000;
            
            if (!isDateString && !isExcelDate) continue;
            
            // Skip rows with footer/summary keywords in narration
            const narration = String(row[1] || '').toLowerCase();
            if (narration.includes('closing balance') || 
                narration.includes('opening balance') ||
                narration.includes('total') ||
                narration.startsWith('*')) {
              continue;
            }
            
            // Convert Excel date to readable format if needed
            let formattedDate = dateStr;
            if (isExcelDate) {
              formattedDate = excelDateToJSDate(dateValue);
            }
            
            transactions.push({
              date: formattedDate,
              narration: row[1],
              refNo: row[2],
              valueDate: row[3],
              withdrawal: row[4],
              deposit: row[5],
              balance: row[6],
            });
          }
          
          // Map transactions to CSV format for preview
          const mappedData = transactions.map(t => {
            let amount = 0;
            let category = '';
            const withdrawal = parseFloat(t.withdrawal) || 0;
            const deposit = parseFloat(t.deposit) || 0;
            
            // Set category and amount based on transaction type
            if (withdrawal > 0) {
              amount = withdrawal;
              category = 'needs'; // Default expense category
            } else if (deposit > 0) {
              amount = deposit;
              category = 'income'; // Income category
            }
            
            return {
              Date: t.date,
              Description: t.narration,
              Amount: amount,
              Category: category,
              Subcategory: '',
              'Payment Method': ''
            };
          });
          
          setCsvData(mappedData);
          setValidationErrors([]);
          setPreviewData(mappedData.slice(0, 5));
          setIsProcessing(false);
          
          toast({
            title: "XLS Parsed Successfully",
            description: `Found ${transactions.length} transactions ready to import.`,
          });
          
          // Show reminder for missing fields
          setTimeout(() => {
            toast({
              title: "⚠️ Reminder: Add Missing Details",
              description: "Don't forget to add Category, Subcategory, and Payment Method before importing!",
              variant: "default",
              duration: 8000,
            });
          }, 1000);
        } catch (error) {
          setValidationErrors([error.message]);
          setIsProcessing(false);
          toast({
            title: "XLS Parse Error",
            description: error.message,
            variant: "destructive"
          });
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      setIsProcessing(false);
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV or XLS/XLSX file.",
        variant: "destructive"
      });
    }
  };

  const processImport = () => {
    if (validationErrors.length > 0) {
      toast({
        title: "Cannot Import",
        description: "Please fix validation errors before importing.",
        variant: "destructive"
      });
      return;
    }

    // Helper to convert DD/MM/YY to YYYY-MM-DD
    const convertDateToISO = (dateStr) => {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        let year = parts[2];
        // Convert 2-digit year to 4-digit (25 -> 2025, 26 -> 2026)
        if (year.length === 2) {
          year = parseInt(year) >= 50 ? `19${year}` : `20${year}`;
        }
        return `${year}-${month}-${day}`;
      }
      return dateStr; // Return as-is if format is unexpected
    };

    const processedTransactions = [];
    const currentCategories = cacheStore.getCategories();
    const paymentMethods = cacheStore.getPaymentMethods();
    const newCategories = { ...currentCategories };
    
    csvData.forEach((row, index) => {
      const category = row.Category.toLowerCase();
      const subcategory = row.Subcategory.toLowerCase().replace(/\s+/g, '_');
      
      // Check if subcategory exists, if not create it
      if (newCategories[category] && !newCategories[category].subcategories.find(sub => sub.id === subcategory)) {
        newCategories[category].subcategories.push({
          id: subcategory,
          name: row.Subcategory,
          budgetLimit: 0 // Default budget limit for new subcategories
        });
      }
      
      // Find payment method by name or create a default one
      let paymentMethodId = paymentMethods.find(pm => 
        pm.name.toLowerCase() === row['Payment Method'].toLowerCase() ||
        pm.id === row['Payment Method'].toLowerCase()
      )?.id || 'cash';
      
      const transaction = {
        id: `import_${Date.now()}_${index}`,
        amount: parseFloat(row.Amount),
        description: row.Description,
        category: category,
        subcategory: subcategory,
        paymentMethod: paymentMethodId,
        date: convertDateToISO(row.Date),
        createdAt: new Date().toISOString()
      };
      
      processedTransactions.push(transaction);
    });

    // Update categories if new subcategories were added
    onCategoriesUpdate(newCategories);
    
    // Import transactions
    onImport(processedTransactions);
    
    // Reset state
    setCsvData([]);
    setPreviewData([]);
    setValidationErrors([]);
    setIsOpen(false);
    
    toast({
      title: "Import Successful!",
      description: `Imported ${processedTransactions.length} transactions successfully.`,
    });
  };

  const resetImport = () => {
    setCsvData([]);
    setPreviewData([]);
    setValidationErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Add HDFC header mapping function
  function mapHDFCRowToSchema(row, headers) {
    // Find column indices
    const idxDate = headers.findIndex(h => h.toLowerCase().includes('txn date'));
    const idxNarration = headers.findIndex(h => h.toLowerCase().includes('narration'));
    const idxWithdrawal = headers.findIndex(h => h.toLowerCase().includes('withdrawal'));
    const idxDeposit = headers.findIndex(h => h.toLowerCase().includes('deposit'));

    // Determine amount and type
    let amount = null;
    if (idxWithdrawal !== -1 && row[idxWithdrawal]) amount = row[idxWithdrawal];
    else if (idxDeposit !== -1 && row[idxDeposit]) amount = row[idxDeposit];

    return {
      Date: idxDate !== -1 ? row[idxDate] : '',
      Description: idxNarration !== -1 ? row[idxNarration] : '',
      Amount: amount || '',
      Category: null,
      Subcategory: null,
      'Payment Method': null
    };
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Import Transactions (CSV)</DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk import transactions. Use our template for the correct format.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          {/* Template Download */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                CSV Template
              </CardTitle>
              <CardDescription>
                Download our template to ensure your CSV file is in the correct format
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border">
                <div>
                  <p className="font-medium text-blue-900">budget_planner_template.csv</p>
                  <p className="text-sm text-blue-700">Required columns: Date, Description, Amount, Category, Subcategory, Payment Method</p>
                </div>
                <Button variant="outline" onClick={downloadTemplate}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Upload File (CSV)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-4 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">CSV, XLS files only</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".csv,.xls,.xlsx"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
                
                {isProcessing && (
                  <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    <p className="text-sm text-gray-600 mt-2">Processing CSV file...</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Validation Errors Found:</p>
                  <ul className="list-disc list-inside text-sm space-y-1 max-h-32 overflow-y-auto">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Preview Data */}
          {previewData.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  {validationErrors.length === 0 ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <X className="w-5 h-5 text-red-500" />
                  )}
                  Preview ({csvData.length} transactions)
                </CardTitle>
                <CardDescription>
                  Showing first 5 rows of your CSV file
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium">Date</th>
                        <th className="text-left p-2 font-medium">Description</th>
                        <th className="text-left p-2 font-medium">Amount</th>
                        <th className="text-left p-2 font-medium">Category</th>
                        <th className="text-left p-2 font-medium">Subcategory</th>
                        <th className="text-left p-2 font-medium">Payment Method</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-2">{row.Date}</td>
                          <td className="p-2">{row.Description}</td>
                          <td className="p-2">₹{parseFloat(row.Amount).toLocaleString('en-IN')}</td>
                          <td className="p-2">
                            <Badge variant="outline">{row.Category}</Badge>
                          </td>
                          <td className="p-2">{row.Subcategory}</td>
                          <td className="p-2">{row['Payment Method']}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {csvData.length > 5 && (
                  <p className="text-sm text-gray-500 mt-2">
                    ... and {csvData.length - 5} more transactions
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          {csvData.length > 0 && (
            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={resetImport}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Clear & Start Over
              </Button>
              <Button 
                onClick={processImport}
                disabled={validationErrors.length > 0}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Import {csvData.length} Transactions
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CSVImport;