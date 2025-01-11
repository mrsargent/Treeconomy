'use client'
import React, { useEffect, useState } from 'react'
import {
    SignInButton,
    SignOutButton,
    SignedIn,
    SignedOut,
    useUser
} from '@clerk/nextjs'
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from './AuthContext';
import CopyableAddress from './alerts/CopyAddress';

interface LoginProps {
    onSignInStatusChange: (isSignedIn: boolean) => void;
}

const Login: React.FC<LoginProps> = ({ onSignInStatusChange }) => {
    const { isLoaded, isSignedIn: clerkIsSignedIn, user } = useUser();
    const { isSignedIn, email, address, setSignInStatus } = useAuth();
    const [userAddress, setUserAddress] = useState<string | null>(null); // Changed to string | null



    useEffect(() => {
        if (isLoaded) {
            onSignInStatusChange(clerkIsSignedIn);

            if (clerkIsSignedIn && user?.primaryEmailAddress?.emailAddress) {
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
                            setSignInStatus(true, email, data.addr);
                        } else {
                            // Handle error or no address found
                            console.error('Failed to fetch address:', data.error);
                            // Update context with new sign-in status, email, and address

                        }
                    })
                    .catch(error => {
                        console.error('Error fetching address:', error);
                    })

            }
        }
    }, [isLoaded, clerkIsSignedIn, user, onSignInStatusChange]);

    const userEmail = user?.primaryEmailAddress?.emailAddress;

    const handleLogout = () => {
        // try {
        console.log("handl log out");
        setSignInStatus(false, "", "");
        onSignInStatusChange(false);
        // } catch (error) {
        //     console.error('Logout failed:', error);
        // }
    };


    return (
        <>
            <SignedOut>
                <button className="btn btn-ghost">
                    <SignInButton>
                        <span className="flex items-center">
                            <FcGoogle className="mr-2" />
                            Log In
                        </span>
                    </SignInButton>
                </button>
            </SignedOut>
            <SignedIn>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <CopyableAddress text={userAddress || ""}>
                        <span>
                            {userAddress === undefined ? " " : userAddress?.slice(0, 10)}
                            {"..."}
                            {userAddress === undefined ? " " : userAddress?.slice(userAddress.length - 6)}
                        </span>
                    </CopyableAddress>
                    <SignOutButton>
                        <button className='btn btn-ghost' onClick={() => setSignInStatus(false, "", "")}>
                            <span className="flex items-center">
                                <FcGoogle className="mr-2" />
                                Sign Out
                            </span>
                        </button>
                    </SignOutButton>

                </div>
            </SignedIn>
        </>
    )
}

export default Login;
