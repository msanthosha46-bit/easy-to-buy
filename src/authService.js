
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_ANON_KEY');

export const sendOTP = async (email) => {
  const { data, error } = await supabase.auth.signInWithOtp({
    email: email,
    options: {
      // Set this to false if you want the user to stay on the same page
      shouldCreateUser: true, 
    },
  });
  return { data, error };
};