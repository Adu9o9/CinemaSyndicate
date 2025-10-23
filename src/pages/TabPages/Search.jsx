import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { supabase } from '../../pages/TabPages/lib/supabase'; // Adjust this path if needed
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const posterWidth = width / 3.5;

const Search = () => {
  const [loadingRecommended, setLoadingRecommended] = useState(true);
  const [recommendedMovies, setRecommendedMovies] = useState([]);
  const [error, setError] = useState(null);
  
  // --- New State for Search ---
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [movieResults, setMovieResults] = useState([]);
  const [userResults, setUserResults] = useState([]);

  const navigation = useNavigation();

  // --- Effect for Fetching Recommended Movies (Runs Once) ---
  useEffect(() => {
    const fetchRecommended = async () => {
      try {
        const { data, error } = await supabase.rpc('get_recommended_movies');
        if (error) throw error;
        setRecommendedMovies(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoadingRecommended(false);
      }
    };
    fetchRecommended();
  }, []);

  // --- Effect for Performing Search (Debounced) ---
  useEffect(() => {
    // This function will perform the actual search
    const performSearch = async () => {
      if (searchQuery.length < 3) {
        // Don't search for tiny strings
        setMovieResults([]);
        setUserResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        // We use textSearch which is great for this. 'plain' makes it search for parts of words.
        // We run both queries concurrently for speed.
        const [movieSearch, userSearch] = await Promise.all([
          supabase
            .from('movies')
            .select('movie_id, title, poster_url')
            .textSearch('title', searchQuery, { type: 'plain' })
            .not('poster_url', 'is', null)
            .limit(10),
          supabase
            .from('profiles')
            .select('user_id, username, profile_picture_url')
            .textSearch('username', searchQuery, { type: 'plain' })
            .limit(5)
        ]);

        if (movieSearch.error) throw movieSearch.error;
        if (userSearch.error) throw userSearch.error;

        setMovieResults(movieSearch.data || []);
        setUserResults(userSearch.data || []);
      
      } catch (e) {
        setError(e.message);
      } finally {
        setIsSearching(false);
      }
    };

    // This is the debounce logic. It waits 500ms after the user stops typing.
    const searchTimeout = setTimeout(() => {
      performSearch();
    }, 500);

    // This cleanup function runs every time the effect re-runs (i.e., when user types)
    // It cancels the previous timeout, so we only run one search.
    return () => clearTimeout(searchTimeout);
  }, [searchQuery]); // This effect depends on the searchQuery state

  // --- RENDER FUNCTIONS ---

  // Renders a single poster for horizontal lists
  const renderMovieItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.movieItem}
      onPress={() => navigation.navigate('MovieDetail', { movieId: item.movie_id })}
    >
      <Image source={{ uri: item.poster_url }} style={styles.posterImage} />
    </TouchableOpacity>
  );

  // Renders a single user for the vertical results list
  const renderUserItem = ({ item }) => (
    <TouchableOpacity style={styles.userItem}>
      <Image 
        source={{ uri: item.profile_picture_url || 'https://placehold.co/80x80/2C3440/FFFFFF?text=User' }} 
        style={styles.userImage} 
      />
      <Text style={styles.userName}>{item.username}</Text>
    </TouchableOpacity>
  );

  // Renders the "Recommended Movies" list (the default state)
  const renderRecommendedList = () => {
    if (loadingRecommended) {
      return <ActivityIndicator size="large" color="#00E054" style={{marginTop: 20}} />;
    }
    if (error) {
      return <Text style={styles.errorText}>{error}</Text>;
    }
    if (!recommendedMovies || recommendedMovies.length === 0) {
      return <Text style={styles.errorText}>No recommended movies found.</Text>;
    }
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recommended Movies</Text>
        <FlatList
          data={recommendedMovies}
          renderItem={renderMovieItem}
          keyExtractor={(item) => item.movie_id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 15 }}
        />
      </View>
    );
  };

  // Renders the Search Results (the active search state)
  const renderSearchResults = () => {
    if (isSearching) {
      return <ActivityIndicator size="large" color="#00E054" style={{marginTop: 20}} />;
    }

    if (!isSearching && movieResults.length === 0 && userResults.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>No results found for "{searchQuery}"</Text>
        </View>
      );
    }

    return (
      <ScrollView>
        {movieResults.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Movies</Text>
            <FlatList
              data={movieResults}
              renderItem={renderMovieItem}
              keyExtractor={(item) => item.movie_id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 15 }}
            />
          </View>
        )}
        {userResults.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Users</Text>
            <FlatList
              data={userResults}
              renderItem={renderUserItem}
              keyExtractor={(item) => item.user_id.toString()}
              contentContainerStyle={{ paddingHorizontal: 15 }}
            />
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* --- Search Bar --- */}
      <View style={styles.searchBarContainer}>
        <Icon name="magnify" size={24} color="#9AB" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search movies, users..."
          placeholderTextColor="#9AB"
          value={searchQuery}
          onChangeText={setSearchQuery} // Updates the searchQuery state on every keystroke
        />
        <Icon name="microphone" size={24} color="#9AB" />
      </View>

      {/* --- Conditional Content --- */}
      {searchQuery.length === 0 ? renderRecommendedList() : renderSearchResults()}
      
    </SafeAreaView>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#14181C',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C3440',
    borderRadius: 8,
    paddingHorizontal: 15,
    margin: 15,
    height: 50,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    marginLeft: 10,
    marginRight: 10,
  },
  section: {
    marginTop: 10,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  movieItem: {
    width: posterWidth,
    marginRight: 15,
  },
  posterImage: {
    width: '100%',
    aspectRatio: 2/3,
    borderRadius: 8,
    backgroundColor: '#2C3440',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#14181C',
  },
  errorText: {
    color: '#9AB',
    fontSize: 16,
    paddingHorizontal: 15,
    textAlign: 'center',
    marginTop: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  userImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2C3440',
  },
  userName: {
    color: 'white',
    fontSize: 16,
    marginLeft: 15,
  },
});

export default Search;

