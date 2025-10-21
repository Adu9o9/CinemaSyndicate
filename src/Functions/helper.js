// supabaseClient.js
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../pages/TabPages/lib/supabase';

// Helper function to get current user
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Helper function to sign out
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error signing out:', error);
    return { success: false, error };
  }
};

// Helper function to check if user is authenticated
export const isAuthenticated = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return !!session;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

// Helper function to reset password
export const resetPassword = async (email) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'your-app-scheme://reset-password',
    });
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error resetting password:', error);
    return { success: false, error: error.message };
  }
};

// Helper function to update user profile
export const updateUserProfile = async (updates) => {
  try {
    const { data, error } = await supabase.auth.updateUser(updates);
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { success: false, error: error.message };
  }
};