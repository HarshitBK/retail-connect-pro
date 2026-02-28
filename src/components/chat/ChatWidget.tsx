import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Send, Paperclip, Video, Smile, Loader2, File, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

const EMOJIS = ["😀", "😂", "👍", "❤️", "🔥", "🎉", "💼", "🤝", "🙏", "✅", "💡", "🚀"];

const BASE = import.meta.env.VITE_AI_API_URL || "http://127.0.0.1:3001";

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
    _id: string;
    roomId: string;
    senderId: string;
    senderName: string;
    content: string;
    attachmentUrl: string | null;
    createdAt: string;
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
            const res = await fetch(`${BASE}/api/chat/${roomId}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            }
        } catch (err) {
            console.error("Error fetching messages:", err);
        }
    };

    useEffect(() => {
        if (isOpen && roomId) {
            fetchMessages();
            const interval = setInterval(fetchMessages, 3000);
            return () => clearInterval(interval);
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
            const res = await fetch(`${BASE}/api/chat/send`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ roomId, senderId, senderName, content, attachmentUrl }),
            });
            if (res.ok) {
                const newMsg = await res.json();
                setMessages((prev) => [...prev, newMsg]);
                setInputMsg("");
            } else {
                toast({ title: "Failed to send message", variant: "destructive" });
            }
        } catch (err) {
            console.error(err);
            toast({ title: "Error", description: "Communication error", variant: "destructive" });
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

        // Simulating upload for now. In a real scenario, upload to Supabase Storage and get URL
        setUploading(true);
        setTimeout(() => {
            // Create a fake object URL for demonstration, usually you upload and get the public URL here
            const fakeUrl = URL.createObjectURL(file);
            sendMessage(`Attached a file: ${file.name}`, fakeUrl);
            setUploading(false);
            toast({ title: "File uploaded successfully!" });
        }, 1500);
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
                                <Badge variant="outline" className="bg-success/10 text-success border-success/20">Active</Badge>
                            </DialogTitle>
                            <DialogDescription className="text-xs flex items-center mt-1 text-warning font-medium">
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
                                const isMe = m.senderId === senderId;
                                return (
                                    <div key={m._id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                                        <span className="text-[10px] text-muted-foreground mb-1 ml-1">{isMe ? "You" : m.senderName}</span>
                                        <div
                                            className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${isMe ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted text-foreground rounded-tl-sm"
                                                }`}
                                        >
                                            {m.content}
                                            {m.attachmentUrl && (
                                                <a href={m.attachmentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 mt-2 text-xs opacity-90 hover:opacity-100 bg-black/10 p-1.5 rounded-md">
                                                    <File className="w-3 h-3" />
                                                    <span className="truncate max-w-[120px]">View Attachment</span>
                                                    <Eye className="w-3 h-3 ml-auto" />
                                                </a>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-muted-foreground mt-1 mr-1">
                                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
