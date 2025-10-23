import React from 'react';
import { View, Text } from 'react-native'; // Keep for default placeholders if needed
import Home from '../src/pages/TabPages/Home';
import Search from '../src/pages/TabPages/Search'; // Import your new Search screen
import RandomMovie from '../src/pages/TabPages/RandomMovie'; // Import your real RandomMovie screen
import Profile from '../src/pages/TabPages/Profile'; // Import your real Profile screen

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const Tab = createBottomTabNavigator();

const Tabnavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color }) => { // Corrected this line
          let iconName;

          if (route.name === "Home") {
            iconName = "home-variant-outline";
          } else if (route.name === "Search") {
            iconName = "magnify";
          } else if (route.name === "Random") {
            iconName = "shuffle-variant"; // Your preferred icon
          } else if (route.name === "Profile") {
            iconName = "account-circle-outline"; 
          }

          return <Icon name={iconName} size={35} color={color} />; // Your requested size
        },
        headerShown: false,
        tabBarStyle: {
          height: 60,
          paddingBottom: 5,
          paddingTop: 7,
          backgroundColor: '#2C3440', 
          borderTopWidth: 0, 
        },
        tabBarActiveTintColor: '#FFFFFF', 
        tabBarInactiveTintColor: '#8899A6', 
        tabBarShowLabel: false, 
      })}
      initialRouteName="Home"
    >
      
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Search" component={Search} />
      <Tab.Screen name="Random" component={RandomMovie} />
      <Tab.Screen 
        name="Profile" 
        component={Profile} 
        listeners={({ navigation, route }) => ({
          tabPress: (e) => {
            // Check if the tab is already focused
            const isFocused = navigation.isFocused();

            if (isFocused) {
              // If we're already on the Profile tab, but maybe on someone
              // else's profile, we want to force-navigate to our own.
              
              // Prevent the default action
              e.preventDefault();

              // Reset the stack for the 'Profile' tab to its root screen
              // and pass 'undefined' params, so it loads the logged-in user.
              navigation.navigate('Profile', { userId: undefined });
            }
          },
        })}
      />
    </Tab.Navigator>
  );
};

export default Tabnavigator;

