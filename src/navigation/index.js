import React, { useEffect, useRef } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { AppState } from 'react-native';
import StackNavigation from './Type/StackNavigation';
import { useSelector } from 'react-redux';
import { BackgroundUploadProvider } from '../providers/BackgroundUploadProvider';
import { LocationProvider } from './locationContext';
import { ScreenProvider } from './screenContext';
import DeepLinkingService from '../services/DeepLinkingService';
import NotificationService from '../services/NotificationService';
import AppInitializer from '../services/AppInitializer';
import NewOrderAlarmBanner from '../containers/TabBar/chef/components/NewOrderAlarmBanner';
import ForceUpdateCheck from '../components/ForceUpdateCheck';

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
        ProfileDetail: {
          path: '/user/:userId',
          parse: {
            userId: (userId) => userId,
          },
        },

        // Chef specific screens
        ChefDashboard: 'chef/dashboard',
        ChefMenu: {
          path: '/chef/:chefId/menu',
          parse: {
            chefId: (chefId) => chefId,
          },
        },
        MenuManagement: 'chef/menu-management',
        OrderManagement: 'chef/orders',
        Analytics: 'chef/analytics',

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
        ChatScreen: {
          path: '/chat/:otherUserId',
          parse: {
            otherUserId: (otherUserId) => otherUserId,
          },
        },
        ChatList: 'chat',
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
        UserNetwork: 'network',
        FindFriends: 'find-friends',
        Suggested: 'suggested',

        // Wallet and payments
        Wallet: 'wallet',

        // Settings and account
        Setting: 'settings',
        EditProfile: 'profile/edit',
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
      // Handle app launch from deep link
      const url = await DeepLinkingService.getInstance().getInitialURL?.();
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

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={colors}
      linking={linking}
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
            </LocationProvider>
          </BackgroundUploadProvider>
        </ScreenProvider>
      </ForceUpdateCheck>
    </NavigationContainer>
  );
}
