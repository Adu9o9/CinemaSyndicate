import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  FlatList,
  Animated, // Import the Animated API
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { supabase } from '../../pages/TabPages/lib/supabase'; // CORRECTED PATH

const { width } = Dimensions.get('window');

const Home = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [heroMovie, setHeroMovie] = useState(null);
  const [popularMovies, setPopularMovies] = useState([]);
  
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const { data, error } = await supabase
          .from('movies')
          .select(`
            movie_id, 
            title, 
            poster_url, 
            backdrop_url, 
            synopsis,
            movie_genres (
              genres ( genre_name )
            )
          `)
          .not('backdrop_url', 'is', null)
          .not('poster_url', 'is', null)
          .limit(21);

        if (error) throw error;
        
        // Check if there's enough data to select the third movie
        if (data && data.length > 6) {
          setHeroMovie(data[5]); // Set the third movie (index 2) as the hero
          setPopularMovies(data); // Use the full list for the grid
        } else if (data && data.length > 0) {
          // Fallback to the first movie if there are fewer than 3
          setHeroMovie(data[0]);
          setPopularMovies(data);
        }

      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, []);

  const ListHeader = () => (
    <>
      <FilterBar />
      {heroMovie && <HeroSection movie={heroMovie} navigation={navigation} />}
      <Text style={styles.subHeader}>Popular Movies</Text>
    </>
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
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <StaticHeader navigation={navigation} scrollY={scrollY} />
      <FlatList
        ListHeaderComponent={ListHeader}
        data={popularMovies}
        renderItem={({ item }) => <MoviePoster item={item} navigation={navigation} />}
        keyExtractor={(item) => item.movie_id.toString()}
        numColumns={2}
        contentContainerStyle={{ paddingHorizontal: 5 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      />
    </SafeAreaView>
  );
};

// --- SUB-COMPONENTS ---

const StaticHeader = ({ navigation, scrollY }) => {
  const headerBackgroundColor = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: ['transparent', '#14181C'],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={[styles.staticHeader, { backgroundColor: headerBackgroundColor }]}>
        <Text style={styles.mainTitle}>Cinema Syndicate</Text>
        <TouchableOpacity onPress={() => { /* Handle Search Navigation */ }}>
            <Icon name="magnify" size={28} color="#FFFFFF" />
        </TouchableOpacity>
    </Animated.View>
  );
};

const FilterBar = () => (
    <View style={styles.filterBar}>
        <TouchableOpacity style={styles.filterButtonSelected}>
            <Text style={styles.filterButtonTextSelected}>Popular Movies</Text>
        </TouchableOpacity>
    </View>
);

const HeroSection = ({ movie, navigation }) => {
  // Extract genre names from the fetched data
  const genres = movie.movie_genres.map(mg => mg.genres.genre_name).join(' • ');

  return (
    <View style={styles.heroWrapper}>
      <View style={styles.heroContainer}>
          {movie.poster_url && <Image source={{ uri: movie.poster_url }} style={styles.heroImage} /> }
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
              <Text style={styles.heroTitle} numberOfLines={2}>{movie.title}</Text>
              <Text style={styles.heroGenres}>{genres}</Text>
              <View style={styles.heroButtonRow}>
                  <TouchableOpacity 
                      style={[styles.heroButton, styles.trailerButton]}
                      onPress={() => navigation.navigate('MovieDetail', { movieId: movie.movie_id })}
                  >
                      <Icon name="play" size={18} color="#000000" />
                      <Text style={styles.trailerButtonText}>Trailer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                      style={[styles.heroButton, styles.communityButton]}
                      onPress={() => navigation.navigate('MovieDetail', { movieId: movie.movie_id })}
                  >
                      <Icon name="forum-outline" size={18} color="#FFFFFF" />
                      <Text style={styles.communityButtonText}>Community</Text>
                  </TouchableOpacity>
              </View>
          </View>
      </View>
    </View>
  );
};

const MoviePoster = ({ item, navigation }) => (
    <TouchableOpacity 
        style={styles.posterContainer}
        onPress={() => navigation.navigate('MovieDetail', { movieId: item.movie_id })}
    >
        {item.poster_url && <Image source={{ uri: item.poster_url }} style={styles.posterImage} /> }
    </TouchableOpacity>
);


// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#14181C',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#14181C',
  },
  errorText: {
    color: 'white',
    fontSize: 16
  },
  staticHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 10,
  },
  mainTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  filterBar: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    paddingTop: 60, 
  },
  filterButtonSelected: {
    backgroundColor: '#2C3440',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  filterButtonTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  subHeader: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 5,
  },
  heroWrapper: {
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  heroContainer: {
    width: '100%',
    height: width * 1.5,
    justifyContent: 'flex-end',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#2C3440',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#2C3440', // Placeholder color
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    // CORRECTED: Use a valid React Native style for a semi-transparent overlay
    backgroundColor: 'rgba(20, 24, 28, 0.4)',
  },
  heroContent: {
    padding: 20,
  },
  heroTitle: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  heroGenres: {
    color: '#E0E0E0',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  heroButtonRow: {
      flexDirection: 'row',
      marginTop: 20,
  },
  heroButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 6,
      flex: 1,
  },
  trailerButton: {
      backgroundColor: 'white',
      marginRight: 10,
  },
  trailerButtonText: {
      color: 'black',
      fontWeight: 'bold',
      marginLeft: 8,
      fontSize: 14,
  },
  communityButton: {
      backgroundColor: 'rgba(100, 100, 100, 0.7)',
      marginLeft: 10,
  },
  communityButtonText: {
      color: 'white',
      fontWeight: 'bold',
      marginLeft: 8,
      fontSize: 14,
  },
  posterContainer: {
    flex: 1,
    margin: 5,
    maxWidth: '50%',
    backgroundColor: '#2C3440',
    borderRadius: 8,
  },
  posterImage: {
    width: '100%',
    aspectRatio: 2/3,
    borderRadius: 8,
  },
});

export default Home;

