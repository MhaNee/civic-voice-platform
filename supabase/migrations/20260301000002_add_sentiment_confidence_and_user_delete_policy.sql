-- Add sentiment confidence columns to comments and transcripts
ALTER TABLE public.comments
    ADD COLUMN sentiment_confidence NUMERIC DEFAULT NULL;

ALTER TABLE public.transcript_entries
    ADD COLUMN sentiment_confidence NUMERIC DEFAULT NULL;

-- Allow admins to delete any profile (user management)
CREATE POLICY "Admins can delete any profile" ON public.profiles FOR DELETE
USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'));
