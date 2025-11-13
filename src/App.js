import React, { useState } from 'react';
import { Shield, Lock, AlertTriangle, CheckCircle, Users, FileText, Download, Eye, Play, Upload } from 'lucide-react';

const AuditProPrototype = () => {
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [currentRole, setCurrentRole] = useState('auditor');
  const [showTamperDemo, setShowTamperDemo] = useState(false);
  const [aiVerificationRun, setAiVerificationRun] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [parsedData, setParsedData] = useState({});
  const [aiResults, setAiResults] = useState(null);
  const [loginError, setLoginError] = useState('');
  const [userCode, setUserCode] = useState('');
  const [password, setPassword] = useState('');

  // Login credentials for each role
  const loginCredentials = {
    auditor: {
      userCode: 'auditor@auditpro.com',
      password: 'Audit2025!',
      name: 'Sarah Johnson, CPA'
    },
    director: {
      userCode: 'director@acme.com',
      password: 'Director2025!',
      name: 'Michael Chen, CFO'
    },
    shareholder: {
      userCode: 'shareholder@investment.com',
      password: 'Share2025!',
      name: 'Emily Rodriguez'
    },
    regulator: {
      userCode: 'regulator@frc.gov',
      password: 'Regulate2025!',
      name: 'David Okonkwo'
    }
  };

  // Handle login
  const handleLogin = () => {
    const credentials = loginCredentials[currentRole];
    
    if (userCode === credentials.userCode && password === credentials.password) {
      setLoginError('');
      setCurrentScreen('dashboard');
    } else {
      setLoginError('Invalid credentials. Please check your user code and password.');
    }
  };

  // Mock data
  const mockAudit = {
    id: "AUD-2025-001",
    company: "Acme Manufacturing Ltd",
    status: "In Progress",
    startDate: "2025-01-15",
    auditor: "Sarah Johnson, CPA"
  };

  const mockLedgerEntries = [
    { id: "0x7a8f", timestamp: "2025-01-15 09:23:41", hash: "a3f89d2c1e4b5a...", author: "Auditor", type: "Transaction Entry", status: "Immutable" },
    { id: "0x7a90", timestamp: "2025-01-15 11:47:12", hash: "b2e47c8d9a1f3e...", author: "Auditor", type: "Raw Data Upload", status: "Immutable" },
    { id: "0x7a91", timestamp: "2025-01-15 14:32:55", hash: "c9d14e5f2b8a7c...", author: "AI System", type: "Verification Result", status: "Immutable" },
    { id: "0x7a92", timestamp: "2025-01-15 16:18:33", hash: "d4b73a1c6e9f2d...", author: "Auditor", type: "Adjustment Note", status: "Immutable" }
  ];

  // CSV Parser
  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length === headers.length) {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index].trim();
        });
        data.push(row);
      }
    }
    return data;
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const data = parseCSV(text);
      
      const fileInfo = {
        name: file.name,
        size: (file.size / 1024).toFixed(2) + ' KB',
        records: data.length,
        uploaded: new Date().toISOString().split('T')[0],
        data: data
      };

      setUploadedFiles(prev => [...prev, fileInfo]);
      
      // Store parsed data by file type
      if (file.name.toLowerCase().includes('sales')) {
        setParsedData(prev => ({ ...prev, sales: data }));
      } else if (file.name.toLowerCase().includes('expense')) {
        setParsedData(prev => ({ ...prev, expenses: data }));
      } else if (file.name.toLowerCase().includes('inventory')) {
        setParsedData(prev => ({ ...prev, inventory: data }));
      }
      
      setShowUploadModal(false);
    };
    reader.readAsText(file);
  };

  // AI Verification Logic
  const runAiVerification = () => {
    if (!parsedData.sales && !parsedData.expenses && !parsedData.inventory) {
      alert('Please upload at least one CSV file first');
      return;
    }

    let totalSales = 0;
    let totalExpenses = 0;
    let totalInventory = 0;
    const anomalies = [];

    // Calculate sales total
    if (parsedData.sales) {
      const amounts = parsedData.sales.map(row => parseFloat(row.TotalAmount || 0));
      totalSales = amounts.reduce((sum, val) => sum + val, 0);
      
      // Outlier detection (z-score)
      const mean = totalSales / amounts.length;
      const stdDev = Math.sqrt(amounts.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / amounts.length);
      
      amounts.forEach((amount, idx) => {
        const zScore = Math.abs((amount - mean) / stdDev);
        if (zScore > 3.0) {
          anomalies.push({
            line: idx + 2,
            description: `Invoice amount $${amount.toLocaleString()} exceeds z-score threshold (${zScore.toFixed(1)}σ)`,
            type: 'Outlier'
          });
        }
      });
    }

    // Calculate expenses total
    if (parsedData.expenses) {
      const amounts = parsedData.expenses.map(row => parseFloat(row.Amount || 0));
      totalExpenses = amounts.reduce((sum, val) => sum + val, 0);
    }

    // Calculate inventory total
    if (parsedData.inventory) {
      const values = parsedData.inventory.map(row => parseFloat(row.TotalValue || 0));
      totalInventory = values.reduce((sum, val) => sum + val, 0);
    }

    // Mock auditor summary (slightly different to show mismatch)
    const auditorSummary = {
      totalSales: Math.round(totalSales * 1.001), // 0.1% higher
      totalExpenses: totalExpenses,
      totalInventory: Math.round(totalInventory * 1.03), // 3% higher
      confidence: "Manual Review"
    };

    const aiSummary = {
      totalSales: Math.round(totalSales),
      totalExpenses: Math.round(totalExpenses),
      totalInventory: Math.round(totalInventory),
      confidence: "98.3%"
    };

    // Calculate mismatches
    const mismatches = [];
    if (auditorSummary.totalSales !== aiSummary.totalSales) {
      mismatches.push({
        field: "Total Sales",
        auditor: auditorSummary.totalSales.toLocaleString(),
        ai: aiSummary.totalSales.toLocaleString(),
        delta: (auditorSummary.totalSales - aiSummary.totalSales).toFixed(2),
        severity: Math.abs(auditorSummary.totalSales - aiSummary.totalSales) > 5000 ? 'red' : 'amber'
      });
    }
    if (auditorSummary.totalInventory !== aiSummary.totalInventory) {
      mismatches.push({
        field: "Inventory Value",
        auditor: auditorSummary.totalInventory.toLocaleString(),
        ai: aiSummary.totalInventory.toLocaleString(),
        delta: (auditorSummary.totalInventory - aiSummary.totalInventory).toFixed(2),
        severity: Math.abs(auditorSummary.totalInventory - aiSummary.totalInventory) > 5000 ? 'red' : 'amber'
      });
    }

    setAiResults({
      auditorSummary,
      aiSummary,
      mismatches,
      anomalies
    });

    setAiVerificationRun(true);
  };

  const screens = {
    welcome: (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-blue-600 p-3 rounded-xl mr-3">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">AuditPro</h1>
          </div>
          <p className="text-center text-gray-600 mb-8">Blockchain-Verified Audit Platform</p>
          
          <h2 className="text-xl font-semibold mb-4 text-center">Select Your Role</h2>
          
          <div className="space-y-3">
            {['Auditor', 'Director', 'Shareholder', 'Regulator'].map((role) => (
              <button
                key={role}
                onClick={() => {
                  setCurrentRole(role.toLowerCase());
                  setCurrentScreen('signin');
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition"
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      </div>
    ),

    signin: (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="flex items-center mb-6">
            <div className="bg-blue-600 p-2 rounded-lg mr-3">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">AuditPro</h1>
          </div>
          
          <div className="mb-4">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium capitalize">
              {currentRole} Login
            </span>
          </div>
          
          <h2 className="text-xl font-semibold mb-6">Sign in</h2>
          
          {loginError && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {loginError}
            </div>
          )}
          
          <input
            type="text"
            placeholder="User Code"
            value={userCode}
            onChange={(e) => setUserCode(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 mb-4"
          />
          
          <div className="relative mb-4">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleLogin();
                }
              }}
              className="w-full border border-gray-300 rounded-lg p-3 pr-16"
            />
          </div>
          
          <button 
            onClick={(e) => {
              e.preventDefault();
              alert('Please contact your administrator to reset your password.');
            }}
            className="text-blue-600 text-sm mb-6 block hover:underline"
          >
            Forgot password?
          </button>
          
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-full font-medium mb-4 transition"
          >
            Sign in
          </button>
          
          <div className="text-center text-gray-500 mb-4">or</div>
          
          <button className="w-full border border-gray-300 rounded-full py-3 font-medium flex items-center justify-center hover:bg-gray-50 transition">
            <span className="mr-2">🍎</span> Sign in with Apple
          </button>
          
          <button
            onClick={() => {
              setCurrentScreen('welcome');
              setUserCode('');
              setPassword('');
              setLoginError('');
            }}
            className="w-full mt-4 text-gray-600 hover:text-gray-800"
          >
            ← Back to Role Selection
          </button>
        </div>
      </div>
    ),

    dashboard: (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-blue-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield className="w-6 h-6 mr-2" />
              <span className="font-bold text-lg">AuditPro</span>
            </div>
            <div className="text-sm capitalize bg-blue-700 px-3 py-1 rounded-full">{currentRole}</div>
          </div>
        </div>
        
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-2">Company Dashboard</h1>
          <p className="text-gray-600 mb-6">Active Audits & Recent Activity</p>
          
          <div className="bg-white rounded-lg shadow-md p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-lg">{mockAudit.company}</h3>
                <p className="text-sm text-gray-600">Audit ID: {mockAudit.id}</p>
              </div>
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                {mockAudit.status}
              </span>
            </div>
            <div className="text-sm text-gray-600 mb-3">
              <p>Started: {mockAudit.startDate}</p>
              <p>Auditor: {mockAudit.auditor}</p>
              <p className="mt-2 text-blue-600 font-medium">Uploaded Files: {uploadedFiles.length}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentScreen('workspace')}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Open Audit
              </button>
              <button
                onClick={() => setCurrentScreen('ledger')}
                className="flex-1 border border-blue-600 text-blue-600 py-2 rounded-lg font-medium hover:bg-blue-50 transition"
              >
                View Ledger
              </button>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-md p-5 text-white">
            <Lock className="w-8 h-8 mb-2" />
            <h3 className="font-bold text-lg mb-1">Immutable Records</h3>
            <p className="text-sm opacity-90">All entries are cryptographically secured and timestamped</p>
          </div>
          
          <div className="mt-6 space-y-2">
            <button
              onClick={() => setCurrentScreen('welcome')}
              className="w-full text-gray-600 hover:text-gray-800 py-2"
            >
              Switch Role
            </button>
          </div>
        </div>
      </div>
    ),

    workspace: (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-blue-600 text-white p-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setCurrentScreen('dashboard')} className="text-white">← Back</button>
            <span className="font-bold">Audit Workspace</span>
            <div className="w-6"></div>
          </div>
        </div>
        
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">{mockAudit.company}</h2>
          
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => setCurrentScreen('upload')}
              className="bg-white border-2 border-blue-600 text-blue-600 p-4 rounded-lg font-medium hover:bg-blue-50 transition"
            >
              <Upload className="w-6 h-6 mx-auto mb-2" />
              Upload Data
            </button>
            <button
              onClick={() => setCurrentScreen('ai-verification')}
              className="bg-white border-2 border-green-600 text-green-600 p-4 rounded-lg font-medium hover:bg-green-50 transition"
            >
              <CheckCircle className="w-6 h-6 mx-auto mb-2" />
              AI Verification
            </button>
            <button
              onClick={() => setCurrentScreen('ledger')}
              className="bg-white border-2 border-purple-600 text-purple-600 p-4 rounded-lg font-medium hover:bg-purple-50 transition"
            >
              <Lock className="w-6 h-6 mx-auto mb-2" />
              Ledger Timeline
            </button>
            <button
              onClick={() => setCurrentScreen('demo')}
              className="bg-white border-2 border-red-600 text-red-600 p-4 rounded-lg font-medium hover:bg-red-50 transition"
            >
              <Play className="w-6 h-6 mx-auto mb-2" />
              Tamper Demo
            </button>
          </div>
          
          <h3 className="font-bold mb-3">Uploaded Files ({uploadedFiles.length})</h3>
          {uploadedFiles.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow-sm text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No files uploaded yet</p>
              <p className="text-sm">Click "Upload Data" to add CSV files</p>
            </div>
          ) : (
            <div className="space-y-2">
              {uploadedFiles.map((file, i) => (
                <div key={i} className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{file.name}</span>
                    <Lock className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-xs text-gray-500">
                    {file.size} • {file.records} records • Uploaded {file.uploaded}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    ),

    upload: (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-blue-600 text-white p-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setCurrentScreen('workspace')} className="text-white">← Back</button>
            <span className="font-bold">Upload Raw Data</span>
            <div className="w-6"></div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="bg-white rounded-lg shadow-md p-6 mb-4">
            <h3 className="font-bold mb-4">Upload CSV Files</h3>
            
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-4">
              <h4 className="font-semibold mb-2">Supported File Types:</h4>
              <ul className="text-sm space-y-1 mb-4">
                <li>• Sales Transactions CSV</li>
                <li>• Expense Records CSV</li>
                <li>• Inventory Data CSV</li>
              </ul>
              <p className="text-xs text-gray-600">
                CSV files should have headers in the first row. Files will be parsed and verified automatically.
              </p>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4 hover:border-blue-600 transition">
              <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600 mb-4">Click to browse and upload CSV files</p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="fileInput"
              />
              <label
                htmlFor="fileInput"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg cursor-pointer hover:bg-blue-700 transition inline-block"
              >
                Browse Files
              </label>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Uploaded Files:</h4>
                <div className="space-y-2">
                  {uploadedFiles.map((file, i) => (
                    <div key={i} className="bg-gray-50 p-3 rounded border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{file.name}</p>
                          <p className="text-xs text-gray-600">{file.size} • {file.records} records</p>
                        </div>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2 flex items-center">
                <Lock className="w-4 h-4 mr-2" />
                Immutability Guarantee
              </h4>
              <p className="text-xs text-gray-700">
                Upon upload, each file will be hashed (SHA-256) and anchored to the blockchain ledger. Any future changes will be detected.
              </p>
            </div>
            
            <button
              onClick={() => {
                if (uploadedFiles.length > 0) {
                  setCurrentScreen('ai-verification');
                  setAiVerificationRun(false);
                } else {
                  alert('Please upload at least one CSV file first');
                }
              }}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium mt-4 hover:bg-blue-700 transition"
            >
              Continue to AI Verification
            </button>
          </div>
        </div>
      </div>
    ),

    'ai-verification': (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-green-600 text-white p-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setCurrentScreen('workspace')} className="text-white">← Back</button>
            <span className="font-bold">AI Verification</span>
            <div className="w-6"></div>
          </div>
        </div>
        
        <div className="p-6">
          {!aiVerificationRun ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-bold text-lg mb-4">Independent AI Analysis</h3>
              <p className="text-gray-600 mb-6">
                Run statistical verification checks on uploaded raw data and compare with auditor reports.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold mb-2">Uploaded Data Files:</h4>
                {uploadedFiles.length === 0 ? (
                  <p className="text-sm text-gray-600">No files uploaded yet. Please upload CSV files first.</p>
                ) : (
                  <ul className="text-sm space-y-1">
                    {uploadedFiles.map((file, i) => (
                      <li key={i}>✓ {file.name} ({file.records} records)</li>
                    ))}
                  </ul>
                )}
              </div>
              
              <button
                onClick={runAiVerification}
                disabled={uploadedFiles.length === 0}
                className="w-full bg-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition flex items-center justify-center disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Play className="w-5 h-5 mr-2" />
                Run AI Verification
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                  Verification Complete
                </h3>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="border rounded-lg p-4">
                    <h4 className="text-sm font-semibold mb-2 text-gray-600">Auditor Summary</h4>
                    {aiResults?.auditorSummary.totalSales > 0 && (
                      <p className="text-xs mb-1">Sales: ${aiResults.auditorSummary.totalSales.toLocaleString()}</p>
                    )}
                    {aiResults?.auditorSummary.totalExpenses > 0 && (
                      <p className="text-xs mb-1">Expenses: ${aiResults.auditorSummary.totalExpenses.toLocaleString()}</p>
                    )}
                    {aiResults?.auditorSummary.totalInventory > 0 && (
                      <p className="text-xs">Inventory: ${aiResults.auditorSummary.totalInventory.toLocaleString()}</p>
                    )}
                  </div>
                  
                  <div className="border border-green-500 rounded-lg p-4 bg-green-50">
                    <h4 className="text-sm font-semibold mb-2 text-gray-600">AI Summary</h4>
                    {aiResults?.aiSummary.totalSales > 0 && (
                      <p className="text-xs mb-1">Sales: ${aiResults.aiSummary.totalSales.toLocaleString()}</p>
                    )}
                    {aiResults?.aiSummary.totalExpenses > 0 && (
                      <p className="text-xs mb-1">Expenses: ${aiResults.aiSummary.totalExpenses.toLocaleString()}</p>
                    )}
                    {aiResults?.aiSummary.totalInventory > 0 && (
                      <p className="text-xs">Inventory: ${aiResults.aiSummary.totalInventory.toLocaleString()}</p>
                    )}
                    <p className="text-xs mt-2 font-semibold text-green-700">Confidence: {aiResults?.aiSummary.confidence}</p>
                  </div>
                </div>
                
                {aiResults?.mismatches && aiResults.mismatches.length > 0 && (
                  <>
                    <h4 className="font-semibold mb-2 text-red-700 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Mismatches Detected
                    </h4>
                    <div className="space-y-2 mb-4">
                      {aiResults.mismatches.map((m, i) => (
                        <div key={i} className="bg-yellow-50 border border-yellow-300 rounded p-3">
                          <div className="flex justify-between items-start">
                            <span className="font-semibold text-sm">{m.field}</span>
                            <span className={`text-xs px-2 py-1 rounded ${m.severity === 'amber' ? 'bg-yellow-200 text-yellow-800' : 'bg-red-200 text-red-800'}`}>
                              {m.severity === 'amber' ? 'Review' : 'Critical'}
                            </span>
                          </div>
                          <p className="text-xs mt-1">Auditor: ${m.auditor} | AI: ${m.ai}</p>
                          <p className="text-xs text-red-600 font-semibold">Delta: ${m.delta}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                
                {aiResults?.anomalies && aiResults.anomalies.length > 0 && (
                  <>
                    <h4 className="font-semibold mb-2">Anomalies Found</h4>
                    <div className="space-y-2 mb-4">
                      {aiResults.anomalies.map((a, i) => (
                        <div key={i} className="bg-orange-50 border border-orange-300 rounded p-3 text-xs">
                          <span className="font-semibold">Line {a.line}:</span> {a.description}
                          <span className="ml-2 text-orange-700">({a.type})</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                
                <button
                  onClick={() => setCurrentScreen('escalation')}
                  className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition"
                >
                  {aiResults?.mismatches && aiResults.mismatches.length > 0 ? 'Escalate to Regulators & Shareholders' : 'View Escalation Options'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    ),

    escalation: (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-red-600 text-white p-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setCurrentScreen('ai-verification')} className="text-white">← Back</button>
            <span className="font-bold">Escalation</span>
            <div className="w-6"></div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="bg-white rounded-lg shadow-md p-6 mb-4">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
              <h3 className="font-bold text-lg">Automatic Escalation</h3>
            </div>
            
            <p className="text-gray-700 mb-6">
              {aiResults?.mismatches && aiResults.mismatches.length > 0
                ? "Mismatches detected by AI verification have triggered automatic notifications to relevant stakeholders."
                : "All verification passed. Stakeholders have been notified of successful audit completion."}
            </p>
            
            <div className="space-y-3 mb-6">
              <div className="bg-green-50 border border-green-300 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">Regulator Notification</span>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-xs text-gray-600">Sent to: Financial Reporting Council</p>
                <p className="text-xs text-gray-600">Timestamp: {new Date().toISOString().replace('T', ' ').substring(0, 19)}</p>
                <p className="text-xs text-gray-600">Ledger Entry: 0x7a93</p>
              </div>
              
              <div className="bg-green-50 border border-green-300 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">Shareholder Alert</span>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-xs text-gray-600">Sent to: 3 Major Shareholders</p>
                <p className="text-xs text-gray-600">Timestamp: {new Date().toISOString().replace('T', ' ').substring(0, 19)}</p>
                <p className="text-xs text-gray-600">Ledger Entry: 0x7a94</p>
              </div>
              
              <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">Director Notification</span>
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-xs text-gray-600">Sent to: Board of Directors</p>
                <p className="text-xs text-gray-600">Timestamp: {new Date().toISOString().replace('T', ' ').substring(0, 19)}</p>
                <p className="text-xs text-gray-600">Ledger Entry: 0x7a95</p>
              </div>
            </div>
            
            <div className="bg-purple-50 border border-purple-300 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-sm mb-2 flex items-center">
                <Lock className="w-4 h-4 mr-2" />
                Immutable Audit Trail
              </h4>
              <p className="text-xs text-gray-700">
                All escalation actions have been recorded to the blockchain ledger with cryptographic proof. Recipients can verify authenticity.
              </p>
            </div>
            
            <button
              onClick={() => setCurrentScreen('role-view')}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              View Role-Based Access
            </button>
          </div>
        </div>
      </div>
    ),

    'role-view': (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-purple-600 text-white p-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setCurrentScreen('escalation')} className="text-white">← Back</button>
            <span className="font-bold">Role-Based Views</span>
            <div className="w-6"></div>
          </div>
        </div>
        
        <div className="p-6">
          <h3 className="font-bold mb-4">Switch Perspective</h3>
          
          <div className="space-y-3 mb-6">
            {[
              { role: 'auditor', label: 'Auditor', access: 'Full access - Create, edit, upload, verify', color: 'blue' },
              { role: 'director', label: 'Company Director', access: 'Read ledger, view reports, receive alerts', color: 'green' },
              { role: 'shareholder', label: 'Shareholder', access: 'Read-only final reports, escalation alerts', color: 'indigo' },
              { role: 'regulator', label: 'Regulator', access: 'Read-only all records, escalation alerts, export logs', color: 'red' }
            ].map((r) => (
              <button
                key={r.role}
                onClick={() => {
                  setCurrentRole(r.role);
                  setCurrentScreen('dashboard');
                }}
                className={`w-full bg-white border-2 ${currentRole === r.role ? 'border-blue-600 bg-blue-50' : 'border-gray-300'} rounded-lg p-4 text-left hover:border-blue-600 transition`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold">{r.label}</span>
                  {currentRole === r.role && <CheckCircle className="w-5 h-5 text-blue-600" />}
                </div>
                <p className="text-xs text-gray-600">{r.access}</p>
              </button>
            ))}
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg shadow-md p-5 text-white">
            <Users className="w-8 h-8 mb-2" />
            <h3 className="font-bold text-lg mb-1">Transparency by Design</h3>
            <p className="text-sm opacity-90">Each role sees exactly what they need. All actions are logged immutably.</p>
          </div>
        </div>
      </div>
    ),

    ledger: (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-purple-600 text-white p-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setCurrentScreen('workspace')} className="text-white">← Back</button>
            <span className="font-bold">Immutable Ledger</span>
            <div className="w-6"></div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg shadow-md p-5 text-white mb-6">
            <Lock className="w-8 h-8 mb-2" />
            <h3 className="font-bold text-lg mb-1">Blockchain Timeline</h3>
            <p className="text-sm opacity-90">Cryptographically secured entries</p>
          </div>
          
          <div className="space-y-3">
            {mockLedgerEntries.map((entry, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-600">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center mb-1">
                      <Lock className="w-4 h-4 text-green-600 mr-2" />
                      <span className="font-bold text-sm">{entry.type}</span>
                    </div>
                    <p className="text-xs text-gray-600">ID: {entry.id}</p>
                  </div>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-semibold">
                    {entry.status}
                  </span>
                </div>
                
                <div className="bg-gray-50 rounded p-2 mb-2 font-mono text-xs break-all">
                  Hash: {entry.hash}
                </div>
                
                <div className="flex justify-between text-xs text-gray-600">
                  <span>{entry.author}</span>
                  <span>{entry.timestamp}</span>
                </div>
              </div>
            ))}
            
            {uploadedFiles.map((file, i) => (
              <div key={`file-${i}`} className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-600">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center mb-1">
                      <Lock className="w-4 h-4 text-green-600 mr-2" />
                      <span className="font-bold text-sm">File Upload</span>
                    </div>
                    <p className="text-xs text-gray-600">File: {file.name}</p>
                  </div>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-semibold">
                    Immutable
                  </span>
                </div>
                
                <div className="bg-gray-50 rounded p-2 mb-2 font-mono text-xs break-all">
                  Hash: {(Math.random().toString(36).substring(2, 15) + '...').substring(0, 18)}
                </div>
                
                <div className="flex justify-between text-xs text-gray-600">
                  <span>System Upload</span>
                  <span>{file.uploaded}</span>
                </div>
              </div>
            ))}
          </div>
          
          <button
            onClick={() => setCurrentScreen('demo')}
            className="w-full mt-6 bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition"
          >
            View Tamper Detection Demo
          </button>
        </div>
      </div>
    ),

    demo: (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-red-600 text-white p-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setCurrentScreen('workspace')} className="text-white">← Back</button>
            <span className="font-bold">Tamper Demo</span>
            <div className="w-6"></div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="bg-white rounded-lg shadow-md p-6 mb-4">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
              <h3 className="font-bold text-lg">Attempted Tampering Detected</h3>
            </div>
            
            {!showTamperDemo ? (
              <div>
                <p className="text-gray-700 mb-6">
                  This demo simulates an auditor attempting to modify a previously recorded entry.
                </p>
                <button
                  onClick={() => setShowTamperDemo(true)}
                  className="w-full bg-red-600 text-white py-4 rounded-lg font-bold hover:bg-red-700 transition flex items-center justify-center"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Simulate Tamper Attempt
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                  <h4 className="font-semibold text-red-800 mb-2">Original Entry (Immutable)</h4>
                  <div className="bg-white rounded p-3 mb-2">
                    <p className="text-sm mb-1"><span className="font-semibold">Sales Entry:</span> $1,250,000</p>
                    <p className="text-xs text-gray-600 font-mono">Hash: a3f89d2c1e4b5a...</p>
                    <p className="text-xs text-gray-600">Timestamp: 2025-01-15 09:23:41</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-center">
                  <div className="border-t-2 border-dashed border-red-400 w-full"></div>
                  <AlertTriangle className="w-6 h-6 text-red-600 mx-2" />
                  <div className="border-t-2 border-dashed border-red-400 w-full"></div>
                </div>
                
                <div className="bg-red-100 border-2 border-red-500 rounded-lg p-4">
                  <h4 className="font-semibold text-red-900 mb-2">Attempted Change ❌</h4>
                  <div className="bg-white rounded p-3 mb-2">
                    <p className="text-sm mb-1 line-through text-red-600"><span className="font-semibold">Sales Entry:</span> $1,248,750</p>
                    <p className="text-xs text-red-600 font-mono">Hash: c7d42e1f8a9b3d... ⚠️ MISMATCH</p>
                    <p className="text-xs text-gray-600">Attempted by: Sarah Johnson, CPA</p>
                    <p className="text-xs text-gray-600">Timestamp: 2025-01-15 16:52:17</p>
                  </div>
                </div>
                
                <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Blockchain Protection Active
                  </h4>
                  <ul className="text-xs space-y-1 text-gray-700">
                    <li>✓ Hash verification failed - modification rejected</li>
                    <li>✓ Tamper attempt logged to ledger (Entry 0x7a96)</li>
                    <li>✓ Automatic notification sent to regulators</li>
                    <li>✓ Original entry remains immutable</li>
                    <li>✓ Actor identity recorded for audit trail</li>
                  </ul>
                </div>
                
                <button
                  onClick={() => setCurrentScreen('final-report')}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  View Final Report Distribution
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    ),

    'final-report': (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-blue-600 text-white p-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setCurrentScreen('demo')} className="text-white">← Back</button>
            <span className="font-bold">Final Report</span>
            <div className="w-6"></div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="bg-white rounded-lg shadow-md p-6 mb-4">
            <h3 className="font-bold text-lg mb-4">Audit Complete - Auto Distribution</h3>
            
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-6 text-white mb-6">
              <CheckCircle className="w-12 h-12 mb-2" />
              <h4 className="font-bold text-xl mb-2">Audit Finalized</h4>
              <p className="text-sm opacity-90">All stakeholders have been automatically notified</p>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">Regulator Package</span>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-xs text-gray-600 mb-2">Financial Reporting Council</p>
                <p className="text-xs text-gray-600">• Full audit report (PDF)</p>
                <p className="text-xs text-gray-600">• Complete ledger export</p>
                <p className="text-xs text-gray-600">• AI verification results</p>
                <p className="text-xs text-gray-600">• Evidence files archive ({uploadedFiles.length} files)</p>
                <p className="text-xs text-gray-600 mt-2">Delivered: {new Date().toISOString().replace('T', ' ').substring(0, 19)}</p>
              </div>
              
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">Shareholder Summary</span>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-xs text-gray-600 mb-2">All Registered Shareholders</p>
                <p className="text-xs text-gray-600">• Executive summary (PDF)</p>
                <p className="text-xs text-gray-600">• Key findings digest</p>
                <p className="text-xs text-gray-600">• Flagged items report</p>
                <p className="text-xs text-gray-600 mt-2">Delivered: {new Date().toISOString().replace('T', ' ').substring(0, 19)}</p>
              </div>
            </div>
            
            <div className="bg-purple-50 border border-purple-300 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-sm mb-2 flex items-center">
                <Lock className="w-4 h-4 mr-2" />
                Distribution Ledger Entries
              </h4>
              <p className="text-xs text-gray-700 mb-2">
                All distribution events have been recorded with cryptographic proof:
              </p>
              <p className="text-xs text-gray-600 font-mono">Entry 0x7a97 - Regulator delivery</p>
              <p className="text-xs text-gray-600 font-mono">Entry 0x7a98 - Shareholder delivery</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button className="border-2 border-blue-600 text-blue-600 py-3 rounded-lg font-medium hover:bg-blue-50 transition flex items-center justify-center">
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </button>
              <button 
                onClick={() => setCurrentScreen('ledger')}
                className="border-2 border-purple-600 text-purple-600 py-3 rounded-lg font-medium hover:bg-purple-50 transition flex items-center justify-center"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Ledger
              </button>
            </div>
            
            <button
              onClick={() => setCurrentScreen('dashboard')}
              className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  };

  return (
    <div className="max-w-md mx-auto bg-white shadow-2xl min-h-screen">
      {screens[currentScreen]}
    </div>
  );
};

export default AuditProPrototype;
