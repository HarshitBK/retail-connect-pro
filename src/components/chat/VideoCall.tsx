import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { PhoneOff, Mic, MicOff, Video, VideoOff, Maximize2, Minimize2 } from "lucide-react";

interface VideoCallProps {
  roomId: string;
  displayName: string;
  onEnd: () => void;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export function VideoCall({ roomId, displayName, onEnd }: VideoCallProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://meet.jit.si/external_api.js";
    script.async = true;
    script.onload = () => {
      if (!containerRef.current || apiRef.current) return;
      const api = new window.JitsiMeetExternalAPI("meet.jit.si", {
        roomName: `RetailConnect-${roomId}`,
        parentNode: containerRef.current,
        width: "100%",
        height: "100%",
        userInfo: { displayName },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          toolbarButtons: [],
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          TOOLBAR_BUTTONS: [],
          FILM_STRIP_MAX_HEIGHT: 120,
        },
      });
      api.addListener("readyToClose", onEnd);
      apiRef.current = api;
      setLoaded(true);
    };
    document.head.appendChild(script);

    return () => {
      apiRef.current?.dispose();
      apiRef.current = null;
      script.remove();
    };
  }, [roomId, displayName, onEnd]);

  const toggleMute = () => {
    apiRef.current?.executeCommand("toggleAudio");
    setMuted((p) => !p);
  };

  const toggleVideo = () => {
    apiRef.current?.executeCommand("toggleVideo");
    setVideoOff((p) => !p);
  };

  const toggleFullscreen = () => {
    if (!fullscreen) {
      containerRef.current?.parentElement?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setFullscreen((p) => !p);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col">
      <div ref={containerRef} className="flex-1 w-full" />

      {/* Controls overlay */}
      <div className="absolute bottom-0 inset-x-0 flex items-center justify-center gap-3 p-4 bg-gradient-to-t from-black/80 to-transparent">
        <Button
          variant="secondary"
          size="icon"
          onClick={toggleMute}
          className={`h-12 w-12 rounded-full ${muted ? "bg-destructive text-destructive-foreground" : "bg-muted/60 text-foreground"}`}
        >
          {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </Button>

        <Button
          variant="destructive"
          size="icon"
          onClick={onEnd}
          className="h-14 w-14 rounded-full shadow-lg"
        >
          <PhoneOff className="w-6 h-6" />
        </Button>

        <Button
          variant="secondary"
          size="icon"
          onClick={toggleVideo}
          className={`h-12 w-12 rounded-full ${videoOff ? "bg-destructive text-destructive-foreground" : "bg-muted/60 text-foreground"}`}
        >
          {videoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </Button>

        <Button
          variant="secondary"
          size="icon"
          onClick={toggleFullscreen}
          className="h-10 w-10 rounded-full bg-muted/40 text-foreground"
        >
          {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
