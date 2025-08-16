import { createFileRoute } from '@tanstack/react-router'
import { useWalletSelector } from "@near-wallet-selector/react-hook";
import { useState, useEffect, useCallback } from 'react';
import { useBridge } from '../hooks/useBridge';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAccount } from 'wagmi';
import toast from 'react-hot-toast';
import { ChevronDown, ChevronUp, Info, Wallet, RefreshCw } from 'lucide-react';
import { getAllTokens, getSolBalance, TokenInfo as SolanaTokenInfo } from '../lib/sol';
import { formatNumber } from '../utils/sol';
import { isRegisteredToken } from '../lib/omni-bridge';
import { getNearBalance } from '../lib/near';

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
  mint: string,
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
  const [amount, setAmount] = useState('');
  const [checkResult, setCheckResult] = useState<string>('');
  const {signIn, signedAccountId} = useWalletSelector()
  const { address: evmAddress, isConnected: evmConnected } = useAccount();

  // New state for the redesigned interface
  const [selectedToken, setSelectedToken] = useState<TokenInfo>();
  const [fromChain, setFromChain] = useState<ChainType>('solana');
  const [toChain, setToChain] = useState<ChainType>('near');
  const [isWalletSectionExpanded, setIsWalletSectionExpanded] = useState(false);
  const [solanaTokens, setSolanaTokens] = useState<SolanaTokenInfo[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [isTokenDropdownOpen, setIsTokenDropdownOpen] = useState(false);
  const [showCopySuccess, setShowCopySuccess] = useState<string | null>(null);
  const [tokenIsRegistered, setTokenIsRegistered] = useState<boolean>(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [transactionHashNear, setTransactionHashNear] = useState<string | null>(null);

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
    near: [],
    solana: solanaTokens.length > 0 
      ? solanaTokens.map(token => ({
          symbol: token.symbol,
          balance: token.balance.toString(),
          value: '0', // TODO: Add price fetching
          icon: token.image || '/chains/solana.svg',
          decimals: token.decimals,
          mint: token.mint
        }))
      : [],
    evm: []
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

  // Check if wallet is connected for the selected "to" chain
  const isToChainWalletConnected = () => {
    switch (toChain) {
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

  // Check if both wallets are connected
  const areBothWalletsConnected = () => {
    return isFromChainWalletConnected() && isToChainWalletConnected();
  };

  // Check if amount exceeds token balance
  const isAmountExceedingBalance = () => {
    if (!selectedToken || !amount) return false;
    const inputAmount = parseFloat(amount);
    const tokenBalance = parseFloat(selectedToken.balance);
    return inputAmount > tokenBalance;
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
    } 
  }, [fromChain, connected, signedAccountId, evmConnected, solanaTokens]);

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

  const checkIsRegisteredToken = useCallback(async () => {
    if(selectedToken && signedAccountId && publicKey){
      const isRegistered = await isRegisteredToken(publicKey?.toBase58() || '', selectedToken.mint, signedAccountId)
      console.log("isRegistered", isRegistered)
      setTokenIsRegistered(isRegistered)
    }
  },[selectedToken, signedAccountId, publicKey])

  useEffect(()=>{
    checkIsRegisteredToken()
  },[checkIsRegisteredToken])

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
    if (!selectedToken?.mint) {
      toast.error('Please select a token first');
      return;
    }

    if (!connected || !publicKey) {
      toast.error('Please connect your Solana wallet first');
      return;
    }

    if(!signedAccountId){
      toast.error('Please connect your NEAR wallet first');
      return;
    }

    setIsLoading(true);
    try {
      
      const toastId = toast.loading("Starting token deployment process...");

      const solBalance = await getSolBalance(publicKey?.toBase58() || '')
      
      if(solBalance < 0.0001){
        toast.error('Insufficient balance to deploy token, balance need >= 0.0001 SOL');
        return;
      }

      const nearBalance = await getNearBalance(signedAccountId)
      
      if(Number(nearBalance) < 3){
        toast.error('Insufficient balance to deploy token, balance need >= 3 NEAR');
        return;
      }

      const toastWatting = toast.loading("Waiting 60 seconds for logMetadata", {id: toastId});
      const result = await deployTokenNear(selectedToken.mint);
      const nearExplorerUrl = result 
        ? `https://testnet.nearblocks.io/en/txns/${result}`
        : null;
      await checkIsRegisteredToken()
      setAmount('0')
      setTransactionHash(nearExplorerUrl)
      toast.success("Token deployed to NEAR successfully!", { id: toastWatting });
    } catch (error) {
      setCheckResult(`❌ Error deploying token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransferToken = async () => {
    if (!selectedToken?.mint) {
      toast.error('Please select a token first');
      return;
    }

    if(!signedAccountId){
      toast.error('Please connect your NEAR wallet first');
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

      const toastWatting = toast.loading("Waiting 60 seconds for logMetadata", {id: toastId});

      // Convert amount to bigint (assuming 6 decimals for most tokens)
      const amountBigInt = BigInt(Math.floor(parseFloat(amount) * 1000000));
      
      const result = await transferTokenSolanaToNear(selectedToken.mint, amountBigInt, signedAccountId);
      const solanaExplorerUrl = `https://solscan.io/tx/${result?.transactionHash}?cluster=devnet`;
      const nearExplorerUrl = result?.transactionHashNear ? `https://testnet.nearblocks.io/en/txns/${result?.transactionHashNear}` : null
      setTransactionHash(solanaExplorerUrl);
      setTransactionHashNear(nearExplorerUrl)
      setAmount('0')
      
      toast.success("Token transfer initiated successfully!", { id: toastWatting });
    } catch (error) {
      setCheckResult(`❌ Error transferring token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg border border-gray-200 mt-10">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Omni Bridge</h2>
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
                <div className="relative group">
                  <div className="text-sm text-green-600 font-mono cursor-pointer hover:text-green-700" 
                       onClick={() => handleCopyAddress(publicKey?.toBase58() || '', 'solana')}>
                    {publicKey?.toBase58().slice(0, 8)}...{publicKey?.toBase58().slice(-4)}
                  </div>
                  {showCopySuccess === 'solana' ? (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-green-600 text-white text-xs rounded opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      Copy successful!
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-green-600"></div>
                    </div>
                  ) : (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      {publicKey?.toBase58()}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                  )}
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
                <div className="relative group">
                  <div className="text-sm text-green-600 font-mono cursor-pointer hover:text-green-700" 
                       onClick={() => handleCopyAddress(signedAccountId, 'near')}>
                    {signedAccountId.length > 20 
                      ? `${signedAccountId.slice(0, 8)}...${signedAccountId.slice(-4)}` 
                      : signedAccountId}
                  </div>
                  {showCopySuccess === 'near' ? (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-green-600 text-white text-xs rounded opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      Copy successful!
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-green-600"></div>
                    </div>
                  ) : (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      {signedAccountId}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                  )}
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
                <div className="relative group">
                  <div className="text-sm text-green-600 font-mono cursor-pointer hover:text-green-700" 
                       onClick={() => handleCopyAddress(evmAddress || '', 'evm')}>
                    {evmAddress ? `${evmAddress.slice(0, 8)}...${evmAddress.slice(-4)}` : 'Connected'}
                  </div>
                  {showCopySuccess === 'evm' ? (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-green-600 text-white text-xs rounded opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      Copy successful!
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-green-600"></div>
                    </div>
                  ) : (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      {evmAddress}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                  )}
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
            {isLoadingTokens ? (
              <div className="bg-gray-100 rounded-lg p-4 border-2 border-dashed border-gray-300">
                <div className="flex items-center justify-center space-x-2 text-gray-500">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span className="text-sm font-medium">Loading tokens...</span>
                </div>
              </div>
            ) : selectedToken ? (
              <>
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
                          {`${formatNumber(Number(selectedToken.balance))} ($ ${selectedToken.value})`}
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
                    {getAvailableTokens().map((token, index) => (
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
                            <div className="text-sm text-gray-500">{formatNumber(Number(token.balance))}</div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          ${token.value}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-gray-100 rounded-lg p-4 border-2 border-dashed border-gray-300">
                <div className="flex items-center justify-center space-x-2 text-gray-500">
                  <Wallet className="w-5 h-5" />
                  <span className="text-sm font-medium">No tokens found</span>
                </div>
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
            {Object.entries(chains).map(([key, chain]) => {
              const isDisabled = key === 'near' || key === 'evm';
              return (
                <div key={key} className="flex-1 relative group">
                  <button
                    onClick={() => !isDisabled && handleFromChainChange(key as ChainType)}
                    disabled={isDisabled}
                    className={`w-full flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                      isDisabled 
                        ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-60' 
                        : fromChain === key 
                          ? 'border-green-400 bg-green-50 cursor-pointer' 
                          : 'border-gray-200 bg-gray-50 hover:border-gray-300 cursor-pointer'
                    }`}
                  >
                    <img src={chain.icon} alt={chain.name} className="w-6 h-6 mb-1" />
                    <span className="text-sm font-medium">{chain.name}</span>
                  </button>
                  {isDisabled && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      Coming Soon
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* To Chain */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
          <div className="flex space-x-2">
            {Object.entries(chains).map(([key, chain]) => {
              const isDisabled = key === 'solana' || key === 'evm';
              return (
                <div key={key} className="flex-1 relative group">
                  <button
                    onClick={() => !isDisabled && handleToChainChange(key as ChainType)}
                    disabled={isDisabled}
                    className={`w-full flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                      isDisabled 
                        ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-60' 
                        : toChain === key 
                          ? 'border-green-400 bg-green-50 cursor-pointer' 
                          : 'border-gray-200 bg-gray-50 hover:border-gray-300 cursor-pointer'
                    }`}
                  >
                    <img src={chain.icon} alt={chain.name} className="w-6 h-6 mb-1" />
                    <span className="text-sm font-medium">{chain.name}</span>
                  </button>
                  {isDisabled && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      Coming Soon
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Amount Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-700">Amount</label>
        </div>
        <div className="relative">
          <div className={`flex items-center p-3 rounded-lg transition-colors ${
            selectedToken && isAmountExceedingBalance() 
              ? 'bg-red-50 border-2 border-red-500' 
              : 'bg-gray-100'
          }`}>
            {selectedToken ? (
              <>
                <img src={selectedToken.icon} alt={selectedToken.symbol} className="w-5 h-5 mr-2 rounded-full" />
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0"
                  className="flex-1 bg-transparent outline-none text-lg"
                />
                {isAmountExceedingBalance() && (
                  <div className="text-red-500 text-sm ml-2">
                    Insufficient balance
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="w-5 h-5 mr-2 rounded-full bg-gray-300" />
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Select a token first"
                  disabled
                  className="flex-1 bg-transparent outline-none text-lg text-gray-400"
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Recipient Address Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Recipient Address</label>
        <div className="relative">
          {(() => {

            const getToChainAddress = () => {
              switch (toChain) {
                case 'near':
                  return signedAccountId || '';
                case 'solana':
                  return publicKey?.toBase58() || '';
                case 'evm':
                  return evmAddress || '';
                default:
                  return '';
              }
            };

            const handleConnectToChainWallet = () => {
              switch (toChain) {
                case 'near':
                  if (!signedAccountId) {
                    signIn();
                  }
                  break;
                case 'solana':
                  // Solana wallet connection is handled by the wallet adapter
                  break;
                case 'evm':
                  // EVM wallet connection is handled by wagmi
                  break;
              }
            };

            if (isToChainWalletConnected()) {
              const address = getToChainAddress();
              return (
                <div className="relative group">
                  <div className="w-full p-3 bg-gray-100 rounded-lg flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img src={chains[toChain].icon} alt={chains[toChain].name} className="w-5 h-5" />
                      <span className="text-sm font-mono text-gray-700">
                        {address.length > 20 
                          ? `${address.slice(0, 8)}...${address.slice(-4)}` 
                          : address}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleCopyAddress(address, toChain)}
                      className="text-green-500 text-sm font-medium hover:text-green-600 cursor-pointer"
                    >
                      Copy
                    </button>
                  </div>
                  {showCopySuccess === toChain ? (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-green-600 text-white text-xs rounded opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      Copy successful!
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-green-600"></div>
                    </div>
                  ) : (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      {address}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                  )}
                </div>
              );
            } else {
              return (
                <div className="w-full p-3 bg-gray-100 rounded-lg flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img src={chains[toChain].icon} alt={chains[toChain].name} className="w-5 h-5" />
                    <span className="text-sm text-gray-500">
                      {toChain === 'near' ? 'Connect NEAR Wallet' : 
                       toChain === 'solana' ? 'Connect Solana Wallet' : 
                       'Connect EVM Wallet'}
                    </span>
                  </div>
                  <button 
                    onClick={handleConnectToChainWallet}
                    className="text-green-500 text-sm font-medium hover:text-green-600"
                  >
                    Connect
                  </button>
                </div>
              );
            }
          })()}
        </div>
      </div>


      {(() => {
        // If both wallets are not connected, show Connect Wallet button
        if (!areBothWalletsConnected()) {
          return (
            <button 
              className="w-full bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 transition-colors"
              onClick={() => {
                // Try to connect the missing wallets
                if (!isFromChainWalletConnected()) {
                  if (fromChain === 'near' && !signedAccountId) {
                    signIn();
                  }
                  // For Solana and EVM, connection is handled by their respective adapters
                }
                if (!isToChainWalletConnected()) {
                  if (toChain === 'near' && !signedAccountId) {
                    signIn();
                  }
                  // For Solana and EVM, connection is handled by their respective adapters
                }
              }}
            >
              Connect Wallet
            </button>
          );
        }

        // If both wallets are connected but no token is selected
        if (!selectedToken) {
          return (
            <button 
              className="w-full bg-gray-400 text-white py-3 rounded-lg font-medium cursor-not-allowed"
              disabled
            >
              Select a Token
            </button>
          );
        }

        // If both wallets are connected and token is selected
        if (tokenIsRegistered) {
          return (
            <button 
              className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleTransferToken}
              disabled={isTransferring || !amount || parseFloat(amount) <= 0 || isAmountExceedingBalance()}
            >
              {isTransferring ? 'Transferring...' : 'Transfer Token'}
            </button>
          );
        } else {
          return (
            <button 
              className="w-full bg-teal-500 text-white py-3 rounded-lg font-medium hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleDeployToken}
              disabled={isLoading}
            >
              {isLoading ? 'Deploying...' : 'Deploy Token'}
            </button>
          );
        }
      })()}
      
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
                value={signedAccountId || ''}
                placeholder="e.g., account.testnet"
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            {(() => {
              // If both wallets are not connected, show Connect Wallet button
              if (!areBothWalletsConnected()) {
                return (
                  <button 
                    className="w-full bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 transition-colors"
                    onClick={() => {
                      // Try to connect the missing wallets
                      if (!isFromChainWalletConnected()) {
                        if (fromChain === 'near' && !signedAccountId) {
                          signIn();
                        }
                        // For Solana and EVM, connection is handled by their respective adapters
                      }
                      if (!isToChainWalletConnected()) {
                        if (toChain === 'near' && !signedAccountId) {
                          signIn();
                        }
                        // For Solana and EVM, connection is handled by their respective adapters
                      }
                    }}
                  >
                    Connect Wallet
                  </button>
                );
              }

              // If both wallets are connected but no token is selected
              if (!selectedToken) {
                return (
                  <button 
                    className="w-full bg-gray-400 text-white py-3 rounded-lg font-medium cursor-not-allowed"
                    disabled
                  >
                    Select a Token
                  </button>
                );
              }

              // If both wallets are connected and token is selected
              if (tokenIsRegistered) {
                return (
                  <button 
                    className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                    onClick={handleTransferToken}
                    disabled={isTransferring || !amount || parseFloat(amount) <= 0 || isAmountExceedingBalance()}
                  >
                    {isTransferring ? 'Transferring...' : 'Transfer Token to NEAR'}
                  </button>
                );
              } else {
                return (
                  <button 
                    className="w-full bg-teal-500 text-white py-3 rounded-lg font-medium hover:bg-teal-600 transition-colors"
                    onClick={handleDeployToken}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Deploying...' : 'Deploy Token to NEAR'}
                  </button>
                );
              }
            })()}
          </div>
        </details>
      </div>
      {
        transactionHash && (
          <div className="mt-8 border-t border-gray-200">
            <div className="mt-4 space-y-2">
              <h3>Transactions</h3>
              <a href={transactionHash} target="_blank" rel="noopener noreferrer">
                <span className='break-all text-blue-500 hover:underline'>{transactionHash}</span>
              </a>
            </div>
          </div>
        )
      }
      {
        transactionHashNear && (
          <div className="mt-8 border-t border-gray-200">
            <div className="mt-4 space-y-2">
              <h3>Transactions NEAR</h3>
              <a href={transactionHashNear} target="_blank" rel="noopener noreferrer">
                <span className='break-all text-blue-500 hover:underline'>{transactionHashNear}</span>
              </a>
            </div>
          </div>
        )
      }
    </div>
  );
}
