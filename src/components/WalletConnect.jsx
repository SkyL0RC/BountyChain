import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import { Wallet } from 'lucide-react';

export default function WalletConnect() {
  const account = useCurrentAccount();

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
