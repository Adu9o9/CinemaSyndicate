// CommentSection.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { supabase } from '../pages/TabPages/lib/supabase';
import { useSelector } from 'react-redux';
// CONFIG
const PAGE_SIZE = 8; // top-level comments per page
const MAX_REPLIES_PRELOAD = 3; // show first N replies initially

// --- Helpers: Supabase + API calls ---
// Get current user (returns { id, email, ... } or null)
async function getCurrentUser() {
  try {
    const { data } = await supabase.auth.getUser();
    return data?.user ?? null;
  } catch (e) {
    return null;
  }
}

// Fetch top-level comments (parent_comment_id IS NULL) with pagination, include profile
export async function fetchTopLevelComments(movieId, limit = 10, offset = 0) {
  if (!movieId) return [];

  // Step 1: get post_id for this movie
  const { data: posts, error: postErr } = await supabase
    .from('community_posts')
    .select('post_id')
    .eq('movie_id', movieId)
    .single();

  if (postErr || !posts) {
    console.error('No post found for movie:', postErr);
    return [];
  }

  const postId = posts.post_id;

  // Step 2: fetch comments for this post_id
  const { data, error } = await supabase
    .from('community_comments')
    .select(`
      comment_id,
      post_id,
      user_id,
      parent_comment_id,
      comment_text,
      comment_date,
      upvotes,
      downvotes,
      profiles (
        user_id,
        username,
        profile_picture_url
      )
    `)
    .eq('post_id', postId)
    .or('parent_comment_id.is.null')
    .order('comment_date', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching top-level comments:', error);
    return [];
  }

  return data;
}


// Fetch direct replies for a parent comment (optionally limit)
async function fetchReplies(parentCommentId, limit = null) {
  let query = supabase
    .from('community_comments')
    .select(`
      comment_id,
      post_id,
      user_id,
      parent_comment_id,
      comment_text,
      comment_date,
      upvotes,
      downvotes,
      profiles (
        user_id,
        username,
        profile_picture_url
      )
    `)
    .eq('parent_comment_id', parentCommentId)
    .order('comment_date', { ascending: true });

  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// Insert a comment (top-level or reply)
// CommentSection.jsx — replace postComment implementation with this
async function postComment({ movieId, parentCommentId = null, text, userId }) {
    console.error("USER:",userId)
  if (!userId) throw new Error('User ID not found');

  const { data, error } = await supabase
    .rpc('create_comment_for_movie', {
      _movie_id: movieId,
      _user_id: userId,
      _comment_text: text,
      _parent_comment_id: parentCommentId
    });

  if (error) throw error;
  return data[0]; // because RPC returns an array of rows
}




// Upvote or downvote comment: we'll implement single-button toggles and optimistic update on client
async function voteComment({ commentId, deltaUp = 0, deltaDown = 0 }) {
  // fetch current counts first
  const { data: current, error: fetchErr } = await supabase
    .from('community_comments')
    .select('upvotes,downvotes')
    .eq('comment_id', commentId)
    .single();
  if (fetchErr) throw fetchErr;

  // update counts
  const { data, error } = await supabase
    .from('community_comments')
    .update({
      upvotes: (current.upvotes ?? 0) + deltaUp,
      downvotes: (current.downvotes ?? 0) + deltaDown,
    })
    .eq('comment_id', commentId)
    .select('upvotes,downvotes')
    .single();

  if (error) throw error;
  return data;
}



// Soft-delete comment: replace text with '[deleted]' and set is_deleted flag if available
async function softDeleteComment(commentId) {
  // attempt to update comment_text to '[deleted]' and set is_deleted true if column exists
  const { data, error } = await supabase
    .from('community_comments')
    .update({ comment_text: '[deleted]' })
    .eq('comment_id', commentId)
    .select('comment_id, comment_text')
    .single();

  if (error) throw error;
  return data;
}

// Edit comment
async function editComment(commentId, newText) {
  const { data, error } = await supabase
    .from('community_comments')
    .update({ comment_text: newText, edited_at: new Date().toISOString() })
    .eq('comment_id', commentId)
    .select('comment_id, comment_text, edited_at')
    .single();

  if (error) throw error;
  return data;
}

// --- UI components ---
const CommentItem = ({
  item,
  onReplyPress,
  onToggleReplies,
  expanded,
  repliesPreview,
  onUpvote,
  onDownvote,
  onEdit,
  onDelete,
  isMyComment,
}) => {
  return (
    <View style={styles.commentCard}>
      <View style={styles.commentHeader}>
        <View>
          <Text style={styles.username}>{item.profiles?.username ?? item.profiles?.[0]?.username ?? 'User'}</Text>
          <Text style={styles.commentDate}>{new Date(item.comment_date).toLocaleString()}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => onUpvote(item.comment_id)} style={styles.voteBtn}>
            <Icon name="arrow-up" size={18} color="#fff" />
            <Text style={styles.voteCount}>{item.upvotes ?? 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDownvote(item.comment_id)} style={styles.voteBtn}>
            <Icon name="arrow-down" size={18} color="#fff" />
            <Text style={styles.voteCount}>{item.downvotes ?? 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onReplyPress(item)} style={styles.actionBtn}>
            <Icon name="reply" size={18} color="#fff" />
          </TouchableOpacity>
          {isMyComment && (
            <>
              <TouchableOpacity onPress={() => onEdit(item)} style={styles.actionBtn}>
                <Icon name="pencil" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onDelete(item)} style={styles.actionBtn}>
                <Icon name="delete" size={18} color="#fff" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <Text style={styles.commentText}>{item.comment_text}</Text>

      {/* Replies preview */}
      {repliesPreview?.length > 0 && (
        <View style={styles.repliesPreview}>
          {repliesPreview.map(rep => (
            <View key={rep.comment_id} style={styles.replyPreviewItem}>
              <Text style={styles.replyUsername}>{rep.profiles?.username ?? 'User'}</Text>
              <Text style={styles.replyText} numberOfLines={1}>{rep.comment_text}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Show/Hide replies toggle */}
      <View style={styles.repliesToggleRow}>
        <TouchableOpacity onPress={() => onToggleReplies(item.comment_id)}>
          <Text style={styles.viewRepliesText}>{expanded ? 'Hide replies' : `View replies (${item.children_count ?? '…'})`}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function CommentSection({ movieId }) {

    const user = useSelector(state => state.auth.user);
    const userName = useSelector(state => state.auth.name);
  const userId = user?.id;
  console.warn(userId) 
  const [topComments, setTopComments] = useState([]);
  const [page, setPage] = useState(0);
  const [loadingTop, setLoadingTop] = useState(false);
  const [moreAvailable, setMoreAvailable] = useState(true);
  const [replyState, setReplyState] = useState({
    // commentId -> { expanded: bool, loading: bool, replies: [] }
  });
  const [posting, setPosting] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [editing, setEditing] = useState({ commentId: null, text: '' });

  // Initial load
  useEffect(() => {
    loadTopLevel();
  }, [movieId]);

  const loadTopLevel = useCallback(async () => {
    if (!movieId) return;
    setLoadingTop(true);
    try {
      const offset = page * PAGE_SIZE;
      const data = await fetchTopLevelComments(movieId, PAGE_SIZE, offset);
      if (!data || data.length === 0) {
        setMoreAvailable(false);
      } else {
        // attempt to fetch a small preview of replies (first N) for each top-level comment
        const enhanced = await Promise.all(data.map(async c => {
          try {
            const preview = await fetchReplies(c.comment_id, MAX_REPLIES_PRELOAD);
            return {
              ...c,
              replies_preview: preview,
            };
          } catch (e) {
            return { ...c, replies_preview: [] };
          }
        }));
        setTopComments(prev => (page === 0 ? enhanced : [...prev, ...enhanced]));
        setPage(prev => prev + 1);
      }
    } catch (e) {
      console.error('loadTopLevel error', e);
      Alert.alert('Error', e.message || 'Failed to load comments');
    } finally {
      setLoadingTop(false);
    }
  }, [movieId, page]);

  // Load replies for a single comment (toggle)
  const toggleReplies = useCallback(async (commentId) => {
    setReplyState(prev => {
      const existing = prev[commentId];
      return { ...prev, [commentId]: { ...(existing || {}), expanded: !existing?.expanded } };
    });

    // if not loaded, load them
    if (!replyState[commentId] || !replyState[commentId].replies) {
      setReplyState(prev => ({ ...prev, [commentId]: { ...(prev[commentId] || {}), loading: true } }));
      try {
        const replies = await fetchReplies(commentId, null);
        setReplyState(prev => ({ ...prev, [commentId]: { ...(prev[commentId] || {}), loading: false, replies, expanded: true } }));
      } catch (e) {
        console.error('fetchReplies failed', e);
        setReplyState(prev => ({ ...prev, [commentId]: { ...(prev[commentId] || {}), loading: false, replies: [] } }));
      }
    }
  }, [replyState]);

  // Post top-level or reply
 const handlePost = async (parentId = null) => {
  if (!newCommentText?.trim()) return;
  if (!userId) {
    Alert.alert('Error', 'User not logged in');
    return;
  }

  setPosting(true);
  try {
    const created = await postComment({ 
      movieId, 
      parentCommentId: parentId, 
      text: newCommentText.trim(),
      userId 
    });

    // attach current user's profile info immediately
    const commentWithProfile = {
    ...created,
    profiles: [{
        user_id: user.id,
        username: userName,
        profile_picture_url: user.profile_picture_url ?? null,
    }],
    replies_preview: [],
    };
    console.log("userName:",userName)


    if (parentId == null) {
    setTopComments(prev => [commentWithProfile, ...prev]);
    } else {
    setReplyState(prev => {
        const p = prev[parentId] || { replies: [], expanded: true };
        return { ...prev, [parentId]: { ...p, replies: [ ...(p.replies||[]), commentWithProfile ], expanded: true } };
    });
}
    setNewCommentText('');
  } catch (e) {
    console.error('postComment', e);
    Alert.alert('Error', e.message || 'Failed to post comment');
  } finally {
    setPosting(false);
  }
};


  const handleReplyPress = (parent) => {
    // scroll to composer and set parent id into editing object or a reply target
    // For simplicity: open a prompt-like composer (we'll reuse newCommentText and set replyTarget)
    setReplyState(prev => ({ ...prev, __replyTarget: parent.comment_id }));
    // ensure replies are expanded and loaded
    toggleReplies(parent.comment_id);
  };

  // Vote handlers (simple incremental toggles)
  const handleUpvote = async (commentId) => {
    try {
      // optimistic UI: update local state
      setTopComments(prev => prev.map(c => c.comment_id === commentId ? { ...c, upvotes: (c.upvotes ?? 0) + 1 } : c));
      setReplyState(prev => {
        const newState = { ...prev };
        if (newState[commentId]) newState[commentId].replies = newState[commentId].replies?.map(r => r.comment_id === commentId ? { ...r, upvotes: (r.upvotes ?? 0) + 1 } : r) || newState[commentId].replies;
        return newState;
      });
      await voteComment({ commentId, deltaUp: 1, deltaDown: 0 });
    } catch (e) {
      console.error(e);
      Alert.alert('Error', e.message || 'Vote failed');
    }
  };

  const handleDownvote = async (commentId) => {
    try {
      setTopComments(prev => prev.map(c => c.comment_id === commentId ? { ...c, downvotes: (c.downvotes ?? 0) + 1 } : c));
      await voteComment({ commentId, deltaUp: 0, deltaDown: 1 });
    } catch (e) {
      console.error(e);
      Alert.alert('Error', e.message || 'Vote failed');
    }
  };

  const handleDelete = async (item) => {
    Alert.alert('Delete comment', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await softDeleteComment(item.comment_id);
            // update local
            setTopComments(prev => prev.map(c => c.comment_id === item.comment_id ? { ...c, comment_text: '[deleted]' } : c));
            setReplyState(prev => {
              const copy = { ...prev };
              Object.keys(copy).forEach(k => {
                copy[k] = { ...(copy[k] || {}), replies: (copy[k].replies || []).map(r => r.comment_id === item.comment_id ? { ...r, comment_text: '[deleted]' } : r) };
              });
              return copy;
            });
          } catch (e) {
            console.error(e);
            Alert.alert('Error', e.message || 'Delete failed');
          }
      } }
    ]);
  };

  const handleEdit = async (item) => {
    // open inline edit (simple prompt-like behavior using editing state)
    setEditing({ commentId: item.comment_id, text: item.comment_text });
  };

  const submitEdit = async () => {
    if (!editing.commentId) return;
    try {
      const updated = await editComment(editing.commentId, editing.text);
      // update local
      setTopComments(prev => prev.map(c => c.comment_id === editing.commentId ? { ...c, comment_text: updated.comment_text } : c));
      setReplyState(prev => {
        const copy = { ...prev };
        Object.keys(copy).forEach(k => {
          copy[k] = { ...(copy[k] || {}), replies: (copy[k].replies || []).map(r => r.comment_id === editing.commentId ? { ...r, comment_text: updated.comment_text } : r) };
        });
        return copy;
      });
      setEditing({ commentId: null, text: ''});
    } catch (e) {
      console.error(e);
      Alert.alert('Error', e.message || 'Edit failed');
    }
  };

  // render each top-level comment with its replies (if expanded)
  const renderTopComment = ({ item }) => {
    const replyMeta = replyState[item.comment_id] || {};
    return (
      <View>
        <CommentItem
          item={{ ...item, children_count: item.children_count ?? (item.replies_preview?.length ?? 0) }}
          onReplyPress={handleReplyPress}
          onToggleReplies={() => toggleReplies(item.comment_id)}
          expanded={replyMeta.expanded}
          repliesPreview={item.replies_preview}
          onUpvote={handleUpvote}
          onDownvote={handleDownvote}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isMyComment={false /* optional: compare user id to mark editable */}
        />

        {/* Replies list (when expanded) */}
        {replyMeta.expanded && (
          <View style={styles.repliesContainer}>
            {replyMeta.loading ? (
              <ActivityIndicator size="small" />
            ) : (
              (replyMeta.replies || []).map(rep => (
                <View key={rep.comment_id} style={styles.replyCard}>
                  <View style={styles.commentHeader}>
                    <View>
                      <Text style={styles.username}>{rep.profiles?.username ?? 'User'}</Text>
                      <Text style={styles.commentDate}>{new Date(rep.comment_date).toLocaleString()}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <TouchableOpacity onPress={() => handleUpvote(rep.comment_id)} style={styles.voteBtn}>
                        <Icon name="arrow-up" size={16} color="#fff" />
                        <Text style={styles.voteCount}>{rep.upvotes ?? 0}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.commentText}>{rep.comment_text}</Text>
                </View>
              ))
            )}
          </View>
        )}
      </View>
    );
  };

  // composer bottom area (new comment / reply)
  const replyTarget = replyState.__replyTarget ?? null;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Discussion</Text>

      {/* Composer */}
      <View style={styles.composer}>
        {replyTarget && <Text style={styles.replyingTo}>Replying to comment #{replyTarget} — tap again to cancel</Text>}
        <TextInput
          placeholder={replyTarget ? 'Write a reply...' : 'Add a comment...'}
          placeholderTextColor="#9AA"
          style={styles.input}
          value={editing.commentId ? editing.text : newCommentText}
          onChangeText={text => editing.commentId ? setEditing(prev => ({...prev, text})) : setNewCommentText(text)}
          multiline
        />

        <View style={styles.composerRow}>
          {editing.commentId ? (
            <>
              <TouchableOpacity style={styles.postBtn} onPress={submitEdit}>
                <Text style={styles.postBtnText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing({ commentId: null, text: '' })}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.postBtn} onPress={() => handlePost(replyTarget)}>
              {posting ? <ActivityIndicator color="#000" /> : <Text style={styles.postBtnText}>Post</Text>}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Top-level comments list */}
      <FlatList
        data={topComments}
        keyExtractor={(item) => item.comment_id.toString()}
        renderItem={renderTopComment}
        onEndReached={() => { if (!loadingTop && moreAvailable) loadTopLevel(); }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() => loadingTop ? <ActivityIndicator style={{ margin: 12 }} /> : null}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 15, marginTop: 10 },
  header: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  composer: { backgroundColor: '#1B2024', borderRadius: 8, padding: 10, marginBottom: 12 },
  input: { minHeight: 48, color: '#fff', padding: 8, borderRadius: 6, backgroundColor: '#111315' },
  composerRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
  postBtn: { backgroundColor: '#00E054', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16 },
  postBtnText: { color: '#000', fontWeight: '700' },
  cancelBtn: { marginLeft: 10, paddingHorizontal: 12, paddingVertical: 8 },
  cancelBtnText: { color: '#fff' },

  commentCard: { backgroundColor: '#111318', padding: 12, borderRadius: 8, marginBottom: 8 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  username: { color: '#fff', fontWeight: '700' },
  commentDate: { color: '#9AA', fontSize: 11 },
  commentText: { color: '#ddd', lineHeight: 18 },
  voteBtn: { alignItems: 'center', marginHorizontal: 6 },
  voteCount: { color: '#fff', fontSize: 12 },

  actionBtn: { marginLeft: 8, padding: 6 },

  repliesContainer: { marginLeft: 14, marginTop: 8, marginBottom: 6 },
  replyCard: { backgroundColor: '#0F1316', padding: 8, borderRadius: 6, marginBottom: 6 },

  repliesPreview: { marginTop: 8, paddingLeft: 6 },
  replyPreviewItem: { flexDirection: 'row', paddingVertical: 2 },
  replyUsername: { color: '#fff', marginRight: 6, fontWeight: '700', fontSize: 12 },
  replyText: { color: '#9AA', fontSize: 12 },

  repliesToggleRow: { marginTop: 8 },
  viewRepliesText: { color: '#9AB', fontSize: 13 },

  replyingTo: { color: '#9AB', marginBottom: 6 },
});
