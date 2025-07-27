import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from "@react-navigation/native";
import UniversalNavi from './navigation/Universal';
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={{
          flex: 1,backgroundColor:"black"
        }}
      >
        <View style={styles.container}>
          
          <StatusBar style="auto" />
          <NavigationContainer
            
          >
            <UniversalNavi />
          </NavigationContainer>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    //backgroundColor: '#fff',
   
  },
});
