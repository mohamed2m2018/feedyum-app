import React, { useEffect, useRef } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { Alert, AppState, Linking, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import RNRestart from 'react-native-restart';
import { MMKVLoader } from 'react-native-mmkv-storage';
import StackNavigation from './Type/StackNavigation';
import { useSelector } from 'react-redux';
import { BackgroundUploadProvider } from '../providers/BackgroundUploadProvider';
import { LocationProvider } from './locationContext';
import { ScreenProvider } from './screenContext';
import DeepLinkingService from '../services/DeepLinkingService';
import AppInitializer from '../services/AppInitializer';
import NewOrderAlarmBanner from '../containers/TabBar/chef/components/NewOrderAlarmBanner';
import ForceUpdateCheck from '../components/ForceUpdateCheck';
import ZText from '../components/common/ZText';
import request, { switchEnvironment } from '../api/request';
import { ACCESS_TOKEN } from '../common/constants';
import { useStorage } from '../utils/useStorage';

const sessionStorage = new MMKVLoader().initialize();
const IMPERSONATION_SESSION_KEY = 'impersonation_session';

function ImpersonationBanner() {
  const [session] = useStorage(IMPERSONATION_SESSION_KEY);
  if (!session?.targetName) return null;

  const exitSession = () => {
    sessionStorage.removeItem(ACCESS_TOKEN);
    sessionStorage.removeItem('user');
    sessionStorage.removeItem(IMPERSONATION_SESSION_KEY);
    RNRestart.Restart();
  };

  return (
    <View style={impersonationStyles.banner}>
      <ZText type="B12" color="#FFFFFF" style={impersonationStyles.label}>
        {`READ-ONLY: Viewing as ${session.targetName}`}
      </ZText>
      <TouchableOpacity onPress={exitSession} style={impersonationStyles.exitButton}>
        <ZText type="B12" color="#8B1E1E">Exit</ZText>
      </TouchableOpacity>
    </View>
  );
}

const impersonationStyles = StyleSheet.create({
  banner: {
    backgroundColor: '#8B1E1E',
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: { flex: 1 },
  exitButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
});

export default function pAppNavigator() {
  const navigationRef = useNavigationContainerRef();
  const appState = useRef(AppState.currentState);
  const color = useSelector(state => state.theme.theme);

  const colors = {
    colors: { background: color.backgroundColor },
  };

  useEffect(() => {
    // We will initialize DeepLinkingService in onReady to ensure ref is ready
    const deepLinkingService = DeepLinkingService.getInstance();
    const cleanup = deepLinkingService.initialize();
    return cleanup;
  }, []);

  useEffect(() => {
    const handleImpersonationLink = async ({ url } = {}) => {
      if (!url?.startsWith('feedyum://admin-impersonate')) return;

      try {
        const parsed = new URL(url);
        const code = parsed.searchParams.get('code');
        if (!code) throw new Error('The shortcut does not contain an impersonation code');

        // In a development build, "production" resolves to the local API URL.
        switchEnvironment('production');
        const { data } = await request.post('/admin-impersonation/exchange', { code });
        sessionStorage.setString(ACCESS_TOKEN, data.token);
        sessionStorage.setMap('user', data.user);
        sessionStorage.setMap(IMPERSONATION_SESSION_KEY, data.impersonation);
        RNRestart.Restart();
      } catch (error) {
        Alert.alert('Unable to view account', error?.message || 'The shortcut expired or was already used.');
      }
    };

    Linking.getInitialURL().then(url => handleImpersonationLink({ url }));
    const subscription = Linking.addEventListener('url', handleImpersonationLink);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    // Handle app state changes for deferred deep linking
    const handleAppStateChange = (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // Check for deferred deep links when app becomes active
        AppInitializer.handleAppStateChange(nextAppState);
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => subscription?.remove();
  }, []);

  // Configure deep linking for React Navigation
  const linking = {
    prefixes: ['feedyum://', 'https://feedyum.com', 'https://www.feedyum.com'],
    config: {
      screens: {
        TabBar: {
          // Pass params directly to TabBar which handles navigation internally
          path: '',
          screens: {
            Discover: {
              path: '/discover',
              screens: {
                DiscoverScreen: 'discover',
                DiscoverCategory: {
                  path: '/discover/:category',
                  parse: {
                    category: (category) => category,
                  },
                },
              },
            },
            Add: 'add',
            Chef: {
              path: '/chef',
              screens: {
                ChefDashboard: 'dashboard',
                MenuManagement: 'menu-management',
                OrderManagement: 'orders',
                Analytics: 'analytics',
              },
            },
            Inbox: {
              path: '/inbox',
              screens: {
                ChatList: 'chat',
                ChatScreen: {
                  path: '/chat/:otherUserId',
                  parse: {
                    otherUserId: (otherUserId) => otherUserId,
                  },
                },
              },
            },
            Profile: {
              path: '/profile',
              screens: {
                ProfileScreen: 'me',
                ProfileDetail: {
                  path: '/profile/:userId',
                  parse: {
                    userId: (userId) => userId,
                  },
                },
                Following: {
                  path: '/profile/:userId/following',
                  parse: {
                    userId: (userId) => userId,
                  },
                },
                Follower: {
                  path: '/profile/:userId/followers',
                  parse: {
                    userId: (userId) => userId,
                  },
                },
                EditProfile: 'edit',
                Setting: 'settings',
              },
            },
          },
        },

        // Direct screen navigation (outside TabBar)

        // Reel/Video screens
        ReelsComponent: {
          path: '/reel/:postId',
          parse: {
            postId: (postId) => postId,
          },
        },
        reelsOne: {
          path: '/reels',
        },
        ReviewReelDetail: {
          path: '/review-reel/:reelId',
          parse: {
            reelId: (reelId) => reelId,
          },
        },
        ReviewReelCreator: 'create-review-reel',
        ClaimRestaurant: {
          path: '/claim-restaurant/:restaurantId',
          parse: {restaurantId: restaurantId => restaurantId},
        },
        RestaurantClaimStatus: '/restaurant-claims',
        PostDetail: {
          path: '/post/:postId',
          parse: {
            postId: (postId) => postId,
          },
        },

        // Story/Video content
        Story: {
          path: '/story/:storyId',
          parse: {
            storyId: (storyId) => storyId,
          },
        },

        // Profile screens

        // Chef specific screens
        ChefMenu: {
          path: '/chef/:chefId/menu',
          parse: {
            chefId: (chefId) => chefId,
          },
        },

        // Menu and dish screens
        MenuDetail: {
          path: '/menu/:menuId',
          parse: {
            menuId: (menuId) => menuId,
          },
        },
        DishDetail: {
          path: '/dish/:dishId',
          parse: {
            dishId: (dishId) => dishId,
          },
        },

        // Order related screens
        OrderTracking: {
          path: '/order/:orderId/track',
          parse: {
            orderId: (orderId) => orderId,
          },
        },
        ShoppingCart: 'cart',

        // Chat screens
        Message: 'messages',

        // Search and discovery
        Search: {
          path: '/search',
        },
        SearchTop: {
          path: '/search/:searchQuery',
          parse: {
            searchQuery: (searchQuery) => decodeURIComponent(searchQuery),
          },
        },
        SearchUser: 'search/users',
        SearchVideo: 'search/videos',
        SearchSound: 'search/sounds',
        SearchLive: 'search/live',
        SearchHashtag: 'search/hashtags',

        // Trending and hashtags
        TrendingHashtag: {
          path: '/trending',
        },
        HashtagCategory: {
          path: '/hashtag/:hashtag',
          parse: {
            hashtag: (hashtag) => hashtag,
          },
        },

        // Sound related
        Sound: 'sounds',
        PostSound: {
          path: '/sound/:soundId',
          parse: {
            soundId: (soundId) => soundId,
          },
        },
        SoundCategory: 'sounds/category',
        TrendingSound: 'sounds/trending',

        // Live streaming
        Live: {
          path: '/live/:liveId?',
          parse: {
            liveId: (liveId) => liveId,
          },
        },

        // Social features
        UserNetwork: 'network',
        FindFriends: 'find-friends',
        Suggested: 'suggested',

        // Wallet and payments
        Wallet: 'wallet',

        // Missions
        MissionsHub: 'missions',
        MissionDetail: 'missions/:missionId',
        MissionLeaderboard: 'missions/:missionId/leaderboard',
        AmbassadorDashboard: 'ambassador/dashboard',
        AmbassadorWallet: 'ambassador/wallet',

        // Settings and account
        ManageAccount: 'account/manage',
        Privacy: 'privacy',
        PrivacyPolicy: 'privacy-policy',
        HelpCenter: 'help',
        Security: 'security',
        Language: 'language',

        // Other features
        QrCode: 'qr',
        Report: 'report',
        Call: 'call',

        // Username-based profiles (handled by search)
        UsernameProfile: {
          path: '/u/:username',
          parse: {
            username: (username) => username,
          },
        },
        ChefUsername: {
          path: '/chef/:username',
          parse: {
            username: (username) => username,
          },
        },

        // Fallback for unmatched routes
        NotFound: '*',
      },
    },

    // Custom URL matching for complex patterns
    getInitialURL: async () => {
      // On web, the bare root URL '/' matches TabBar (path: ''),
      // which bypasses the Splash screen's auth check entirely.
      // Return null so initialRouteName 'Splash' takes over.
      if (Platform.OS === 'web') {
        const path = window.location.pathname;
        if (!path || path === '/') {
          return null; // Let Splash handle auth
        }
        // For actual deep link paths, return the full URL
        return window.location.href;
      }
      // Handle app launch from deep link (native)
      const url = await DeepLinkingService.getInstance().getInitialURL?.();
      if (url?.startsWith('feedyum://admin-impersonate')) return null;
      return url;
    },

    // Handle incoming URLs while app is running
    subscribe: (listener) => {
      const linkingListener = DeepLinkingService.getInstance().addEventListeners?.();

      return () => {
        if (linkingListener) {
          linkingListener();
        }
      };
    },
  };

  // On web, linking causes the root URL '/' to resolve directly to TabBar (path: ''),
  // bypassing Splash auth flow. Disable linking on web so initialRouteName: 'Splash' works.
  const linkingConfig = Platform.OS === 'web' ? undefined : linking;

  return (
    <NavigationContainer
          ref={navigationRef}
          theme={colors}
          linking={linkingConfig}
          fallback={<></>} // You can add a loading component here
          onReady={() => {
            // Navigation is ready, deep linking service can now handle navigation
            if (navigationRef.isReady()) {
              DeepLinkingService.setNavigationRef(navigationRef);
            }
          }}
          onUnhandledAction={(action) => {
          }}
          onStateChange={(state) => {
            // Log navigation state changes for debugging
            if (__DEV__) {
            }
          }}
        >
          <ForceUpdateCheck>
            <ScreenProvider>
              <BackgroundUploadProvider>
                <LocationProvider>
                  <StackNavigation />
                  <NewOrderAlarmBanner />
                  <ImpersonationBanner />
                </LocationProvider>
              </BackgroundUploadProvider>
            </ScreenProvider>
          </ForceUpdateCheck>
    </NavigationContainer>
  );
}
