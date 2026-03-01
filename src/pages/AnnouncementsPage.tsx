import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import useAppStore from "@/store/appStore";
import { useAuth } from "@/context/AuthContext";

const standards = ["Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const sections = ["A", "B", "C", "D", "E"];

const AnnouncementsPage = () => {
  const { toast } = useToast();
  const { schoolId } = useAuth();
  const addAnnouncement = useAppStore((state) => state.addAnnouncement);
  const fetchAnnouncements = useAppStore((state) => state.fetchAnnouncements);
  const [broadcastToAll, setBroadcastToAll] = useState(false);
  const [standard, setStandard] = useState("");
  const [section, setSection] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolId) {
      toast({
        title: "School identity missing",
        description: "Please logout and login again.",
        variant: "destructive",
      });
      return;
    }
    const type = broadcastToAll ? "all" : `${standard}-${section}`;
    await addAnnouncement({
      title: broadcastToAll ? "Broadcast" : `${standard}-${section}`,
      content: message,
      type,
      school_id: schoolId,
    });
    await fetchAnnouncements(schoolId);
    const description = broadcastToAll
      ? "Announcement has been sent to ALL Classes."
      : `Announcement has been sent to Standard ${standard}, Section ${section}.`;
    toast({ title: "Announcement Sent Successfully!", description });
    setBroadcastToAll(false);
    setStandard("");
    setSection("");
    setMessage("");
  };

  return (
    <div className="space-y-6 relative z-10 px-4 py-6">
      <h1 className="text-3xl font-bold text-foreground text-center">Announcement Bot</h1>
      <div className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-2xl p-8 max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center space-x-2 bg-black/40 border border-primary/20 p-4 rounded-lg">
            <Checkbox
              id="broadcast"
              checked={broadcastToAll}
              onCheckedChange={(v) => setBroadcastToAll(!!v)}
              className="border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
            />
            <label htmlFor="broadcast" className="text-sm font-medium leading-none text-foreground">
              Broadcast to ALL Classes
            </label>
          </div>
          <div
            className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${broadcastToAll ? "opacity-50 pointer-events-none" : ""}`}
          >
            <div>
              <label className="block text-xs font-medium text-foreground/80 mb-2">STANDARD</label>
              <select
                value={standard}
                onChange={(e) => setStandard(e.target.value)}
                required={!broadcastToAll}
                disabled={broadcastToAll}
                className="w-full px-4 py-3 bg-black/40 border border-primary/20 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">Select Standard</option>
                {standards.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground/80 mb-2">SECTION</label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                required={!broadcastToAll}
                disabled={broadcastToAll}
                className="w-full px-4 py-3 bg-black/40 border border-primary/20 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">Select Section</option>
                {sections.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground/80 mb-2">ANNOUNCEMENT MESSAGE</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={6}
              className="w-full px-4 py-3 bg-black/40 border border-primary/20 rounded-lg text-foreground placeholder:text-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
              placeholder="Type your announcement here..."
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-lg shadow-[0_0_20px_hsl(51,100%,50%,0.3)] hover:shadow-[0_0_30px_hsl(51,100%,50%,0.5)]"
          >
            <Send size={20} className="mr-2" /> Broadcast Announcement
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AnnouncementsPage;
