import React from "react";
import { Button } from "@/components/ui/button";
import { Share2, MessageCircle, Linkedin, Twitter, Facebook, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SHARE_MESSAGES } from "@/lib/constants";

interface SocialShareButtonsProps {
  userType: "employee" | "employer";
  referralCode?: string;
  className?: string;
}

const SocialShareButtons: React.FC<SocialShareButtonsProps> = ({
  userType,
  referralCode,
  className = "",
}) => {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);

  const messages = SHARE_MESSAGES[userType];
  const baseUrl = window.location.origin;
  const shareUrl = referralCode
    ? `${baseUrl}/${userType === "employee" ? "employee" : "employer"}/register?ref=${referralCode}`
    : baseUrl;

  const fullMessage = `${messages.text}\n\nRegister now: ${shareUrl}\n\n${messages.hashtags.map((h) => `#${h}`).join(" ")}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link Copied!",
        description: "Share link has been copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  };

  const handleWhatsAppShare = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(fullMessage)}`;
    window.open(url, "_blank");
  };

  const handleTwitterShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(messages.text)}&url=${encodeURIComponent(shareUrl)}&hashtags=${messages.hashtags.join(",")}`;
    window.open(url, "_blank");
  };

  const handleLinkedInShare = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank");
  };

  const handleFacebookShare = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(messages.text)}`;
    window.open(url, "_blank");
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 text-sm font-medium">
        <Share2 className="w-4 h-4" />
        Share & Earn Points
      </div>

      <p className="text-sm text-muted-foreground">
        {userType === "employee"
          ? "Share your profile and earn 15 points for every successful referral!"
          : "Share that you're hiring and attract more candidates!"}
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleWhatsAppShare}
          className="bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] border-[#25D366]/30"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          WhatsApp
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleTwitterShare}
          className="bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 text-[#1DA1F2] border-[#1DA1F2]/30"
        >
          <Twitter className="w-4 h-4 mr-2" />
          Twitter
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleLinkedInShare}
          className="bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 text-[#0A66C2] border-[#0A66C2]/30"
        >
          <Linkedin className="w-4 h-4 mr-2" />
          LinkedIn
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleFacebookShare}
          className="bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-[#1877F2] border-[#1877F2]/30"
        >
          <Facebook className="w-4 h-4 mr-2" />
          Facebook
        </Button>

        <Button variant="outline" size="sm" onClick={handleCopyLink}>
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2 text-success" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy Link
            </>
          )}
        </Button>
      </div>

      {referralCode && (
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Your Referral Code</p>
          <p className="font-mono font-bold text-lg text-primary">{referralCode}</p>
        </div>
      )}
    </div>
  );
};

export default SocialShareButtons;
