import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
const Community = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Community Screen</Text>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#14181C', // A dark background like Letterboxd
  },
  text: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default Community;