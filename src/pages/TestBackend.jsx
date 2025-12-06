import { useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Shield, Lock, AlertTriangle } from 'lucide-react';
import { submitReport, getBounty, generateKeyPair } from '../utils/backendCrypto';

export default function TestBackend() {
  const currentAccount = useCurrentAccount();
  const [bountyId, setBountyId] = useState('test-1');
  const [reportText, setReportText] = useState('');
  const [description, setDescription] = useState('');
  const [impact, setImpact] = useState('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [bounty, setBounty] = useState(null);

  const handleFetchBounty = async () => {
    try {
      setError(null);
      const data = await getBounty(bountyId);
      setBounty(data);
    } catch (err) {
      setError('Failed to fetch bounty: ' + err.message);
    }
  };

  const handleSubmit = async () => {
    if (!currentAccount) {
      setError('Please connect wallet first');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const fullReport = JSON.stringify({
        description,
        impact,
        reportDetails: reportText,
        submittedBy: currentAccount.address,
        timestamp: new Date().toISOString()
      }, null, 2);

      const data = await submitReport(bountyId, currentAccount.address, fullReport);
      setResult(data);

    } catch (err) {
      setError('Submission failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateKeys = async () => {
    try {
      const keys = await generateKeyPair();
      console.log('Generated Keys:');
      console.log('Public Key:', keys.publicKey);
      console.log('Private Key:', keys.privateKey);
      alert('Keys generated! Check console (F12)');
    } catch (err) {
      setError('Key generation failed: ' + err.message);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '10px' }}>
        🧪 Backend Test Page
      </h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Test encrypted bug report submission to PostgreSQL backend
      </p>

      {/* Fetch Bounty */}
      <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>
          1. Fetch Bounty
        </h2>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <input
            type="text"
            value={bountyId}
            onChange={(e) => setBountyId(e.target.value)}
            placeholder="Bounty ID"
            style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
          />
          <button
            onClick={handleFetchBounty}
            style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            Fetch Bounty
          </button>
        </div>
        {bounty && (
          <div style={{ background: 'white', padding: '15px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '12px' }}>
            <pre>{JSON.stringify(bounty, null, 2)}</pre>
          </div>
        )}
      </div>

      {/* Submit Report */}
      <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>
          2. Submit Encrypted Report
        </h2>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Report Details:</label>
          <textarea
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            placeholder="Describe the bug..."
            rows={6}
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', fontFamily: 'monospace' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Brief Description:</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., SQL Injection"
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Severity:</label>
          <select
            value={impact}
            onChange={(e) => setImpact(e.target.value)}
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', background: 'white' }}
          >
            <option value="low">🟢 Low</option>
            <option value="medium">🟡 Medium</option>
            <option value="high">🟠 High</option>
            <option value="critical">🔴 Critical</option>
          </select>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !reportText || !description}
          style={{
            width: '100%',
            padding: '15px',
            background: isSubmitting ? '#9ca3af' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          {isSubmitting ? (
            <>
              <Shield size={20} />
              Encrypting & Submitting...
            </>
          ) : (
            <>
              <Lock size={20} />
              Submit Encrypted Report
            </>
          )}
        </button>

        {result && (
          <div style={{ marginTop: '15px', background: '#d1fae5', padding: '15px', borderRadius: '8px', border: '1px solid #10b981' }}>
            <strong>✅ Success!</strong>
            <pre style={{ marginTop: '10px', fontSize: '12px' }}>{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>

      {/* Utils */}
      <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>
          3. Utilities
        </h2>
        <button
          onClick={handleGenerateKeys}
          style={{ padding: '10px 20px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          Generate RSA Keys
        </button>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
          Generates RSA-2048 key pair for testing. Check browser console.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: '#fee2e2', padding: '15px', borderRadius: '8px', border: '1px solid #ef4444', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={20} color="#dc2626" />
          <span style={{ color: '#dc2626' }}>{error}</span>
        </div>
      )}

      {/* Info */}
      <div style={{ marginTop: '30px', padding: '20px', background: '#eff6ff', borderRadius: '12px', border: '1px solid #3b82f6' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', color: '#1e40af' }}>
          ℹ️ How It Works
        </h3>
        <ul style={{ fontSize: '14px', color: '#1e3a8a', lineHeight: '1.8' }}>
          <li>✅ Report encrypted client-side with AES-256-GCM</li>
          <li>✅ AES key encrypted with bounty owner's RSA public key</li>
          <li>✅ Backend stores only encrypted data</li>
          <li>✅ Auto-approval after 7 days if not reviewed</li>
          <li>✅ Only owner can decrypt with private key</li>
        </ul>
      </div>

      {!currentAccount && (
        <div style={{ marginTop: '20px', padding: '20px', background: '#fef3c7', borderRadius: '12px', border: '1px solid #f59e0b' }}>
          <AlertTriangle size={20} color="#d97706" />
          <strong style={{ marginLeft: '10px', color: '#92400e' }}>Please connect your wallet to test</strong>
        </div>
      )}
    </div>
  );
}
