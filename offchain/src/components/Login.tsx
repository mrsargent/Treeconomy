import React, { useEffect, useState } from 'react'
import {
    SignInButton,
    SignedIn,
    SignedOut,
    UserButton,
    useUser
} from '@clerk/nextjs'
import { PrismaClient } from '@prisma/client';
import { credentialToAddress, Emulator, generatePrivateKey, keyHashToCredential, Lucid, PrivateKey, toPublicKey } from '@lucid-evolution/lucid';
import * as CML from '@anastasia-labs/cardano-multiplatform-lib-nodejs';
import { FcGoogle } from 'react-icons/fc'; 

interface LoginProps {
    onSignInStatusChange: (isSignedIn: boolean) => void;
}

const Login: React.FC<LoginProps> = ({ onSignInStatusChange }) => {
    const { isLoaded, isSignedIn, user } = useUser();
    const prisma = new PrismaClient();
    const [userAddress, setUserAddress] = useState<string | null>(null); // Changed to string | null

    useEffect(() => {
        if (isLoaded) {
            onSignInStatusChange(isSignedIn);

            if (isSignedIn && user?.primaryEmailAddress?.emailAddress) {
                const email = user.primaryEmailAddress.emailAddress;

                fetch('/api/generate_google_user', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email }),
                })
                    .then(response => response.json())
                    .then(data => {
                        if ('addr' in data && typeof data.addr === 'string') {
                            setUserAddress(data.addr);
                        } else {
                            // Handle error or no address found
                            console.error('Failed to fetch address:', data.error);
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching address:', error);
                    })

            }
        }
    }, [isLoaded, isSignedIn, user, onSignInStatusChange]);

    const userEmail = user?.primaryEmailAddress?.emailAddress;

    return (
        <>
            <SignedOut>
            <button className="btn btn-primary">
                    <SignInButton>
                        <span className="flex items-center">
                            <FcGoogle className="mr-2" /> {/* Google Icon */}
                            Log In
                        </span>
                    </SignInButton>
                </button>
            </SignedOut>
            <SignedIn>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ marginRight: '10px' }}>
                    {userAddress === undefined ? " " : userAddress?.slice(0, 10)}
                    {"..."}
                    {userAddress === undefined ? " " : userAddress?.slice(userAddress.length - 6)}
                </span>
                <UserButton
                    appearance={{
                        elements: {
                            userButton: "btn btn-primary",
                            userButtonTrigger: "btn btn-primary",
                            userButtonPopoverFooter: "btn btn-primary",
                        }
                    }}
                />
                </div>
            </SignedIn>
        </>
    )
}

export default Login;
