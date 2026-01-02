import {Linking} from 'react-native';
import {CommonActions} from '@react-navigation/native';

class DeepLinkingService {
  static instance = null;
  static navigationRef = null;

  static getInstance() {
    if (!DeepLinkingService.instance) {
      DeepLinkingService.instance = new DeepLinkingService();
    }
    return DeepLinkingService.instance;
  }

  static setNavigationRef(ref) {
    DeepLinkingService.navigationRef = ref;
  }

  // Initialize deep linking listeners
  initialize() {
    // Handle app launch from deep link
    this.getInitialURL();
    
    // Handle deep links when app is running
    this.addEventListeners();
  }

  async getInitialURL() {
    try {
      const url = await Linking.getInitialURL();
      if (url) {
        this.handleDeepLink(url);
      }
    } catch (error) {
}
  }

  addEventListeners() {
    const linkingListener = Linking.addEventListener('url', this.handleIncomingURL);
    return () => linkingListener?.remove();
  }

  handleIncomingURL = (event) => {
    this.handleDeepLink(event.url);
  };

  // Parse and handle deep link URLs
  handleDeepLink(url) {
try {
      const parsed = this.parseDeepLink(url);
      if (parsed) {
        this.navigateToScreen(parsed);
      }
    } catch (error) {
}
  }

  parseDeepLink(url) {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
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
    if (!DeepLinkingService.navigationRef?.isReady()) {
      // Queue navigation for when navigation is ready
      setTimeout(() => this.navigateToScreen(linkData), 500);
      return;
    }

    const { type, id, secondaryId, username, params } = linkData;

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
          this.navigateToChefDashboard();
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
    DeepLinkingService.navigationRef?.dispatch(
      CommonActions.navigate('ChatScreen', {
        otherUserId: userId,
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
    DeepLinkingService.navigationRef?.dispatch(
      CommonActions.navigate('ReelsComponent', {
        postId: reelId,
        startIndex: params.index ? parseInt(params.index) : 0,
        ...params
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
        screen: 'Home',
        params: {
          ...params
        }
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

  navigateToChefDashboard() {
    DeepLinkingService.navigationRef?.dispatch(
      CommonActions.navigate('ChefDashboard')
    );
  }

  // Menu navigation
  navigateToMenu(menuId, params) {
    DeepLinkingService.navigationRef?.dispatch(
      CommonActions.navigate('MenuDetailScreen', {
        menuId,
        ...params
      })
    );
  }

  navigateToMenuItem(menuId, itemId, params) {
    DeepLinkingService.navigationRef?.dispatch(
      CommonActions.navigate('DishDetailScreen', {
        dishId: itemId,
        menuId,
        ...params
      })
    );
  }

  navigateToDish(dishId, params) {
    DeepLinkingService.navigationRef?.dispatch(
      CommonActions.navigate('DishDetailScreen', {
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
    DeepLinkingService.navigationRef?.dispatch(
      CommonActions.navigate('PostDetail', {
        postId,
        ...params
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
      CommonActions.navigate('PostSound', {
        soundId,
        ...params
      })
    );
  }

  // Generate deep link URLs
  static generateDeepLink(type, id, params = {}) {
    const baseUrl = 'foodtok://'; // Your app's URL scheme
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
    const baseUrl = 'https://foodtok.app'; // Your web domain
    const queryString = new URLSearchParams(params).toString();
    const query = queryString ? `?${queryString}` : '';

    // Use same patterns as deep links but with https
    const deepLink = DeepLinkingService.generateDeepLink(type, id, params);
    return deepLink.replace('foodtok://', baseUrl);
  }

  // Generate shareable links with fallback
  static generateShareableLink(type, id, params = {}) {
    return {
      deepLink: DeepLinkingService.generateDeepLink(type, id, params),
      universalLink: DeepLinkingService.generateUniversalLink(type, id, params),
      webFallback: `https://foodtok.app/${type}/${id || ''}${params ? '?' + new URLSearchParams(params).toString() : ''}`
    };
  }

  // Handle notification-based navigation
  handleNotificationTap(notificationData) {
if (notificationData.deepLink) {
      this.handleDeepLink(notificationData.deepLink);
    } else if (notificationData.type && notificationData.id) {
      // Legacy support for old notification format
      const linkData = {
        type: notificationData.type,
        id: notificationData.id,
        params: notificationData.params || {}
      };
      this.navigateToScreen(linkData);
    }
  }
}

export default DeepLinkingService; 