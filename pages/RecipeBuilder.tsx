import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../services/projectContext';
import { Slot, Recipe } from '../types';
import { ArrowLeft, Save, GripVertical, Trash2, ArrowUp, ArrowDown, Plus, Sparkles, AlertTriangle, Captions } from 'lucide-react';

// The "Glyph" Library - Available Building Blocks
const SLOT_TEMPLATES = [
  {
    type: 'hook',
    name: 'The Hook',
    description: 'A 3-second visual or statement to stop the scroll.',
    durationHint: '3s',
    aspect: '9:16' as const,
    color: 'bg-amber-500',
    icon: Sparkles,
    defaultSubtitles: true
  },
  {
    type: 'talking_head',
    name: 'Talking Head',
    description: 'Direct-to-camera explanation or story.',
    durationHint: '10s',
    aspect: '9:16' as const,
    color: 'bg-blue-500',
    icon: Plus,
    defaultSubtitles: true
  },
  {
    type: 'b_roll',
    name: 'Visual / B-Roll',
    description: 'Show, don\'t tell. Footage of the subject.',
    durationHint: '5s',
    aspect: '9:16' as const,
    color: 'bg-emerald-500',
    icon: Plus,
    defaultSubtitles: false
  },
  {
    type: 'cta',
    name: 'Call To Action',
    description: 'Tell them exactly what to do next.',
    durationHint: '5s',
    aspect: '9:16' as const,
    color: 'bg-red-500',
    icon: AlertTriangle,
    defaultSubtitles: true
  }
];

const RecipeBuilder: React.FC = () => {
  const navigate = useNavigate();
  const { saveCustomRecipe } = useProjects();

  const [recipeName, setRecipeName] = useState('');
  const [recipeDesc, setRecipeDesc] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  // Add a block from the library to the stack
  const addSlot = (template: typeof SLOT_TEMPLATES[0]) => {
    const newSlot: Slot = {
      id: crypto.randomUUID(),
      name: template.name,
      description: template.description,
      durationHint: template.durationHint,
      requiredAspectRatio: template.aspect,
      hasSubtitles: template.defaultSubtitles
    };
    setSlots([...slots, newSlot]);
    setSelectedSlotId(newSlot.id);
  };

  const updateSlot = (id: string, updates: Partial<Slot>) => {
    setSlots(slots.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const removeSlot = (id: string) => {
    setSlots(slots.filter(s => s.id !== id));
    if (selectedSlotId === id) setSelectedSlotId(null);
  };

  const moveSlot = (index: number, direction: 'up' | 'down') => {
    const newSlots = [...slots];
    if (direction === 'up' && index > 0) {
      [newSlots[index], newSlots[index - 1]] = [newSlots[index - 1], newSlots[index]];
    } else if (direction === 'down' && index < newSlots.length - 1) {
      [newSlots[index], newSlots[index + 1]] = [newSlots[index + 1], newSlots[index]];
    }
    setSlots(newSlots);
  };

  const handleSave = () => {
    if (!recipeName.trim() || slots.length === 0) return;

    const newRecipe: Recipe = {
      id: crypto.randomUUID(),
      name: recipeName,
      description: recipeDesc || 'Custom structural recipe',
      slots: slots
    };

    saveCustomRecipe(newRecipe);
    navigate('/');
  };

  const selectedSlot = slots.find(s => s.id === selectedSlotId);

  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <input 
              type="text" 
              placeholder="Recipe Name (e.g. The Viral Hook)" 
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
              className="bg-transparent text-lg font-bold placeholder-zinc-600 focus:outline-none focus:ring-0 text-white"
            />
          </div>
        </div>
        <button 
          onClick={handleSave}
          disabled={!recipeName || slots.length === 0}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:hover:bg-amber-500 text-zinc-950 px-4 py-2 rounded-lg font-bold transition-colors"
        >
          <Save className="w-4 h-4" />
          Save Recipe
        </button>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left: Component Library */}
        <div className="w-64 border-r border-zinc-800 bg-zinc-900/50 p-4 flex flex-col gap-4 overflow-y-auto">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Components</h3>
          <div className="space-y-2">
            {SLOT_TEMPLATES.map((template, idx) => (
              <button
                key={idx}
                onClick={() => addSlot(template)}
                className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-700 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-md ${template.color} bg-opacity-20 flex items-center justify-center text-${template.color.replace('bg-', '')}`}>
                    <template.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-zinc-200">{template.name}</div>
                    <div className="text-xs text-zinc-500">{template.durationHint}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          <div className="mt-auto p-4 bg-zinc-900 rounded-lg border border-zinc-800">
             <h4 className="text-xs font-bold text-zinc-400 mb-2">Pro Tip</h4>
             <p className="text-xs text-zinc-500">
               Start with a Hook to grab attention, follow with Value, and end with an Ask.
             </p>
          </div>
        </div>

        {/* Center: The Ritual Board (Canvas) */}
        <div className="flex-1 bg-zinc-950 p-8 overflow-y-auto flex flex-col items-center">
          <div className="max-w-md w-full">
            <h3 className="text-center text-xs font-bold text-zinc-600 uppercase tracking-wider mb-6">Narrative Stack</h3>
            
            <div className="space-y-1 relative min-h-[400px]">
              {slots.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 rounded-xl">
                  <p className="text-zinc-600 font-medium">Drag blocks here...</p>
                  <p className="text-zinc-700 text-sm">(Click on left sidebar items)</p>
                </div>
              )}

              {slots.map((slot, index) => {
                const isSelected = selectedSlotId === slot.id;
                return (
                  <div key={slot.id} className="group relative">
                    {/* Visual Connector Line */}
                    {index > 0 && (
                       <div className="h-4 w-0.5 bg-zinc-800 mx-auto" />
                    )}
                    
                    <div 
                      onClick={() => setSelectedSlotId(slot.id)}
                      className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-zinc-800 border-amber-500 shadow-lg shadow-amber-900/20' 
                          : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center text-zinc-500 font-mono text-xs">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-bold text-zinc-200 flex items-center gap-2">
                                {slot.name}
                                {slot.hasSubtitles && <Captions className="w-3 h-3 text-amber-500" />}
                            </div>
                            <div className="text-xs text-zinc-500 truncate max-w-[150px]">{slot.durationHint}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => { e.stopPropagation(); moveSlot(index, 'up'); }}
                            disabled={index === 0}
                            className="p-1 hover:bg-zinc-700 rounded text-zinc-400 disabled:opacity-30"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); moveSlot(index, 'down'); }}
                            disabled={index === slots.length - 1}
                            className="p-1 hover:bg-zinc-700 rounded text-zinc-400 disabled:opacity-30"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Energy Graph (Simplified Visual) */}
            {slots.length > 0 && (
                <div className="mt-12 pt-6 border-t border-zinc-800">
                    <div className="flex items-center gap-2 mb-2">
                         <span className="text-xs font-bold text-zinc-500 uppercase">Pacing Curve</span>
                    </div>
                    <div className="h-12 flex items-end gap-1">
                        {slots.map((_, i) => (
                            <div 
                                key={i} 
                                className="flex-1 bg-zinc-800 rounded-t-sm transition-all hover:bg-amber-500/50"
                                style={{ height: `${30 + (Math.random() * 70)}%` }} // Randomized for visual effect in prototype
                            />
                        ))}
                    </div>
                </div>
            )}
          </div>
        </div>

        {/* Right: The Tuning Fork (Inspector) */}
        <div className="w-80 border-l border-zinc-800 bg-zinc-900/50 p-6 overflow-y-auto">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-6">Tuning Fork</h3>
          
          {selectedSlot ? (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-200">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase">Label</label>
                <input 
                  type="text" 
                  value={selectedSlot.name}
                  onChange={(e) => updateSlot(selectedSlot.id, { name: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase">Prompt / Instructions</label>
                <textarea 
                  value={selectedSlot.description}
                  onChange={(e) => updateSlot(selectedSlot.id, { description: e.target.value })}
                  rows={4}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase">Settings</label>
                <div 
                    onClick={() => updateSlot(selectedSlot.id, { hasSubtitles: !selectedSlot.hasSubtitles })}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedSlot.hasSubtitles 
                        ? 'bg-amber-500/10 border-amber-500/50' 
                        : 'bg-zinc-950 border-zinc-700 hover:bg-zinc-900'
                    }`}
                >
                    <div className="flex items-center gap-2">
                    <Captions className={`w-4 h-4 ${selectedSlot.hasSubtitles ? 'text-amber-500' : 'text-zinc-500'}`} />
                    <span className={`text-sm font-medium ${selectedSlot.hasSubtitles ? 'text-amber-500' : 'text-zinc-400'}`}>
                        {selectedSlot.hasSubtitles ? 'Subtitles On' : 'Subtitles Off'}
                    </span>
                    </div>
                    <div className={`w-10 h-5 rounded-full relative transition-colors ${selectedSlot.hasSubtitles ? 'bg-amber-500' : 'bg-zinc-700'}`}>
                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${selectedSlot.hasSubtitles ? 'left-6' : 'left-1'}`} />
                    </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase">Duration</label>
                    <input 
                    type="text" 
                    value={selectedSlot.durationHint}
                    onChange={(e) => updateSlot(selectedSlot.id, { durationHint: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 text-white"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase">Aspect</label>
                    <select 
                        value={selectedSlot.requiredAspectRatio || '9:16'}
                        onChange={(e) => updateSlot(selectedSlot.id, { requiredAspectRatio: e.target.value as any })}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 text-white"
                    >
                        <option value="9:16">9:16 (Story)</option>
                        <option value="16:9">16:9 (Cinema)</option>
                    </select>
                </div>
              </div>
              
              <div className="pt-6 mt-6 border-t border-zinc-800">
                <button 
                  onClick={() => removeSlot(selectedSlot.id)}
                  className="w-full py-2 flex items-center justify-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove Block
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-zinc-600">
              <GripVertical className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-sm">Select a block in the stack to tune its properties.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default RecipeBuilder;