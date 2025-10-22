import React, { useEffect } from 'react';
import { View, StyleSheet, Button,Linking } from 'react-native';
import { Provider, useDispatch } from 'react-redux';
import { store } from './src/Redux/store';
import { supabase } from './src/pages/TabPages/lib/supabase';
import { NavigationContainer } from '@react-navigation/native';
import UniversalNavi from './navigation/Universal';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { setSession } from './src/Redux/AuthSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';


export default function App() {
  const dispatch = useDispatch()
  useEffect(() => {
    const retrieveUser = async() => {
      const userData = await AsyncStorage.getItem("user");
      const userName = await AsyncStorage.getItem("name");
      //console.error("User:",userData)
      const user = JSON.parse(userData); // convert back to object
      if(user){
        dispatch(setSession({user:user,name:userName}))
      }
    }

    retrieveUser()
  }, []);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
      <View style={styles.container}>
        <NavigationContainer>
          <UniversalNavi />
        </NavigationContainer>
      </View>
    </SafeAreaView>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
