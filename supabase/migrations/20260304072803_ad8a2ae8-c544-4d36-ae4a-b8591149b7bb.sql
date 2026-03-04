
-- Create chat_messages table for in-app messaging
CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id text NOT NULL,
  sender_id uuid NOT NULL,
  sender_name text NOT NULL,
  content text NOT NULL DEFAULT '',
  attachment_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for fast room lookups
CREATE INDEX idx_chat_messages_room_id ON public.chat_messages(room_id, created_at);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read messages in rooms they belong to (room_id contains their user_id)
CREATE POLICY "Users can view messages in their rooms"
ON public.chat_messages FOR SELECT
TO authenticated
USING (
  room_id LIKE '%' || auth.uid()::text || '%'
);

-- Authenticated users can send messages
CREATE POLICY "Users can send messages"
ON public.chat_messages FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
