import React from "react";
import { Button } from "@/components/ui/button";
import { Share2, MessageCircle, Linkedin, Twitter, Facebook, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SocialShareButtonsProps {
  userType: "employee" | "employer";
  referralCode?: string;
  className?: string;
}

const MESSAGES = {
  employee: {
    whatsapp: (url: string) =>
      `🛍️ I just registered on RetailHire - India's #1 retail job portal!\n\nI'm looking for exciting opportunities in the retail industry. If you're a job seeker too, use my referral link to register – we both earn bonus points!\n\n🔗 My referral link: ${url}\n\n✅ Free registration\n✅ Get certified & earn points\n✅ Connect with top retail brands\n\n#RetailHire #RetailJobs #JobSearch`,
    twitter: (url: string) =>
      `🛍️ Just registered on @RetailHire - India's #1 retail job portal! Use my link to sign up and we both earn points 👉 ${url}`,
    linkedin: (url: string) =>
      `I've registered on RetailHire - India's leading retail job portal! 🛍️ Use my referral link to join and we both earn bonus points.\n\n🔗 My referral link: ${url}\n\n#RetailHire #RetailJobs #Hiring #CareerGrowth`,
    facebook: (url: string) =>
      `🛍️ I just joined RetailHire - India's #1 retail hiring platform! Use my referral link to register and we both earn points:\n\n👉 ${url}`,
  },
  employer: {
    whatsapp: (url: string) =>
      `🎯 We're Hiring! Our company uses RetailHire to find the best retail talent in India. Share this referral link with job seekers – they get free registration and can take our skill tests!\n\n🔗 Referral link: ${url}\n\n✅ Free registration for job seekers\n✅ Skill tests & certifications\n✅ Get hired by top brands\n\n#NowHiring #RetailJobs #RetailHire`,
    twitter: (url: string) =>
      `🎯 We're hiring! Looking for skilled retail professionals through @RetailHire. Job seekers, use our link to register and take our skill tests! 👉 ${url} #NowHiring #RetailJobs`,
    linkedin: (url: string) =>
      `🎯 We're Hiring Through RetailHire!\n\nOur organization is looking for skilled retail professionals. Share this link with candidates to register:\n\n🔗 ${url}\n\n#NowHiring #RetailJobs #RetailHire #Careers`,
    facebook: (url: string) =>
      `🎯 We're Hiring! Share this link with retail job seekers – free registration and direct connection with our company:\n\n👉 ${url}`,
  },
};

const SocialShareButtons: React.FC<SocialShareButtonsProps> = ({
  userType,
  referralCode,
  className = "",
}) => {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);

  const baseUrl = window.location.origin;
  const shareUrl = referralCode
    ? `${baseUrl}/${userType === "employee" ? "employee" : "employer"}/register?ref=${referralCode}`
    : baseUrl;

  const messages = MESSAGES[userType];

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({ title: "Link Copied!", description: "Share link copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Failed to copy", description: "Please copy manually", variant: "destructive" });
    }
  };

  const handleWhatsAppShare = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(messages.whatsapp(shareUrl))}`, "_blank");
  };

  const handleTwitterShare = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(messages.twitter(shareUrl))}`, "_blank");
  };

  const handleLinkedInShare = () => {
    // LinkedIn sharing with pre-filled text via shareArticle
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&summary=${encodeURIComponent(messages.linkedin(shareUrl))}`;
    window.open(linkedInUrl, "_blank");
  };

  const handleFacebookShare = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(messages.facebook(shareUrl))}`, "_blank");
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
        <Button variant="outline" size="sm" onClick={handleWhatsAppShare}
          className="bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] border-[#25D366]/30">
          <MessageCircle className="w-4 h-4 mr-2" />WhatsApp
        </Button>
        <Button variant="outline" size="sm" onClick={handleTwitterShare}
          className="bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 text-[#1DA1F2] border-[#1DA1F2]/30">
          <Twitter className="w-4 h-4 mr-2" />Twitter
        </Button>
        <Button variant="outline" size="sm" onClick={handleLinkedInShare}
          className="bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 text-[#0A66C2] border-[#0A66C2]/30">
          <Linkedin className="w-4 h-4 mr-2" />LinkedIn
        </Button>
        <Button variant="outline" size="sm" onClick={handleFacebookShare}
          className="bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-[#1877F2] border-[#1877F2]/30">
          <Facebook className="w-4 h-4 mr-2" />Facebook
        </Button>
        <Button variant="outline" size="sm" onClick={handleCopyLink}>
          {copied ? (<><Check className="w-4 h-4 mr-2 text-success" />Copied!</>) : (<><Copy className="w-4 h-4 mr-2" />Copy Link</>)}
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
