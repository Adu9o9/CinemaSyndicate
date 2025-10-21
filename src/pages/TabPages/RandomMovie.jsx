import { useState } from 'react';
import { ActivityIndicator, Button, ScrollView, StyleSheet, Text, TextInput, View, Image, TouchableOpacity} from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { useEffect } from 'react';
import { supabase } from './lib/supabase';

// export default function MovieGenerator() {
export default function MovieGenerator() {
  const [genres, setGenres] = useState([]); // State to hold genres from Supabase
  const [selectedGenres, setSelectedGenres] = useState([]);
  // ... rest of your state

  // This function fetches genres from your Supabase 'genres' table
  const fetchGenres = async () => {
    try {
      const { data, error } = await supabase
        .from('genres')
        .select('genre_id, genre_name');

      if (error) throw error;
      
      // We map the data to the format the UI expects: {id, name}
      const formattedGenres = data.map(g => ({ id: g.genre_id, name: g.genre_name }));
      setGenres(formattedGenres);
    } catch (error) {
      console.error("Error fetching genres:", error);
    }
  };

  // This useEffect hook runs the fetchGenres function once when the app starts
  useEffect(() => {
    fetchGenres();
  }, []);
  const [minRating, setMinRating] = useState('');
  const [maxRating, setMaxRating] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [movie, setMovie] = useState(null);

  const handleGenreSelect = (genreId) => {
    setSelectedGenres((prev) =>
      prev.includes(genreId)
        ? prev.filter((id) => id !== genreId)
        : [...prev, genreId]
    );
  };

const fetchRandomMovie = async () => {
    setLoading(true);
    setMovie(null); // Clear previous movie

    try {
      // Step A: Find all 'movie_id's linked to the selected 'genre_id's
      const { data: genreLinks, error: genreError } = await supabase
        .from('movie_genres')
        .select('movie_id')
        .in('genre_id', selectedGenres);
      
      if (genreError) throw genreError;

      if (!genreLinks || genreLinks.length === 0) {
        throw new Error("No movies found for the selected genres.");
      }

      // Extract the unique movie IDs from the result
      const candidateMovieIds = [...new Set(genreLinks.map(link => link.movie_id))];

      // Step B: Filter those movies by release year
      const { data: filteredMovies, error: movieError } = await supabase
        .from('movies')
        .select('movie_id') // We only need the ID for random selection
        .in('movie_id', candidateMovieIds)
        .gte('release_year', startYear)
        .lte('release_year', endYear);
      
      if (movieError) throw movieError;

      if (!filteredMovies || filteredMovies.length === 0) {
        throw new Error("No movies found in that year range.");
      }
      
      // Step C: Pick a random movie ID from the final list
      const randomIndex = Math.floor(Math.random() * filteredMovies.length);
      const randomMovieId = filteredMovies[randomIndex].movie_id;

      // Step D: Fetch the full details for that one random movie
      const { data: finalMovie, error: finalError } = await supabase
        .from('movies')
        .select('*') // Get all columns for this movie
        .eq('movie_id', randomMovieId)
        .single(); // We expect only one result
      
      if (finalError) throw finalError;

      setMovie(finalMovie);

    } catch (error) {
      console.error(error);
      setMovie(null); // Ensure movie is null on error
    } finally {
      setLoading(false);
    }
  };
//{genresList.map((genre) => ( replaced
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Random Movie Generator</Text>
      <Text style={styles.label}>Select Genres:</Text>
      <View style={styles.genreContainer}>
        {genres.map((genre) => (
          <TouchableOpacity
            key={genre.id}
            style={[
              styles.genreButton,
              selectedGenres.includes(genre.id) && styles.genreButtonSelected,
            ]}
            onPress={() => handleGenreSelect(genre.id)}
          >
            <Text
              style={[
                styles.genreButtonText,
                selectedGenres.includes(genre.id) && styles.genreButtonTextSelected,
              ]}
            >
              {genre.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.label}>Rating (%):</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="Min"
          placeholderTextColor="#888"
          keyboardType="numeric"
          value={minRating}
          onChangeText={setMinRating}
        />
        <TextInput
          style={styles.input}
          placeholder="Max"
          placeholderTextColor="#888"
          keyboardType="numeric"
          value={maxRating}
          onChangeText={setMaxRating}
        />
      </View>
      <Text style={styles.label}>Year Interval:</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="Start Year"
          placeholderTextColor="#888"
          keyboardType="numeric"
          value={startYear}
          onChangeText={setStartYear}
        />
        <TextInput
          style={styles.input}
          placeholder="End Year"
          placeholderTextColor="#888"
          keyboardType="numeric"
          value={endYear}
          onChangeText={setEndYear}
        />
      </View>
      <Button title="Generate Random Movie" color="#4cacafff" onPress={fetchRandomMovie} />

      {loading && (
        <ActivityIndicator size="large" color="#4d96ff" style={{ margin: 20 }} />
      )}

      {movie && (
        <View style={styles.movieBox}>
          <Text style={styles.movieTitle}>{movie.title}</Text>
          {movie.poster_url && (
            <Image
              source={{ uri: movie.poster_url }}
              style={styles.poster}
              resizeMode="contain"
            />
          )}
          <Text style={styles.release}>
            Release Year: {movie.release_year}
          </Text>
          <Text style={styles.movieDetails}>{movie.synopsis}</Text>
        </View>
      )}
      {!loading && movie === null && (
        <Text style={styles.movieDetails}>No movies found with these filters.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#181818',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    color: '#fff',
    marginBottom: 16,
    fontWeight: 'bold',
  },
  label: {
    color: '#fff',
    fontSize: 16,
    marginTop: 12,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#222',
    color: '#fff',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    width: 100,
  },
  movieBox: {
    backgroundColor: "#222",
    padding: 15,
    borderRadius: 10,
    marginTop: 24,
    width: '100%',
  },
  movieTitle: {
    fontSize: 22,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  release: {
    color: '#fff',
    fontSize: 18,
    marginVertical: 2,
  },
  movieDetails: {
    color: '#99AABB',
    fontSize: 15,
    marginVertical: 2,
  },
  poster: {
  width: '70%',
  height: 380,
  borderRadius: 10,
  marginVertical: 10,
  backgroundColor: '#000',
  alignSelf: 'center'
  },
  genreButton: {
  paddingVertical: 8,
  paddingHorizontal: 15,
  borderRadius: 20,          // 👈 makes it rounded
  backgroundColor: '#222',   // default dark
  margin: 4,
},
genreButtonSelected: {
  backgroundColor: '#4d96ff', // selected color
},
genreButtonText: {
  color: '#fff',
  fontSize: 14,
},
genreButtonTextSelected: {
  color: '#fff', // text color when selected (can change if you want)
},
});