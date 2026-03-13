import { Linking } from 'react-native';
import { CommonActions } from '@react-navigation/native';

class DeepLinkingService {
  static instance = null;
  static navigationRef = null;
  static pendingDeepLink = null;
  static isNavigationReady = false;

  static getInstance() {
    if (!DeepLinkingService.instance) {
      DeepLinkingService.instance = new DeepLinkingService();
    }
    return DeepLinkingService.instance;
  }

  static setNavigationRef(ref) {
    DeepLinkingService.navigationRef = ref;
    DeepLinkingService.isNavigationReady = true;

    // All pending deep links from cold start are handled by Splash.js
    // via handlePendingDeepLink(). We just store the ref here.
    if (DeepLinkingService.pendingDeepLink) {
      console.log('🐞 [DeepLinkingService] setNavigationRef: pendingDeepLink exists, will be handled by Splash');
    }
  }

  // Initialize deep linking listeners
  initialize() {
    // Only handle deep links when app is running (not initial launch)
    // Initial launch is handled by React Navigation's linking config
    return this.addEventListeners();
  }

  async getInitialURL() {
    try {
      const url = await Linking.getInitialURL();
      console.log('🐞 [DeepLinkingService] getInitialURL called, url:', url);
      if (url) {
        const parsed = this.parseDeepLink(url);
        console.log('🐞 [DeepLinkingService] getInitialURL parsed:', JSON.stringify(parsed));
        if (parsed) {
          // Store ALL recognized deep links for manual handling after Splash.
          // React Navigation's linking config would try to navigate immediately,
          // but Splash.js calls navigation.reset() which wipes that state.
          // So we store the URL and process it after Splash finishes.
          DeepLinkingService.pendingDeepLink = url;
          console.log('🐞 [DeepLinkingService] Deep link stored for post-Splash handling:', parsed.type, url);
          return null;
        }
        // Unrecognized URL — let React Navigation try
        return url;
      }
      return null;
    } catch (error) {
      console.log('🐞 [DeepLinkingService] getInitialURL error:', error);
      return null;
    }
  }

  addEventListeners() {
    const linkingListener = Linking.addEventListener('url', this.handleIncomingURL);
    return () => linkingListener?.remove();
  }

  handleIncomingURL = (event) => {
    console.log('🐞 [DeepLinkingService] handleIncomingURL:', event.url);
    this.handleDeepLink(event.url);
  };

  // Parse and handle deep link URLs
  handleDeepLink(url) {
    try {
      console.log('🐞 [DeepLinkingService] handleDeepLink called with:', url);
      const parsed = this.parseDeepLink(url);
      console.log('🐞 [DeepLinkingService] Parsed deep link:', JSON.stringify(parsed));
      if (parsed) {
        this.navigateToScreen(parsed);
      }
    } catch (error) {
      console.error('🐞 [DeepLinkingService] Error handling deep link:', error);
    }
  }

  parseDeepLink(url) {
    const urlObj = new URL(url);
    // For custom schemes like feedyum://, pathname may not have leading slash
    let path = urlObj.pathname;

    // IMPORTANT: For custom URL schemes like feedyum://reel/123:
    // - hostname = 'reel'
    // - pathname = '/123'
    // We need to combine them to get the full path '/reel/123'
    // For https://feedyum.com/reel/123, hostname is 'feedyum.com' so we don't want to include it
    const isCustomScheme = urlObj.protocol && !urlObj.protocol.startsWith('http');

    if (isCustomScheme && urlObj.hostname) {
      // Custom scheme - combine hostname and pathname
      path = '/' + urlObj.hostname + (urlObj.pathname || '');
    } else if (!path || path === '') {
      path = '/' + urlObj.hostname;
    } else if (!path.startsWith('/')) {
      path = '/' + path;
    }
    console.log('🐞 [DeepLinkingService] Parsed path:', path, 'hostname:', urlObj.hostname, 'isCustomScheme:', isCustomScheme);
    const params = Object.fromEntries(urlObj.searchParams);

    // Define supported deep link patterns
    const patterns = {
      // Order deep links
      order: /^\/order\/([a-f\d]{24})$/i,
      orderTracking: /^\/order\/([a-f\d]{24})\/track$/i,

      // Chat deep links
      chat: /^\/chat\/([a-f\d]{24})$/i,
      chatList: /^\/chat$/i,

      // Reel/Video deep links
      reel: /^\/reel\/([a-f\d]{24})$/i,
      reels: /^\/reels$/i,
      video: /^\/video\/([a-f\d]{24})$/i,
      story: /^\/story\/([a-f\d]{24})$/i,
      reviewReel: /^\/review-reel\/([a-f\d]{24})$/i,

      // Profile deep links
      profile: /^\/profile\/([a-f\d]{24})$/i,
      userProfile: /^\/user\/([a-f\d]{24})$/i,
      profileByUsername: /^\/u\/([a-zA-Z0-9_.-]+)$/i,

      // Chef deep links
      chefProfile: /^\/chef\/([a-f\d]{24})$/i,
      chefByUsername: /^\/chef\/([a-zA-Z0-9_.-]+)$/i,
      chefMenu: /^\/chef\/([a-f\d]{24})\/menu$/i,
      chefDashboard: /^\/chef\/dashboard$/i,

      // Menu deep links
      menu: /^\/menu\/([a-f\d]{24})$/i,
      menuItem: /^\/menu\/([a-f\d]{24})\/item\/([a-f\d]{24})$/i,
      dish: /^\/dish\/([a-f\d]{24})$/i,
      dishDetail: /^\/dish\/([a-f\d]{24})\/detail$/i,

      // Discovery deep links
      discover: /^\/discover$/i,
      discoverCategory: /^\/discover\/([a-zA-Z0-9_-]+)$/i,
      trending: /^\/trending$/i,
      search: /^\/search$/i,
      searchResults: /^\/search\/([^\/]+)$/i,

      // Social deep links
      following: /^\/profile\/([a-f\d]{24})\/following$/i,
      followers: /^\/profile\/([a-f\d]{24})\/followers$/i,
      likes: /^\/profile\/([a-f\d]{24})\/likes$/i,
      posts: /^\/profile\/([a-f\d]{24})\/posts$/i,

      // Live streaming
      live: /^\/live\/([a-f\d]{24})$/i,
      liveStream: /^\/live$/i,

      // General deep links
      post: /^\/post\/([a-f\d]{24})$/i,
      hashtag: /^\/hashtag\/([a-zA-Z0-9_]+)$/i,
      sound: /^\/sound\/([a-f\d]{24})$/i,

      // Support deep links
      supportChat: /^\/support-chat$/i,

      // Auth deep links
      resetPassword: /^\/reset-password$/i,
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      const match = path.match(pattern);
      if (match) {
        return {
          type,
          id: match[1] || null,
          secondaryId: match[2] || null,
          username: match[1] || null, // For username-based patterns
          params: params,
          path: path
        };
      }
    }

    return null;
  }

  navigateToScreen(linkData) {
    // Check if navigation is ready - handle both navigationRef (has isReady) and navigation prop (has dispatch directly)
    const navRef = DeepLinkingService.navigationRef;
    const isNavReady = navRef && (typeof navRef.isReady === 'function' ? navRef.isReady() : typeof navRef.dispatch === 'function');

    if (!isNavReady) {
      // Queue navigation for when navigation is ready
      setTimeout(() => this.navigateToScreen(linkData), 500);
      return;
    }

    const { type, id, secondaryId, username, params } = linkData;
    console.log('🐞 [DeepLinkingService] navigateToScreen type:', type, 'params:', params);

    try {
      switch (type) {
        // Order navigation
        case 'order':
        case 'orderTracking':
          this.navigateToOrder(id, params);
          break;

        // Chat navigation
        case 'chat':
          this.navigateToChat(id, params);
          break;
        case 'chatList':
          this.navigateToChatList();
          break;

        // Reel/Video navigation
        case 'reel':
        case 'video':
        case 'story':
          this.navigateToReel(id, params);
          break;
        case 'reviewReel':
          this.navigateToReviewReel(id, params);
          break;
        case 'reels':
          this.navigateToReels(params);
          break;

        // Profile navigation
        case 'profile':
        case 'userProfile':
          this.navigateToProfile(id, params);
          break;
        case 'profileByUsername':
          this.navigateToProfileByUsername(username, params);
          break;

        // Chef navigation
        case 'chefProfile':
          this.navigateToChefProfile(id, params);
          break;
        case 'chefByUsername':
          this.navigateToChefByUsername(username, params);
          break;
        case 'chefMenu':
          this.navigateToChefMenu(id, params);
          break;
        case 'chefDashboard':
          this.navigateToChefDashboard(params);
          break;

        // Menu navigation
        case 'menu':
          this.navigateToMenu(id, params);
          break;
        case 'menuItem':
          this.navigateToMenuItem(id, secondaryId, params);
          break;
        case 'dish':
        case 'dishDetail':
          this.navigateToDish(id, params);
          break;

        // Discovery navigation
        case 'discover':
          this.navigateToDiscover(params);
          break;
        case 'discoverCategory':
          this.navigateToDiscoverCategory(id, params);
          break;
        case 'trending':
          this.navigateToTrending(params);
          break;
        case 'search':
          this.navigateToSearch(params);
          break;
        case 'searchResults':
          this.navigateToSearchResults(id, params);
          break;

        // Social navigation
        case 'following':
          this.navigateToFollowing(id, params);
          break;
        case 'followers':
          this.navigateToFollowers(id, params);
          break;
        case 'likes':
          this.navigateToLikes(id, params);
          break;
        case 'posts':
          this.navigateToPosts(id, params);
          break;

        // Live streaming
        case 'live':
          this.navigateToLive(id, params);
          break;
        case 'liveStream':
          this.navigateToLiveStream(params);
          break;

        // General navigation
        case 'post':
          this.navigateToPost(id, params);
          break;
        case 'hashtag':
          this.navigateToHashtag(id, params);
          break;
        case 'sound':
          this.navigateToSound(id, params);
          break;

        // Support navigation
        case 'supportChat':
          this.navigateToSupportChat(params);
          break;

        // Auth navigation
        case 'resetPassword':
          this.navigateToResetPassword(params);
          break;

        default:
      }
    } catch (error) {
    }
  }

  // Navigation methods for different screens

  // Order navigation
  navigateToOrder(orderId, params) {
    DeepLinkingService.navigationRef?.dispatch(
      CommonActions.navigate('OrderTracking', {
        orderId,
        ...params
      })
    );
  }

  // Chat navigation
  navigateToChat(userId, params) {
    // ChatScreen expects 'chefId' parameter for order-related chats or user-user chats
    // It also supports 'orderId' if provided
    console.log('🐞 [DeepLinkingService] Navigating to ChatScreen:', userId, params);
    DeepLinkingService.navigationRef?.dispatch(
      CommonActions.navigate('Chat', {
        chefId: userId, // Map userId to chefId as expected by ChatScreen
        orderId: params?.orderId || null,
        ...params
      })
    );
  }

  navigateToChatList() {
    DeepLinkingService.navigationRef?.dispatch(
      CommonActions.navigate('ChatList')
    );
  }

  // Reel/Video navigation
  navigateToReel(reelId, params) {
    // Navigate directly to FollowingTab within TabBar with the storyId
    // This works for both cold start (via Splash) and foreground deep links
    console.log('🐞 [DeepLinkingService] navigateToReel:', reelId);
    DeepLinkingService.navigationRef?.dispatch(
      CommonActions.navigate({
        name: 'TabBar',
        params: {
          screen: 'FollowingTab',
          params: {
            storyId: reelId,
            postId: reelId,
            startIndex: params?.index ? parseInt(params.index) : 0,
            ...params
          }
        }
      })
    );
  }

  navigateToReviewReel(reelId, params) {
    DeepLinkingService.navigationRef?.dispatch(
      CommonActions.navigate('ReviewReelDetail', {
        reelId,
        ...params
      })
    );
  }

  navigateToReels(params) {
    DeepLinkingService.navigationRef?.dispatch(
      CommonActions.navigate('TabBar', {
        initialTab: 'FollowingTab',
        ...params
      })
    );
  }

  // Profile navigation
  navigateToProfile(userId, params) {
    DeepLinkingService.navigationRef?.dispatch(
      CommonActions.navigate('ProfileDetail', {
        userId,
        ...params
      })
    );
  }

  navigateToProfileByUsername(username, params) {
    // Navigate to profile search or lookup screen
    DeepLinkingService.navigationRef?.dispatch(
      CommonActions.navigate('Search', {
        searchQuery: username,
        searchType: 'user',
        ...params
      })
    );
  }

  // Chef navigation
  navigateToChefProfile(chefId, params) {
    DeepLinkingService.navigationRef?.dispatch(
      CommonActions.navigate('ProfileDetail', {
        userId: chefId,
        userType: 'chef',
        ...params
      })
    );
  }

  navigateToChefByUsername(username, params) {
    DeepLinkingService.navigationRef?.dispatch(
      CommonActions.navigate('Search', {
        searchQuery: username,
        searchType: 'chef',
        ...params
      })
    );
  }

  navigateToChefMenu(chefId, params) {
    DeepLinkingService.navigationRef?.dispatch(
      CommonActions.navigate('ChefMenu', {
        chefId,
        ...params
      })
    );
  }

  navigateToChefDashboard(params = {}) {
    if (params?.action === 'new_order') {
      DeepLinkingService.navigationRef?.dispatch(
        CommonActions.navigate('TabBar', {
          screen: 'Orders',
          params: {
            orderId: params.orderId,
            action: params.action
          }
        })
      );
    } else {
      DeepLinkingService.navigationRef?.dispatch(
        CommonActions.navigate('TabBar', {
          screen: 'Discover'
        })
      );
    }
  }

  // Navigate directly to chef order details modal screen
  navigateToChefOrderDetails(orderId) {
    console.log('🐞 [DeepLinkingService] Navigating to ChefOrderDetails with orderId:', orderId);
    DeepLinkingService.navigationRef?.dispatch(
      CommonActions.navigate('ChefOrderDetails', {
        orderId
      })
    );
  }

  /**
   * Handle pending deep link URL after app cold start.
   * Call this from Splash.js before handlePendingNotification.
   * Returns navigation info for reel deep links.
   */
  handlePendingDeepLink() {
    const pendingUrl = DeepLinkingService.pendingDeepLink;
    if (!pendingUrl) {
      return { handled: false };
    }

    console.log('🐞 [DeepLinkingService] Processing pending deep link:', pendingUrl);

    const parsed = this.parseDeepLink(pendingUrl);
    if (!parsed) {
      DeepLinkingService.pendingDeepLink = null;
      return { handled: false };
    }

    // Clear the pending deep link
    DeepLinkingService.pendingDeepLink = null;

    // Handle reel/video/story deep links - navigate to FollowingTab with storyId
    if (['reel', 'video', 'story', 'reels'].includes(parsed.type)) {
      const reelId = parsed.id;
      console.log('🐞 [DeepLinkingService] Reel deep link handled, storyId:', reelId);

      return {
        handled: true,
        targetTab: 'FollowingTab',
        params: {
          storyId: reelId,
          postId: reelId,
          ...parsed.params
        }
      };
    }

    // For all other deep link types (chefMenu, profile, chat, order, etc.),
    // defer navigation until after TabBar loads
    console.log('🐞 [DeepLinkingService] Non-reel deep link handled, deferring navigation for type:', parsed.type);
    return {
      handled: true,
      navigateAfterTabBar: () => {
        console.log('🐞 [DeepLinkingService] Executing deferred deep link navigation:', parsed.type);
        this.navigateToScreen(parsed);
      }
    };
  }

  /**
   * Handle pending notification after app cold start.
   * Call this from Splash.js after navigation is ready.
   * Returns the target tab if navigation should change, or null if notification was handled.
   */
  handlePendingNotification() {
    const lastNotif = DeepLinkingService.lastNotification;
    if (!lastNotif) {
      return { handled: false, targetTab: null };
    }

    console.log('🐞 [DeepLinkingService] Processing pending notification:', lastNotif);

    // New order notification - navigate to ChefOrderDetails
    if (lastNotif.type === 'chefDashboard' || lastNotif.action === 'new_order') {
      const orderId = lastNotif.orderId;
      // Clear the notification so we don't handle it twice
      DeepLinkingService.lastNotification = null;

      // Return that we need to navigate to ChefOrderDetails after TabBar loads
      return {
        handled: true,
        navigateAfterTabBar: () => {
          console.log('🐞 [DeepLinkingService] Deferred navigation to ChefOrderDetails');
          this.navigateToChefOrderDetails(orderId);
        }
      };
    }

    // FollowingTab notification
    if (lastNotif.screen === 'FollowingTab') {
      DeepLinkingService.lastNotification = null;
      return { handled: true, targetTab: 'FollowingTab' };
    }

    // Generic deep link or chat notification
    if (lastNotif.deepLink || (lastNotif.type && lastNotif.id) || lastNotif.chatId) {
      console.log('🐞 [DeepLinkingService] Generic/Chat notification found, deferring navigation');

      const notifData = { ...lastNotif };
      DeepLinkingService.lastNotification = null;

      return {
        handled: true,
        navigateAfterTabBar: () => {
          console.log('🐞 [DeepLinkingService] Executing deferred navigation for:', notifData);
          // Re-use handleNotificationTap logic but bypassing the setLastNotification part to avoid loops? 
          // Actually handleNotificationTap sets lastNotification, but we just cleared it. 
          // If we call handleNotificationTap, it will set it again, but Splash is already done.
          // Better to call internal navigation helpers directly or handleDeepLink.

          if (notifData.deepLink) {
            const parsed = this.parseDeepLink(notifData.deepLink);
            if (parsed) {
              parsed.params = { ...parsed.params, ...notifData };
              this.navigateToScreen(parsed);
            }
          } else if (notifData.type && notifData.id) {
            const linkData = {
              type: notifData.type,
              id: notifData.id,
              params: { ...notifData.params, ...notifData }
            };
            this.navigateToScreen(linkData);
          } else if (notifData.chatId || notifData.custom?.a?.chatId) {
            // Handle pure OneSignal chat payload if it lacks deepLink but has data
            // Typically senderId is the chatId
            const chatId = notifData.chatId || notifData.custom?.a?.chatId;
            // Map to navigateToChat
            this.navigateToChat(chatId, { ...notifData, orderId: notifData.orderId });
          }
        }
      };
    }

    // Default: clear and don't change navigation
    DeepLinkingService.lastNotification = null;
    return { handled: false, targetTab: null };
  }

  // Menu navigation
  navigateToMenu(menuId, params) {
    DeepLinkingService.navigationRef?.dispatch(
      CommonActions.navigate('MenuDetail', {
        menuId,
        ...params
      })
    );
  }

  navigateToMenuItem(menuId, itemId, params) {
    DeepLinkingService.navigationRef?.dispatch(
      CommonActions.navigate('DishDetail', {
        dishId: itemId,
        menuId,
        ...params
      })
    );
  }

  navigateToDish(dishId, params) {
    DeepLinkingService.navigationRef?.dispatch(
      CommonActions.navigate('DishDetail', {
        dishId,
        ...params
      })
    );
  }

  // Discovery navigation
  navigateToDiscover(params) {
    DeepLinkingService.navigationRef?.dispatch(
      CommonActions.navigate('TabBar', {
        screen: 'Discover',
        params: {
          ...params
        }
      })
    );
  }

  navigateToDiscoverCategory(category, params) {
    DeepLinkingService.navigationRef?.dispatch(
      CommonActions.navigate('TabBar', {
        screen: 'Discover',
        params: {
          category,
          ...params
        }
      })
    );
  }

  navigateToTrending(params) {
    DeepLinkingService.navigationRef?.dispatch(
      CommonActions.navigate('TrendingHashtag', {
        ...params
      })
    );
  }

  navigateToSearch(params) {
    DeepLinkingService.navigationRef?.dispatch(
      CommonActions.navigate('Search', {
        ...params
      })
    );
  }

  navigateToSearchResults(query, params) {
    DeepLinkingService.navigationRef?.dispatch(
      CommonActions.navigate('SearchTop', {
        searchQuery: decodeURIComponent(query),
        ...params
      })
    );
  }

  // Social navigation
  navigateToFollowing(userId, params) {
    DeepLinkingService.navigationRef?.dispatch(
      CommonActions.navigate('Following', {
        userId,
        ...params
      })
    );
  }

  navigateToFollowers(userId, params) {
    DeepLinkingService.navigationRef?.dispatch(
      CommonActions.navigate('Follower', {
        userId,
        ...params
      })
    );
  }

  navigateToLikes(userId, params) {
    DeepLinkingService.navigationRef?.dispatch(
      CommonActions.navigate('ProfileDetail', {
        userId,
        tab: 'likes',
        ...params
      })
    );
  }

  navigateToPosts(userId, params) {
    DeepLinkingService.navigationRef?.dispatch(
      CommonActions.navigate('ProfileDetail', {
        userId,
        tab: 'posts',
        ...params
      })
    );
  }

  // Live streaming
  navigateToLive(liveId, params) {
    DeepLinkingService.navigationRef?.dispatch(
      CommonActions.navigate('Live', {
        liveId,
        ...params
      })
    );
  }

  navigateToLiveStream(params) {
    DeepLinkingService.navigationRef?.dispatch(
      CommonActions.navigate('Live', {
        ...params
      })
    );
  }

  // General navigation
  navigateToPost(postId, params) {
    // Navigate to TabBar > Home with storyId so user sees full TabBar experience
    console.log('🐞 [DeepLinkingService] Navigating to post/story:', postId, params);
    DeepLinkingService.navigationRef?.dispatch(
      CommonActions.navigate('TabBar', {
        screen: 'Home',
        params: {
          postId,
          storyId: postId,
          ...params
        }
      })
    );
  }

  navigateToHashtag(hashtag, params) {
    DeepLinkingService.navigationRef?.dispatch(
      CommonActions.navigate('HashtagCategory', {
        hashtag,
        ...params
      })
    );
  }

  navigateToSound(soundId, params) {
    DeepLinkingService.navigationRef?.dispatch(
      CommonActions.navigate('SelectSound', {
        soundId,
        ...params
      })
    );
  }

  // Support navigation
  navigateToSupportChat(params) {
    console.log('🐞 [DeepLinkingService] Navigating to SupportChat with params:', params);
    DeepLinkingService.navigationRef?.dispatch(
      CommonActions.navigate('SupportChat', {
        ...params
      })
    );
  }

  // Auth navigation
  navigateToResetPassword(params) {
    console.log('🐞 [DeepLinkingService] Navigating to CreateNewPassword with params:', params);
    DeepLinkingService.navigationRef?.dispatch(
      CommonActions.navigate('CreateNewPassword', {
        token: params.token || '',
        email: params.email || '',
        ...params
      })
    );
  }

  // Generate deep link URLs
  static generateDeepLink(type, id, params = {}) {
    const baseUrl = 'feedyum://'; // Your app's URL scheme
    const queryString = new URLSearchParams(params).toString();
    const query = queryString ? `?${queryString}` : '';

    switch (type) {
      // Order links
      case 'order':
        return `${baseUrl}/order/${id}${query}`;
      case 'orderTracking':
        return `${baseUrl}/order/${id}/track${query}`;

      // Chat links
      case 'chat':
        return `${baseUrl}/chat/${id}${query}`;
      case 'chatList':
        return `${baseUrl}/chat${query}`;

      // Reel/Video links
      case 'reel':
      case 'video':
        return `${baseUrl}/reel/${id}${query}`;
      case 'story':
        return `${baseUrl}/story/${id}${query}`;
      case 'reviewReel':
        return `${baseUrl}/review-reel/${id}${query}`;
      case 'reels':
        return `${baseUrl}/reels${query}`;

      // Profile links
      case 'profile':
      case 'userProfile':
        return `${baseUrl}/profile/${id}${query}`;
      case 'profileByUsername':
        return `${baseUrl}/u/${id}${query}`;

      // Chef links
      case 'chefProfile':
        return `${baseUrl}/chef/${id}${query}`;
      case 'chefByUsername':
        return `${baseUrl}/chef/${id}${query}`;
      case 'chefMenu':
        return `${baseUrl}/chef/${id}/menu${query}`;
      case 'chefDashboard':
        return `${baseUrl}/chef/dashboard${query}`;

      // Menu links
      case 'menu':
        return `${baseUrl}/menu/${id}${query}`;
      case 'menuItem':
        return `${baseUrl}/menu/${id}/item/${params.itemId}${query}`;
      case 'dish':
      case 'dishDetail':
        return `${baseUrl}/dish/${id}${query}`;

      // Discovery links
      case 'discover':
        return `${baseUrl}/discover${query}`;
      case 'discoverCategory':
        return `${baseUrl}/discover/${id}${query}`;
      case 'trending':
        return `${baseUrl}/trending${query}`;
      case 'search':
        return `${baseUrl}/search${query}`;
      case 'searchResults':
        return `${baseUrl}/search/${encodeURIComponent(id)}${query}`;

      // Social links
      case 'following':
        return `${baseUrl}/profile/${id}/following${query}`;
      case 'followers':
        return `${baseUrl}/profile/${id}/followers${query}`;
      case 'likes':
        return `${baseUrl}/profile/${id}/likes${query}`;
      case 'posts':
        return `${baseUrl}/profile/${id}/posts${query}`;

      // Live streaming
      case 'live':
        return `${baseUrl}/live/${id}${query}`;
      case 'liveStream':
        return `${baseUrl}/live${query}`;

      // General links
      case 'post':
        return `${baseUrl}/post/${id}${query}`;
      case 'hashtag':
        return `${baseUrl}/hashtag/${id}${query}`;
      case 'sound':
        return `${baseUrl}/sound/${id}${query}`;

      default:
        return `${baseUrl}/${query}`;
    }
  }

  // Generate universal links (for web and sharing)
  static generateUniversalLink(type, id, params = {}) {
    const baseUrl = 'https://feedyum.com'; // Your web domain
    const queryString = new URLSearchParams(params).toString();
    const query = queryString ? `?${queryString}` : '';

    // Use same patterns as deep links but with https
    const deepLink = DeepLinkingService.generateDeepLink(type, id, params);
    return deepLink.replace('feedyum://', baseUrl);
  }

  // Generate shareable links with fallback
  static generateShareableLink(type, id, params = {}) {
    // Filter out non-routing params that shouldn't be in the URL
    const NON_ROUTING_KEYS = ['title', 'creator', 'description', 'name', 'avatar', 'shareText', 'hashtags', 'chefName', 'price', 'type', 'streamerName'];
    const routingParams = {};
    for (const [key, value] of Object.entries(params)) {
      if (!NON_ROUTING_KEYS.includes(key) && value !== undefined && value !== null) {
        routingParams[key] = value;
      }
    }

    const deepLink = DeepLinkingService.generateDeepLink(type, id, routingParams);
    // Derive the universal link from the deep link by replacing the scheme
    const DOMAIN = 'https://feedyum.com';
    const universalLink = deepLink.replace(/^feedyum:\/\//, DOMAIN);

    return {
      deepLink,
      universalLink,
      webFallback: universalLink,
    };
  }

  // Handle notification-based navigation
  handleNotificationTap(notificationData) {
    // Store for Splash screen or other consumers to check
    DeepLinkingService.lastNotification = notificationData;
    console.log('🐞 [DeepLinkingService] Stored lastNotification:', notificationData);

    // For new order notifications, navigate directly to the order details modal
    if (notificationData.action === 'new_order' && notificationData.orderId) {
      console.log('🐞 [DeepLinkingService] New order notification, navigating to ChefOrderDetails screen');
      this.navigateToChefOrderDetails(notificationData.orderId);
      return;
    }

    if (notificationData.deepLink) {
      // Parse the deep link URL, but also merge in additionalData as params
      const parsed = this.parseDeepLink(notificationData.deepLink);
      if (parsed) {
        // Merge notification additionalData into params
        parsed.params = { ...parsed.params, ...notificationData };
        this.navigateToScreen(parsed);
        return;
      }
    }

    if (notificationData.type && notificationData.id) {
      // Legacy support for old notification format
      const linkData = {
        type: notificationData.type,
        id: notificationData.id,
        params: { ...notificationData.params, ...notificationData }
      };
      this.navigateToScreen(linkData);
    }
  }
}

export default DeepLinkingService; 