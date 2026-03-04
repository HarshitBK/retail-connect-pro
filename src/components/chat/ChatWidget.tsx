import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Paperclip, Video, Smile, Loader2, File, Eye, MoreVertical, Share2, CheckCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const EMOJIS = ["😀", "😂", "👍", "❤️", "🔥", "🎉", "💼", "🤝", "🙏", "✅", "💡", "🚀"];

interface ChatWidgetProps {
    isOpen: boolean;
    onClose: () => void;
    roomId: string;
    recipientName: string;
    senderId: string;
    senderName: string;
    warningMessage: string;
}

interface Message {
    id: string;
    room_id: string;
    sender_id: string;
    sender_name: string;
    content: string;
    attachment_url: string | null;
    created_at: string;
}

export function ChatWidget({ isOpen, onClose, roomId, recipientName, senderId, senderName, warningMessage }: ChatWidgetProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMsg, setInputMsg] = useState("");
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    const fetchMessages = async () => {
        if (!roomId) return;
        try {
            const { data, error } = await supabase
                .from("chat_messages")
                .select("*")
                .eq("room_id", roomId)
                .order("created_at", { ascending: true });
            if (error) throw error;
            if (data) setMessages(data as Message[]);
        } catch (err) {
            console.error("Error fetching messages:", err);
        }
    };

    useEffect(() => {
        if (isOpen && roomId) {
            fetchMessages();

            // Subscribe to realtime
            const channel = supabase
                .channel(`chat-${roomId}`)
                .on(
                    "postgres_changes",
                    {
                        event: "INSERT",
                        schema: "public",
                        table: "chat_messages",
                        filter: `room_id=eq.${roomId}`
                    },
                    (payload) => {
                        console.log("Realtime payload received:", payload);
                        const newMsg = payload.new as Message;
                        setMessages((prev) => {
                            if (prev.some(m => m.id === newMsg.id)) return prev;
                            return [...prev, newMsg];
                        });
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [isOpen, roomId]);

    useEffect(() => {
        if (scrollRef.current) {
            const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (viewport) {
                viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
            }
        }
    }, [messages]);

    const sendMessage = async (content: string, attachmentUrl: string | null = null) => {
        if (!content.trim() && !attachmentUrl) return;
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("chat_messages")
                .insert({
                    room_id: roomId,
                    sender_id: senderId,
                    sender_name: senderName,
                    content,
                    attachment_url: attachmentUrl,
                })
                .select()
                .single();

            if (error) throw error;

            if (data) {
                setMessages(prev => {
                    if (prev.some(m => m.id === data.id)) return prev;
                    return [...prev, data as Message];
                });
            }

            setInputMsg("");
        } catch (err: any) {
            console.error("Chat send error:", err);
            const errorMsg = err.message || (typeof err === 'object' ? JSON.stringify(err) : "Unknown error");
            toast({
                title: "Failed to send message",
                description: `Error: ${errorMsg}`,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };


    const handleSend = () => {
        sendMessage(inputMsg);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleEmojiSelect = (emoji: string) => {
        setInputMsg((prev) => prev + emoji);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast({ title: "File too large", description: "Limit is 5MB", variant: "destructive" });
            return;
        }

        setUploading(true);
        try {
            const filePath = `chat/${roomId}/${Date.now()}_${file.name}`;
            const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file);
            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from("documents").getPublicUrl(filePath);
            await sendMessage(`📎 Shared a file: ${file.name}`, urlData.publicUrl);
        } catch (err) {
            console.error(err);
            toast({ title: "Upload failed", variant: "destructive" });
        } finally {
            setUploading(false);
        }
    };

    const startVideoCall = () => {
        const meetUrl = `https://meet.jit.si/RetailConnect-${roomId}`;
        window.open(meetUrl, "_blank", "noopener,noreferrer");
        sendMessage(`🎬 Join my video call: ${meetUrl}`);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden flex flex-col h-[700px] border-none shadow-2xl bg-background rounded-3xl">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-accent/5 pointer-events-none" />

                <DialogHeader className="p-4 py-3 border-b bg-background/50 backdrop-blur-xl relative z-10 flex flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-primary/20 shadow-sm">
                            <AvatarFallback className="bg-primary/5 text-primary uppercase font-bold">
                                {recipientName.substring(0, 2)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <h3 className="text-sm font-bold flex items-center gap-2">
                                {recipientName}
                                <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            </h3>
                            <span className="text-[10px] text-muted-foreground">Active in room</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="secondary"
                            size="icon"
                            onClick={startVideoCall}
                            className="h-9 w-9 rounded-full shadow-sm hover:bg-primary hover:text-white transition-all"
                        >
                            <Video className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground">
                            <MoreVertical className="w-4 h-4" />
                        </Button>
                    </div>
                </DialogHeader>

                {warningMessage && (
                    <div className="bg-muted/30 px-4 py-1 flex items-center gap-2 text-[10px] text-muted-foreground border-b italic">
                        <Share2 className="w-3 h-3" /> {warningMessage}
                    </div>
                )}

                <ScrollArea className="flex-1 p-4 relative z-10" ref={scrollRef}>
                    <div className="space-y-4">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground pt-40 opacity-40 space-y-3">
                                <div className="p-5 bg-muted rounded-full">
                                    <Smile className="w-10 h-10" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-medium">No messages yet.</p>
                                    <p className="text-[10px]">Start your secure conversation now.</p>
                                </div>
                            </div>
                        ) : (
                            messages.map((m, idx) => {
                                const isMe = m.sender_id === senderId;
                                const prevMsg = messages[idx - 1];
                                const isGrouped = prevMsg && prevMsg.sender_id === m.sender_id;

                                return (
                                    <div
                                        key={m.id}
                                        className={`flex flex-col ${isMe ? "items-end" : "items-start"} ${isGrouped ? "mt-1" : "mt-4"}`}
                                    >
                                        {!isGrouped && !isMe && (
                                            <span className="text-[10px] font-bold text-muted-foreground mb-1 ml-2">
                                                {m.sender_name}
                                            </span>
                                        )}
                                        <div
                                            className={`max-w-[85%] rounded-[1.25rem] px-4 py-2.5 text-sm shadow-sm transition-all relative group ${isMe
                                                ? "bg-primary text-primary-foreground rounded-tr-sm"
                                                : "bg-muted/80 backdrop-blur-sm text-foreground rounded-tl-sm border border-border/50"
                                                }`}
                                        >
                                            {m.content}
                                            {m.attachment_url && (
                                                <a
                                                    href={m.attachment_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className={`flex items-center gap-3 mt-3 p-2.5 rounded-xl border transition-all ${isMe
                                                        ? 'bg-white/10 border-white/20 hover:bg-white/20'
                                                        : 'bg-background/50 border-input hover:border-primary/30'
                                                        }`}
                                                >
                                                    <div className={`p-2 rounded-lg ${isMe ? 'bg-white/10' : 'bg-muted'}`}>
                                                        <File className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex flex-col overflow-hidden">
                                                        <span className="text-[11px] font-bold truncate">File Attachment</span>
                                                        <span className="text-[9px] opacity-70">Click to preview</span>
                                                    </div>
                                                    <Eye className="w-4 h-4 ml-auto opacity-50" />
                                                </a>
                                            )}
                                            <div className={`absolute bottom-[-16px] ${isMe ? 'right-1' : 'left-1'} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1`}>
                                                <span className="text-[9px] text-muted-foreground">
                                                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {isMe && <CheckCheck className="w-3 h-3 text-primary" />}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </ScrollArea>

                <div className="p-4 border-t bg-background/60 backdrop-blur-md relative z-10">
                    <div className="flex gap-2 items-end">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 text-muted-foreground hover:text-primary transition-colors hover:bg-primary/10 rounded-xl">
                                    <Smile className="w-5 h-5" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-2 rounded-2xl shadow-2xl border-none bg-background/95 backdrop-blur-xl mb-4" side="top" align="start">
                                <div className="grid grid-cols-4 gap-2">
                                    {EMOJIS.map((e) => (
                                        <button
                                            key={e}
                                            onClick={() => handleEmojiSelect(e)}
                                            className="text-xl hover:bg-primary/10 p-2 rounded-xl transition-all hover:scale-110 active:scale-95"
                                        >
                                            {e}
                                        </button>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>

                        <div className="relative shrink-0">
                            <input type="file" id="chat-attachment" className="hidden" onChange={handleFileUpload} />
                            <label htmlFor="chat-attachment">
                                <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-primary transition-colors hover:bg-primary/10 rounded-xl" asChild>
                                    <span>
                                        {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                                    </span>
                                </Button>
                            </label>
                        </div>

                        <div className="flex-1 relative flex items-center">
                            <Input
                                value={inputMsg}
                                onChange={(e) => setInputMsg(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Message..."
                                className="h-11 pl-4 pr-12 rounded-2xl border-none bg-muted/50 focus-visible:ring-primary/20 shadow-inner overflow-hidden text-sm"
                            />
                            <Button
                                size="icon"
                                onClick={handleSend}
                                disabled={!inputMsg.trim() || loading}
                                className={`absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 shrink-0 rounded-xl shadow-lg transition-all ${!inputMsg.trim() ? "translate-x-2 opacity-0 bg-muted" : "translate-x-0 opacity-100 bg-primary"
                                    }`}
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
