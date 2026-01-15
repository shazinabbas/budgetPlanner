import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { cacheStore } from '../services/cache';

export default function XLSImport() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [imported, setImported] = useState(false);
  const [error, setError] = useState('');

  // Handle file upload
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setPreview([]);
    setImported(false);
    setError('');
  };

  // Parse XLS file and preview transactions
  const handleParse = () => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      // HDFC statements: usually first sheet
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      // Find header row (usually starts with 'Date' or 'Txn Date')
      const headerIdx = rows.findIndex(r => r[0] && r[0].toString().toLowerCase().includes('date'));
      if (headerIdx === -1) {
        setError('Could not find header row. Is this a valid HDFC statement?');
        return;
      }
      const headers = rows[headerIdx];
      // Parse transactions
      const txns = rows.slice(headerIdx + 1)
        .filter(r => r.length >= headers.length && r[0])
        .map(r => {
          // Map columns to expense model
          // Example HDFC columns: Date, Narration, Chq/Ref No., Value Date, Withdrawal Amt., Deposit Amt., Closing Balance
          const [date, narration, refNo, valueDate, withdrawal, deposit, balance] = r;
          return {
            amount: withdrawal || deposit || 0,
            description: narration || '',
            category: withdrawal ? 'needs' : 'income',
            paymentMethod: 'hdfc_bank',
            date: XLSX.SSF.parse_date_code(date) ? new Date(XLSX.SSF.parse_date_code(date)).toISOString().split('T')[0] : date,
            refNo,
            type: withdrawal ? 'debit' : 'credit',
            balance
          };
        });
      setPreview(txns);
    };
    reader.readAsArrayBuffer(file);
  };

  // Import transactions to cache
  const handleImport = () => {
    if (!preview.length) return;
    // Only import debits as expenses
    const expenses = preview.filter(txn => txn.type === 'debit').map(txn => ({
      amount: txn.amount,
      description: txn.description,
      category: 'needs',
      paymentMethod: 'hdfc_bank',
      date: txn.date
    }));
    cacheStore.addExpenses(expenses);
    setImported(true);
  };

  return (
    <div className="p-4 border rounded bg-white max-w-xl mx-auto">
      <h2 className="text-lg font-bold mb-2">Import HDFC Bank Statement (XLS)</h2>
      <input type="file" accept=".xls,.xlsx" onChange={handleFileChange} />
      <button className="ml-2 px-3 py-1 bg-blue-600 text-white rounded" onClick={handleParse} disabled={!file}>Preview</button>
      {error && <div className="text-red-600 mt-2">{error}</div>}
      {preview.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold">Preview ({preview.length} transactions)</h3>
          <table className="w-full text-sm border">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((txn, idx) => (
                <tr key={idx} className={txn.type === 'debit' ? 'bg-red-50' : 'bg-green-50'}>
                  <td>{txn.date}</td>
                  <td>{txn.description}</td>
                  <td>{txn.amount}</td>
                  <td>{txn.type}</td>
                  <td>{txn.balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="mt-2 px-3 py-1 bg-green-600 text-white rounded" onClick={handleImport}>Import Expenses</button>
          {imported && <div className="text-green-600 mt-2">Imported successfully!</div>}
        </div>
      )}
    </div>
  );
}
