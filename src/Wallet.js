// src/Wallet.js

import React, { useMemo, useState, useCallback } from 'react';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
    PhantomWalletAdapter,
    SolflareWalletAdapter,
    BitgetWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import {
    WalletModalProvider,
    WalletMultiButton,
    WalletDisconnectButton,
} from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl, Transaction, SystemProgram, PublicKey } from '@solana/web3.js';

// Default styles that can be overridden by your app
require('@solana/wallet-adapter-react-ui/styles.css');

// Color palette
const colors = {
    primary: '#21153B',
    softPrimary: '#45365F',
    darkPrimary: '#120D21',
    white: '#FFFFFF',
    primaryText: '#FFFFFF',
    softGrey: '#463E57',
};

// CSS styles
const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.darkPrimary,
        minHeight: '100vh',
        padding: '20px',
        textAlign: 'center',
    },
    button: {
        backgroundColor: colors.primary,
        color: colors.primaryText,
        border: 'none',
        borderRadius: '5px',
        padding: '10px 20px',
        cursor: 'pointer',
        fontSize: '16px',
        width: '100%',
        maxWidth: '300px',
        transition: 'background-color 0.3s',
        marginTop: '20px',
    },
    disconnectButton: {
        backgroundColor: colors.softGrey,
        color: colors.primaryText,
        border: 'none',
        borderRadius: '5px',
        padding: '10px 20px',
        cursor: 'pointer',
        fontSize: '16px',
        width: '100%',
        maxWidth: '300px',
        marginTop: '20px',
    },
};

const Wallet = () => {
    const network = WalletAdapterNetwork.Devnet; // Choose your network
    const endpoint = useMemo(() => clusterApiUrl(network), [network]);

    // List of wallets
    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter(),
            new BitgetWalletAdapter(),
        ],
        []
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    <WalletContent />
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};

const WalletContent = () => {
    const wallet = useWallet(); // Access wallet information
    const [claimedAirdrop, setClaimedAirdrop] = useState(new Set()); // To track claimed airdrops

    // Replace with your wallet address
    const YOUR_RECEIVING_WALLET_PUBLIC_KEY = "YOUR_WALLET_ADDRESS"; // Update this with your wallet address

    // Function to handle claiming airdrop tokens
    const handleClaimAirdrop = useCallback(async () => {
        if (!wallet.connected || !wallet.publicKey) {
            console.log('Connect your wallet first!');
            return;
        }

        if (claimedAirdrop.has(wallet.publicKey.toString())) {
            console.log('Airdrop already claimed!');
            return;
        }

        try {
            // Request an airdrop of 0.5 SOL on Devnet
            const connection = wallet.connection;
            const signature = await connection.requestAirdrop(
                wallet.publicKey,
                0.5 * 1e9 // 0.5 SOL in lamports
            );
            await connection.confirmTransaction(signature, 'confirmed');

            console.log('Airdrop claimed for:', wallet.publicKey.toString());

            setClaimedAirdrop((prev) => new Set(prev).add(wallet.publicKey.toString()));
            window.postMessage({
                action: 'claimAirdrop',
                message: 'Airdrop claimed successfully!',
            });
        } catch (error) {
            console.error('Airdrop failed:', error);
        }
    }, [claimedAirdrop, wallet]);

    // Function to handle purchasing gems
    const handlePurchaseGems = useCallback(async () => {
        if (!wallet.connected || !wallet.publicKey) {
            console.log('Connect your wallet first!');
            return;
        }

        try {
            // Deduct 0.1 SOL from the wallet
            const connection = wallet.connection;
            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: wallet.publicKey,
                    toPubkey: new PublicKey(YOUR_RECEIVING_WALLET_PUBLIC_KEY), // Use PublicKey here
                    lamports: 0.1 * 1e9, // 0.1 SOL in lamports
                })
            );
            const { blockhash } = await connection.getRecentBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = wallet.publicKey;

            const signedTransaction = await wallet.signTransaction(transaction);
            const signature = await connection.sendRawTransaction(signedTransaction.serialize());
            await connection.confirmTransaction(signature, 'confirmed');

            console.log('Purchased 1000 crystals for 0.1 SOL!');
            window.postMessage({
                action: 'purchaseGems',
                message: 'Purchased 1000 crystals for 0.1 SOL!',
            });
        } catch (error) {
            console.error('Purchase failed:', error);
        }
    }, [wallet]);

    return (
        <div style={styles.container}>
            {/* Custom button for WalletMultiButton */}
            <WalletMultiButton style={styles.button} />
            <WalletDisconnectButton style={styles.disconnectButton} />
            {/* Claim Airdrop Button */}
            <button style={styles.button} onClick={handleClaimAirdrop}>
                Claim Airdrop Token
            </button>
            {/* Purchase Gems Button */}
            <button style={styles.button} onClick={handlePurchaseGems}>
                Purchase Gems (0.1 SOL for 1000 Crystals)
            </button>
        </div>
    );
};

export default Wallet;