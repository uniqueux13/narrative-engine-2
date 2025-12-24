import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProjects } from '../services/projectContext';
import { generateScriptForSlot } from '../services/geminiService';
import { manifestProject } from '../services/mockForge';
import CameraRecorder from '../components/CameraRecorder';
import { ChevronLeft, BrainCircuit, Wand2, ChevronRight, PlayCircle, Loader, ArrowRight, Download, Check, RotateCcw } from 'lucide-react';
import { ProjectStatus } from '../types';

const Studio: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { getProject, getRecipe, addClip, updateProjectStatus } = useProjects();
  
  const project = getProject(projectId || '');
  const recipe = project ? getRecipe(project.recipeId) : undefined;

  const [currentSlotIndex, setCurrentSlotIndex] = useState(0);
  const [aiScript, setAiScript] = useState<string | null>(null);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [showManifestSuccess, setShowManifestSuccess] = useState(false);
  
  // Playback state for the final result
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const videoPlayerRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!project) {
      navigate('/');
    }
  }, [project, navigate]);

  // Reset AI script when changing slots
  useEffect(() => {
    setAiScript(null);
  }, [currentSlotIndex]);

  // Autoplay sequence logic for the result view
  useEffect(() => {
    if ((showManifestSuccess || project?.status === ProjectStatus.COMPLETED) && videoPlayerRef.current) {
        videoPlayerRef.current.play().catch(e => console.log("Autoplay blocked", e));
    }
  }, [playbackIndex, showManifestSuccess, project?.status]);

  if (!project || !recipe) return null;

  const currentSlot = recipe.slots[currentSlotIndex];
  const isCompleted = project.status === ProjectStatus.COMPLETED;
  const isProcessing = project.status === ProjectStatus.UPLOADING || project.status === ProjectStatus.PROCESSING;

  // Derive sorted clips based on recipe order for the final playback
  const sortedClips = recipe.slots
    .map(slot => project.clips[slot.id])
    .filter(Boolean);

  const handleCapture = (blob: Blob) => {
    addClip(project.id, {
      slotId: currentSlot.id,
      blob,
      blobUrl: URL.createObjectURL(blob),
      timestamp: Date.now()
    });
  };

  const handleNext = () => {
    if (currentSlotIndex < recipe.slots.length - 1) {
      setCurrentSlotIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlotIndex > 0) {
      setCurrentSlotIndex(prev => prev - 1);
    }
  };

  const handleGenerateScript = async () => {
    setIsGeneratingScript(true);
    const script = await generateScriptForSlot(currentSlot.name, currentSlot.description, project.title);
    setAiScript(script);
    setIsGeneratingScript(false);
  };

  const handleManifest = async () => {
    if (!projectId) return;
    // Pass the actual clips to the forge
    await manifestProject(projectId, project.clips, (status, url) => {
      updateProjectStatus(projectId, status, url);
      if (status === ProjectStatus.COMPLETED) {
        setShowManifestSuccess(true);
        setPlaybackIndex(0); // Reset playback
      }
    });
  };

  const handleDownload = () => {
    if (sortedClips.length === 0) return;
    
    // In a real engine, we download the merged file. 
    // Here we download the first clip or the current playing clip as a demo.
    const clipToDownload = sortedClips[0]; 
    const a = document.createElement('a');
    a.href = clipToDownload.blobUrl;
    a.download = `Grimwire_${project.title.replace(/\s+/g, '_')}_Manifest.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const clip = project.clips[currentSlot.id];

  // If the project is already done, show the result view
  if (isCompleted || showManifestSuccess) {
    const currentPlaybackClip = sortedClips[playbackIndex];

    return (
      <div className="h-screen flex flex-col items-center justify-center p-6 bg-zinc-950 text-center">
        <div className="max-w-md w-full space-y-8">
           <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto ring-1 ring-emerald-500/50">
             <Check className="w-10 h-10 text-emerald-500" />
           </div>
           
           <div>
            <h1 className="text-3xl font-bold text-white mb-2">Manifestation Complete</h1>
            <p className="text-zinc-400">Your narrative has been forged.</p>
           </div>

           {/* Sequential Player */}
           {currentPlaybackClip && (
             <div className="relative aspect-[9/16] w-64 mx-auto bg-black rounded-xl overflow-hidden ring-1 ring-zinc-800 shadow-2xl">
                <video 
                  ref={videoPlayerRef}
                  src={currentPlaybackClip.blobUrl} 
                  controls={false}
                  className="w-full h-full object-cover" 
                  onEnded={() => {
                    if (playbackIndex < sortedClips.length - 1) {
                        setPlaybackIndex(prev => prev + 1);
                    } else {
                        // Loop back to start after a delay
                        setTimeout(() => setPlaybackIndex(0), 1000);
                    }
                  }}
                />
                <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded-md text-xs font-mono text-white/80 pointer-events-none">
                    CLIP {playbackIndex + 1}/{sortedClips.length}
                </div>
             </div>
           )}

           <div className="flex gap-4">
             <button 
                onClick={() => setPlaybackIndex(0)}
                className="flex-1 py-3 px-4 rounded-lg border border-zinc-700 text-zinc-300 font-medium hover:bg-zinc-900 flex items-center justify-center gap-2"
             >
               <RotateCcw className="w-4 h-4" /> Replay
             </button>
             <button 
                onClick={handleDownload}
                className="flex-1 py-3 px-4 rounded-lg bg-emerald-500 text-zinc-950 font-bold hover:bg-emerald-400 flex items-center justify-center gap-2"
             >
               <Download className="w-4 h-4" /> Download
             </button>
           </div>
           
           <Link to="/" className="block text-sm text-zinc-500 hover:text-white mt-4">
             Return to Dashboard
           </Link>
        </div>
      </div>
    );
  }

  // If processing
  if (isProcessing) {
    return (
      <div className="h-screen flex flex-col items-center justify-center space-y-6 bg-zinc-950">
        <Loader className="w-12 h-12 text-amber-500 animate-spin" />
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-1">The Forge is Active</h2>
          <p className="text-zinc-500 font-mono text-sm">Status: {project.status}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-1rem)] flex flex-col md:flex-row max-w-7xl mx-auto md:p-6 gap-6">
      
      {/* Sidebar / Topbar for Navigation */}
      <div className="md:w-80 flex-shrink-0 flex flex-col gap-6 p-4 md:p-0">
        <div className="flex items-center gap-2 mb-2">
          <Link to="/" className="p-2 hover:bg-zinc-900 rounded-full text-zinc-400 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div>
            <h2 className="font-bold text-zinc-200 leading-tight">{project.title}</h2>
            <p className="text-xs text-zinc-500">{recipe.name}</p>
          </div>
        </div>

        {/* Progress Stepper */}
        <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide">
          {recipe.slots.map((slot, idx) => {
            const hasClip = !!project.clips[slot.id];
            const isActive = idx === currentSlotIndex;
            
            return (
              <button 
                key={slot.id}
                onClick={() => setCurrentSlotIndex(idx)}
                className={`flex-shrink-0 md:w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                  isActive 
                    ? 'bg-zinc-800 border-amber-500 ring-1 ring-amber-500/20' 
                    : hasClip 
                      ? 'bg-zinc-900/30 border-emerald-900/30 hover:bg-zinc-900' 
                      : 'bg-zinc-900/30 border-zinc-800 hover:bg-zinc-900'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  hasClip 
                    ? 'bg-emerald-500 text-zinc-950' 
                    : isActive 
                      ? 'bg-amber-500 text-zinc-950' 
                      : 'bg-zinc-700 text-zinc-400'
                }`}>
                  {idx + 1}
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-medium truncate ${isActive ? 'text-white' : 'text-zinc-400'}`}>{slot.name}</p>
                  <p className="text-xs text-zinc-600 truncate">{slot.durationHint}</p>
                </div>
              </button>
            );
          })}
        </div>
        
        {/* Manifest Button (Desktop placement) */}
        <div className="hidden md:block mt-auto">
           <button
             disabled={Object.keys(project.clips).length !== recipe.slots.length}
             onClick={handleManifest}
             className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center gap-2"
           >
             <Wand2 className="w-5 h-5" />
             MANIFEST PROJECT
           </button>
           <p className="text-center text-xs text-zinc-600 mt-2">Requires {recipe.slots.length} clips</p>
        </div>
      </div>

      {/* Main Studio Area */}
      <div className="flex-1 flex flex-col bg-zinc-950 md:bg-zinc-900/50 md:rounded-3xl md:border border-zinc-800 overflow-hidden relative">
        
        {/* Slot Info Overlay */}
        <div className="absolute top-0 left-0 right-0 z-10 p-6 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
          <div className="flex justify-between items-start pointer-events-auto">
             <div>
               <h3 className="text-2xl font-bold text-white drop-shadow-md">{currentSlot.name}</h3>
               <p className="text-zinc-300 text-sm max-w-md drop-shadow-md mt-1">{currentSlot.description}</p>
             </div>
             
             {/* AI Script Assistant */}
             <div className="flex flex-col items-end gap-2">
               <button 
                 onClick={handleGenerateScript}
                 disabled={isGeneratingScript}
                 className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/50 rounded-full backdrop-blur-md text-xs font-bold text-indigo-300 transition-colors"
               >
                 <BrainCircuit className="w-3 h-3" />
                 {isGeneratingScript ? 'Thinking...' : 'AI Script'}
               </button>
             </div>
          </div>

          {/* AI Script Result Display */}
          {aiScript && (
            <div className="mt-4 p-4 bg-black/60 backdrop-blur-xl border-l-2 border-indigo-500 rounded-r-lg max-w-sm pointer-events-auto animate-in fade-in slide-in-from-top-2">
              <p className="text-white text-lg font-medium leading-snug">"{aiScript}"</p>
              <button onClick={() => setAiScript(null)} className="text-xs text-zinc-500 mt-2 hover:text-white">Dismiss</button>
            </div>
          )}
        </div>

        {/* Camera / Preview Area */}
        <div className="flex-1 relative bg-black">
          {clip ? (
            <div className="relative w-full h-full">
              <video 
                src={clip.blobUrl} 
                controls 
                className="w-full h-full object-contain"
              />
              <button 
                onClick={() => addClip(project.id, { ...clip, slotId: 'temp_remove' } as any)} // Hack to remove for UI demo
                className="absolute bottom-20 left-1/2 -translate-x-1/2 px-6 py-2 bg-zinc-800/80 backdrop-blur text-white rounded-full text-sm font-bold border border-white/10"
              >
                Retake Slot
              </button>
            </div>
          ) : (
            <CameraRecorder 
              isActive={true}
              aspectRatio={currentSlot.requiredAspectRatio || '9:16'}
              onCapture={handleCapture}
            />
          )}
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden p-4 bg-zinc-950 border-t border-zinc-800 flex justify-between items-center gap-4">
           <button 
             onClick={handlePrev} 
             disabled={currentSlotIndex === 0}
             className="p-3 rounded-full bg-zinc-900 text-zinc-400 disabled:opacity-30"
           >
             <ChevronLeft className="w-6 h-6" />
           </button>

           {Object.keys(project.clips).length === recipe.slots.length ? (
             <button 
               onClick={handleManifest}
               className="flex-1 py-3 bg-amber-500 rounded-lg text-zinc-950 font-bold flex items-center justify-center gap-2"
             >
               <Wand2 className="w-4 h-4" /> MANIFEST
             </button>
           ) : (
             <div className="text-center">
               <span className="text-xs font-mono text-zinc-500">{currentSlotIndex + 1} / {recipe.slots.length}</span>
             </div>
           )}

           <button 
             onClick={handleNext} 
             disabled={currentSlotIndex === recipe.slots.length - 1}
             className="p-3 rounded-full bg-zinc-900 text-zinc-400 disabled:opacity-30"
           >
             <ChevronRight className="w-6 h-6" />
           </button>
        </div>

      </div>
    </div>
  );
};

export default Studio;