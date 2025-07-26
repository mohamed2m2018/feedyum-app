import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ChefsListScreen from '../screens/ChefsListScreen';
import ChefProfileScreen from '../screens/ChefProfileScreen';
import ChefMenuScreen from '../screens/ChefMenuScreen'; // You'll need to create this
import DishDetailScreen from '../screens/DishDetailScreen'; // You'll need to create this

const Stack = createStackNavigator();

const ChefNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="ChefsList" 
        component={ChefsListScreen}
        options={{ title: 'Chefs' }}
      />
      <Stack.Screen 
        name="ChefProfile" 
        component={ChefProfileScreen}
        options={({ route }) => ({ 
          title: route.params?.chefName || 'Chef Profile' 
        })}
      />
      <Stack.Screen 
        name="ChefMenu" 
        component={ChefMenuScreen}
        options={({ route }) => ({ 
          title: `${route.params?.chefName || 'Chef'}'s Menu` 
        })}
      />
      <Stack.Screen 
        name="DishDetail" 
        component={DishDetailScreen}
        options={{ title: 'Dish Details' }}
      />
    </Stack.Navigator>
  );
};

export default ChefNavigator;

// Example of how to use in your main navigation:
/*
import ChefNavigator from './ChefNavigationExample';

// In your main navigator:
<Tab.Screen 
  name="Chefs" 
  component={ChefNavigator}
  options={{
    tabBarIcon: ({ color, size }) => (
      <Icon name="restaurant" color={color} size={size} />
    ),
  }}
/>
*/