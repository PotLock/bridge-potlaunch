import { useState, useEffect } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletSelector } from '@near-wallet-selector/react-hook';
import WalletProfileModal from './WalletProfileModal';
import SignInModal from './SignInModal';
import { ChevronDown, User, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import toast from 'react-hot-toast';

interface ConnectedWallet {
  type: 'solana' | 'near' | 'evm';
  address: string;
  displayName: string;
}

const WalletButton: React.FC = () => {
  const { address, isConnected: evmConnected } = useAccount();
  const { disconnect: disconnectEVM } = useDisconnect();
  const { connected: solanaConnected, disconnect: disconnectSolana, publicKey } = useWallet();
  
  const {signedAccountId, signOut} = useWalletSelector()

  // State for modals
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [showCopySuccess, setShowCopySuccess] = useState<string | null>(null);

  const isAnyWalletConnected = () => {
    return evmConnected || solanaConnected || !!signedAccountId;
  };

  const getConnectedWallets = (): ConnectedWallet[] => {
    const wallets: ConnectedWallet[] = [];
    
    if (solanaConnected && publicKey) {
      wallets.push({
        type: 'solana',
        address: publicKey.toString(),
        displayName: 'Solana Wallet'
      });
    }
    
    if (signedAccountId) {
      wallets.push({
        type: 'near',
        address: signedAccountId,
        displayName: 'NEAR Wallet'
      });
    }
    
    if (evmConnected && address) {
      wallets.push({
        type: 'evm',
        address: address,
        displayName: 'MetaMask'
      });
    }
    
    return wallets;
  };

  const getConnectedWalletsCount = () => {
    let count = 0;
    if (evmConnected) count++;
    if (solanaConnected) count++;
    if (signedAccountId) count++;
    return count;
  };

  const getButtonText = () => {
    if (isAnyWalletConnected()) {
      const count = getConnectedWalletsCount();
      if (count === 1) {
        // Show the connected wallet address
        if (evmConnected && address) {
          return `${address.slice(0, 6)}...${address.slice(-4)}`;
        }
        if (solanaConnected) {
          return 'Solana Wallet';
        }
        if (signedAccountId) {
          return signedAccountId.length > 60 
            ? `${signedAccountId.slice(0, 6)}...${signedAccountId.slice(-4)}` 
            : signedAccountId;
        }
      } else {
        // Show count of connected wallets
        return `${count} Wallets Connected`;
      }
    }
    
    return 'Sign In';
  };

  const handleWalletButtonClick = () => {
    if (isAnyWalletConnected()) {
      setIsProfileModalOpen(true);
    } else {
      setIsSignInModalOpen(true);
    }
  };

  // Handle copy success tooltip
  useEffect(() => {
    if (showCopySuccess) {
      const timer = setTimeout(() => {
        setShowCopySuccess(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showCopySuccess]);

  const handleCopyAddress = async (address: string, type: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setShowCopySuccess(type);
      toast.success('Address copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy address');
    }
  };

  const handleDisconnectWallet = async (walletType: 'solana' | 'near' | 'evm') => {
    switch (walletType) {
      case 'solana':
        disconnectSolana();
        break;
      case 'near':
        if (signedAccountId) {
          try {
            await signOut();
          } catch (error) {
            console.error('Failed to disconnect NEAR wallet:', error);
          }
        }
        break;
      case 'evm':
        disconnectEVM();
        break;
    }
  };

  const connectedWallets = getConnectedWallets();

  if (isAnyWalletConnected()) {
    return (
      <div className="flex flex-col gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild className='shadow-none text-black'>
            <Button variant="default" className="shadow-none text-black flex items-center space-x-2 bg-white border border-gray-200 hover:text-black cursor-pointer hover:bg-gray-50">
              <User className="w-4 h-4" />
              <span className='text-black'>{getButtonText()}</span>
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 bg-white text-black shadow-none border border-gray-200">
            {connectedWallets.map((wallet, index) => (
              <DropdownMenuItem key={index} className="flex items-center gap-2 hover:bg-gray-50 shadow-none">
                <div className="flex items-center space-x-2">
                  <img 
                    src={wallet.type === 'solana' ? '/chains/solana.svg' : 
                         wallet.type === 'near' ? '/chains/near.png' : 
                         '/icons/metamask.svg'} 
                    alt={wallet.displayName} 
                    className="w-4 h-4" 
                  />
                </div>
                <div className="relative group flex-1">
                  <span 
                    className="text-xs text-gray-500 font-mono cursor-pointer hover:text-gray-700"
                    onClick={() => handleCopyAddress(wallet.address, wallet.type)}
                  >
                    {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                  </span>
                  {showCopySuccess === wallet.type ? (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-green-600 text-white text-xs rounded opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      Copy successful!
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-green-600"></div>
                    </div>
                  ) : (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      {wallet.address}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className='cursor-pointer hover:bg-gray-200' onClick={() => setIsProfileModalOpen(true)}>
              <User className="w-4 h-4" />
              Manage Wallets
            </DropdownMenuItem>
            <DropdownMenuItem className='cursor-pointer hover:bg-gray-200' onClick={() => setIsSignInModalOpen(true)}>
              <User className="w-4 h-4" />
              Add More Wallets
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {connectedWallets.map((wallet, index) => (
              <DropdownMenuItem 
                key={`disconnect-${index}`} 
                onClick={() => handleDisconnectWallet(wallet.type)}
                className="text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Disconnect {wallet.displayName}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        <SignInModal
          isOpen={isSignInModalOpen}
          onClose={() => setIsSignInModalOpen(false)}
        />
        
        <WalletProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Wallet Connection */}
      <button
        onClick={handleWalletButtonClick}
        className="w-full bg-white border border-gray-200 px-4 py-1.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
      >
        {getButtonText()}
      </button>
      
      {/* Sign In Modal */}
      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
      />
      
      {/* Profile Modal for all chains */}
      <WalletProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
};

export default WalletButton;