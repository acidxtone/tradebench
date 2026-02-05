/**
 * Supabase API client — auth, questions, user progress, quiz attempts
 * Replaces the localClient.js with Supabase integration
 */

import { supabase } from '@/lib/supabase';

let questionsCache = null;
let studyGuidesCache = null;

async function loadQuestions() {
  if (questionsCache) return questionsCache;
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('year, section');
    
    if (error) {
      console.error('Error loading questions:', error);
      questionsCache = [];
    } else {
      questionsCache = data || [];
    }
  } catch (error) {
    console.error('Error loading questions:', error);
    questionsCache = [];
  }
  return questionsCache;
}

async function loadStudyGuides() {
  if (studyGuidesCache) return studyGuidesCache;
  try {
    const { data, error } = await supabase
      .from('study_guides')
      .select('*')
      .order('year, section');
    
    if (error) {
      console.error('Error loading study guides:', error);
      studyGuidesCache = [];
    } else {
      studyGuidesCache = data || [];
    }
  } catch (error) {
    console.error('Error loading study guides:', error);
    studyGuidesCache = [];
  }
  return studyGuidesCache;
}

const auth = {
  async me() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        throw new Error('User not authenticated');
      }

      // Get user profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
      }

      return {
        id: user.id,
        email: user.email,
        full_name: profile?.full_name || user.user_metadata?.full_name || 'User',
        selected_year: profile?.selected_year || null,
        role: profile?.role || 'user',
      };
    } catch (error) {
      console.error('Auth me error:', error);
      throw error;
    }
  },

  async updateMe({ selected_year }) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          selected_year,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }

      return {
        id: user.id,
        email: user.email,
        full_name: data.full_name || user.user_metadata?.full_name || 'User',
        selected_year: data.selected_year,
        role: data.role || 'user',
      };
    } catch (error) {
      console.error('Update me error:', error);
      throw error;
    }
  },

  async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        throw error;
      }
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  },

  async signUp(email, password, fullName) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  },

  redirectToLogin() {
    // This would typically redirect to a login page
    window.location.href = '/login';
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  }
};

const entities = {
  Question: {
    async filter({ year, section }) {
      try {
        console.log('supabaseClient.js - Question.filter called with:', { year, section, yearType: typeof year });
        let query = supabase.from('questions').select('*');
        
        if (year != null) {
          console.log('supabaseClient.js - Filtering by year:', year);
          query = query.eq('year', year);
        }
        if (section != null) {
          console.log('supabaseClient.js - Filtering by section:', section);
          query = query.eq('section', section);
        }
        
        const { data, error } = await query.order('year, section');
        
        if (error) {
          console.error('Error filtering questions:', error);
          return [];
        }
        
        console.log('supabaseClient.js - Questions returned:', data?.length || 0);
        return data || [];
      } catch (error) {
        console.error('Error filtering questions:', error);
        return [];
      }
    },
  },

  UserProgress: {
    async filter({ created_by }) {
      try {
        const { data: user } = await supabase.auth.getUser();
        
        if (!user.user || user.user.email !== created_by) {
          return [];
        }

        const { data, error } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', user.user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching user progress:', error);
          return [];
        }

        return data ? [data] : [];
      } catch (error) {
        console.error('Error filtering user progress:', error);
        return [];
      }
    },

    async create(payload) {
      try {
        const { data: user } = await supabase.auth.getUser();
        
        if (!user.user) {
          throw new Error('User not authenticated');
        }

        const { data, error } = await supabase
          .from('user_progress')
          .insert({
            user_id: user.user.id,
            ...payload
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating user progress:', error);
          throw error;
        }

        return data;
      } catch (error) {
        console.error('Error creating user progress:', error);
        throw error;
      }
    },

    async update(id, payload) {
      try {
        const { data: user } = await supabase.auth.getUser();
        
        if (!user.user) {
          throw new Error('User not authenticated');
        }

        const { data, error } = await supabase
          .from('user_progress')
          .update({
            ...payload,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('user_id', user.user.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating user progress:', error);
          throw error;
        }

        return data;
      } catch (error) {
        console.error('Error updating user progress:', error);
        throw error;
      }
    },

    async delete() {
      try {
        const { data: user } = await supabase.auth.getUser();
        
        if (!user.user) {
          throw new Error('User not authenticated');
        }

        const { error } = await supabase
          .from('user_progress')
          .delete()
          .eq('user_id', user.user.id);

        if (error) {
          console.error('Error deleting user progress:', error);
          throw error;
        }

        return true;
      } catch (error) {
        console.error('Error deleting user progress:', error);
        throw error;
      }
    },
  },

  QuizAttempt: {
    async filter({ user_id }) {
      try {
        const { data: user } = await supabase.auth.getUser();
        
        if (!user.user || user.user.id !== user_id) {
          return [];
        }

        const { data, error } = await supabase
          .from('quiz_attempts')
          .select('*')
          .eq('user_id', user_id)
          .order('completed_at', { ascending: false });

        if (error) {
          console.error('Error fetching quiz attempts:', error);
          return [];
        }

        return data || [];
      } catch (error) {
        console.error('Error filtering quiz attempts:', error);
        return [];
      }
    },

    async create(payload) {
      try {
        const { data: user } = await supabase.auth.getUser();
        
        if (!user.user) {
          throw new Error('User not authenticated');
        }

        const { data, error } = await supabase
          .from('quiz_attempts')
          .insert({
            user_id: user.user.id,
            ...payload
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating quiz attempt:', error);
          throw error;
        }

        return data;
      } catch (error) {
        console.error('Error creating quiz attempt:', error);
        throw error;
      }
    },
  },
};

const appLogs = {
  async logUserInApp() {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (user.user) {
        const { error } = await supabase
          .from('user_activity_logs')
          .insert({
            user_id: user.user.id,
            action: 'app_login',
            created_at: new Date().toISOString()
          });

        if (error) {
          console.error('Error logging user activity:', error);
        }
      }
    } catch (error) {
      console.error('Error logging user activity:', error);
    }
    
    return Promise.resolve();
  },
};

const studyGuides = {
  async getByYear(year) {
    try {
      const { data, error } = await supabase
        .from('study_guides')
        .select('*')
        .eq('year', year)
        .order('section');

      if (error) {
        console.error('Error fetching study guides by year:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching study guides by year:', error);
      return [];
    }
  },

  async getByYearAndSection(year, section) {
    try {
      const { data, error } = await supabase
        .from('study_guides')
        .select('*')
        .eq('year', year)
        .eq('section', section)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching study guide:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching study guide:', error);
      return null;
    }
  },
};

export const api = {
  auth,
  entities,
  appLogs,
  studyGuides,
};
