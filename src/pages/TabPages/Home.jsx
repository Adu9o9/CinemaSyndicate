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
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { supabase } from '../../pages/TabPages/lib/supabase'; // Adjust path if needed

const { width } = Dimensions.get('window');

const Home = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [heroMovies, setHeroMovies] = useState([]); // Array for the slider
  const [popularMovies, setPopularMovies] = useState([]); // Array for the grid
  
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
          .limit(40); // Fetch 10 for hero + 20 for grid + buffer for filtering

        if (error) throw error;
        
        if (data && data.length > 10) {
          setHeroMovies(data.slice(0, 10)); // First 10 movies for the hero slider
          
          // --- New Title-Based Filtering Logic (More Robust) ---
          
          // Convert blocked titles to lowercase for case-insensitive matching
          const blockedTitles = [
            "fib the truth", 
            "Female Teacher"
          ];

          // 1. Get all potential popular movies
          const popularListBase = data.slice(10, 40); 
          
          // 2. Filter out the blocked titles, ignoring case and whitespace
          const filteredList = popularListBase.filter(movie => {
            // Ensure movie.title exists, convert to lowercase, and trim whitespace
            const movieTitle = movie.title ? movie.title.toLowerCase().trim() : '';
            return !blockedTitles.includes(movieTitle);
          });

          // 3. Take the first 20 from the clean list
          const finalPopularList = filteredList.slice(0, 16);
          
          setPopularMovies(finalPopularList);

        } else if (data) {
          // Fallback if we get less data
          setHeroMovies(data.slice(0, 1));
          setPopularMovies(data.slice(1));
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
      {heroMovies.length > 0 && <HeroSlider heroMovies={heroMovies} navigation={navigation} />}
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
      <StaticHeader scrollY={scrollY} />
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

const StaticHeader = ({ scrollY }) => {
  // Animate background color from transparent to dark grey
  const headerBackgroundColor = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: ['transparent', '#14181C'], // Fades to dark background
    extrapolate: 'clamp',
  });

  // Animate title color from white to light grey
  const titleColor = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: ['#FFFFFF', '#9AB'], // Fades from white to grey
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={[styles.staticHeader, { backgroundColor: headerBackgroundColor }]}>
        <Animated.Text style={[styles.mainTitle, { color: titleColor }]}>
          Cinema Syndicate
        </Animated.Text>
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

// --- New Hero Slider Component ---
const HeroSlider = ({ heroMovies, navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  // This effect handles the automatic, looping scroll
  useEffect(() => {
    if (!heroMovies || heroMovies.length === 0) return;

    const timer = setInterval(() => {
      setCurrentIndex(prevIndex => {
        const nextIndex = prevIndex === heroMovies.length - 1 ? 0 : prevIndex + 1;
        
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });

        return nextIndex;
      });
    }, 1500); // 3-second delay

    return () => clearInterval(timer); // Clean up the timer
  }, [heroMovies]);

  return (
    <View style={styles.heroWrapper}>
      <FlatList
        ref={flatListRef}
        data={heroMovies}
        renderItem={({ item }) => (
          <HeroSlide movie={item} navigation={navigation} />
        )}
        keyExtractor={(item) => item.movie_id.toString()}
        horizontal
        pagingEnabled // This makes it snap to each slide
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.floor(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />
    </View>
  );
};

// --- New Hero Slide Component (for one slide) ---
const HeroSlide = ({ movie, navigation }) => {
  const genres = movie.movie_genres.map(mg => mg.genres.genre_name).join(' • ');

  return (
    <View style={styles.heroSlide}>
      <View style={styles.heroContainer}>
          {movie.poster_url && <Image source={{ uri: movie.poster_url }} style={styles.heroImage} />}
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
    justifyContent: 'center', // Center the title
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 10,
  },
  mainTitle: {
    // color is now animated
    fontSize: 22, // Increased font size
    fontWeight: 'bold',
  },
  filterBar: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    paddingTop: 60, // Pushes content below the floating header
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  heroSlide: {
    width: width - 30, // Full width minus the horizontal padding
    alignItems: 'center',
  },
  heroContainer: {
    width: '100%',
    height: (width - 30) * 1.5,
    justifyContent: 'flex-end',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#2C3440',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
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

