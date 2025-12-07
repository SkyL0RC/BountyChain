import { useState } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction, useDisconnectWallet, useSuiClient } from '@mysten/dapp-kit';
import { useNavigate } from 'react-router-dom';
import { Transaction } from '@mysten/sui/transactions';
import { Shield, Lock, DollarSign, Calendar, Github, Globe, AlertCircle, RefreshCw } from 'lucide-react';
import { generateKeyPair } from '../utils/backendCrypto';

const API_BASE_URL = 'http://localhost:3001/api';
const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID;

export default function CreateBounty() {
  const currentAccount = useCurrentAccount();
  const navigate = useNavigate();
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const { mutate: disconnect } = useDisconnectWallet();
  const suiClient = useSuiClient();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    rewardAmount: '',
    difficulty: 'beginner',
    expiresInDays: '30',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [walletError, setWalletError] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentAccount) {
      alert('Please connect your wallet first');
      return;
    }

    if (!formData.title || !formData.rewardAmount) {
      setError('Please fill all required fields');
      return;
    }

    // Wallet bağlantısını kontrol et
    if (!currentAccount.address) {
      setError('Wallet not properly connected. Please reconnect your wallet.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Generate encryption key pair
      const keyPair = await generateKeyPair();
      console.log('🔐 Key pair generated');

      // 2. Generate bounty ID
      const bountyId = `bounty_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // 3. Real payment with Slush wallet
      const SKIP_PAYMENT = false; // Real payment enabled
      
      let txResult = null;
      
      if (!SKIP_PAYMENT) {
        // Create transaction using simplified escrow contract
        const rewardInMIST = Math.floor(parseFloat(formData.rewardAmount) * 1_000_000_000);
        
        console.log(`💰 Creating bounty with ${rewardInMIST} MIST (${formData.rewardAmount} SUI)`);
        console.log(`📦 Package: ${PACKAGE_ID}`);
        console.log(`👤 Sender: ${currentAccount.address}`);
        
        const tx = new Transaction();
        
        // Split coin for reward
        const [rewardCoin] = tx.splitCoins(tx.gas, [rewardInMIST]);
        
        // Convert string to bytes array  
        const titleBytes = Array.from(new TextEncoder().encode(formData.title));
        
        // Call escrow contract
        tx.moveCall({
          target: `${PACKAGE_ID}::bounty_escrow::create_bounty`,
          arguments: [
            tx.pure.vector('u8', titleBytes),
            rewardCoin,
          ],
        });

        // Set gas budget
        tx.setGasBudget(10000000);

        console.log('📝 Transaction built');
        console.log('💳 Requesting signature from wallet...');
        console.log('🔍 Transaction details:', {
          package: PACKAGE_ID,
          function: 'create_bounty',
          reward: `${formData.rewardAmount} SUI (${rewardInMIST} MIST)`,
          sender: currentAccount.address,
        });

        // Execute transaction with proper error handling
        try {
          txResult = await signAndExecuteTransaction(
            {
              transaction: tx,
            },
            {
              onSuccess: (result) => {
                console.log('✅ Transaction successful:', result.digest);
              },
            }
          );
          
          console.log('✅ Payment locked in escrow');
          console.log('📋 TX Digest:', txResult.digest);
        } catch (txError) {
          console.error('💥 Transaction failed:', txError);
          
          const errorMsg = txError.message || String(txError);
          console.error('Error message:', errorMsg);
          
          if (errorMsg.toLowerCase().includes('reject') || 
              errorMsg.toLowerCase().includes('cancel') ||
              errorMsg.toLowerCase().includes('denied')) {
            setError('❌ Transaction Cancelled\n\nYou rejected the payment in your wallet.');
          } else if (errorMsg.toLowerCase().includes('insufficient')) {
            setError('❌ Insufficient Balance\n\nYou need at least:\n• ' + formData.rewardAmount + ' SUI (reward)\n• ~0.01 SUI (gas fees)');
          } else if (errorMsg.toLowerCase().includes('session') || errorMsg.toLowerCase().includes('unlock')) {
            setError('⚠️ Wallet Locked\n\nPlease unlock your Slush wallet and try again.');
          } else {
            setError('❌ Payment Failed\n\n' + errorMsg + '\n\nTroubleshooting:\n1. Make sure wallet is unlocked\n2. Check you have enough SUI\n3. Try refreshing the page');
          }
          setIsSubmitting(false);
          return;
        }
      } else {
        console.log('⚠️ SKIPPING PAYMENT (TEST MODE)');
        txResult = { digest: 'TEST_TX_' + Date.now(), effects: { created: [] } };
      }

      // Extract bounty object ID from transaction result
      console.log('🔍 Full transaction result:', JSON.stringify(txResult, null, 2));
      
      let bountyObjectId = null;
      
      // Wait for transaction to be indexed by RPC (Sui takes a moment)
      console.log('⏳ Waiting 3 seconds for transaction to be indexed...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Fetch transaction details from Sui RPC to get created objects
      try {
        console.log('🔍 Fetching transaction details from Sui RPC...');
        const txDetails = await suiClient.getTransactionBlock({
          digest: txResult.digest,
          options: {
            showEffects: true,
            showObjectChanges: true,
          },
        });
        
        console.log('📦 Transaction details:', txDetails);
        
        // Look for created shared object in objectChanges
        if (txDetails.objectChanges) {
          const sharedObject = txDetails.objectChanges.find(change => 
            change.type === 'created' && 
            change.owner && 
            (change.owner === 'Shared' || change.owner.Shared)
          );
          
          if (sharedObject) {
            bountyObjectId = sharedObject.objectId;
            console.log('🎯 Found Bounty Object ID:', bountyObjectId);
          }
        }
        
        // Fallback: check effects
        if (!bountyObjectId && txDetails.effects?.created) {
          const sharedObj = txDetails.effects.created.find(obj =>
            obj.owner && (obj.owner === 'Shared' || obj.owner.Shared)
          );
          if (sharedObj) {
            bountyObjectId = sharedObj.reference?.objectId || sharedObj.objectId;
            console.log('🎯 Found Bounty Object ID from effects:', bountyObjectId);
          }
        }
      } catch (err) {
        console.error('❌ Failed to fetch transaction details:', err);
      }

      if (!bountyObjectId) {
        console.error('❌ Failed to extract bounty object ID from transaction');
        console.warn('⚠️ Bounty will be created but payment release will not work');
      }

      // 4. Payment başarılı olduktan SONRA backend'de bounty kaydı oluştur
      console.log('📝 Creating bounty record in database...');
      
      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(formData.expiresInDays));
      
      const response = await fetch(`${API_BASE_URL}/bounties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: bountyId,
          title: formData.title,
          description: formData.description,
          rewardAmount: formData.rewardAmount,
          difficulty: formData.difficulty,
          expiresAt: expiresAt.toISOString(),
          ownerWallet: currentAccount.address,
          ownerPublicKey: keyPair.publicKey,
          bountyObjectId: bountyObjectId,
          transactionHash: txResult.digest
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Backend error:', error);
        throw new Error(error.error || 'Failed to create bounty record');
      }

      const bountyResult = await response.json();
      console.log('✅ Bounty record created:', bountyResult);

      // 5. Store private key in localStorage
      localStorage.setItem(`bounty_${bountyId}_privateKey`, keyPair.privateKey);
      console.log('🔑 Private key stored in localStorage');

      // 6. Backend'e transaction hash'i kaydet
      await fetch(`${API_BASE_URL}/bounties/${bountyId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionHash: txResult.digest,
          amount: formData.rewardAmount
        })
      });
      
      alert(`✅ Bounty created successfully!\n\n💰 ${formData.rewardAmount} SUI locked in escrow\n🔗 TX: ${txResult.digest.slice(0, 16)}...`);
      setTimeout(() => navigate('/hacks'), 500);

    } catch (error) {
      console.error('Bounty creation failed:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      setError(error.message);
      setIsSubmitting(false);
    }
  };

  if (!currentAccount) {
    return (
      <div className="create-bounty-page">
        <div className="empty-state">
          <Shield size={64} />
          <h2>Connect Your Wallet</h2>
          <p>You need to connect your Sui wallet to create a bounty.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="create-bounty-page">
      <div className="page-header">
        <h1>
          <Shield size={32} />
          Create Bug Bounty
        </h1>
        <p>Create a bug bounty with encrypted report submission</p>
      </div>

      <form onSubmit={handleSubmit} className="bounty-form">
        {error && (
          <div className="error-box">
            <AlertCircle size={20} />
            <div style={{ flex: 1 }}>
              <span style={{ whiteSpace: 'pre-line' }}>{error}</span>
              {walletError && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: '10px' }}
                  onClick={() => {
                    disconnect();
                    setWalletError(false);
                    setError(null);
                    window.location.reload();
                  }}
                >
                  <RefreshCw size={16} />
                  Reconnect Wallet
                </button>
              )}
            </div>
          </div>
        )}

        <div className="form-section">
          <h3>Bounty Information</h3>
          
          <div className="warning-box-form">
            <Lock size={20} />
            <Shield size={20} />
            <div>
              <strong>🔐 End-to-End Encryption & Escrow Payment:</strong>
              <ul style={{ margin: '8px 0 0 20px', fontSize: '0.9em' }}>
                <li>Encryption keys generated for your bounty</li>
                <li>Only you can decrypt submitted reports</li>
                <li>Private key stored in your browser (keep backup!)</li>
                <li>Reward locked in escrow contract</li>
                <li>Funds released only when you approve a report</li>
              </ul>
            </div>
          </div>

          <div className="form-group">
            <label>Bounty Title *</label>
            <input
              type="text"
              name="title"
              className="form-input"
              placeholder="e.g., Smart Contract Security Audit"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              className="form-textarea"
              rows="6"
              placeholder="Describe your project, what you're looking for, and any specific areas of concern..."
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Reward Amount (SUI) *</label>
            <input
              type="number"
              name="rewardAmount"
              className="form-input"
              placeholder="e.g., 100 or 0.5"
              step="0.001"
              min="0.001"
              value={formData.rewardAmount}
              onChange={handleChange}
              required
            />
            <small style={{ color: '#888', fontSize: '0.85em' }}>Minimum: 0.001 SUI</small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Difficulty Level *</label>
              <select
                name="difficulty"
                className="form-select"
                value={formData.difficulty}
                onChange={handleChange}
                required
              >
                <option value="beginner">🟢 Beginner - Easy to find bugs</option>
                <option value="intermediate">🟡 Intermediate - Moderate complexity</option>
                <option value="expert">🔴 Expert - Advanced vulnerabilities</option>
              </select>
            </div>

            <div className="form-group">
              <label>Expires In (Days) *</label>
              <select
                name="expiresInDays"
                className="form-select"
                value={formData.expiresInDays}
                onChange={handleChange}
                required
              >
                <option value="7">7 Days</option>
                <option value="14">14 Days</option>
                <option value="30">30 Days</option>
                <option value="60">60 Days</option>
                <option value="90">90 Days</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/hacks')}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Bounty...' : (
              <>
                <Shield size={20} />
                Create Bounty
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

