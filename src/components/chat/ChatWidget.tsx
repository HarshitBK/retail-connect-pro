import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Send, Paperclip, Video, Smile, Loader2, File, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

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
                    { event: "INSERT", schema: "public", table: "chat_messages", filter: `room_id=eq.${roomId}` },
                    (payload) => {
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
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const sendMessage = async (content: string, attachmentUrl: string | null = null) => {
        if (!content.trim() && !attachmentUrl) return;
        try {
            setLoading(true);
            const { error } = await supabase.from("chat_messages").insert({
                room_id: roomId,
                sender_id: senderId,
                sender_name: senderName,
                content,
                attachment_url: attachmentUrl,
            });
            if (error) throw error;
            setInputMsg("");
        } catch (err) {
            console.error(err);
            toast({ title: "Failed to send message", variant: "destructive" });
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
        setUploading(true);
        try {
            const filePath = `chat/${roomId}/${Date.now()}_${file.name}`;
            const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file);
            if (uploadError) throw uploadError;
            const { data: urlData } = supabase.storage.from("documents").getPublicUrl(filePath);
            await sendMessage(`Attached: ${file.name}`, urlData.publicUrl);
            toast({ title: "File uploaded successfully!" });
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
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden flex flex-col h-[600px] border-border shadow-xl">
                <DialogHeader className="p-4 pb-2 border-b bg-muted/30">
                    <div className="flex justify-between items-start">
                        <div>
                            <DialogTitle className="flex items-center gap-2">
                                Chat with {recipientName}
                                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">Active</Badge>
                            </DialogTitle>
                            <DialogDescription className="text-xs flex items-center mt-1 text-yellow-600 font-medium">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                {warningMessage}
                            </DialogDescription>
                        </div>
                        <Button variant="outline" size="icon" onClick={startVideoCall} title="Start Video Call" className="h-8 w-8 rounded-full border-primary/20 text-primary hover:bg-primary/10">
                            <Video className="w-4 h-4" />
                        </Button>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                    <div className="space-y-4">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground pt-32">
                                <p className="text-sm">No messages yet.</p>
                                <p className="text-xs mt-1">Start the conversation!</p>
                            </div>
                        ) : (
                            messages.map((m) => {
                                const isMe = m.sender_id === senderId;
                                return (
                                    <div key={m.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                                        <span className="text-[10px] text-muted-foreground mb-1 ml-1">{isMe ? "You" : m.sender_name}</span>
                                        <div
                                            className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${isMe ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted text-foreground rounded-tl-sm"
                                                }`}
                                        >
                                            {m.content}
                                            {m.attachment_url && (
                                                <a href={m.attachment_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 mt-2 text-xs opacity-90 hover:opacity-100 bg-black/10 p-1.5 rounded-md">
                                                    <File className="w-3 h-3" />
                                                    <span className="truncate max-w-[120px]">View Attachment</span>
                                                    <Eye className="w-3 h-3 ml-auto" />
                                                </a>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-muted-foreground mt-1 mr-1">
                                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </ScrollArea>

                <div className="p-3 border-t bg-background flex flex-col gap-2">
                    <div className="flex gap-2 items-end">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground">
                                    <Smile className="w-5 h-5" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-2 grid grid-cols-4 gap-2" side="top" align="start">
                                {EMOJIS.map((e) => (
                                    <button key={e} onClick={() => handleEmojiSelect(e)} className="text-xl hover:bg-muted p-2 rounded-md transition-colors">
                                        {e}
                                    </button>
                                ))}
                            </PopoverContent>
                        </Popover>

                        <div className="relative shrink-0">
                            <input type="file" id="chat-attachment" className="hidden" onChange={handleFileUpload} />
                            <label htmlFor="chat-attachment">
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" asChild>
                                    <span>
                                        {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                                    </span>
                                </Button>
                            </label>
                        </div>

                        <Input
                            value={inputMsg}
                            onChange={(e) => setInputMsg(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your message..."
                            className="flex-1 rounded-full border-muted-foreground/30 focus-visible:ring-primary/50"
                        />

                        <Button
                            size="icon"
                            onClick={handleSend}
                            disabled={!inputMsg.trim() || loading}
                            className="h-10 w-10 shrink-0 rounded-full shadow-md"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
