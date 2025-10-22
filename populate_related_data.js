// This script will read your existing 'movies' table from Supabase,
// then fetch related data (cast, crew, trailers) from the TMDB API
// and insert it into your normalized Supabase tables.

// --- SETUP ---
// 1. Import necessary libraries
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch'; // Make sure to run `npm install node-fetch`

// 2. Configure your Supabase and TMDB credentials
// IMPORTANT: Replace with your actual credentials
const SUPABASE_URL = 'https://hxtnjddgmheiyvgstblu.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4dG5qZGRnbWhlaXl2Z3N0Ymx1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjc3MTIxNSwiZXhwIjoyMDY4MzQ3MjE1fQ.6Gm5173xOSSGO0F0aBbWku-nbwwDQ9FDs1dy0D7LBdE'; // Use the SERVICE_ROLE key for server-side scripts
const TMDB_API_KEY = 'f99933b8f70a6dbf82e60957cf1a66bd';

// 3. Initialize the Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// --- MAIN FUNCTION ---
async function populateRelatedData() {
  console.log('Starting data enrichment process...');

  try {
    // STEP 1: Fetch all existing movies from our Supabase 'movies' table
    console.log('Fetching existing movies from Supabase...');
    const { data: movies, error: moviesError } = await supabase
      .from('movies')
      .select('movie_id, tmdb_id');

    if (moviesError) throw moviesError;
    if (!movies || movies.length === 0) {
      console.log('No movies found in the database. Exiting.');
      return;
    }

    console.log(`Found ${movies.length} movies to process.`);

    // STEP 2: Loop through each movie and fetch its related data
    for (const movie of movies) {
      // --- START of the new, more resilient try...catch block ---
      try {
        console.log(`\nProcessing movie_id: ${movie.movie_id} (tmdb_id: ${movie.tmdb_id})`);

        // Fetch credits (cast & crew) from TMDB API
        const creditsUrl = `https://api.themoviedb.org/3/movie/${movie.tmdb_id}/credits?api_key=${TMDB_API_KEY}`;
        const creditsResponse = await fetch(creditsUrl);
        if (!creditsResponse.ok) {
          // By throwing an error here, we ensure it's caught by our new catch block
          throw new Error(`Failed to fetch credits. Status: ${creditsResponse.status}`);
        }
        const { cast, crew } = await creditsResponse.json();

        // Fetch videos (trailers) from TMDB API
        const videosUrl = `https://api.themoviedb.org/3/movie/${movie.tmdb_id}/videos?api_key=${TMDB_API_KEY}`;
        const videosResponse = await fetch(videosUrl);
        if (!videosResponse.ok) {
          throw new Error(`Failed to fetch videos. Status: ${videosResponse.status}`);
        }
        const { results: videos } = await videosResponse.json();
        
        // --- DATA TRANSFORMATION AND INSERTION ---

        // A. Process and insert People, Cast, and Crew
        if (cast && crew) {
          const allPeople = [...cast, ...crew];
          
          const uniquePeople = Array.from(new Set(allPeople.map(p => p.id)))
            .map(id => allPeople.find(p => p.id === id));
            
          const peopleToInsert = uniquePeople.map(p => ({
            person_id: p.id,
            name: p.name,
            profile_picture_url: p.profile_path ? `https://image.tmdb.org/t/p/w185${p.profile_path}` : null,
            tmdb_person_id: p.id,
          }));

          const { error: peopleError } = await supabase.from('people').upsert(peopleToInsert, { onConflict: 'person_id' });
          if (peopleError) console.error('  - Error upserting people:', peopleError.message);
          else console.log(`  - Upserted ${peopleToInsert.length} unique people.`);

          const castToInsert = cast.map(member => ({
            movie_id: movie.movie_id,
            person_id: member.id,
            character_name: member.character,
          }));

          const { error: castError } = await supabase.from('movie_cast').insert(castToInsert);
          if (castError && !castError.message.includes('duplicate key')) console.error('  - Error inserting cast:', castError.message);
          else if (!castError) console.log(`  - Inserted ${castToInsert.length} cast members.`);

          const crewToInsert = crew.map(member => ({
              movie_id: movie.movie_id,
              person_id: member.id,
              role: member.job || 'N/A',
              job_description: member.department,
          }));
          
          const { error: crewError } = await supabase.from('movie_crew').insert(crewToInsert);
          if (crewError && !crewError.message.includes('duplicate key')) console.error('  - Error inserting crew:', crewError.message);
          else if (!crewError) console.log(`  - Inserted ${crewToInsert.length} crew members.`);
        }

        // B. Process and insert Trailers
        if (videos) {
          const trailersToInsert = videos
            .filter(v => v.site === 'YouTube' && v.type === 'Trailer')
            .map(trailer => ({
              movie_id: movie.movie_id,
              youtube_url: `https://www.youtube.com/watch?v=${trailer.key}`,
              title: trailer.name,
              language: trailer.iso_639_1,
            }));

          if (trailersToInsert.length > 0) {
            const { error: trailerError } = await supabase.from('trailers').insert(trailersToInsert);
            if (trailerError && !trailerError.message.includes('duplicate key')) console.error('  - Error inserting trailers:', trailerError.message);
            else if (!trailerError) console.log(`  - Inserted ${trailersToInsert.length} trailers.`);
          }
        }

        // Add a small delay to avoid hitting API rate limits
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (e) {
        // This catch block will handle errors for a SINGLE movie, then the loop will continue.
        console.error(`  !! FAILED to process movie_id: ${movie.movie_id} (tmdb_id: ${movie.tmdb_id}). Reason: ${e.message}`);
      }
      // --- END of the new try...catch block ---
    }

  } catch (error) {
    // This outer catch block will only handle initial errors, like failing to fetch the movie list.
    console.error('A critical error occurred:', error);
  } finally {
    console.log('\nData enrichment process finished.');
  }
}

// Run the main function
populateRelatedData();

