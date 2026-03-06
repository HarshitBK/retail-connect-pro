import React, { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { VideoCall } from "./VideoCall";

interface CallSignal {
  id: string;
  room_id: string;
  caller_id: string;
  caller_name: string;
  callee_id: string;
  status: string;
}

// Oscillator-based ring tone
function createRingTone(ctx: AudioContext): OscillatorNode {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = 440;
  gain.gain.value = 0.3;
  // Pulsing ring
  const now = ctx.currentTime;
  for (let i = 0; i < 30; i++) {
    gain.gain.setValueAtTime(0.3, now + i * 1.2);
    gain.gain.setValueAtTime(0, now + i * 1.2 + 0.6);
  }
  osc.connect(gain).connect(ctx.destination);
  return osc;
}

export function IncomingCallRing() {
  const { user } = useAuth();
  const [incomingCall, setIncomingCall] = useState<CallSignal | null>(null);
  const [activeCall, setActiveCall] = useState<CallSignal | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);

  const stopRing = useCallback(() => {
    try {
      oscRef.current?.stop();
    } catch {}
    oscRef.current = null;
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
  }, []);

  const startRing = useCallback(() => {
    stopRing();
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    const osc = createRingTone(ctx);
    oscRef.current = osc;
    osc.start();
  }, [stopRing]);

  useEffect(() => {
    if (!user) return;

    // Fetch any existing ringing calls on mount
    const fetchRinging = async () => {
      const { data } = await supabase
        .from("call_signals")
        .select("*")
        .eq("callee_id", user.id)
        .eq("status", "ringing")
        .order("created_at", { ascending: false })
        .limit(1);
      if (data && data.length > 0) {
        setIncomingCall(data[0] as unknown as CallSignal);
      }
    };
    fetchRinging();

    const channel = supabase
      .channel("incoming-calls")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "call_signals",
          filter: `callee_id=eq.${user.id}`,
        },
        (payload) => {
          const sig = payload.new as unknown as CallSignal;
          if (sig.status === "ringing") {
            setIncomingCall(sig);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "call_signals",
          filter: `callee_id=eq.${user.id}`,
        },
        (payload) => {
          const sig = payload.new as unknown as CallSignal;
          if (sig.status !== "ringing") {
            setIncomingCall((prev) => (prev?.id === sig.id ? null : prev));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Play ring when incoming call appears
  useEffect(() => {
    if (incomingCall) {
      startRing();
    } else {
      stopRing();
    }
    return stopRing;
  }, [incomingCall, startRing, stopRing]);

  const acceptCall = async () => {
    if (!incomingCall) return;
    stopRing();
    await supabase
      .from("call_signals")
      .update({ status: "accepted" })
      .eq("id", incomingCall.id);
    setActiveCall(incomingCall);
    setIncomingCall(null);
  };

  const declineCall = async () => {
    if (!incomingCall) return;
    stopRing();
    await supabase
      .from("call_signals")
      .update({ status: "declined" })
      .eq("id", incomingCall.id);
    setIncomingCall(null);
  };

  const endCall = async () => {
    if (activeCall) {
      await supabase
        .from("call_signals")
        .update({ status: "ended", ended_at: new Date().toISOString() })
        .eq("id", activeCall.id);
    }
    setActiveCall(null);
  };

  if (activeCall) {
    return (
      <VideoCall
        roomId={activeCall.room_id}
        displayName={user?.email?.split("@")[0] || "User"}
        onEnd={endCall}
      />
    );
  }

  if (!incomingCall) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-background border border-border rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-6 max-w-sm w-full mx-4">
        <div className="relative">
          <Avatar className="h-20 w-20 border-4 border-primary/30 shadow-lg animate-pulse">
            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold uppercase">
              {incomingCall.caller_name.substring(0, 2)}
            </AvatarFallback>
          </Avatar>
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 rounded-full bg-green-500 border-2 border-background animate-ping" />
        </div>

        <div className="text-center space-y-1">
          <h3 className="text-lg font-bold">{incomingCall.caller_name}</h3>
          <p className="text-sm text-muted-foreground animate-pulse">Incoming video call...</p>
        </div>

        <div className="flex gap-6">
          <Button
            onClick={declineCall}
            variant="destructive"
            size="icon"
            className="h-14 w-14 rounded-full shadow-lg"
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
          <Button
            onClick={acceptCall}
            size="icon"
            className="h-14 w-14 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg"
          >
            <Phone className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
