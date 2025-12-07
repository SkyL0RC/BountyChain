import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import { useEffect, useRef } from 'react';
import { Wallet } from 'lucide-react';

export default function WalletConnect() {
  const account = useCurrentAccount();
  const previousAccount = useRef(account?.address);

  useEffect(() => {
    // Eğer cüzdan değiştiyse (çıkış yapıldı veya yeni cüzdan bağlandı)
    if (previousAccount.current !== account?.address) {
      // İlk render'da reload etme
      if (previousAccount.current !== undefined) {
        console.log('🔄 Wallet changed, reloading page...');
        window.location.reload();
      }
      previousAccount.current = account?.address;
    }
  }, [account?.address]);

  return (
    <div className="wallet-connect-wrapper">
      {account ? (
        <ConnectButton />
      ) : (
        <ConnectButton />
      )}
    </div>
  );
}
