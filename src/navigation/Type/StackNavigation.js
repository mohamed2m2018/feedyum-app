/* eslint-disable react/no-unstable-nested-components */
import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {StackRoute} from '../NavigationRoutes';
import {StackNav} from '../NavigationKeys';

const Stack = createNativeStackNavigator();

export default function StackNavigation() {
  // Auth Stack
  function AuthNavigation() {
    return (
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
        initialRouteName={StackNav.Login}>
        <Stack.Screen
          screenOptions={{
            headerShown: false,
          }}
          name={StackNav.Login}
          component={StackRoute.Login}
        />
        <Stack.Screen
          name={StackNav.Register}
          component={StackRoute.Register}
        />
        <Stack.Screen
          name={StackNav.SelectInterest}
          component={StackRoute.SelectInterest}
        />
        <Stack.Screen name={StackNav.SetPin} component={StackRoute.SetPin} />
        <Stack.Screen
          name={StackNav.Birthday}
          component={StackRoute.Birthday}
        />
        <Stack.Screen name={StackNav.Gender} component={StackRoute.Gender} />
        <Stack.Screen
          name={StackNav.SetUpProfile}
          component={StackRoute.SetUpProfile}
        />
        <Stack.Screen
          name={StackNav.SetSecure}
          component={StackRoute.SetSecure}
        />
        <Stack.Screen
          name={StackNav.ForgotPassword}
          component={StackRoute.ForgotPassword}
        />
        <Stack.Screen
          name={StackNav.ForgotPasswordOtp}
          component={StackRoute.ForgotPasswordOtp}
        />
        <Stack.Screen
          name={StackNav.CreateNewPassword}
          component={StackRoute.CreateNewPassword}
        />
      </Stack.Navigator>
    );
  }

  // Main Stack
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        mode: 'modal',
        transparentCard: true,
      }}
      initialRouteName={StackNav.Splash}>
      <Stack.Screen name={StackNav.Splash} component={StackRoute.Splash} />
      <Stack.Screen
        name={StackNav.onBoarding}
        component={StackRoute.OnBoarding}
      />
      <Stack.Screen name={StackNav.Auth} component={AuthNavigation} />
      <Stack.Screen name={StackNav.TabBar} component={StackRoute.TabBar} />
      <Stack.Screen
        name={StackNav.CreateNewPassword}
        component={StackRoute.CreateNewPassword}
      />
      <Stack.Screen name={StackNav.SetPin} component={StackRoute.SetPin} />
      <Stack.Screen
        name={StackNav.SetUpProfile}
        component={StackRoute.SetUpProfile}
      />
      <Stack.Screen name={StackNav.Setting} component={StackRoute.Setting} />
      <Stack.Screen name={StackNav.Message} component={StackRoute.Message} />
      <Stack.Screen name={StackNav.Chat} component={StackRoute.Chat} />
      <Stack.Screen name={StackNav.Call} component={StackRoute.Call} />
      <Stack.Screen name={StackNav.Report} component={StackRoute.Report} />
      <Stack.Screen name={StackNav.Sound} component={StackRoute.Sound} />
      <Stack.Screen
        name={StackNav.ManageAccount}
        component={StackRoute.ManageAccount}
      />
      <Stack.Screen name={StackNav.QrCode} component={StackRoute.QrCode} />
      <Stack.Screen
        name={StackNav.Suggested}
        component={StackRoute.Suggested}
      />
      <Stack.Screen name={StackNav.Follower} component={StackRoute.Follower} />
      <Stack.Screen
        name={StackNav.Following}
        component={StackRoute.Following}
      />
      <Stack.Screen
        name={StackNav.ProfileDetail}
        component={StackRoute.ProfileDetail}
      />
      <Stack.Screen
        name={StackNav.UserNetwork}
        component={StackRoute.UserNetwork}
      />
      <Stack.Screen
        name={StackNav.EditProfile}
        component={StackRoute.EditProfile}
      />
      <Stack.Screen name={StackNav.Privacy} component={StackRoute.Privacy} />
      <Stack.Screen
        name={StackNav.PrivacyPolicy}
        component={StackRoute.PrivacyPolicy}
      />
      <Stack.Screen
        name={StackNav.HelpCenter}
        component={StackRoute.HelpCenter}
      />
      <Stack.Screen name={StackNav.Security} component={StackRoute.Security} />
      <Stack.Screen name={StackNav.Language} component={StackRoute.Language} />
      <Stack.Screen
        name={StackNav.SoundCategory}
        component={StackRoute.SoundCategory}
      />
      <Stack.Screen
        name={StackNav.TrendingSound}
        component={StackRoute.TrendingSound}
      />
      <Stack.Screen
        name={StackNav.HashtagCategory}
        component={StackRoute.HashtagCategory}
      />
      <Stack.Screen
        name={StackNav.TrendingHashtag}
        component={StackRoute.TrendingHashtag}
      />
      <Stack.Screen name={StackNav.Search} component={StackRoute.Search} />
      <Stack.Screen
        name={StackNav.SearchTop}
        component={StackRoute.SearchTop}
      />
      <Stack.Screen
        name={StackNav.SearchUser}
        component={StackRoute.SearchUser}
      />
      <Stack.Screen
        name={StackNav.SearchVideo}
        component={StackRoute.SearchVideo}
      />
      <Stack.Screen
        name={StackNav.SearchSound}
        component={StackRoute.SearchSound}
      />
      <Stack.Screen
        name={StackNav.SearchLive}
        component={StackRoute.SearchLive}
      />
      <Stack.Screen
        name={StackNav.SearchHashtag}
        component={StackRoute.SearchHashtag}
      />
      <Stack.Screen
        name={StackNav.PostDetail}
        component={StackRoute.PostDetail}
      />
      <Stack.Screen
        name={StackNav.PostSound}
        component={StackRoute.PostSound}
      />
      <Stack.Screen
        name={StackNav.ReelsComponent}
        component={StackRoute.ReelsComponent}
      />
      <Stack.Screen
        name={StackNav.FindFriends}
        component={StackRoute.FindFriends}
      />
      <Stack.Screen name={StackNav.Live} component={StackRoute.Live} />
    </Stack.Navigator>
  );
}
