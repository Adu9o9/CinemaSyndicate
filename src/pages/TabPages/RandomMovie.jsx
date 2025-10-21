import { useState } from 'react';
import { ActivityIndicator, Button, ScrollView, StyleSheet, Text, TextInput, View, Image, TouchableOpacity} from 'react-native';

const genresList = [
    {id: 28, name: "Action"},
    {id: 12, name: "Adventure"},
    {id: 16, name: "Animation"},
    {id: 35, name: "Comedy"},
    {id: 80, name: "Crime"},
    {id: 99, name: "Documentary"},
    {id: 18, name: "Drama"},
    {id: 10751, name: "Family"},
    {id: 14, name: "Fantasy"},
    {id: 36, name: "History"},
    {id: 27, name: "Horror"},
    {id: 10402, name: "Music"},
    {id: 9648, name: "Mystery"},
    {id: 10749, name: "Romance"},
    {id: 878, name: "Science Fiction"},
    {id: 10770, name: "TV Movie"},
    {id: 53, name: "Thriller"},
    {id: 10752, name: "War"},
    {id: 37, name: "Western"}
]

export default function MovieGenerator() {
  const [selectedGenres, setSelectedGenres] = useState([]);
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
    const apiKey = 'f99933b8f70a6dbf82e60957cf1a66bd';
    const genreParam = selectedGenres.join(',');
    const url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=${genreParam}&vote_average.gte=${minRating/10}&vote_average.lte=${maxRating/10}&primary_release_date.gte=${startYear}-01-01&primary_release_date.lte=${endYear}-12-31`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.results.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.results.length);
        setMovie(data.results[randomIndex]);
      } else {
        setMovie(null);
      }
    } catch (error) {
      setMovie(null);
    }
    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Random Movie Generator</Text>
      <Text style={styles.label}>Select Genres:</Text>
      <View style={styles.genreContainer}>
        {genresList.map((genre) => (
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
          {movie.poster_path && (
            <Image
              source={{ uri: `https://image.tmdb.org/t/p/w500${movie.poster_path}` }}
              style={styles.poster}
              resizeMode="contain"
            />
          )}
          <Text style={styles.release}>
            Release: {movie.release_date} | Rating: {movie.vote_average.toFixed(1)}/10
          </Text>
          <Text style={styles.movieDetails}>{movie.overview}</Text>
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
