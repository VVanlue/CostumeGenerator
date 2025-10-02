import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, AlertTriangle, DollarSign, RefreshCw, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <Card 
            key={item.itemId}
            className="group relative overflow-hidden bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-glow"
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
            
            <div className="p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-foreground line-clamp-2 mb-1">{item.name}</h3>
                <p className="text-sm text-muted-foreground">{item.brand}</p>
                <p className="text-xs text-muted-foreground capitalize">{item.category}</p>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-primary">${item.price.toFixed(2)}</span>
                <a 
                  href={item.productLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:shadow-glow transition-all duration-300"
                >
                  Shop
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              
              {!item.vendorTrusted && (
                <p className="text-xs text-destructive flex items-start gap-1">
                  <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  This item is from an unverified site. Please check carefully before buying.
                </p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
