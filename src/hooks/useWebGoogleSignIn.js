import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

export const useWebGoogleSignIn = ({ onTokenReceived }) => {
  const onTokenReceivedRef = useRef(onTokenReceived);

  // Keep ref up-to-date so we always use the latest callback without re-running initialization
  useEffect(() => {
    onTokenReceivedRef.current = onTokenReceived;
  }, [onTokenReceived]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleCredentialResponse = (response) => {
       if (onTokenReceivedRef.current) {
         onTokenReceivedRef.current(response.credential);
       }
    };

    const initializeGoogleSignIn = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: '366063482945-m3nacq9l697asg8f6ss2tabvt05i03d6.apps.googleusercontent.com',
          callback: handleCredentialResponse,
        });
        const btnContainer = document.getElementById('google-signin-btn');
        if (btnContainer) {
          window.google.accounts.id.renderButton(
            btnContainer,
            { theme: 'outline', size: 'large', width: 250 }
          );
        }
      }
    };

    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleSignIn;
      document.body.appendChild(script);
    } else {
      // Small timeout ensures the DOM node exists if navigating back to this page quickly
      setTimeout(initializeGoogleSignIn, 100);
    }
  }, []); // Empty dependency array ensures script logic runs exactly once on mount, preventing infinite loops
};
