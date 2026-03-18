import React from 'react';
// Tab Routes
import Discover from '../containers/TabBar/discover/Discover';
import Profile from '../containers/TabBar/profile/Profile';

// // Screens Route
import Login from '../containers/auth/Login';
import Register from '../containers/auth/Register';
import TabBar from './Type/TabBarNavigation';
import Splash from '../containers/auth/Splash';
import OnBoarding from '../containers/OnBoarding';
import Connect from '../containers/auth/Connect';
import SelectInterest from '../containers/auth/SelectInterest';
import SetPin from '../containers/auth/SetPin';
import SetUpProfile from '../containers/auth/SetUpProfile';
import SetSecure from '../containers/auth/SetSecure';
import ForgotPassword from '../containers/auth/ForgotPassword';
import ForgotPasswordOtp from '../containers/auth/ForgotPasswordOtp';
import CreateNewPassword from '../containers/auth/CreateNewPassword';
import Gender from '../containers/auth/Gender';
import Privacy from '../containers/TabBar/profile/Privacy';
import PrivacyPolicy from '../containers/TabBar/profile/PrivacyPolicy';
import HelpCenter from '../containers/TabBar/profile/HelpCenter';
import Security from '../containers/TabBar/profile/Security';
import Language from '../containers/TabBar/profile/Language';
import Setting from '../containers/TabBar/profile/Setting';
import EditProfile from '../containers/TabBar/profile/EditProfile';
import EditProfileField from '../containers/TabBar/profile/EditProfileField';

import Report from '../containers/TabBar/home/Report';
import ProfileDetail from '../containers/TabBar/home/userDetail/ProfileDetail';
import Suggested from '../containers/TabBar/home/userDetail/Suggested';
import Following from '../containers/TabBar/home/userDetail/Following';
import Follower from '../containers/TabBar/home/userDetail/Follower';
import ManageAccount from '../containers/TabBar/profile/ManageAccount';
import QrCode from '../containers/TabBar/profile/QrCode';
import SoundCategory from '../containers/TabBar/discover/SoundCategory';
import HashtagCategory from '../containers/TabBar/discover/HashtagCategory';
import Search from '../containers/TabBar/home/Search/Search';
import SearchTop from '../containers/TabBar/home/Search/SearchTop';
import SearchVideo from '../containers/TabBar/home/Search/SearchVideo';

import SearchUser from '../containers/TabBar/home/Search/SearchUser';

import SearchHashtag from '../containers/TabBar/home/Search/SearchHashtag';
import UserNetwork from '../containers/TabBar/home/userDetail/UserNetwork';
import CreateReel from '../containers/TabBar/add/CreateReel';

import ReelFeed from '../containers/TabBar/home/ReelsComponent';
import SingleReel from '../containers/TabBar/home/ReelsComponentOne';
import FindFriends from '../containers/TabBar/profile/FindFriends';

import ForYou from '../containers/TabBar/home/ForYou';
import FollowingTab from '../containers/TabBar/home/Following';
import LocationPicker from '../components/models/location';
import SelectCategory from '../containers/auth/selectCategory';
import ChefDashboard from '../containers/TabBar/chef/ChefDashboard';
import MenuManagement from '../containers/TabBar/chef/MenuManagement';
import OrderManagement from '../containers/TabBar/chef/OrderManagement';
import Analytics from '../containers/TabBar/chef/Analytics';
import ChefMenu from '../containers/TabBar/ordering/ChefMenu';
import DishDetail from '../containers/TabBar/ordering/DishDetail';
import MenuDetail from '../containers/TabBar/ordering/MenuDetail';
import ShoppingCart from '../containers/TabBar/ordering/ShoppingCart';
import OrderTracking from '../containers/TabBar/ordering/OrderTracking';
import ChatScreen from '../containers/TabBar/ordering/Chat';
import ChatList from '../containers/TabBar/ordering/ChatList';
import Orders from '../containers/TabBar/orders/Orders';
import Wallet from '../containers/TabBar/profile/Wallet';
// Lazy-load PaymobCheckout to avoid crashing on startup if react-native-webview native module isn't available
const PaymobCheckout = React.lazy(() => import('../containers/TabBar/profile/PaymobCheckout'));
import ReviewReelCreator from '../components/ReviewReelCreator';
import ReviewReelDetail from '../components/ReviewReelDetailView';
import SavedAddresses from '../containers/TabBar/profile/SavedAddresses';
import EditAddress from '../containers/TabBar/profile/EditAddress';
import MapLocationPicker from '../components/MapLocationPicker';
import ChefOrderDetails from '../containers/TabBar/chef/ChefOrderDetails';
import ChefBranches from '../screens/ChefBranches';
import WorkingHoursScreen from '../screens/WorkingHoursScreen';
import EditReel from '../containers/TabBar/add/EditReel';
import SupportChat from '../containers/TabBar/profile/SupportChat';

export const TabRoute = {
  ForYou: ForYou,
  Following: FollowingTab,
  Profile,
  Discover,
  Search,
  Orders,
  OrderManagement,
  Chat: ChatList,
};

export const StackRoute = {
  Login,
  Splash,
  Register,
  TabBar,
  OnBoarding,
  Connect,
  SelectInterest,
  SetPin,
  SetUpProfile,
  SetSecure,
  ForgotPassword,
  ForgotPasswordOtp,
  CreateNewPassword,
  Gender,
  Setting,
  Privacy,
  PrivacyPolicy,
  HelpCenter,
  Security,
  Language,
  EditProfile,
  EditProfileField,
  LocationPicker,
  Report,
  ProfileDetail,
  Suggested,
  Following,
  Follower,
  ManageAccount,
  QrCode,
  HashtagCategory,
  Search,
  SearchTop,
  SearchVideo,
  SearchUser,
  SearchHashtag,
  UserNetwork,
  CreateReel,
  ReelFeed,
  FindFriends,
  SingleReel,
  SelectCategory,
  ChefDashboard,
  MenuManagement,
  OrderManagement,
  Analytics,
  ChefMenu,
  DishDetail,
  MenuDetail,
  ShoppingCart,
  OrderTracking,
  ChefOrderDetails,
  ChatScreen,
  ChatList,
  Wallet,
  PaymobCheckout,
  ReviewReelCreator,
  ReviewReelDetail,
  SavedAddresses,
  EditAddress,
  MapLocationPicker,
  ChefBranches,
  WorkingHours: WorkingHoursScreen,
  Orders,
  EditReel,
  SupportChat,
};
