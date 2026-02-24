ALTER TABLE voice_profiles
  ADD CONSTRAINT voice_profiles_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(clerk_id) ON DELETE CASCADE;
