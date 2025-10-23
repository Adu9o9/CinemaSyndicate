import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
// Import navigation hooks
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
// Corrected import path - ensure this is correct for your project structure
import { supabase } from '../../pages/TabPages/lib/supabase'; // Assuming path is correct
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearSession } from '../../Redux/AuthSlice';
import { useDispatch } from 'react-redux';

// --- Reusable Components ---
const MovieList = ({ title, movies }) => (
  <View style={styles.listContainer}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.movieListContent}>
      {Array.isArray(movies) && movies.map((movie) => (
        movie && movie.movie_id ? (
          <View key={movie.movie_id} style={styles.movieCard}>
            <Image
              source={{ uri: movie.poster_url || 'https://via.placeholder.com/100x150' }}
              style={styles.moviePoster}
              resizeMode="cover"
            />
            <Text style={styles.movieTitle} numberOfLines={2}>
              {movie.title ?? 'Unknown Title'}
            </Text>
          </View>
        ) : null
      ))}
      <View style={{ width: 16 }} />
    </ScrollView>
  </View>
);

// --- START: MODIFIED CommentList Component ---
const CommentList = ({ title, comments }) => {
  const navigation = useNavigation(); 

  const handleCommentPress = (commentData) => {
    const movieId = commentData?.community_posts?.movies?.movie_id;

    if (movieId) {
      // --- THIS IS THE FIX ---
      // Your navigator (RootNavigator.js) named this screen 'MovieDetail'
      navigation.navigate('MovieDetail', { movieId: movieId });
      // --- END OF FIX ---
    } else {
      console.warn("Could not navigate: No Movie ID found on this comment.");
    }
  };
 
  return (
    <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {Array.isArray(comments) && comments.length > 0 ? (
            comments.map((comment) => (
               comment && comment.comment_id ? (
                 <TouchableOpacity 
                   key={comment.comment_id} 
                   style={styles.commentCard}
                   onPress={() => handleCommentPress(comment)}
                 >
                    {comment.community_posts?.movies && (
                        <View style={styles.commentMovieHeader}>
                            <Image
                                source={{ uri: comment.community_posts.movies.poster_url || 'https://via.placeholder.com/40x60' }}
                                style={styles.commentMoviePoster}
                                resizeMode="cover"
                            />
                            <Text style={styles.commentMovieTitle} numberOfLines={1}>
                                On: {comment.community_posts.movies.title ?? 'Unknown Movie'}
                            </Text>
                        </View>
                    )}
                    <Text style={styles.commentText}>{comment.comment_text ?? 'No content'}</Text>
                    <Text style={styles.commentUpvotes}>Upvotes: {comment.upvotes ?? 0}</Text>
                 </TouchableOpacity> 
               ) : null
            ))
        ) : (
            <Text style={styles.noItemsText}>No recent activity found.</Text>
        )}
    </View>
  );
};
// --- END: MODIFIED CommentList Component ---


// --- Main Profile Page Component ---
const ProfilePage = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const profileUserId = route.params?.userId; 
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null); 
  const [recentActivity, setRecentActivity] = useState([]); 
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loggedInUserId, setLoggedInUserId] = useState(null); 
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [followLoading, setFollowLoading] = useState(false); 
  const [isEditing, setIsEditing] = useState(false);
  const [tempBio, setTempBio] = useState(''); 
  const [tempTags, setTempTags] = useState(''); 
  const [saving, setSaving] = useState(false); 

  // --- Helper to parse bio/tags ---
  const parseBioAndTags = (fullBioString) => {
    if (!fullBioString) return { bio: '', tagsString: '' };
    const separator = "\nTags:"; 
    const parts = fullBioString.split(separator);
    const bio = parts[0]?.trim() ?? ''; 
    const tagsRaw = parts[1]?.trim() ?? '';
    const tagsString = tagsRaw.split(/[\s,]+/).filter(Boolean).join(', ');
    return { bio, tagsString };
  };

  // --- Fetch Data Logic ---
  const fetchProfileData = useCallback(async () => {
    console.log("Fetching profile data...");
    setProfile(null); setRecentActivity([]);
    setFollowerCount(0); setFollowingCount(0);
    setIsFollowing(false); setLoggedInUserId(null); setIsOwnProfile(false);

    let idToFetch = profileUserId; 

    try {
      setLoading(true); 

      // 1. Get Logged-in User
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) console.error("Auth Error:", userError.message); 
      const currentLoggedInUserId = user?.id;
      setLoggedInUserId(currentLoggedInUserId); 

      // Determine whose profile to load
      if (!idToFetch && currentLoggedInUserId) {
        idToFetch = currentLoggedInUserId; 
        setIsOwnProfile(true);
      } else if (idToFetch && currentLoggedInUserId && idToFetch === currentLoggedInUserId) {
        setIsOwnProfile(true); 
      } else {
        setIsOwnProfile(false); 
      }

      if (!idToFetch) {
         console.log("No profile ID to load (not passed via params and user not logged in).");
         setLoading(false); 
         return;
      }

      console.log(`Fetching data for profile ID: ${idToFetch}, Logged in User ID: ${currentLoggedInUserId}`);

      // 2. Fetch all data concurrently
      const [
        profileResult,
        activityResult,
        followersResult,
        followingResult,
        followStatusResult
      ] = await Promise.all([
        supabase.from('profiles').select('username, bio, profile_picture_url').eq('user_id', idToFetch).maybeSingle(), 
        supabase.from('community_comments')
          .select(`comment_id, comment_text, upvotes, comment_date, community_posts!inner(post_id, movie_id, movies!inner(movie_id, title, poster_url))`)
          .eq('user_id', idToFetch)
          .not('community_posts.movie_id', 'is', null) 
          .order('comment_date', { ascending: false })
          .limit(5),
        supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('following_id', idToFetch),
        supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('follower_id', idToFetch),
        currentLoggedInUserId && !isOwnProfile && idToFetch ? supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('follower_id', currentLoggedInUserId).eq('following_id', idToFetch) : Promise.resolve({ count: 0, error: null })
      ]);

      // 3. Process Results
      if (profileResult.error) {
        console.error("Profile fetch error:", profileResult.error.message);
      } else {
        setProfile(profileResult.data || {}); 
        const { bio: initialBio, tagsString: initialTags } = parseBioAndTags(profileResult.data?.bio);
        setTempBio(initialBio);
        setTempTags(initialTags);
      }

      if (activityResult.error) {
          console.error("Activity fetch error:", activityResult.error.message);
          setRecentActivity([]); 
      } else {
          const validActivity = activityResult.data?.filter(
              item => item.community_posts && item.community_posts.movies
          ) ?? []; 
          setRecentActivity(validActivity);
      }

      if (followersResult.error) console.error("Followers count error:", followersResult.error.message);
      else setFollowerCount(followersResult.count ?? 0); 

      if (followingResult.error) console.error("Following count error:", followingResult.error.message);
      else setFollowingCount(followingResult.count ?? 0); 

      if (followStatusResult.error) console.error("Follow status error:", followStatusResult.error.message);
      else setIsFollowing((followStatusResult.count ?? 0) > 0); 

    } catch (error) {
      console.error("General error fetching profile data:", error.message);
      setProfile(null); 
    } finally {
      setLoading(false); 
    }
  }, [profileUserId]); 


  // --- Auth Listener ---
  useEffect(() => {
    console.log("Setting up auth listener...");
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        console.log("Auth state changed, refetching profile data...");
        fetchProfileData(); 
    });

    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
        console.log("Unsubscribed from auth changes.");
      }
    };
  }, [fetchProfileData]); 

  // --- Focus Listener ---
  useFocusEffect(
    useCallback(() => {
      console.log("Profile screen is focused, fetching data...");
      fetchProfileData();
    }, [fetchProfileData]) 
  );


  // --- Derived state for display ---
   const { displayBio, displayTagsArray } = useMemo(() => {
     if (!profile?.bio) return { displayBio: '', displayTagsArray: [] };
     const separator = "\nTags:";
     const parts = profile.bio.split(separator);
     const bio = parts[0]?.trim() ?? '';
     const tagsString = parts[1]?.trim() ?? '';
     const tagsArray = tagsString.split(/[\s,]+/).filter(Boolean);
     return { displayBio: bio, displayTagsArray: tagsArray };
  }, [profile?.bio]); 


  // --- Edit Mode Functions ---
   const handleEdit = () => {
      const { bio: currentBio, tagsString: currentTags } = parseBioAndTags(profile?.bio);
      setTempBio(currentBio);
      setTempTags(currentTags);
      setIsEditing(true);
   };
   const handleCancel = () => { setIsEditing(false); };
   const handleSave = async () => {
      if (!loggedInUserId) { Alert.alert("Error", "Authentication error."); return; }
      setSaving(true);
      try {
        const tagsToSave = tempTags.trim();
        let combinedBio = tempBio.trim();
        if (tagsToSave) { combinedBio += `\nTags: ${tagsToSave}`; } 

        const updates = {
            bio: combinedBio
        };
        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('user_id', loggedInUserId); 
        if (error) throw error;
        setProfile(prev => ({ ...prev, bio: combinedBio }));
        setIsEditing(false);
        Alert.alert("Success", "Profile updated!");
      } catch (error) {
        console.error("Error updating profile:", error.message);
        Alert.alert("Error", `Could not update profile: ${error.message}`);
      } finally { setSaving(false); }
   };


  // --- Follow/Unfollow Functions ---
   const handleFollow = async () => {
      const targetUserId = profileUserId;
      if (!loggedInUserId || !targetUserId || isOwnProfile) return;
      setFollowLoading(true);
      try {
        const { error } = await supabase.from('user_follows').insert({ follower_id: loggedInUserId, following_id: targetUserId });
        if (error) throw error;
        setIsFollowing(true); setFollowerCount(prev => prev + 1);
      } catch (error) { console.error("Follow Error:", error.message); Alert.alert("Error", "Could not follow user."); }
      finally { setFollowLoading(false); }
   };
   const handleUnfollow = async () => {
      const targetUserId = profileUserId;
      if (!loggedInUserId || !targetUserId || isOwnProfile) return;
      setFollowLoading(true);
      try {
        const { error } = await supabase.from('user_follows').delete().eq('follower_id', loggedInUserId).eq('following_id', targetUserId);
        if (error) throw error;
        setIsFollowing(false); setFollowerCount(prev => Math.max(0, prev - 1));
      } catch (error) { console.error("Unfollow Error:", error.message); Alert.alert("Error", "Could not unfollow user."); }
      finally { setFollowLoading(false); }
   };

   // --- Logout Function ---
   const handleLogout = async () => {
       setLoading(true); 
       await AsyncStorage.removeItem("user")
        await AsyncStorage.removeItem("name")
        dispatch(clearSession())
       const { error } = await supabase.auth.signOut();
       if (error) {
           Alert.alert("Logout Error", error.message);
           setLoading(false); 
       } else {
           console.log("User logged out");
       }
   };

  // --- Render Logic ---
  if (loading) {
     return ( <SafeAreaView style={styles.safeArea}><ActivityIndicator size="large" color={COLORS.textPrimary} style={{ flex: 1, justifyContent: 'center' }} /></SafeAreaView> );
  }

  if (!loggedInUserId && !profileUserId) {
     return ( <SafeAreaView style={[styles.safeArea, styles.centeredMessageContainer]}><StatusBar barStyle="light-content" /><Text style={styles.centeredMessageText}>Please log in to view profile.</Text></SafeAreaView> );
  }

  if (!profile || Object.keys(profile).length === 0) {
      return ( <SafeAreaView style={[styles.safeArea, styles.centeredMessageContainer]}><StatusBar barStyle="light-content" /><Text style={styles.centeredMessageText}>Could not load profile.</Text></SafeAreaView> );
  }

  const displayProfile = profile; 
  const tagDisplayString = displayTagsArray.map(tag => `#${tag}`).join(' ');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView>
        {/* Profile Header */}
        <View style={styles.headerContainer}>
           <Image source={{ uri: displayProfile.profile_picture_url || 'https://t3.ftcdn.net/jpg/05/87/76/66/360_F_587766653_PkBNyGx7mQh9l1XXPtCAq1lBgOsLl6xH.jpg' }} style={styles.profilePic} />
           <Text style={styles.username}>{displayProfile?.username ?? '...'}</Text>
           <View style={styles.followStatsContainer}>
             <View style={styles.followStat}><Text style={styles.followCount}>{followerCount}</Text><Text style={styles.followLabel}>Followers</Text></View>
             <View style={styles.followStat}><Text style={styles.followCount}>{followingCount}</Text><Text style={styles.followLabel}>Following</Text></View>
           </View>
           {isEditing ? (
              // --- EDITING VIEW ---
              <View style={styles.editingContainer}>
                 <Text style={styles.inputLabel}>Bio</Text>
                 <TextInput style={[styles.input, styles.bioInput]} value={tempBio} onChangeText={setTempBio} placeholder="Enter your bio" placeholderTextColor={COLORS.textSecondary} multiline />
                 <Text style={styles.inputLabel}>Favorite Tags (comma or space separated)</Text>
                 <TextInput style={styles.input} value={tempTags} onChangeText={setTempTags} placeholder="e.g., Sci-Fi Thriller Action" placeholderTextColor={COLORS.textSecondary} />
                 <View style={styles.editButtonsContainer}>
                   <TouchableOpacity style={[styles.editButtonSmall, styles.cancelButton]} onPress={handleCancel} disabled={saving}><Text style={[styles.editButtonTextSmall, styles.cancelButtonText]}>Cancel</Text></TouchableOpacity>
                   <TouchableOpacity style={[styles.editButtonSmall, styles.saveButton]} onPress={handleSave} disabled={saving}>{saving ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.editButtonTextSmall}>Save</Text>}</TouchableOpacity>
                 </View>
              </View>
           ) : (
              // --- VIEWING VIEW ---
              <>
                <Text style={styles.bio}>{displayBio ?? 'No bio yet.'}</Text>
                {displayTagsArray.length > 0 && (<Text style={styles.tagsDisplay}>{tagDisplayString ?? ''}</Text>)}
                {/* --- Conditional Buttons --- */}
                {isOwnProfile ? (
                  <>
                     <TouchableOpacity style={styles.editButton} onPress={handleEdit}><Text style={styles.editButtonText}>Edit Profile</Text></TouchableOpacity>
                     <TouchableOpacity style={[styles.editButton, styles.logoutButton]} onPress={handleLogout}><Text style={styles.logoutButtonText}>Log Out</Text></TouchableOpacity>
                  </>
                ) : loggedInUserId ? (
                  <TouchableOpacity
                    style={[styles.followButton, isFollowing ? styles.unfollowButton : styles.followButtonActive]}
                    onPress={isFollowing ? handleUnfollow : handleFollow}
                    disabled={followLoading}
                  >
                    {followLoading ? (
                       <ActivityIndicator size="small" color={isFollowing ? COLORS.unfollow : "#FFFFFF"} />
                    ) : (
                       <Text style={[styles.followButtonText, isFollowing && styles.unfollowButtonText]}>
                          {isFollowing ? 'Unfollow' : 'Follow'}
                       </Text>
                    )}
                  </TouchableOpacity>
                ) : null }
              </> 
           )} 
        </View> 

        {/* --- Sections (Only show if not editing) --- */}
        {!isEditing && (
             <>
                 {/* Display Recent Activity (Comments + Movies) */}
                 <CommentList title="Recent Activity" comments={recentActivity} />
             </>
        )}
      </ScrollView>
    </SafeAreaView>
  ); 
}; 


// --- Styles ---
const COLORS = {
  primary: '#00E054',
  save: '#34C759', cancel: '#FF3B30',
  background: '#14181C', card: '#1F242A', textPrimary: '#FFFFFF',
  textSecondary: '#A9A9A9', border: '#333333', inputBackground: '#3A3A3C',
  follow: '#34C759',
  unfollow: '#FF3B30',
  logout: '#8E8E93',
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  centeredMessageContainer: { flex:1, justifyContent: 'center', alignItems: 'center' },
  centeredMessageText: { color: COLORS.textSecondary, fontSize: 18 },
  headerContainer: { backgroundColor: COLORS.card, alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  profilePic: { width: 100, height: 100, borderRadius: 50, marginBottom: 12, backgroundColor: COLORS.background },
  username: { fontSize: 22, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 4 },
  followStatsContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '60%', marginVertical: 10 },
  followStat: { alignItems: 'center' },
  followCount: { color: COLORS.textPrimary, fontSize: 18, fontWeight: 'bold' },
  followLabel: { color: COLORS.textSecondary, fontSize: 12 },
  bio: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 8, paddingHorizontal: 10 },
  tagsDisplay: { fontSize: 14, color: COLORS.primary, textAlign: 'center', marginBottom: 16, paddingHorizontal: 10, fontStyle: 'italic' },
  editButton: { backgroundColor: COLORS.primary, paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20, marginTop: 10, minWidth: 120, alignItems:'center' },
  editButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  logoutButton: { backgroundColor: 'transparent', borderColor: COLORS.logout, borderWidth: 1, marginTop: 8 },
  logoutButtonText: { color: COLORS.logout, fontSize: 14, fontWeight: 'bold' },
  followButton: { paddingVertical: 8, paddingHorizontal: 30, borderRadius: 20, marginTop: 10, minWidth: 120, alignItems: 'center', justifyContent: 'center', minHeight: 36 },
  followButtonActive: { backgroundColor: COLORS.follow },
  unfollowButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.unfollow },
  followButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  unfollowButtonText: { color: COLORS.unfollow },
  editingContainer: { width: '100%', marginTop: 10 },
  inputLabel: { color: COLORS.textSecondary, fontSize: 14, marginBottom: 4, alignSelf: 'flex-start' },
  input: { backgroundColor: COLORS.inputBackground, color: COLORS.textPrimary, borderRadius: 8, paddingHorizontal: 15, paddingVertical: 10, fontSize: 15, width: '100%', marginBottom: 15 },
  bioInput: { minHeight: 80, textAlignVertical: 'top' },
  editButtonsContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '1Screen%', marginTop: 10 },
  editButtonSmall: { paddingVertical: 10, paddingHorizontal: 30, borderRadius: 20, alignItems: 'center', justifyContent: 'center', minWidth: 100 },
  saveButton: { backgroundColor: COLORS.save },
  cancelButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.cancel },
  editButtonTextSmall: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  cancelButtonText: { color: COLORS.cancel },
  commentCard: { backgroundColor: COLORS.background, padding: 12, marginHorizontal: 16, marginBottom: 10, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  commentMovieHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  commentMoviePoster: { width: 30, height: 45, borderRadius: 4, marginRight: 8, backgroundColor: COLORS.card },
  commentMovieTitle: { color: COLORS.textSecondary, fontSize: 13, fontStyle: 'italic', flex: 1 },
  commentText: { color: COLORS.textPrimary, fontSize: 14, marginBottom: 4 },
  commentUpvotes: { color: COLORS.textSecondary, fontSize: 12, fontWeight: 'bold', marginTop: 4 },
  noItemsText: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', paddingHorizontal: 16, marginTop: 10, marginBottom: 10 },
  listContainer: { backgroundColor: COLORS.card, marginTop: 12, paddingVertical: 16 }, 
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary, marginLeft: 16, marginBottom: 12 },
  movieListContent: { paddingRight: 16 }, 
  movieCard: { width: 100, marginLeft: 16 },
  moviePoster: { width: 100, height: 150, borderRadius: 8, backgroundColor: COLORS.background },
  movieTitle: { fontSize: 13, color: COLORS.textPrimary, marginTop: 4, flexWrap: 'wrap' },
});

export default ProfilePage;