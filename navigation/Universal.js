import React, { useState, useEffect } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useSelector } from "react-redux";

import RootNavigator from "./RootStackNavigator.js";
import LoginScreen from "../src/pages/TabPages/LoginScreen.jsx";


const Stack = createStackNavigator();
const UniversalNavi = () => {

  const { user } = useSelector((state) => state.auth)
  


  return (
    <Stack.Navigator>
      {user ? (
        <Stack.Screen
          name="RootNavigator"
          component={RootNavigator}
          options={{ headerShown: false }}
        />
      ) : (
        <Stack.Screen
          name="Auth"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
};
export default UniversalNavi;
