
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Image,
  Dimensions,
  StatusBar,
  TouchableOpacity
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
const TMDB_API_KEY = '802b1fff7ff225605a7378644666662b';

const API_URL = `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`;


const { width } = Dimensions.get('window');
const posterWidth = (width - 30) / 2; 

const Home = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error('Something went wrong!');
        }
        const data = await response.json();

        // The poster_path from the API is just a partial path.
        // We need to prepend the full TMDb image URL.
        const moviesWithFullPosterPaths = data.results.map(movie => ({
          ...movie,
          full_poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        }));

        setMovies(moviesWithFullPosterPaths);
      } catch (e) {
        setError(e.message);
        console.error('Error fetching movies:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  // This function renders each individual movie poster in the grid.
  const renderMovieItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Image
        source={{ uri: item.full_poster_url }}
        style={styles.poster}
        resizeMode="cover"
      />
    </View>
  );
const ScrollingHeader = () => (
    <Text style={styles.scrollingHeader}>Popular Movies</Text>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00E054" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Text style={styles.errorText}>Did you add your API Key?</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.staticHeader}>
        <Text style={styles.mainTitle}>Cinema Syndicate</Text>
        <TouchableOpacity>
          <Icon name="magnify" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={movies}
        renderItem={renderMovieItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        ListHeaderComponent={ScrollingHeader}
        contentContainerStyle={styles.listContainer}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#14181C', // A dark background like Letterboxd
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#14181C',
    padding: 20,
  },
  staticHeader: {
    backgroundColor: '#252930',
    paddingVertical: 15,
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', // This centers the title horizontally
    borderBottomWidth: 1,
    borderBottomColor: '#14181C'
  },
  mainTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  scrollingHeader: {
    color: '#FFFFFF',
    fontSize: 22, // Slightly smaller than the main title
    fontWeight: 'bold',
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 15,
  },
  listContainer: {
    paddingHorizontal: 5,
  },
  itemContainer: {
    flex: 1,
    margin: 5,
    alignItems: 'center',
  },
  poster: {
    width: posterWidth,
    height: posterWidth * 1.5, // Standard movie poster aspect ratio
    borderRadius: 8,
    backgroundColor: '#2C3440' // A slightly lighter dark color for the placeholder
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default Home;