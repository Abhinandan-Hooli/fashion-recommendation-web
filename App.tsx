
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { products } from './data';
import { Product } from './types';
import { User, Sparkles, ShoppingBag, Loader2, ArrowRight, Tag } from 'lucide-react';

// --- Types for AI Response ---
interface RecommendationIds {
  top_id: string;
  bottom_id: string;
  footwear_id: string;
  accessory_id: string;
  style_tags: string[];
  color_palette: string[];
  reasoning: string;
  occasion_title: string;
}

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<RecommendationIds | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleStyleMe = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    setRecommendation(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Prepare the inventory context. 
      // To save tokens, we send a simplified version of the product catalog.
      const inventoryContext = products.map(p => 
        `ID: ${p.ProductID}, Name: ${p.ProductName}, Brand: ${p.ProductBrand}, Color: ${p.PrimaryColor}, Desc: ${p.Description}`
      ).join('\n');

      const prompt = `
        You are LuxeMatch, an elite high-fashion AI stylist. 
        
        The user needs an outfit for: "${query}".
        
        Select the best matching items from the provided INVENTORY list below to create a complete, stylish outfit.
        You MUST pick exactly one 'top' (shirt/t-shirt/kurta/dress), one 'bottom' (jeans/trousers/skirt/shorts/leggings), one 'footwear', and one 'accessory' (watch/bag/jewellery/belt) from the inventory.
        If the user selects a dress or jumpsuit (which covers both top and bottom), set the 'bottom_id' to "NONE" or select a complementary legging if appropriate.
        
        INVENTORY:
        ${inventoryContext}

        Return a JSON object. Do not include markdown code blocks.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              top_id: { type: Type.STRING, description: "ProductID of the selected top/dress" },
              bottom_id: { type: Type.STRING, description: "ProductID of the selected bottom (or 'NONE')" },
              footwear_id: { type: Type.STRING, description: "ProductID of the selected footwear" },
              accessory_id: { type: Type.STRING, description: "ProductID of the selected accessory" },
              style_tags: { type: Type.ARRAY, items: { type: Type.STRING } },
              color_palette: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Hex codes or color names" },
              reasoning: { type: Type.STRING, description: "Why this outfit works for the occasion" },
              occasion_title: { type: Type.STRING, description: "A catchy title for this look" }
            }
          }
        }
      });

      if (response.text) {
        const data = JSON.parse(response.text) as RecommendationIds;
        setRecommendation(data);
        
        // Scroll to results after a brief delay for rendering
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }

    } catch (err) {
      console.error(err);
      setError("Our stylists are currently busy (AI Error). Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Helper to find product object by ID
  const getProduct = (id: string): Product | undefined => {
    if (id === 'NONE') return undefined;
    return products.find(p => p.ProductID === id || p.ProductID === String(id));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-rose-200 selection:text-rose-900">
      
      {/* Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-white/40 bg-white/70 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-rose-500" />
            <h1 className="text-2xl font-serif font-bold tracking-tight text-slate-900">LuxeMatch<span className="text-rose-500">.</span></h1>
          </div>
          <div className="text-sm font-medium text-slate-500 hidden sm:block">
            AI Personal Styling Engine
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        
        {/* Hero / Input Section */}
        <section className="max-w-3xl mx-auto text-center space-y-8 mb-20">
          <h2 className="text-5xl font-serif leading-tight text-slate-900">
            What are you dressing for today?
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            From casual brunches to evening galas, describe your occasion and let our AI 
            curate the perfect look from our exclusive collection.
          </p>

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-rose-200 to-teal-200 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center bg-white rounded-xl shadow-xl p-2 border border-slate-100">
              <div className="pl-4 text-slate-400">
                <User className="w-5 h-5" />
              </div>
              <input 
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., A chic outfit for a summer garden party..."
                className="w-full px-4 py-4 bg-transparent border-none focus:ring-0 text-lg placeholder:text-slate-300"
                onKeyDown={(e) => e.key === 'Enter' && handleStyleMe()}
              />
              <button 
                onClick={handleStyleMe}
                disabled={loading || !query}
                className="bg-slate-900 text-white px-8 py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Style Me <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
          
          {error && (
            <div className="text-red-500 bg-red-50 px-4 py-2 rounded-lg inline-block">
              {error}
            </div>
          )}
        </section>

        {/* Results Section */}
        {recommendation && (
          <div ref={resultRef} className="animate-fade-in-up space-y-12">
            
            <div className="text-center space-y-4">
              <span className="inline-block px-3 py-1 rounded-full bg-rose-100 text-rose-600 text-xs font-bold tracking-wider uppercase">
                Your Curated Look
              </span>
              <h3 className="text-4xl font-serif">{recommendation.occasion_title}</h3>
              <div className="flex justify-center flex-wrap gap-2 mt-4">
                {recommendation.style_tags.map((tag, i) => (
                  <span key={i} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-sm text-slate-600 flex items-center gap-1">
                    <Tag className="w-3 h-3" /> {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* The Outfit Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <ProductCard product={getProduct(recommendation.top_id)} category="Top" />
              <ProductCard product={getProduct(recommendation.bottom_id)} category="Bottom" />
              <ProductCard product={getProduct(recommendation.footwear_id)} category="Footwear" />
              <ProductCard product={getProduct(recommendation.accessory_id)} category="Accessory" />
            </div>

            {/* Reasoning & Palette */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <h4 className="text-xl font-serif mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" /> Stylist's Note
                </h4>
                <p className="text-slate-600 text-lg leading-relaxed italic">
                  "{recommendation.reasoning}"
                </p>
              </div>
              
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
                <h4 className="text-sm font-bold uppercase text-slate-400 tracking-wider mb-4">Color Palette</h4>
                <div className="flex gap-4">
                  {recommendation.color_palette.map((color, i) => (
                    <div key={i} className="group relative">
                      <div 
                        className="w-16 h-16 rounded-full shadow-md ring-2 ring-offset-2 ring-slate-50"
                        style={{ backgroundColor: color.toLowerCase().includes('gold') ? '#FFD700' : color }}
                      ></div>
                      <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 text-xs font-medium text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        {color}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}
      </main>
      
      <footer className="bg-white border-t border-slate-100 py-12 mt-20">
        <div className="max-w-6xl mx-auto px-6 text-center text-slate-400">
          <p className="font-serif text-lg text-slate-900 mb-2">LuxeMatch.</p>
          <p>Powered by Google Gemini • Fashion dataset included</p>
        </div>
      </footer>
    </div>
  );
}

// --- Sub-components ---

const ProductCard = ({ product, category }: { product: Product | undefined, category: string }) => {
  if (!product) {
    return (
      <div className="h-full min-h-[300px] bg-slate-100 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 flex-col gap-2 p-6 text-center">
        <ShoppingBag className="w-8 h-8 opacity-50" />
        <span className="text-sm font-medium">No {category} selected</span>
      </div>
    );
  }

  return (
    <div className="group bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100 flex flex-col h-full">
      <div className="aspect-[3/4] bg-slate-200 relative overflow-hidden">
        {/* Placeholder for image since CSV doesn't contain actual URLs usually, or if it does, we'd use it. 
            The provided dataset has 'NumImages' but no URL. We'll use a stylish placeholder. */}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400">
             <span className="font-serif text-4xl opacity-20">{category}</span>
        </div>
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
      </div>
      
      <div className="p-5 flex flex-col flex-grow">
        <div className="text-xs font-bold text-rose-500 uppercase tracking-wide mb-1">
          {product.ProductBrand}
        </div>
        <h3 className="font-serif text-lg leading-snug text-slate-900 mb-2 line-clamp-2">
          {product.ProductName}
        </h3>
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50">
          <span className="text-slate-500 text-sm">{product.PrimaryColor}</span>
          <span className="text-lg font-bold text-slate-900">₹{product.Price}</span>
        </div>
      </div>
    </div>
  );
};

export default App;
