// Tab Routes
import Home from '../containers/TabBar/home/Home';
import Discover from '../containers/TabBar/discover/Discover';
import Inbox from '../containers/TabBar/inbox/Inbox';
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
import Birthday from '../containers/auth/Birthday';
import Gender from '../containers/auth/Gender';
import Privacy from '../containers/TabBar/profile/Privacy';
import PrivacyPolicy from '../containers/TabBar/profile/PrivacyPolicy';
import HelpCenter from '../containers/TabBar/profile/HelpCenter';
import Security from '../containers/TabBar/profile/Security';
import Language from '../containers/TabBar/profile/Language';
import Setting from '../containers/TabBar/profile/Setting';
import EditProfile from '../containers/TabBar/profile/EditProfile';
import Message from '../containers/TabBar/inbox/Message';
import Chat from '../containers/TabBar/inbox/Chat';
import Call from '../containers/TabBar/inbox/Call';
import Sound from '../containers/TabBar/home/Sound';
import Report from '../containers/TabBar/home/Report';
import ProfileDetail from '../containers/TabBar/home/userDetail/ProfileDetail';
import Suggested from '../containers/TabBar/home/userDetail/Suggested';
import Following from '../containers/TabBar/home/userDetail/Following';
import Follower from '../containers/TabBar/home/userDetail/Follower';
import ManageAccount from '../containers/TabBar/profile/ManageAccount';
import QrCode from '../containers/TabBar/profile/QrCode';
import SoundCategory from '../containers/TabBar/discover/SoundCategory';
import HashtagCategory from '../containers/TabBar/discover/HashtagCategory';
import TrendingSound from '../containers/TabBar/discover/TrendingSound';
import TrendingHashtag from '../containers/TabBar/discover/TrendingHashtag';
import Search from '../containers/TabBar/home/Seach/Search';
import SearchTop from '../containers/TabBar/home/Seach/SearchTop';
import SearchVideo from '../containers/TabBar/home/Seach/SearchVideo';
import SearchSound from '../containers/TabBar/home/Seach/SearchSound';
import SearchUser from '../containers/TabBar/home/Seach/SearchUser';
import SearchLive from '../containers/TabBar/home/Seach/SearchLive';
import SearchHashtag from '../containers/TabBar/home/Seach/SearchHashtag';
import UserNetwork from '../containers/TabBar/home/userDetail/UserNetwork';
import PostDetail from '../containers/TabBar/add/PostDetail';
import PostSound from '../containers/TabBar/add/PostSound';
import ReelsComponent from '../containers/TabBar/home/ReelsComponent';
import FindFriends from '../containers/TabBar/profile/FindFriends';
import Live from '../containers/TabBar/home/Live';

export const TabRoute = {
  Home,
  Profile,
  Discover,
  Inbox,
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
  Birthday,
  Gender,
  Setting,
  Privacy,
  PrivacyPolicy,
  HelpCenter,
  Security,
  Language,
  EditProfile,
  Message,
  Chat,
  Call,
  Sound,
  Report,
  ProfileDetail,
  Suggested,
  Following,
  Follower,
  ManageAccount,
  QrCode,
  SoundCategory,
  HashtagCategory,
  TrendingSound,
  TrendingHashtag,
  Search,
  SearchTop,
  SearchVideo,
  SearchSound,
  SearchUser,
  SearchLive,
  SearchHashtag,
  UserNetwork,
  PostDetail,
  PostSound,
  ReelsComponent,
  FindFriends,
  Live,
};
