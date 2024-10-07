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
import { clusterApiUrl, Connection, Transaction, SystemProgram, PublicKey } from '@solana/web3.js';

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
    form: {
        marginTop: '20px',
        maxWidth: '300px',
        width: '100%',
    },
    label: {
        color: colors.primaryText,
        display: 'block',
        marginBottom: '10px',
    },
    input: {
        width: '100%',
        padding: '10px',
        borderRadius: '5px',
        border: '1px solid #ccc',
        marginBottom: '10px',
    },
    errorText: {
        color: 'red',
        marginTop: '10px',
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
                    <WalletContent endpoint={endpoint} />
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};

const WalletContent = ({ endpoint }) => {
    const wallet = useWallet(); // Access wallet information

    // Replace with your wallet address
    const YOUR_RECEIVING_WALLET_PUBLIC_KEY = "JncCqNjRmNNq6naszU9z6kWSuuPi6Bp4yYAAXRXtEP6"; // Update this with your wallet address

    // State variables for the airdrop functionality
    const [solanaPublicKey, setSolanaPublicKey] = useState('');
    const [txHash, setTxHash] = useState('');
    const [isAirdropped, setIsAirdropped] = useState(false);
    const [errorMessage, setErrorMessage] = useState(''); // State to hold the error message

    // Function to handle claiming airdrop tokens
    const handleClaimAirdrop = useCallback(
        async (e) => {
            e.preventDefault(); // Prevent form submission from refreshing the page

            // Establish a connection to the network
            const connection = new Connection(endpoint);

            let publicKeyObject;
            try {
                publicKeyObject = new PublicKey(solanaPublicKey);
            } catch (err) {
                setErrorMessage('Invalid Solana address. Please try again.');
                return;
            }

            try {
                // Request an airdrop of 0.5 SOL on Devnet
                const txhash = await connection.requestAirdrop(publicKeyObject, 0.5 * 1e9);
                setTxHash(txhash);
                setIsAirdropped(true);
                setErrorMessage(''); // Clear any previous error

                console.log(`Airdrop claimed for: ${solanaPublicKey}`);

                window.postMessage({
                    action: 'claimAirdrop',
                    message: 'Airdrop claimed successfully!',
                });
            } catch (error) {
                console.error('Airdrop failed:', error);
                setErrorMessage(
                    "You've either reached your airdrop limit today or the airdrop faucet has run dry. Please visit https://faucet.solana.com for alternate sources of test SOL."
                );
                // Automatically clear the error after 10 seconds
                setTimeout(() => {
                    setErrorMessage('');
                }, 10000);
            }
        },
        [solanaPublicKey, endpoint]
    );

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
            const { blockhash } = await connection.getLatestBlockhash();
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
            {/* Wallet Buttons */}
            <WalletMultiButton style={styles.button} />
            <WalletDisconnectButton style={styles.disconnectButton} />

            {/* Airdrop Form */}
            <form onSubmit={handleClaimAirdrop} style={styles.form}>
                <label htmlFor="solanaAddress" style={styles.label}>
                    Solana Airdrop
                </label>
                <input
                    type="text"
                    name="solanaAddress"
                    placeholder="Enter Solana address..."
                    id="solanaAddress"
                    value={solanaPublicKey}
                    onChange={(e) => setSolanaPublicKey(e.target.value)}
                    style={{
                        ...styles.input,
                        backgroundColor: isAirdropped ? '#e0ffe0' : '#fff',
                    }}
                />
                <button type="submit" style={styles.button}>
                    Airdrop
                </button>
            </form>

            {/* Display Transaction Hash if Airdropped */}
            {isAirdropped && (
                <p style={{ color: 'green' }}>
                    Airdrop successful! Transaction hash: {txHash}
                </p>
            )}

            {/* Display Error Message */}
            {errorMessage && <p style={styles.errorText}>{errorMessage}</p>}

            {/* Purchase Gems Button */}
            {/* <button style={styles.button} onClick={handlePurchaseGems}>
                Purchase Gems (0.1 SOL for 1000 Crystals)
            </button> */}
        </div>
    );
};

export default Wallet;
