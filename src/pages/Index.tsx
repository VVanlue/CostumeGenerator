import { useState } from "react";
import { CostumeGenerator } from "@/components/CostumeGenerator";
import { CostumeResults } from "@/components/CostumeResults";
import { Ghost, Skull, Flame } from "lucide-react";

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

interface GeneratorProps {
  items: CostumeItem[];
  total: number;
  description: string;
  budget: number;
}

const Index = () => {
  const [generatedItems, setGeneratedItems] = useState<CostumeItem[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [originalDescription, setOriginalDescription] = useState("");
  const [originalBudget, setOriginalBudget] = useState(100);

  const handleCostumeGenerated = (items: CostumeItem[], total: number) => {
    setGeneratedItems(items);
    setTotalCost(total);
  };

  return (
    <div className="min-h-screen bg-gradient-spooky relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 text-primary/20 animate-pulse">
        <Ghost className="w-16 h-16" />
      </div>
      <div className="absolute bottom-20 right-10 text-secondary/20 animate-pulse delay-75">
        <Skull className="w-16 h-16" />
      </div>
      <div className="absolute top-1/2 right-1/4 text-accent/20 animate-pulse delay-150">
        <Flame className="w-12 h-12" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16 space-y-16">
        {/* Hero Section */}
        <header className="text-center space-y-6 animate-fade-in">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-foreground drop-shadow-2xl">
            <span className="bg-gradient-orange-glow bg-clip-text text-transparent">
              Spooktacular
            </span>
            <br />
            Costume Generator
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Describe your dream Halloween costume and we'll find every piece you need to bring it to life! 🎃
          </p>
        </header>

        {/* Generator */}
        {generatedItems.length === 0 ? (
          <CostumeGenerator 
            onCostumeGenerated={(items, total, desc, budget) => {
              setGeneratedItems(items);
              setTotalCost(total);
              setOriginalDescription(desc);
              setOriginalBudget(budget);
            }}
          />
        ) : (
          <CostumeResults 
            items={generatedItems}
            totalCost={totalCost}
            originalDescription={originalDescription}
            originalBudget={originalBudget}
            onRegenerate={handleCostumeGenerated}
            onNewCostume={() => {
              setGeneratedItems([]);
              setTotalCost(0);
            }}
          />
        )}

        {/* Footer info */}
        <footer className="text-center text-muted-foreground text-sm">
          <p>🔮 Powered by AI magic • Shop from trusted retailers</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
