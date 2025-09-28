'use client';

/**
 * ConnectButton Component
 *
 * A wallet connection button for Web3 applications showing essential account info.
 */

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useState, useRef, useEffect } from 'react';
import { useAccount, useBalance } from 'wagmi';
import Button from './ui/button';

interface ConnectButtonProps {
  className?: string;
}

export default function ConnectButton({ className }: ConnectButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { ready, authenticated, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const { address, chain } = useAccount();

  const { data: balanceData } = useBalance({
    address: address,
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!ready) return null;

  const activeWallet = wallets?.[0];
  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const toggleDropdown = () => setIsOpen(!isOpen);
  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {!authenticated ? (
        <Button onClick={login}>
          Connect
        </Button>
      ) : (
        <>
          <Button onClick={toggleDropdown} className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-400"></div>
            {formatAddress(activeWallet?.address || '')}
          </Button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-lg bg-black border border-white/20 shadow-lg z-50">
              <div className="p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Balance</span>
                  <span className="text-white">
                    {balanceData 
                      ? `${parseFloat(balanceData.formatted).toFixed(4)} ${balanceData.symbol}`
                      : '0'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Network</span>
                  <span className="text-white">{chain?.name}</span>
                </div>
              </div>
              
              <div className="border-t border-white/20">
                <button
                  onClick={handleLogout}
                  className="w-full p-3 text-left text-white hover:bg-white/10 transition-colors text-sm"
                >
                  Disconnect
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
