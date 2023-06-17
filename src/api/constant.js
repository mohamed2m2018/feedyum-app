import images from '../assets/images';
import strings from '../i18n/strings';
import {StackNav} from '../navigation/NavigationKeys';

const renderChips = [
  'Action',
  'Drama',
  'Comedy',
  'Ecchi',
  'Adventure',
  'Mecha',
  'Romance',
  'Fantasy',
  'Horror',
  'Mystery',
  'Psychological',
  'Sci-Fi',
  'Slice of Life',
  'Sports',
  'Thriller',
  'Supernatural',
  'Historical',
  'Music',
  'Game',
  'Harem',
];

const editProfileData = (name, email) => [
  {
    title: 'About You',
    data: [
      {
        id: 1,
        icon: 'person-outline',
        type: 'Name',
        value: name,
      },
      {
        id: 2,
        icon: 'mail-outline',
        type: 'Email',
        value: email,
      },
    ],
  },
  {
    title: 'Social',
    data: [
      {
        id: 1,
        icon: 'logo-facebook',
        type: 'Facebook',
        value: 'facebook.com',
      },
      {
        id: 2,
        icon: 'logo-twitter',
        type: 'Twitter',
        value: 'w.twitter.com',
      },
      {
        id: 3,
        icon: 'logo-instagram',
        type: 'Instagram',
        value: 'htinstagram.com',
      },
    ],
  },
];

const manageAccData = [
  {
    title: 'Account Information',
    data: [
      {
        id: 1,
        icon: 'call-outline',
        type: 'Phone Number',
        value: '+1 111 467 378',
      },
      {
        id: 2,
        icon: 'mail-outline',
        type: 'Email',
        value: 'ans@gmail.com',
      },
      {
        id: 3,
        icon: 'calendar-outline',
        type: 'Date of Birth',
        value: '12/27/1995',
        rightIcon: 'calendar-outline',
      },
    ],
  },
  {
    title: 'Account Control',
    data: [
      {
        id: 1,
        icon: 'swap-vertical-outline',
        type: 'Switch to Business Account',
      },
      {
        id: 2,
        icon: 'trash-outline',
        type: 'Delete Account',
        trash: true,
      },
    ],
  },
];

const headerCategoryData = [
  {
    id: 1,
    type: 'All Activity',
    icon: 'time-outline',
  },
  {
    id: 2,
    type: 'Likes',
    icon: 'heart-outline',
  },
  {
    id: 3,
    type: 'Comments',
    icon: 'chatbubble-ellipses-outline',
  },
  {
    id: 4,
    type: 'Q&A',
    icon: 'reader-outline',
  },
  {
    id: 5,
    type: 'Mentions & Tags',
    icon: 'person-outline',
  },
  {
    id: 6,
    type: 'Followers',
    icon: 'people-outline',
  },
  {
    id: 7,
    type: 'From FoodTok',
    icon: 'alert-circle-outline',
  },
];

const inboxData = [
  {
    title: 'Today',
    data: [
      {
        id: 1,
        name: 'Charolette Hanlin',
        desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        follow: 'Follow',
        profileImage: 'https://i.ibb.co/xjLGscf/user1.png',
      },
      {
        id: 2,
        name: 'Annabel Rohan',
        desc: 'Started following you',
        follow: 'Follow Back',
        profileImage: 'https://i.ibb.co/4JhzfZ6/user7.png',
      },
      {
        id: 3,
        name: 'Sanjuanita Ordonez',
        desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        profileImage: 'https://i.ibb.co/CtJMsKk/user3.png',
      },
    ],
  },
  {
    title: 'Yesterday',
    data: [
      {
        id: 1,
        name: 'Rayford Chenail Hanlin',
        desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        follow: 'Follow',
        profileImage: 'https://i.ibb.co/9psxy8J/user4.png',
      },
      {
        id: 2,
        name: 'Sanjuanita Rohan',
        desc: 'Started following you',
        profileImage: 'https://i.ibb.co/Z2BtDcm/user5.png',
      },
      {
        id: 3,
        name: 'Annabel Ordonez',
        desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        follow: 'Follow Back',
        profileImage: 'https://i.ibb.co/J3q5m54/user6.png',
      },
    ],
  },
  {
    title: 'Last Week',
    data: [
      {
        id: 1,
        name: 'Charolette Hanlin',
        desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        profileImage: 'https://i.ibb.co/N2hx6tN/user2.png',
      },
      {
        id: 2,
        name: 'Annabel Rohan',
        desc: 'Started following you',
        profileImage: 'https://i.ibb.co/CtJMsKk/user3.png',
      },
      {
        id: 3,
        name: 'Sanjuanita Ordonez',
        desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        follow: 'Follow Back',
        profileImage: 'https://i.ibb.co/J3q5m54/user6.png',
      },
    ],
  },
];

const ProfileSetting = [
  {
    id: 1,
    title: strings.editProfile,
    icon: 'person-outline',
    route: StackNav.ManageAccount,
  },
  {
    id: 2,
    title: strings.privacy,
    icon: 'lock-closed-outline',
    route: StackNav.Privacy,
  },
  {
    id: 4,
    title: strings.security,
    icon: 'shield-checkmark-outline',
    route: StackNav.Security,
  },
  {
    id: 4,
    title: strings.qrCode,
    icon: 'scan-outline',
    route: StackNav.QrCode,
  },
  {
    id: 5,
    title: strings.language,
    icon: 'options-outline',
    value: 'English(US)',
    route: StackNav.Language,
  },
  {
    id: 6,
    title: strings.darkMode,
    icon: 'contrast-outline',
    rightIcon: 'rightIcon',
  },
  {
    id: 2,
    title: strings.contentPreferences,
    icon: 'videocam-outline',
  },
  {
    id: 2,
    title: strings.ads,
    icon: 'radio-outline',
  },
  {
    id: 3,
    title: strings.reportProblem,
    icon: 'cloud-download-outline',
  },
  {
    id: 7,
    title: strings.helpCenter,
    icon: 'information-circle-outline',
    route: StackNav.HelpCenter,
  },
  {
    id: 7,
    title: strings.safetyCenter,
    icon: 'checkmark-circle-outline',
  },
  {
    id: 7,
    title: strings.communityGuidelines,
    icon: 'people-outline',
  },
  {
    id: 7,
    title: strings.termsServices,
    icon: 'newspaper-outline',
  },
  {
    id: 8,
    title: strings.privacyPolicy,
    icon: 'alert-circle-outline',
    route: StackNav.PrivacyPolicy,
  },
];

const helperCategoryData = [
  'General',
  'Account',
  'Payment',
  'Subscription',
  'Others',
];

const helperData = [
  {
    title: 'What is FoodTok?',
    description:
      'FoodTok is a streaming service that offers a wide variety of anime titles.',
  },
  {
    title: 'How do I sign up for FoodTok?',
    description:
      'You can sign up for FoodTok by downloading the app from the App Store or Google Play Store.',
  },
  {
    title: 'How to remove anime on wishlist?',
    description:
      'You can remove anime on your wishlist by clicking the heart icon on the anime details page.',
  },
  {
    title: 'How do I subscribe to premium?',
    description:
      'You can subscribe to premium by clicking the premium button on the home page.',
  },
  {
    title: 'How do I can download anime?',
    description:
      'You can download anime by clicking the download icon on the anime details page.',
  },
  {
    title: 'How to unsubscribe from premium?',
    description:
      'You can unsubscribe from premium by clicking the premium button on the home page.',
  },
];

const contactUsData = [
  {
    id: 1,
    title: 'Contact Us',
    icon: 'headset',
  },
  {
    id: 2,
    title: 'WhatsApp',
    icon: 'whatsapp',
  },
  {
    id: 3,
    title: 'Website',
    icon: 'google-earth',
  },
  {
    id: 4,
    title: 'Facebook',
    icon: 'facebook',
  },
  {
    id: 5,
    title: 'Instagram',
    icon: 'instagram',
  },
  {
    id: 6,
    title: 'Twitter',
    icon: 'twitter',
  },
];

const languageData = [
  {
    title: 'Suggested',
    data: [{lnName: 'English(US)'}, {lnName: 'English(UK)'}],
  },
  {
    title: 'Language',
    data: [
      {
        lnName: 'English',
      },
      {
        lnName: 'Spanish',
      },
      {
        lnName: 'French',
      },
      {
        lnName: 'German',
      },
      {
        lnName: 'Italian',
      },
      {
        lnName: 'Portuguese',
      },
      {
        lnName: 'Russian',
      },
      {
        lnName: 'Turkish',
      },
      {
        lnName: 'Chinese',
      },
      {
        lnName: 'Japanese',
      },
      {
        lnName: 'Korean',
      },
      {
        lnName: 'Arabic',
      },
      {
        lnName: 'Hindi',
      },
      {
        lnName: 'Indonesian',
      },
      {
        lnName: 'Malay',
      },
      {
        lnName: 'Thai',
      },
    ],
  },
];

const reportData = [
  {
    lnName: 'Dangerous organizations/individuals',
  },
  {
    lnName: 'Frauds & Scams',
  },
  {
    lnName: 'Misleading Information',
  },
  {
    lnName: 'Illegal activities or regulated goods',
  },
  {
    lnName: 'Violent & graphic contents',
  },
  {
    lnName: 'Animal Cruelty',
  },
  {
    lnName: 'Pornography & nudity',
  },
  {
    lnName: 'Hate Speech',
  },
  {
    lnName: 'Harrashment or bullying',
  },
  {
    lnName: 'Intelectual property infringement',
  },
  {
    lnName: 'Spam',
  },
  {
    lnName: 'Minor Safety',
  },
  {
    lnName: 'Other',
  },
];

const privacyPolicyData = [
  {
    title: strings.privacyPolicy1,
    description: strings.privacyPolicyDesc,
  },
  {
    title: strings.privacyPolicy2,
    description: strings.privacyPolicyDesc,
  },
  {
    title: strings.privacyPolicy3,
    description: strings.privacyPolicyDesc,
  },
  {
    title: strings.privacyPolicy2,
    description: strings.privacyPolicyDesc,
  },
  {
    title: strings.privacyPolicy3,
    description: strings.privacyPolicyDesc,
  },
  {
    title: strings.privacyPolicy2,
    description: strings.privacyPolicyDesc,
  },
  {
    title: strings.privacyPolicy3,
    description: strings.privacyPolicyDesc,
  },
];

const messageDataList = [
  {
    id: 1,
    name: 'John Doe',
    message: 'Hello, how are you?',
    time: '12:00',
    imageUrl: 'https://i.ibb.co/xjLGscf/user1.png',
    pending: 2,
  },
  {
    id: 2,
    name: 'Ashley Graham martin',
    message: 'Hi, morning too Andrew!',
    time: '1:20',
    imageUrl: 'https://i.ibb.co/N2hx6tN/user2.png',
    pending: 0,
  },
  {
    id: 3,
    name: 'Leatrice Handler',
    message: 'Haha oh man 🤣🤣🤣',
    time: '2:00',
    imageUrl: 'https://i.ibb.co/CtJMsKk/user3.png',
    pending: 0,
  },
  {
    id: 4,
    name: 'John Doe',
    message: 'Hello, how are you?',
    time: '12:00',
    imageUrl: 'https://i.ibb.co/9psxy8J/user4.png',
    pending: 3,
  },
  {
    id: 5,
    name: 'Pedro Huard Jr ',
    message: "Haha that's terrifying 😂😂😂",
    time: 'Yesterday',
    imageUrl: 'https://i.ibb.co/Z2BtDcm/user5.png',
    pending: 0,
  },
  {
    id: 5,
    name: 'Kristin Watson',
    message: 'just ideas for next time 😆',
    time: 'Dec 18, 2024',
    imageUrl: 'https://i.ibb.co/J3q5m54/user6.png',
    pending: 0,
  },
];

const recenltyDataList = [
  {
    id: 1,
    name: 'John Doe',
    imageUrl: 'https://randomuser.me/api/portraits/women/10.jpg',
  },
  {
    id: 2,
    name: 'Ashley Graham martin',
    imageUrl: 'https://randomuser.me/api/portraits/women/12.jpg',
  },
  {
    id: 3,
    name: 'Leatrice Handler',
    imageUrl: 'https://randomuser.me/api/portraits/women/5.jpg',
  },
  {
    id: 4,
    name: 'John Doe',
    imageUrl: 'https://randomuser.me/api/portraits/women/60.jpg',
  },
  {
    id: 5,
    name: 'Pedro Huard Jr ',
    imageUrl: 'https://randomuser.me/api/portraits/women/55.jpg',
  },
  {
    id: 5,
    name: 'Kristin Watson',
    imageUrl: 'https://randomuser.me/api/portraits/men/3.jpg',
  },
];

const videoData = [
  {
    id: 1,
    channelName: 'Rashmika_Mandanna',
    uri: 'https://user-images.githubusercontent.com/129170600/231968235-a6a60f18-6b50-459d-8c7c-9716d9df0730.mp4',
    caption:
      'Rashmika Mandanna is an Indian actress and model who works in Telugu and Kannada films. She made her acting debut in the Kannada film Cheluvi (2011).',
    musicName: 'Song #1',
    likes: '110EGP',
    comments: '284K',

    bookmark: '110egp',
    share: '110EGP',
    categoty: 'Entertainment',
    avatarUri: 'https://wallpaperaccess.com/full/1669289.jpg',
    poster:
      'https://res.cloudinary.com/givantk/image/upload/v1684603315/x4papvm45uh3e6niqmpj.jpg',
    views: '110EGP',
  },
  {
    id: 2,
    channelName: 'zuzu_fan',
    uri: 'https://user-images.githubusercontent.com/129170600/231968281-f8450cd9-9adf-4002-8e77-947140fc19ec.mp4',
    caption: '#cute #girls #tikto #tiktoapp #tiktofan #tiktofans',
    musicName: 'Song #2',
    likes: '24K',
    comments: '122',
    bookmark: '1K',
    share: '1.2K',
    categoty: 'Sports & Gaming',
    avatarUri: 'https://wallpaperaccess.com/thumb/266770.jpg',
    poster:
      'https://res.cloudinary.com/givantk/image/upload/v1684603315/x4papvm45uh3e6niqmpj.jpg',
    views: '110EGP',
  },
  {
    id: 3,
    channelName: 'katrinakaif',
    uri: 'https://user-images.githubusercontent.com/129170600/231986154-36c34011-8503-43e5-85e8-d959901e5dbb.mp4',
    caption: 'kat hot dance #katrinakaif #dance #hot #sexy #bollywood #india',
    musicName: 'Song #3',
    likes: '31k',
    comments: '801',
    bookmark: '1.2K',
    share: '110',
    categoty: 'News & Politics',
    avatarUri:
      'https://res.cloudinary.com/givantk/image/upload/v1684603315/x4papvm45uh3e6niqmpj.jpg',
    poster:
      'https://res.cloudinary.com/givantk/image/upload/v1684603315/x4papvm45uh3e6niqmpj.jpg',
    views: '200EGP',
  },
];

const soundTrendingData = [
  {
    id: 1,
    title: 'Favorite Girl',
    artist: 'Justin Bieber',
    imgUrl: 'https://picsum.photos/200/300',
    time: '3:20',
    totalViews: '240M',
    artistUrl: 'https://picsum.photos/200/300',
    artistDesc: 'Justin Drew Bieber is a Canadian singer and songwriter.',
  },
  {
    id: 2,
    title: 'Despacito',
    artist: 'Luis Fonsi',
    imgUrl: 'https://picsum.photos/200/300',
    time: '2:45',
    totalViews: '1.3B',
    artistUrl: 'https://picsum.photos/200/300',
    artistDesc:
      'Luis Fonsi is a Puerto Rican singer, songwriter, actor, and record producer.',
  },
];

const hashtagTreandingData = [
  {
    id: 1,
    title: 'amazingfood',
    imgUrl: 'https://picsum.photos/200/300',
    totalHashTag: '827.5M',
  },
  {
    id: 2,
    title: 'wonderful',
    imgUrl: 'https://picsum.photos/200/300',
    totalHashTag: '234M',
  },
];

const chatData = [
  {
    id: 1,
    message: 'Hi Theresa, good morning 😄',
    time: '12:00',
    type: 'sender',
  },
  {
    id: 2,
    message: 'Hi there, good morning! How are you?',
    time: '12:01',
    type: 'receiver',
  },
  {
    id: 3,
    message: 'I am doing well, thanks for asking 😊',
    time: '12:02',
    type: 'sender',
  },
  {
    id: 4,
    message: "That's great to hear! What are your plans for the day?",
    time: '12:03',
    type: 'receiver',
  },
  {
    id: 5,
    message:
      'I have a few meetings scheduled, but otherwise just working from home. How about you?',
    time: '12:04',
    type: 'sender',
  },
  {
    id: 1,
    message: 'Hi Theresa, good morning 😄',
    time: '12:00',
    type: 'sender',
  },
  {
    id: 2,
    message: 'Hi there, good morning! How are you?',
    time: '12:01',
    type: 'receiver',
  },
  {
    id: 3,
    message: 'I am doing well, thanks for asking 😊',
    time: '12:02',
    type: 'sender',
  },
  {
    id: 4,
    message: "That's great to hear! What are your plans for the day?",
    time: '12:03',
    type: 'receiver',
  },
  {
    id: 5,
    message:
      'I have a few meetings scheduled, but otherwise just working from home. How about you?',
    time: '12:04',
    type: 'sender',
  },
  {
    id: 1,
    message: 'Hi Theresa, good morning 😄',
    time: '12:00',
    type: 'sender',
  },
  {
    id: 2,
    message: 'Hi there, good morning! How are you?',
    time: '12:01',
    type: 'receiver',
  },
  {
    id: 3,
    message: 'I am doing well, thanks for asking 😊',
    time: '12:02',
    type: 'sender',
  },
  {
    id: 4,
    message: "That's great to hear! What are your plans for the day?",
    time: '12:03',
    type: 'receiver',
  },
  {
    id: 5,
    message:
      'I have a few meetings scheduled, but otherwise just working from home. How about you?',
    time: '12:04',
    type: 'sender',
  },
];

const searchVideoData = [
  {
    id: 1,
    reelImgUrl: 'https://picsum.photos/200/300',
    views: '1.2M',
    userName: 'Sophie Brown',
  },
  {
    id: 2,
    reelImgUrl: 'https://picsum.photos/200/300',
    views: '600K',
    userName: 'Miles Davis',
  },
  {
    id: 3,
    reelImgUrl: 'https://picsum.photos/200/300',
    views: '1M',
    userName: 'Olivia White',
  },
  {
    id: 4,
    reelImgUrl: 'https://picsum.photos/200/300',
    views: '1.2M',
    userName: 'Nathan Parker',
  },
  {
    id: 5,
    reelImgUrl: 'https://picsum.photos/200/300',
    views: '100K',
    userName: 'Avery Martinez',
  },
  {
    id: 6,
    reelImgUrl: 'https://picsum.photos/200/300',
    views: '635K',
    userName: 'Gabriella Foster',
  },
  {
    id: 7,
    reelImgUrl: 'https://picsum.photos/200/300',
    views: '11M',
    userName: 'Benjamin James',
  },
  {
    id: 8,
    reelImgUrl: 'https://picsum.photos/200/300',
    views: '2M',
    userName: 'Aria Lopez',
  },
];

const searchMusicData = [
  {
    id: 1,
    title: 'Favorite Girl',
    artist: 'Justin Bieber',
    imgUrl: 'https://picsum.photos/200/300',
    time: '3:20',
    totalViews: '240M',
    artistUrl: 'https://picsum.photos/200/300',
  },
  {
    id: 2,
    title: 'Beautiful Day',
    artist: 'U2',
    imgUrl: 'https://picsum.photos/200/300',
    time: '4:10',
    totalViews: '150M',
    artistUrl: 'https://picsum.photos/200/300',
  },

  {
    id: 3,
    title: 'I Will Always Love You',
    artist: 'Whitney Houston',
    imgUrl: 'https://picsum.photos/200/300',
    time: '4:50',
    totalViews: '300M',
    artistUrl: 'https://picsum.photos/200/300',
  },
  {
    id: 4,
    title: 'Cant Stop the Feeling!',
    artist: 'Justin Timberlake',
    imgUrl: 'https://picsum.photos/200/300',
    time: '3:56',
    totalViews: '500M',
    artistUrl: 'https://picsum.photos/200/300',
  },

  {
    id: 5,
    title: 'Chasing Pavements',
    artist: 'Adele',
    imgUrl: 'https://picsum.photos/200/300',
    time: '3:31',
    totalViews: '120M',
    artistUrl: 'https://picsum.photos/200/300',
  },

  {
    id: 6,
    title: 'Clocks',
    artist: 'Coldplay',
    imgUrl: 'https://picsum.photos/200/300',
    time: '5:07',
    totalViews: '400M',
    artistUrl: 'https://picsum.photos/200/300',
  },

  {
    id: 7,
    title: 'Sorry',
    artist: 'Halsey',
    imgUrl: 'https://picsum.photos/200/300',
    time: '3:39',
    totalViews: '250M',
    artistUrl: 'https://picsum.photos/200/300',
  },

  {
    id: 8,
    title: 'Back to You',
    artist: 'Louis Tomlinson',
    imgUrl: 'https://picsum.photos/200/300',
    time: '3:11',
    totalViews: '80M',
    artistUrl: 'https://picsum.photos/200/300',
  },

  {
    id: 9,
    title: 'Roar',
    artist: 'Katy Perry',
    imgUrl: 'https://picsum.photos/200/300',
    time: '4:30',
    totalViews: '600M',
    artistUrl: 'https://picsum.photos/200/300',
  },

  {
    id: 10,
    title: 'Dancing Queen',
    artist: 'ABBA',
    imgUrl: 'https://picsum.photos/200/300',
    time: '3:51',
    totalViews: '900M',
    artistUrl: 'https://picsum.photos/200/300',
  },

  {
    id: 11,
    title: 'Stay',
    artist: 'Rihanna',
    imgUrl: 'https://picsum.photos/200/300',
    time: '4:00',
    totalViews: '200M',
    artistUrl: 'https://picsum.photos/200/300',
  },
];

const userDetail = [
  {
    name: 'Dracel Steward',
    description: 'arianacooper | 24.5M followers',
    imgUrl:
      'https://images.unsplash.com/photo-1527980965255-d3b416303d12?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1160&q=80',
    isFollow: false,
  },
  {
    name: 'John Doe',
    description: 'johndoe | 10M followers',
    imgUrl:
      'https://images.unsplash.com/photo-1605993439219-9d09d2020fa5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mzh8fHVzZXJ8ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60',
    isFollow: true,
  },
  {
    name: 'Jane Smith',
    description: 'janesmith | 5M followers',
    imgUrl:
      'https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MzN8fHVzZXIlMjBwcm9maWxlJTIwd2l0aCUyMGJhY2tncm91bmR8ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60',
    isFollow: true,
  },
  {
    name: 'Bob Johnson',
    description: 'bobjohnson | 2M followers',
    imgUrl:
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NHx8dXNlcnxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=800&q=60',
    isFollow: false,
  },
  {
    name: 'Sara Wilson',
    description: 'sarawilson | 1M followers',
    imgUrl:
      'https://images.unsplash.com/photo-1619895862022-09114b41f16f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MjJ8fHVzZXJ8ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60',
    isFollow: false,
  },
  {
    name: 'Tom Wilson',
    description: 'tomwilson | 500K followers',
    imgUrl:
      'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mjl8fHVzZXJ8ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60',
    isFollow: true,
  },
  {
    name: 'Alice Brown',
    description: 'alicebrown | 250K followers',
    imgUrl:
      'https://images.unsplash.com/photo-1463453091185-61582044d556?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MzZ8fHVzZXJ8ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60',
    isFollow: true,
  },
  {
    name: 'Emily Davis',
    description: 'emilydavis | 100K followers',
    imgUrl:
      'https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NDV8fHVzZXJ8ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60',
    isFollow: false,
  },
  {
    name: 'Mark Lee',
    description: 'marklee | 50K followers',
    imgUrl:
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NTN8fHVzZXJ8ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60',
    isFollow: false,
  },
  {
    name: 'Laura Lee',
    description: 'lauralee | 10K followers',
    imgUrl:
      'https://images.unsplash.com/photo-1610737241336-371badac3b66?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NTJ8fHVzZXJ8ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60',
    isFollow: true,
  },
];

const liveChat = [
  {
    name: 'Dracel Steward',
    message: 'Hi Theresa, good morning 😄',
    imgUrl:
      'https://images.unsplash.com/photo-1527980965255-d3b416303d12?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1160&q=80',
    isFollow: false,
  },
  {
    name: 'John Doe',
    message: 'Hi there, good morning! How are you?',
    imgUrl:
      'https://images.unsplash.com/photo-1605993439219-9d09d2020fa5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mzh8fHVzZXJ8ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60',
    isFollow: true,
  },
  {
    name: 'Jane Smith',
    message: 'I am doing well, thanks for asking 😊',
    imgUrl:
      'https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MzN8fHVzZXIlMjBwcm9maWxlJTIwd2l0aCUyMGJhY2tncm91bmR8ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60',
    isFollow: true,
  },
  {
    name: 'Bob Johnson',
    message: "That's great to hear! What are your plans for the day?",
    imgUrl:
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NHx8dXNlcnxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=800&q=60',
    isFollow: false,
  },
  {
    name: 'Sara Wilson',
    message:
      'I have a few meetings scheduled, but otherwise just working from home. How about you?',
    imgUrl:
      'https://images.unsplash.com/photo-1619895862022-09114b41f16f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MjJ8fHVzZXJ8ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60',
    isFollow: false,
  },
  {
    name: 'Tom Wilson',
    message: "That's great to hear! What are your plans for the day?",
    imgUrl:
      'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mjl8fHVzZXJ8ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60',
    isFollow: true,
  },
  {
    name: 'Alice Brown',
    message:
      'I have a few meetings scheduled, but otherwise just working from home. How about you?',
    imgUrl:
      'https://images.unsplash.com/photo-1463453091185-61582044d556?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MzZ8fHVzZXJ8ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60',
    isFollow: true,
  },
  {
    name: 'Emily Davis',
    message: "That's great to hear! What are your plans for the day?",
    imgUrl:
      'https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NDV8fHVzZXJ8ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60',
    isFollow: false,
  },
  {
    name: 'Mark Lee',
    message: 'you are welcome! I am doing well, thanks for asking 😊',
    imgUrl:
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NTN8fHVzZXJ8ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60',
    isFollow: false,
  },
  {
    name: 'Laura Lee',
    message: 'what are your plans for the day?',
    imgUrl:
      'https://images.unsplash.com/photo-1610737241336-371badac3b66?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NTJ8fHVzZXJ8ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60',
    isFollow: true,
  },
];

const hashtagDetail = [
  {
    id: 1,
    views: '1.2M',
    title: 'amazingfood',
  },
  {
    id: 2,
    views: '800K',
    title: 'delicious desserts',
  },
  {
    id: 3,
    views: '2.5M',
    title: 'tasty seafood',
  },
  {
    id: 4,
    views: '600K',
    title: 'vegan delights',
  },
  {
    id: 5,
    views: '1.8M',
    title: 'juicy burgers',
  },
  {
    id: 6,
    views: '1.1M',
    title: 'ethnic cuisine',
  },
  {
    id: 7,
    views: '4.2M',
    title: 'chef specials',
  },
  {
    id: 8,
    views: '900K',
    title: 'farm-to-table',
  },
  {
    id: 9,
    views: '3.6M',
    title: 'gourmet pizza',
  },
  {
    id: 10,
    views: '1.5M',
    title: 'hearty soups',
  },
  {
    id: 11,
    views: '2.2M',
    title: 'spicy wings',
  },
  {
    id: 12,
    views: '500K',
    title: 'breakfast classics',
  },
  {
    id: 13,
    views: '1.9M',
    title: 'dessert first',
  },
];

const searchCategoryData = [
  {
    id: 0,
    title: strings.user,
  },
  {
    id: 1,
    title: strings.video,
  },
];

const findFriendsData = [
  {
    id: 1,
    title: 'Invite Friends',
    icon: 'arrow-redo',
    description: 'Invite friends to join',
    btn: 'Invite',
  },
  {
    id: 2,
    title: 'Contacts',
    icon: 'people',
    description: 'Find your contacts',
    btn: 'Find',
  },
  {
    id: 3,
    title: 'Facebook Friends',
    icon: 'logo-facebook',
    description: 'Find friends of Facebook',
    btn: 'Find',
  },
  {
    id: 4,
    title: 'Instagram Friends',
    icon: 'logo-instagram',
    description: 'Find friends of Instagram',
    btn: 'Find',
  },
];

const UserDetailCategory = (postsNo, followersNo, followingNo, viewsNo) => [
  {
    title: strings.post,
    value: postsNo,
  },
  {
    title: strings.followers,
    value: followersNo,
  },
  {
    title: strings.following,
    value: followingNo,
  },
  {
    title: 'Views',
    value: viewsNo,
  },
];

const commentData = [
  {
    name: 'Dracel Steward',
    description: 'What is your favorite fruit?',
    imgUrl:
      'https://images.unsplash.com/photo-1527980965255-d3b416303d12?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1160&q=80',
    commentLike: '1.1K',
  },
  {
    name: 'John Doe',
    description: 'Do you have any pet peeves?',
    imgUrl:
      'https://images.unsplash.com/photo-1605993439219-9d09d2020fa5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mzh8fHVzZXJ8ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60',
    commentLike: '974',
  },
  {
    name: 'Jane Smith',
    description: 'What is your favorite color?',
    imgUrl:
      'https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MzN8fHVzZXIlMjBwcm9maWxlJTIwd2l0aCUyMGJhY2tncm91bmR8ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60',
    commentLike: '664',
  },
  {
    name: 'Bob Johnson',
    description: 'What is your favorite movie?',
    imgUrl:
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NHx8dXNlcnxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=800&q=60',
    commentLike: '76',
  },
  {
    name: 'Sara Wilson',
    description: 'What is your favorite food?',
    imgUrl:
      'https://images.unsplash.com/photo-1619895862022-09114b41f16f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MjJ8fHVzZXJ8ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60',
    commentLike: '24',
  },
  {
    name: 'Tom Wilson',
    description: 'How do you like your coffee?',
    imgUrl:
      'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mjl8fHVzZXJ8ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60',
    commentLike: '147',
  },
  {
    name: 'Alice Brown',
    description: 'is it cold where you are?',
    imgUrl:
      'https://images.unsplash.com/photo-1463453091185-61582044d556?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MzZ8fHVzZXJ8ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60',
    commentLike: '54',
  },
  {
    name: 'Emily Davis',
    description: 'How the weather today?',
    imgUrl:
      'https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NDV8fHVzZXJ8ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60',
    commentLike: '46',
  },
  {
    name: 'Mark Lee',
    description: 'the weather is so nice today',
    imgUrl:
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NTN8fHVzZXJ8ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60',
    commentLike: '456',
  },
  {
    name: 'Laura Lee',
    description: 'what is your favorite season?',
    imgUrl:
      'https://images.unsplash.com/photo-1610737241336-371badac3b66?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NTJ8fHVzZXJ8ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60',
    commentLike: '54',
  },
];

// const searchVideoData = [

export {
  renderChips,
  ProfileSetting,
  helperCategoryData,
  helperData,
  contactUsData,
  languageData,
  privacyPolicyData,
  editProfileData,
  headerCategoryData,
  inboxData,
  videoData,
  reportData,
  manageAccData,
  messageDataList,
  recenltyDataList,
  soundTrendingData,
  hashtagTreandingData,
  chatData,
  userDetail,
  searchVideoData,
  searchMusicData,
  hashtagDetail,
  searchCategoryData,
  findFriendsData,
  liveChat,
  UserDetailCategory,
  commentData,
};
