import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface CostumeItem {
  itemId: string;
  category: string;
  name: string;
  brand: string;
  price: number;
  vendor: string;
  vendorTrusted: boolean;
  productLink: string;
  imageUrl: string;
}

interface CostumeGeneratorProps {
  onCostumeGenerated: (items: CostumeItem[], total: number, description: string, budget: number) => void;
}

export const CostumeGenerator = ({ onCostumeGenerated }: CostumeGeneratorProps) => {
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState([100]);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast.error("Please describe your costume idea");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-costume', {
        body: { 
          description: description.trim(),
          budget: budget[0]
        }
      });

      if (error) throw error;

      if (data?.items) {
        const total = data.items.reduce((sum: number, item: CostumeItem) => sum + item.price, 0);
        onCostumeGenerated(data.items, total, description, budget[0]);
        toast.success("Costume generated! Check out your items below");
      }
    } catch (error) {
      console.error('Error generating costume:', error);
      toast.error("Failed to generate costume. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-8 rounded-2xl bg-card border-2 border-primary/20 shadow-glow animate-fade-in">
      <div className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="description" className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Describe Your Costume
          </label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., A mystical wizard with flowing robes, a pointed hat, and a wooden staff..."
            className="min-h-32 bg-muted border-border text-foreground resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-lg font-semibold text-foreground">Budget</label>
            <span className="text-2xl font-bold text-primary">${budget[0]}</span>
          </div>
          <Slider
            value={budget}
            onValueChange={setBudget}
            min={20}
            max={300}
            step={10}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>$20</span>
            <span>$300</span>
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isLoading || !description.trim()}
          className="w-full h-14 text-lg font-semibold bg-gradient-orange-glow hover:shadow-glow transition-all duration-300"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Crafting Your Costume...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Generate Costume
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
