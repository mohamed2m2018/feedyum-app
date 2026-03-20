import { useWindowDimensions, Platform } from 'react-native';

/**
 * useResponsive - A hook to abstract responsive web/mobile logic
 * 
 * Breakpoints (standardized mostly around Bootstrap/Tailwind):
 * - Mobile:  < 768px
 * - Tablet:  >= 768px and < 992px
 * - Desktop: >= 992px
 * 
 * Returns flags and dimensions to easily conditionally render components
 * based on screen size or platform.
 */
export const useResponsive = () => {
  const { width, height } = useWindowDimensions();

  // Basic platform checks
  const isWeb = Platform.OS === 'web';
  const isIOS = Platform.OS === 'ios';
  const isAndroid = Platform.OS === 'android';

  // Device type based purely on screen width (works across web and tablets)
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 992;
  const isDesktop = width >= 992;
  const isLargeScreen = width >= 768; // Tablet or Desktop

  // Orientation
  const isPortrait = height >= width;
  const isLandscape = width > height;

  return {
    // Current Dimensions
    windowWidth: width,
    windowHeight: height,

    // Platform Check
    isWeb,
    isIOS,
    isAndroid,

    // Form Factor
    isMobile,
    isTablet,
    isDesktop,
    isLargeScreen,

    // Layout Helpers
    isPortrait,
    isLandscape,
  };
};

export default useResponsive;
