
-- Fix notifications INSERT to be properly scoped
DROP POLICY "Authenticated users can create notifications" ON public.notifications;
CREATE POLICY "Users can create notifications as actor" ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = actor_id);
