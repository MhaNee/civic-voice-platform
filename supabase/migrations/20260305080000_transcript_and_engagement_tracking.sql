
-- Transcript entries table for AI-generated transcripts
CREATE TABLE IF NOT EXISTS public.transcript_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hearing_id UUID NOT NULL REFERENCES public.hearings(id) ON DELETE CASCADE,
  speaker TEXT NOT NULL,
  role TEXT,
  timestamp TEXT NOT NULL,
  text TEXT NOT NULL,
  sentiment TEXT DEFAULT 'neutral' CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transcript_entries_hearing_id ON public.transcript_entries(hearing_id);

-- RLS for transcript entries
ALTER TABLE public.transcript_entries ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Transcripts viewable by all') THEN
    CREATE POLICY "Transcripts viewable by all" ON public.transcript_entries FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage transcripts') THEN
    CREATE POLICY "Admins can manage transcripts" ON public.transcript_entries 
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- Engagement Tracking: Watched Hearings
CREATE TABLE IF NOT EXISTS public.user_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hearing_id UUID NOT NULL REFERENCES public.hearings(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL DEFAULT 'watched',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, hearing_id, interaction_type)
);

-- RLS for user interactions
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own interactions') THEN
    CREATE POLICY "Users can view own interactions" ON public.user_interactions FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can track own interactions') THEN
    CREATE POLICY "Users can track own interactions" ON public.user_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all interactions') THEN
    CREATE POLICY "Admins can view all interactions" ON public.user_interactions 
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'));
  END IF;
END $$;
