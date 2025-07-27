import React, { useState, useEffect } from "react";
import { createStackNavigator } from "@react-navigation/stack";


import RootNavigator from "./RootStackNavigator.js";


const Stack = createStackNavigator();
const UniversalNavi = () => {

  //const { user } = useSelector((state) => state.user)
  


  return (
    <Stack.Navigator>
      {true ? (
        <Stack.Screen
          name="RootNavigator"
          component={RootNavigator}
          options={{ headerShown: false }}
        />
      ) : (
        // <Stack.Screen
        //   name="Auth"
        //   component={AuthStack}
        //   options={{ headerShown: false }}
        // />
        <></>
      )}
    </Stack.Navigator>
  );
};
export default UniversalNavi;
