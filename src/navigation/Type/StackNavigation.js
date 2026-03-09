/* eslint-disable react/no-unstable-nested-components */
import React from 'react';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StackRoute } from '../NavigationRoutes';
import { StackNav } from '../NavigationKeys';
import { isAndroid } from '../../common/constants';

const Stack = createStackNavigator();
const AuthStack = createNativeStackNavigator();

export default function StackNavigation() {
  // Auth Stack
  function AuthNavigation() {
    return (
      <AuthStack.Navigator
        screenOptions={{
          headerShown: false,
        }}
        initialRouteName={StackNav.Login}>
        <AuthStack.Screen
          screenOptions={{
            headerShown: false,
          }}
          name={StackNav.Login}
          component={StackRoute.Login}
        />
        <AuthStack.Screen
          name={StackNav.Register}
          component={StackRoute.Register}
        />
        <AuthStack.Screen
          name={StackNav.SelectInterest}
          component={StackRoute.SelectInterest}
        />

        <AuthStack.Screen
          name={StackNav.Gender}
          component={StackRoute.Gender}
        />
        <AuthStack.Screen
          name={StackNav.SetUpProfile}
          component={StackRoute.SetUpProfile}
        />
        <AuthStack.Screen
          name={StackNav.SetSecure}
          component={StackRoute.SetSecure}
        />
        <AuthStack.Screen
          name={StackNav.ForgotPassword}
          component={StackRoute.ForgotPassword}
        />
        {/* <Stack.Screen
          name={StackNav.ForgotPasswordOtp}
          component={StackRoute.ForgotPasswordOtp}
        /> */}
        <AuthStack.Screen
          name={StackNav.CreateNewPassword}
          component={StackRoute.CreateNewPassword}
        />
      </AuthStack.Navigator>
    );
  }

  // Auth Stack
  function AuthNavigation2() {
    return (
      <AuthStack.Navigator
        screenOptions={{
          headerShown: false,
        }}
        initialRouteName={StackNav.Register}>
        <AuthStack.Screen
          screenOptions={{
            headerShown: false,
          }}
          name={StackNav.Login}
          component={StackRoute.Login}
        />
        <AuthStack.Screen
          name={StackNav.Register}
          component={StackRoute.Register}
        />
        <AuthStack.Screen
          name={StackNav.SelectInterest}
          component={StackRoute.SelectInterest}
        />

        <AuthStack.Screen
          name={StackNav.Gender}
          component={StackRoute.Gender}
        />
        <AuthStack.Screen
          name={StackNav.SetUpProfile}
          component={StackRoute.SetUpProfile}
        />
        <AuthStack.Screen
          name={StackNav.SetSecure}
          component={StackRoute.SetSecure}
        />
        <AuthStack.Screen
          name={StackNav.ForgotPassword}
          component={StackRoute.ForgotPassword}
        />
        {/* <Stack.Screen
            name={StackNav.ForgotPasswordOtp}
            component={StackRoute.ForgotPasswordOtp}
          /> */}
        <AuthStack.Screen
          name={StackNav.CreateNewPassword}
          component={StackRoute.CreateNewPassword}
        />
      </AuthStack.Navigator>
    );
  }

  // Main Stack
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        // mode: 'modal',
        transparentCard: true,
        detachInactiveScreens: false, // Prevent ref freezing issues
      }}
      initialRouteName={StackNav.Splash}>
      <Stack.Screen
        name={StackNav.Splash}
        options={{ animation: 'none' }}
        component={StackRoute.Splash}
      />
      <Stack.Group
        screenOptions={{
          presentation: 'modal',
          gestureEnabled: true,
          ...(isAndroid && TransitionPresets.ModalPresentationIOS),
        }}>
        <Stack.Screen
          name={StackNav.SelectCategory}
          component={StackRoute.SelectCategory}
        />
      </Stack.Group>
      <Stack.Screen name={StackNav.OnBoarding} component={StackRoute.OnBoarding} />
      <Stack.Screen name={StackNav.Auth} component={AuthNavigation} />
      <Stack.Screen name={StackNav.Auth2} component={AuthNavigation2} />
      <Stack.Screen name={StackNav.TabBar} component={StackRoute.TabBar} />
      <Stack.Screen
        name={StackNav.CreateNewPassword}
        component={StackRoute.CreateNewPassword}
      />
      <Stack.Screen
        name={StackNav.SetUpProfile}
        component={StackRoute.SetUpProfile}
      />
      <Stack.Screen name={StackNav.Setting} component={StackRoute.Setting} />
      <Stack.Screen
        name={StackNav.SingleReel}
        component={StackRoute.SingleReel}
      />

      <Stack.Group
        screenOptions={{
          presentation: 'modal',
          gestureEnabled: true,
          ...(isAndroid && TransitionPresets.ModalPresentationIOS),
        }}>
        <Stack.Screen
          name={StackNav.LocationPicker}
          component={StackRoute.LocationPicker}
        />
      </Stack.Group>

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
      <Stack.Screen
        name={StackNav.EditProfileField}
        component={StackRoute.EditProfileField}
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
        name={StackNav.SearchHashtag}
        component={StackRoute.SearchHashtag}
      />
      <Stack.Screen
        name={StackNav.CreateReel}
        component={StackRoute.CreateReel}
      />

      <Stack.Screen
        name={StackNav.ReelFeed}
        component={StackRoute.ReelFeed}
      />
      <Stack.Screen
        name={StackNav.FindFriends}
        component={StackRoute.FindFriends}
      />

      <Stack.Screen
        name={StackNav.ChefDashboard}
        component={StackRoute.ChefDashboard}
      />
      <Stack.Screen
        name={StackNav.MenuManagement}
        component={StackRoute.MenuManagement}
      />
      <Stack.Screen
        name={StackNav.OrderManagement}
        component={StackRoute.OrderManagement}
      />
      <Stack.Screen
        name={StackNav.Analytics}
        component={StackRoute.Analytics}
      />
      <Stack.Screen
        name={StackNav.ChefMenu}
        component={StackRoute.ChefMenu}
      />
      <Stack.Screen
        name={StackNav.DishDetail}
        component={StackRoute.DishDetail}
      />
      <Stack.Screen
        name={StackNav.ShoppingCart}
        component={StackRoute.ShoppingCart}
      />
      <Stack.Screen
        name={StackNav.OrderTracking}
        component={StackRoute.OrderTracking}
      />
      <Stack.Screen
        name={StackNav.ChefOrderDetails}
        component={StackRoute.ChefOrderDetails}
        options={{
          presentation: 'modal',
          gestureEnabled: true,
          ...TransitionPresets.ModalPresentationIOS,
        }}
      />
      <Stack.Screen
        name={StackNav.Chat}
        component={StackRoute.ChatScreen}
        options={{ animation: 'none' }}
      />
      <Stack.Screen
        name={StackNav.ChatList}
        component={StackRoute.ChatList}
      />
      <Stack.Screen
        name={StackNav.Wallet}
        component={StackRoute.Wallet}
      />
      <Stack.Screen
        name={StackNav.PaymobCheckout}
        component={StackRoute.PaymobCheckout}
      />
      <Stack.Screen
        name={StackNav.MenuDetail}
        component={StackRoute.MenuDetail}
      />
      <Stack.Screen
        name={StackNav.ReviewReelCreator}
        component={StackRoute.ReviewReelCreator}
      />
      <Stack.Screen
        name={StackNav.ReviewReelDetail}
        component={StackRoute.ReviewReelDetail}
      />
      <Stack.Screen
        name={StackNav.SavedAddresses}
        component={StackRoute.SavedAddresses}
      />
      <Stack.Screen
        name={StackNav.EditAddress}
        component={StackRoute.EditAddress}
      />
      <Stack.Screen
        name={StackNav.MapLocationPicker}
        component={StackRoute.MapLocationPicker}
      />
      <Stack.Screen
        name={StackNav.ChefBranches}
        component={StackRoute.ChefBranches}
      />
      <Stack.Screen
        name={StackNav.Orders}
        component={StackRoute.Orders}
      />
      <Stack.Screen
        name={StackNav.EditReel}
        component={StackRoute.EditReel}
      />
      <Stack.Screen
        name={StackNav.Report}
        component={StackRoute.Report}
      />
    </Stack.Navigator>
  );
}
