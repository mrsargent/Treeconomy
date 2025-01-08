import React, { useState } from 'react'
import {
    ClerkProvider,
} from '@clerk/nextjs'
import Login from './Login'
import { useUser } from '@clerk/nextjs';
interface ClerkcompProps {
    onSignInStatusChange: (isSignedIn: boolean) => void;
}

const Clerkcomp: React.FC<ClerkcompProps> = ({ onSignInStatusChange }) => {
    const [isChildSignedIn, setIsChildSignedIn] = useState<boolean>(false);

    // Update parent with the sign-in status from Login
    const handleSignInStatusChange = (isSignedIn: boolean) => {
        setIsChildSignedIn(isSignedIn);
        onSignInStatusChange(isSignedIn);
    };

    return (
        <ClerkProvider>
            <Login onSignInStatusChange={handleSignInStatusChange} />
        </ClerkProvider>
    );
}

export default Clerkcomp;