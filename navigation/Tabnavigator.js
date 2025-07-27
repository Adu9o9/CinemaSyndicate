import React from 'react'
import Home from '../src/pages/TabPages/Home';
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
const Tab = createBottomTabNavigator();
const Tabnavigator = () => {
  let isKeyboardVisible = false
  return (
    <>
    <Tab.Navigator
        screenOptions={({ route }) => {
          let iconName;
          if (route.name === "Home") iconName = "home-outline";
      

          return {
            
            tabBarIcon: ({ color, size }) => (
              <Icon name={iconName} size={size} color={color} />
            ),
            headerShown: false,
            //tabBarHideOnKeyboard: true,
            tabBarStyle: isKeyboardVisible
            
      ? { display: "none",height:0 } // Hides instantly
      : {
          height: 55,
          padding: "auto",
        },
          };
        }}
        initialRouteName="Home"
      >
        <Tab.Screen name="Home" component={Home} />
       
    </Tab.Navigator>
    </>
  )
}

export default Tabnavigator
