import React from 'react'
import Home from '../src/pages/TabPages/Home';
import Community from '../src/pages/TabPages/Community';
import RandomMovie from '../src/pages/TabPages/RandomMovie';
import Profile from '../src/pages/TabPages/Profile';
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
const Tab = createBottomTabNavigator();
const Tabnavigator = () => {
  return (
    <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
          let iconName;
            if (route.name === "Home") {
            iconName = "home-variant-outline";
          } else if (route.name === "Community") {
            iconName = "forum-outline";
          } else if (route.name === "RandomMovie") {
            iconName = "shuffle-variant";
          } else if (route.name === "Profile") {
            iconName = "account-outline";
          }  
           return <Icon name={iconName} size={33} color={color} />;
        },
        headerShown: false,
        tabBarStyle: {
          height: 60, 
          paddingBottom: 5,
          paddingTop: 7,
          backgroundColor: '#252930', //matching with top header
          borderTopWidth: 0, // Removes the default top border line
      },
        tabBarActiveTintColor: '#FFFFFF', 
        tabBarInactiveTintColor: '#8899A6',
        tabBarShowLabel: false, 
      })}
      initialRouteName="Home"
        >
        <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Community" component={Community} />
      <Tab.Screen name="RandomMovie" component={RandomMovie} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
};
           

export default Tabnavigator
