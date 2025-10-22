import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
  FlatList,
  Linking
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { supabase } from './lib/supabase'; 
import CommentSection from '../../components/CommentSection';

// --- CONSTANTS ---
const { width } = Dimensions.get('window');

const MovieDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const movieId = route.params?.movieId;

  // --- STATE MANAGEMENT ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [movie, setMovie] = useState(null);
  const [cast, setCast] = useState([]);
  const [director, setDirector] = useState(null);
  const [trailer, setTrailer] = useState(null);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      if (!movieId) {
        setError("Movie ID not found.");
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('movies')
          .select(`
            *,
            movie_cast (
              character_name,
              people (
                person_id,
                name,
                profile_picture_url
              )
            ),
            movie_crew (
              role,
              people (
                person_id,
                name
              )
            ),
            trailers (
              title,
              youtube_url
            )
          `)
          .eq('movie_id', movieId)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          // --- DATA TRANSFORMATION ---
          setMovie(data);

          // Find the director from the movie_crew array
          const directorInfo = data.movie_crew?.find(crewMember => crewMember.role === 'Director');
          setDirector(directorInfo?.people);

          // Set the cast list, combining cast and people info
          const castInfo = data.movie_cast?.map(c => ({
            person_id: c.people?.person_id,
            name: c.people?.name,
            profile_picture_url: c.people?.profile_picture_url,
            character: c.character_name,
          })).filter(item => item.profile_picture_url); // Filter out cast without pictures

          setCast(castInfo || []); // Use || [] as a fallback

          // Find the official YouTube trailer
          const officialTrailer = data.trailers?.find(
            video => video.youtube_url && video.title.toLowerCase().includes('trailer')
          );
          setTrailer(officialTrailer);
        }

      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMovieDetails();
  }, [movieId]);

  // --- RENDER FUNCTIONS ---
  const renderCastMember = ({ item }) => {
    if (!item.profile_picture_url) {
      return null;
    }
    return (
      <View style={styles.castItem}>
        <Image
          source={{ uri: item.profile_picture_url }}
          style={styles.castImage}
        />
        <Text style={styles.castName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.castCharacter} numberOfLines={2}>{item.character}</Text>
      </View>
    );
  };

  // --- UI FOR LOADING AND ERROR STATES ---
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00E054" />
      </SafeAreaView>
    );
  }

  if (error || !movie) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.errorText}>{error || "Movie not found."}</Text>
      </SafeAreaView>
    );
  }

  // --- MAIN UI ---
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* --- HEADER WITH BACKDROP AND BACK BUTTON --- */}
        <View>
          {movie.backdrop_url && (
            <Image
              source={{ uri: movie.backdrop_url }}
              style={styles.backdrop}
            />
          )}
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* --- MAIN MOVIE INFO SECTION --- */}
        <View style={styles.infoContainer}>
          {movie.poster_url && (
            <Image
              source={{ uri: movie.poster_url }}
              style={styles.poster}
            />
          )}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{movie.title}</Text>
            {director && (
              <Text style={styles.director}>Directed by {director.name}</Text>
            )}
            {trailer && (
                <TouchableOpacity style={styles.trailerButton} onPress={() => Linking.openURL(trailer.youtube_url)}>
                    <Icon name="play-circle-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.trailerButtonText}>Watch Trailer</Text>
                </TouchableOpacity>
            )}
          </View>
        </View>
        
        {/* --- SYNOPSIS --- */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Synopsis</Text>
            <Text style={styles.synopsis}>{movie.synopsis}</Text>
        </View>

        {/* --- CAST (HORIZONTAL LIST) --- */}
        {cast.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cast</Text>
            <FlatList
              data={cast}
              renderItem={renderCastMember}
              keyExtractor={(item) => item.person_id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 15 }}
            />
          </View>
        )}

        {/* --- DEDICATED COMMUNITY (PLACEHOLDER) --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dedicated Community</Text>
          <CommentSection movieId={movieId} />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#14181C',
  },
  container: {
    flex: 1,
    backgroundColor: '#14181C',
  },
  backdrop: {
    width: '100%',
    height: 250,
  },
  backButton: {
    position: 'absolute',
    top: 40, // Adjusted for better visibility on notched devices
    left: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 5,
  },
  infoContainer: {
    flexDirection: 'row',
    padding: 15,
    marginTop: -80, // Pulls the poster up over the backdrop
  },
  poster: {
    width: 120,
    height: 180,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  titleContainer: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'flex-end',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  director: {
    color: '#9AB',
    fontSize: 14,
    marginTop: 4,
  },
  trailerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00E054',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  trailerButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  section: {
    marginTop: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    paddingHorizontal: 15,
  },
  synopsis: {
    color: '#9AB',
    fontSize: 14,
    lineHeight: 22,
    paddingHorizontal: 15,
  },
  castItem: {
    marginRight: 15,
    width: 100,
    alignItems: 'center',
  },
  castImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2C3440',
  },
  castName: {
    color: '#FFFFFF',
    marginTop: 8,
    textAlign: 'center',
    fontSize: 12,
  },
  castCharacter: {
    color: '#9AB',
    fontSize: 10,
    textAlign: 'center',
  },
  communityPlaceholder: {
      backgroundColor: '#2C3440',
      borderRadius: 8,
      padding: 20,
      marginHorizontal: 15,
      alignItems: 'center',
  },
  communityText: {
      color: '#9AB',
      textAlign: 'center',
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});

export default MovieDetailScreen;

