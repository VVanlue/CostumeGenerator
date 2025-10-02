import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, AlertTriangle, DollarSign, RefreshCw, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CostumeItem {
  itemId: string;
  category: "top" | "bottom" | "footwear" | "accessory" | string;
  name: string;
  brand: string;
  price: number;
  vendor: string;
  vendorTrusted: boolean;
  productLink: string;
  imageUrl: string;
}

interface CostumeResultsProps {
  items: CostumeItem[];
  totalCost: number;
  originalDescription: string;
  originalBudget: number;
  onRegenerate: (items: CostumeItem[], total: number) => void;
  onNewCostume: () => void;
}

export const CostumeResults = ({ 
  items, 
  totalCost, 
  originalDescription, 
  originalBudget,
  onRegenerate,
  onNewCostume
}: CostumeResultsProps) => {
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerate = async (type: 'cheaper' | 'better') => {
    setIsRegenerating(true);
    try {
      const newBudget = type === 'cheaper' 
        ? Math.max(20, originalBudget * 0.7) 
        : Math.min(300, originalBudget * 1.3);

      const { data, error } = await supabase.functions.invoke('generate-costume', {
        body: { 
          description: originalDescription,
          budget: newBudget,
          quality: type
        }
      });

      if (error) throw error;

      if (data?.items) {
        const total = data.items.reduce((sum: number, item: CostumeItem) => sum + item.price, 0);
        onRegenerate(data.items, total);
        toast.success(`Regenerated with ${type === 'cheaper' ? 'cheaper' : 'better quality'} items!`);
      }
    } catch (error) {
      console.error('Error regenerating:', error);
      toast.error("Failed to regenerate. Please try again.");
    } finally {
      setIsRegenerating(false);
    }
  };

  // Organize items by category for spatial layout
  const topItems = items.filter(item => item.category === 'top');
  const bottomItems = items.filter(item => item.category === 'bottom');
  const footwearItems = items.filter(item => item.category === 'footwear');
  const accessoryItems = items.filter(item => item.category === 'accessory');

  const ItemCard = ({ item }: { item: CostumeItem }) => (
    <a
      href={item.productLink}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block bg-card border-2 border-border hover:border-primary/50 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-glow"
    >
      <div className="aspect-square relative overflow-hidden bg-muted">
        <img 
          src={item.imageUrl} 
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        {!item.vendorTrusted && (
          <div className="absolute top-2 right-2 bg-destructive/90 text-destructive-foreground px-2 py-1 rounded-md text-xs flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Unverified
          </div>
        )}
      </div>
      
      <div className="p-3 space-y-2">
        <div>
          <h3 className="font-semibold text-foreground text-sm line-clamp-1">{item.name}</h3>
          <p className="text-xs text-muted-foreground">{item.brand}</p>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-primary">${item.price.toFixed(2)}</span>
          <ExternalLink className="w-4 h-4 text-primary" />
        </div>
        
        {!item.vendorTrusted && (
          <p className="text-xs text-destructive flex items-start gap-1">
            <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
            Unverified site
          </p>
        )}
      </div>
    </a>
  );

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 bg-card rounded-xl border-2 border-primary/20">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Your Costume</h2>
          <p className="text-muted-foreground">Total: <span className="text-2xl font-bold text-primary">${totalCost.toFixed(2)}</span></p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={onNewCostume}
            variant="secondary"
            className="border-secondary/50"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Costume
          </Button>
          <Button 
            onClick={() => handleRegenerate('cheaper')}
            disabled={isRegenerating}
            variant="outline"
            className="border-primary/50 hover:bg-primary/10"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Cheaper
          </Button>
          <Button 
            onClick={() => handleRegenerate('better')}
            disabled={isRegenerating}
            variant="outline"
            className="border-secondary/50 hover:bg-secondary/10"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Better Quality
          </Button>
        </div>
      </div>

      {/* Spatial Layout: How items would be worn */}
      <div className="max-w-4xl mx-auto">
        {/* Accessories (top row) - hats, headwear */}
        {accessoryItems.length > 0 && (
          <div className="flex justify-center gap-4 mb-6">
            {accessoryItems.map((item) => (
              <div key={item.itemId} className="w-48">
                <ItemCard item={item} />
              </div>
            ))}
          </div>
        )}

        {/* Top wear */}
        {topItems.length > 0 && (
          <div className="flex justify-center gap-4 mb-6">
            {topItems.map((item) => (
              <div key={item.itemId} className="w-64">
                <ItemCard item={item} />
              </div>
            ))}
          </div>
        )}

        {/* Bottom wear */}
        {bottomItems.length > 0 && (
          <div className="flex justify-center gap-4 mb-6">
            {bottomItems.map((item) => (
              <div key={item.itemId} className="w-64">
                <ItemCard item={item} />
              </div>
            ))}
          </div>
        )}

        {/* Footwear */}
        {footwearItems.length > 0 && (
          <div className="flex justify-center gap-4">
            {footwearItems.map((item) => (
              <div key={item.itemId} className="w-48">
                <ItemCard item={item} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
