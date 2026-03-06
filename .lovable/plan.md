

## In-App Video Calling with Ring Notifications

### Current State
The chat widget uses Jitsi Meet via external redirect (`window.open`) for video calls. There are no call notifications or ringing mechanics.

### Feasibility Assessment
**Building a fully in-app WebRTC video call** requires a signaling server and peer-to-peer connection management. Since this is a browser-only project (no custom backend server), the best approach is:

1. **Embed Jitsi Meet via iframe** inside the chat dialog instead of opening an external tab. Jitsi provides an embeddable iframe API that requires zero backend. This gives the "in-app" experience without needing a custom WebRTC signaling server.
2. **Call signaling for ring/notifications** will use the existing `notifications` table + realtime subscriptions to notify the other party.

### Plan

**1. Create a VideoCall component**
- New `src/components/chat/VideoCall.tsx`
- Embeds Jitsi Meet using their IFrame API (`https://meet.jit.si/external_api.js`)
- Renders inside a full-screen overlay or expanded dialog within the chat
- Room name derived from the existing `roomId`
- Includes hang-up button, mute/unmute controls via Jitsi API

**2. Add call signaling via database**
- Create a `call_signals` table with columns: `id`, `room_id`, `caller_id`, `caller_name`, `callee_id`, `status` (ringing/accepted/declined/ended), `created_at`
- Enable realtime on this table
- RLS: participants can read/update their own calls, authenticated users can insert

**3. Create an IncomingCall component**
- New `src/components/chat/IncomingCallRing.tsx`
- Subscribes to `call_signals` via realtime where `callee_id = current user` and `status = 'ringing'`
- Shows a ringing overlay with caller name, accept/decline buttons
- Plays a ring sound using `Audio` API (use a royalty-free ring tone bundled as a static asset or generated via oscillator)
- On accept: updates signal status to `accepted`, opens VideoCall component
- On decline: updates signal status to `declined`

**4. Update ChatWidget**
- Replace `startVideoCall()` external redirect with: insert a `call_signals` row (status: `ringing`), then show the embedded VideoCall component
- Add a "Calling..." state while waiting for the other party to accept
- Auto-timeout ringing after 30 seconds (set status to `ended`)

**5. Add chat/call notifications**
- When a new chat message arrives and the recipient is not in the chat room, insert a notification into the `notifications` table ("New message from {senderName}")
- When a call is initiated, insert a notification ("Incoming video call from {callerName}")
- Mount `IncomingCallRing` globally (in `App.tsx` or layout) so it works regardless of which page the user is on

**6. Database migration**
```sql
CREATE TABLE public.call_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id text NOT NULL,
  caller_id uuid NOT NULL,
  caller_name text NOT NULL,
  callee_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'ringing',
  created_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);

ALTER TABLE public.call_signals ENABLE ROW LEVEL SECURITY;

-- Participants can view their calls
CREATE POLICY "Users can view own calls" ON public.call_signals
  FOR SELECT TO authenticated
  USING (caller_id = auth.uid() OR callee_id = auth.uid());

-- Authenticated users can initiate calls
CREATE POLICY "Users can create calls" ON public.call_signals
  FOR INSERT TO authenticated
  WITH CHECK (caller_id = auth.uid());

-- Participants can update call status
CREATE POLICY "Users can update own calls" ON public.call_signals
  FOR UPDATE TO authenticated
  USING (caller_id = auth.uid() OR callee_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.call_signals;
```

### Technical Notes
- Jitsi IFrame API is free, no API key needed, and provides a fully embedded experience
- Ring sound will be a short oscillator-based tone (no external file needed)
- The callee_id will be resolved from the reservation/hired record linked to the room_id

