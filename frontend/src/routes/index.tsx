import { createFileRoute } from '@tanstack/react-router'
import { useWalletSelector } from "@near-wallet-selector/react-hook";
import { useState, useEffect } from 'react';
import { useBridge } from '../hooks/useBridge';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAccount } from 'wagmi';
import toast from 'react-hot-toast';
import { ChevronDown, ChevronUp, Info, Wallet, RefreshCw } from 'lucide-react';
import { getAllTokens, TokenInfo as SolanaTokenInfo } from '../lib/sol';
import { formatNumber } from '../utils/sol';

export const Route = createFileRoute('/')({
  component: Home,
})

type ChainType = 'near' | 'solana' | 'evm';

interface TokenInfo {
  symbol: string;
  balance: string;
  value: string;
  icon: string;
  decimals: number
}

function Home() {
  const { 
    deployTokenNear,
    transferTokenSolanaToNear
  } = useBridge();
  
  const { publicKey, connected } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [tokenMint, setTokenMint] = useState('');
  const [recipientNearAccount, setRecipientNearAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [checkResult, setCheckResult] = useState<string>('');
  const {signIn, signedAccountId} = useWalletSelector()
  const { address: evmAddress, isConnected: evmConnected } = useAccount();

  // New state for the redesigned interface
  const [selectedToken, setSelectedToken] = useState<TokenInfo>({
    symbol: 'NEAR',
    balance: '0',
    value: '0',
    icon: '/chains/near.png',
    decimals: 0
  });
  const [fromChain, setFromChain] = useState<ChainType>('solana');
  const [toChain, setToChain] = useState<ChainType>('near');
  const [isWalletSectionExpanded, setIsWalletSectionExpanded] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [solanaTokens, setSolanaTokens] = useState<SolanaTokenInfo[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [isTokenDropdownOpen, setIsTokenDropdownOpen] = useState(false);

  // Function to fetch Solana tokens
  const fetchSolanaTokens = async () => {
    if (!connected || !publicKey) return;
    
    setIsLoadingTokens(true);
    try {
      const tokens = await getAllTokens(publicKey.toBase58());
      setSolanaTokens(tokens);
    } catch (error) {
      console.error('Error fetching Solana tokens:', error);
      toast.error('Failed to fetch Solana tokens');
    } finally {
      setIsLoadingTokens(false);
    }
  };

  // Available tokens for each chain
  const chainTokens = {
    near: [
      { symbol: 'NEAR', balance: '0', value: '0', icon: '/chains/near.png', decimals: 0 },
      { symbol: 'USDC', balance: '0', value: '0', icon: '/chains/near.png', decimals: 0 }
    ],
    solana: solanaTokens.length > 0 
      ? solanaTokens.map(token => ({
          symbol: token.symbol,
          balance: formatNumber(token.balance),
          value: '0', // TODO: Add price fetching
          icon: token.image || '/chains/solana.svg',
          decimals: token.decimals
        }))
      : [
          { symbol: 'SOL', balance: '0', value: '0', icon: '/chains/solana.svg', decimals: 0 },
          { symbol: 'USDC', balance: '0', value: '0', icon: '/chains/solana.svg', decimals: 0 }
        ],
    evm: [
      { symbol: 'ETH', balance: '0', value: '0', icon: '/chains/ethereum.png', decimals: 0 },
      { symbol: 'USDC', balance: '0', value: '0', icon: '/chains/ethereum.png', decimals: 0 }
    ]
  };

  // Check if wallet is connected for the selected "from" chain
  const isFromChainWalletConnected = () => {
    switch (fromChain) {
      case 'near':
        return !!signedAccountId;
      case 'solana':
        return connected;
      case 'evm':
        return evmConnected;
      default:
        return false;
    }
  };

  // Get available tokens for the selected "from" chain
  const getAvailableTokens = () => {
    if (!isFromChainWalletConnected()) {
      return [];
    }
    return chainTokens[fromChain] || [];
  };

  // Get wallet connection status text
  const getWalletConnectionText = () => {
    if (isFromChainWalletConnected()) {
      return 'Select Token';
    }
    
    switch (fromChain) {
      case 'near':
        return 'Connect NEAR Wallet to view tokens';
      case 'solana':
        return 'Connect Solana Wallet to view tokens';
      case 'evm':
        return 'Connect EVM Wallet to view tokens';
      default:
        return 'Connect wallet to view tokens';
    }
  };

  // Chain information
  const chains = {
    near: { name: 'Near', icon: '/chains/near.png', color: 'bg-green-500' },
    solana: { name: 'Solana', icon: '/chains/solana.svg', color: 'bg-purple-500' },
    evm: { name: 'EVM', icon: '/chains/ethereum.png', color: 'bg-blue-500' }
  };

  // Fetch Solana tokens when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      fetchSolanaTokens();
    } else {
      setSolanaTokens([]);
    }
  }, [connected, publicKey?.toBase58()]);

  // Update selected token when chain changes or wallet connection status changes
  useEffect(() => {
    const availableTokens = getAvailableTokens();
    if (availableTokens.length > 0) {
      setSelectedToken(availableTokens[0]);
    } else {
      // Reset to default token when no wallet is connected
      setSelectedToken({
        symbol: 'NEAR',
        balance: '0',
        value: '0',
        icon: '/chains/near.png',
        decimals: 0
      });
    }
  }, [fromChain, connected, signedAccountId, evmConnected, solanaTokens]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.token-dropdown')) {
        setIsTokenDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Prevent same chain selection
  const handleFromChainChange = (chain: ChainType) => {
    if (chain === toChain) {
      toast.error('From and To chains cannot be the same');
      return;
    }
    setFromChain(chain);
  };

  const handleToChainChange = (chain: ChainType) => {
    if (chain === fromChain) {
      toast.error('From and To chains cannot be the same');
      return;
    }
    setToChain(chain);
  };

  const handleDeployToken = async () => {
    if (!tokenMint) {
      toast.error('Please enter a token mint address');
      return;
    }

    if (!connected || !publicKey) {
      toast.error('Please connect your Solana wallet first');
      return;
    }
    setIsLoading(true);
    try {
      const toastId = toast.loading("Starting token deployment process...");
      setCheckResult('🔄 Starting token deployment process...\n1. Logging metadata...\n2. Waiting 60 seconds for completion...\n3. Getting VAA...\n4. Deploying to NEAR...');
      const toastWatting = toast.loading("Waiting 60 seconds for logMetadata", {id: toastId});
      const result = await deployTokenNear(tokenMint);
      const nearExplorerUrl = result 
        ? `https://testnet.nearblocks.io/en/txns/${result}`
        : null;
      
      const resultText = `✅ Token deployed to NEAR successfully!\nTransaction: ${JSON.stringify(result, null, 2)}`;
      
      if (nearExplorerUrl) {
        setCheckResult(`${resultText}\n\n🔗 View on NEAR Explorer: ${nearExplorerUrl}`);
      } else {
        setCheckResult(resultText);
      }
      toast.success("Token deployed to NEAR successfully!", { id: toastWatting });
    } catch (error) {
      setCheckResult(`❌ Error deploying token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransferToken = async () => {
    if (!tokenMint) {
      toast.error('Please enter a token mint address');
      return;
    }

    if (!recipientNearAccount) {
      toast.error('Please enter a recipient NEAR account');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!connected || !publicKey) {
      toast.error('Please connect your Solana wallet first');
      return;
    }

    setIsTransferring(true);
    try {
      const toastId = toast.loading("Starting token transfer process...");
      setCheckResult('🔄 Starting token transfer process...\n1. Initiating bridge transfer...\n2. Waiting for confirmation...\n3. Processing on NEAR...');
      
      // Convert amount to bigint (assuming 6 decimals for most tokens)
      const amountBigInt = BigInt(Math.floor(parseFloat(amount) * 1000000));
      
      const result = await transferTokenSolanaToNear(tokenMint, amountBigInt, recipientNearAccount);
      
      const resultText = `✅ Token transfer initiated successfully!\nTransaction: ${result?.transactionHash || 'Completed'}\nStatus: ${result?.status || 'Processing'}`;
      
      if (result?.transactionHash) {
        const solanaExplorerUrl = `https://explorer.solana.com/tx/${result.transactionHash}?cluster=devnet`;
        setCheckResult(`${resultText}\n\n🔗 View on Solana Explorer: ${solanaExplorerUrl}`);
      } else {
        setCheckResult(resultText);
      }
      
      toast.success("Token transfer initiated successfully!", { id: toastId });
    } catch (error) {
      setCheckResult(`❌ Error transferring token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg border border-gray-200 mt-10">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Omni Bridge</h2>
      
      {/* Wallet Connection Section - Moved to top */}
      <div className="mb-6">
        <div 
          className="bg-gray-100 rounded-lg p-4 cursor-pointer"
          onClick={() => setIsWalletSectionExpanded(!isWalletSectionExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Wallet className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {connected || signedAccountId || evmConnected ? 'Wallets Connected' : 'No wallets connected'}
              </span>
            </div>
            {isWalletSectionExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            )}
          </div>
        </div>

        {isWalletSectionExpanded && (
          <div className="mt-3 space-y-3">
            {/* Solana Wallet */}
            <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <img src="/chains/solana.svg" alt="Solana" className="w-6 h-6" />
                <span className="text-sm font-medium">Connect Solana Wallet</span>
              </div>
              {connected ? (
                <div className="text-sm text-green-600 font-mono">
                  {publicKey?.toBase58().slice(0, 8)}...{publicKey?.toBase58().slice(-4)}
                </div>
              ) : (
                <button className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
                  Connect
                </button>
              )}
            </div>

            {/* NEAR Wallet */}
            <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <img src="/chains/near.png" alt="NEAR" className="w-6 h-6" />
                <span className="text-sm font-medium">Connect NEAR Wallet</span>
              </div>
              {signedAccountId ? (
                <div className="text-sm text-green-600 font-mono">
                  {signedAccountId.length > 20 
                    ? `${signedAccountId.slice(0, 8)}...${signedAccountId.slice(-4)}` 
                    : signedAccountId}
                </div>
              ) : (
                <button 
                  onClick={signIn}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                >
                  Connect
                </button>
              )}
            </div>

            {/* EVM Wallet */}
            <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <img src="/chains/ethereum.png" alt="EVM" className="w-6 h-6" />
                <span className="text-sm font-medium">Connect EVM Wallet</span>
              </div>
              {evmConnected ? (
                <div className="text-sm text-green-600 font-mono">
                  {evmAddress ? `${evmAddress.slice(0, 8)}...${evmAddress.slice(-4)}` : 'Connected'}
                </div>
              ) : (
                <button className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
                  Connect
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Token Selection Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">{getWalletConnectionText()}</h3>
          <div className="flex items-center space-x-2">
            {fromChain === 'solana' && connected && (
              <button
                onClick={fetchSolanaTokens}
                disabled={isLoadingTokens}
                className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                title="Refresh tokens"
              >
                <RefreshCw className={`w-4 h-4 text-gray-400 ${isLoadingTokens ? 'animate-spin' : ''}`} />
              </button>
            )}
            <Info className="w-4 h-4 text-gray-400" />
          </div>
        </div>
        
        {isFromChainWalletConnected() ? (
          <div className="relative token-dropdown">
            <div 
              className="border border-gray-200 rounded-lg p-2 cursor-pointer"
              onClick={() => setIsTokenDropdownOpen(!isTokenDropdownOpen)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img 
                    src={selectedToken.icon} 
                    alt={selectedToken.symbol} 
                    className="w-8 h-8 rounded-full bg-white/20 p-1" 
                  />
                  <div>
                    <div className="font-semibold">{selectedToken.symbol}</div>
                    <div className="text-sm opacity-90">
                      {isLoadingTokens ? 'Loading...' : `${selectedToken.balance} ($ ${selectedToken.value})`}
                    </div>
                  </div>
                </div>
                {isTokenDropdownOpen ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </div>
            </div>

            {/* Token Dropdown */}
            {isTokenDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                {isLoadingTokens ? (
                  <div className="p-2 text-center text-gray-500">
                    Loading tokens...
                  </div>
                ) : getAvailableTokens().length > 0 ? (
                  getAvailableTokens().map((token, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      onClick={() => {
                        setSelectedToken(token);
                        setIsTokenDropdownOpen(false);
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <img 
                          src={token.icon} 
                          alt={token.symbol} 
                          className="w-6 h-6 rounded-full" 
                        />
                        <div>
                          <div className="font-medium text-gray-800">{token.symbol}</div>
                          <div className="text-sm text-gray-500">{token.balance}</div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        ${token.value}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    No tokens found
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-100 rounded-lg p-4 border-2 border-dashed border-gray-300">
            <div className="flex items-center justify-center space-x-2 text-gray-500">
              <Wallet className="w-5 h-5" />
              <span className="text-sm font-medium">{getWalletConnectionText()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Chain Selection Section */}
      <div className="mb-6 space-y-4">
        {/* From Chain */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
          <div className="flex space-x-2">
            {Object.entries(chains).map(([key, chain]) => (
              <button
                key={key}
                onClick={() => handleFromChainChange(key as ChainType)}
                className={`flex-1 flex flex-col items-center p-3 rounded-lg border-2 transition-all cursor-pointer ${
                  fromChain === key 
                    ? 'border-green-400 bg-green-50' 
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}
              >
                <img src={chain.icon} alt={chain.name} className="w-6 h-6 mb-1" />
                <span className="text-sm font-medium">{chain.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* To Chain */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
          <div className="flex space-x-2">
            {Object.entries(chains).map(([key, chain]) => (
              <button
                key={key}
                onClick={() => handleToChainChange(key as ChainType)}
                className={`flex-1 flex flex-col items-center p-3 rounded-lg border-2 transition-all cursor-pointer ${
                  toChain === key 
                    ? 'border-green-400 bg-green-50' 
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}
              >
                <img src={chain.icon} alt={chain.name} className="w-6 h-6 mb-1" />
                <span className="text-sm font-medium">{chain.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Amount Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-700">Amount</label>
        </div>
        <div className="relative">
          <div className="flex items-center p-3 bg-gray-100 rounded-lg">
            <img src={selectedToken.icon} alt={selectedToken.symbol} className="w-5 h-5 mr-2 rounded-full" />
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="flex-1 bg-transparent outline-none text-lg"
            />
          </div>
        </div>
      </div>

      {/* Recipient Address Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Recipient Address</label>
        <div className="relative">
          <input
            type="text"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            placeholder={`${chains[toChain].name} address`}
            className="w-full p-3 bg-gray-100 rounded-lg outline-none"
          />
          <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 text-sm font-medium">
            Connect Wallet
          </button>
        </div>
      </div>



      {/* Connect Wallet Button */}
      <button className="w-full bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 transition-colors">
        Connect Wallet
      </button>
      
      {/* Legacy Bridge Interface (Hidden by default) */}
      <div className="mt-8 pt-8 border-t border-gray-200">
        <details className="group">
          <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
            Advanced Bridge Options
          </summary>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Solana Token Mint Address
              </label>
              <input
                type="text"
                value={tokenMint}
                onChange={(e) => setTokenMint(e.target.value)}
                placeholder="e.g., So11111111111111111111111111111111111111112"
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient NEAR Account
              </label>
              <input
                type="text"
                value={recipientNearAccount}
                onChange={(e) => setRecipientNearAccount(e.target.value)}
                placeholder="e.g., account.testnet"
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleDeployToken}
                disabled={isLoading || !connected}
                className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 disabled:opacity-50"
              >
                {isLoading ? 'Deploying...' : 'Deploy Token to NEAR'}
              </button>

              <button
                onClick={handleTransferToken}
                disabled={isTransferring || !connected || !signedAccountId}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
              >
                {isTransferring ? 'Transferring...' : 'Transfer Token to NEAR'}
              </button>
            </div>

            {checkResult && (
              <div className="mt-4 p-4 bg-gray-100 rounded-md">
                <h3 className="font-semibold mb-2">Result:</h3>
                <pre className="text-sm whitespace-pre-wrap">{checkResult}</pre>
              </div>
            )}
          </div>
        </details>
      </div>
    </div>
  );
}
