import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProjects } from '../services/projectContext';
import { generateScriptForSlot } from '../services/geminiService';
import { manifestProject } from '../services/mockForge';
import CameraRecorder from '../components/CameraRecorder';
import { ChevronLeft, BrainCircuit, Wand2, ChevronRight, PlayCircle, Loader, ArrowRight, Download, Check, RotateCcw, Captions, Edit3, Save } from 'lucide-react';
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
  
  // Transcript Editing
  const [localTranscript, setLocalTranscript] = useState('');
  
  // Playback state for the final result
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const videoPlayerRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!project) {
      navigate('/');
    }
  }, [project, navigate]);

  // Reset AI script and sync transcript when changing slots
  useEffect(() => {
    setAiScript(null);
    if (project && recipe) {
        const slot = recipe.slots[currentSlotIndex];
        const clip = project.clips[slot.id];
        setLocalTranscript(clip?.transcript || '');
    }
  }, [currentSlotIndex, project?.clips]);

  // Autoplay sequence logic for the result view
  useEffect(() => {
    if ((showManifestSuccess || project?.status === ProjectStatus.COMPLETED) && videoPlayerRef.current) {
        // Small delay to ensure DOM is ready and transition feels natural
        setTimeout(() => {
            videoPlayerRef.current?.play().catch(e => console.log("Autoplay blocked", e));
        }, 500);
    }
  }, [playbackIndex, showManifestSuccess, project?.status]);

  if (!project || !recipe) return null;

  const currentSlot = recipe.slots[currentSlotIndex];
  const isCompleted = project.status === ProjectStatus.COMPLETED;
  const isProcessing = project.status === ProjectStatus.UPLOADING || project.status === ProjectStatus.PROCESSING;

  // Create a structured sequence for playback that pairs Slots with their Clips
  const playbackSequence = recipe.slots
    .filter(slot => project.clips[slot.id])
    .map(slot => ({
      slot,
      clip: project.clips[slot.id]
    }));

  const saveTranscript = () => {
     if (project && project.clips[currentSlot.id]) {
         const currentClip = project.clips[currentSlot.id];
         if (currentClip.transcript !== localTranscript) {
             addClip(project.id, {
                 ...currentClip,
                 transcript: localTranscript
             });
         }
     }
  };

  const handleCapture = (blob: Blob, transcript: string) => {
    addClip(project.id, {
      slotId: currentSlot.id,
      blob,
      blobUrl: URL.createObjectURL(blob),
      timestamp: Date.now(),
      transcript
    });
    setLocalTranscript(transcript);
  };

  const handleNext = () => {
    saveTranscript();
    if (currentSlotIndex < recipe.slots.length - 1) {
      setCurrentSlotIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    saveTranscript();
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
    saveTranscript();
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
    if (playbackSequence.length === 0) return;
    
    // In a real engine, we download the merged file. 
    // Here we download the current playback clip (or the first one) to prove the pipeline works.
    const itemToDownload = playbackSequence[playbackIndex] || playbackSequence[0]; 
    const a = document.createElement('a');
    a.href = itemToDownload.clip.blobUrl;
    a.download = `Grimwire_${project.title.replace(/\s+/g, '_')}_${itemToDownload.slot.name}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const clip = project.clips[currentSlot.id];

  // If the project is already done, show the result view
  if (isCompleted || showManifestSuccess) {
    const currentItem = playbackSequence[playbackIndex];

    return (
      <div className="h-screen flex flex-col items-center justify-center p-6 bg-zinc-950 text-center">
        <div className="max-w-md w-full space-y-8">
           <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto ring-1 ring-emerald-500/50 animate-in zoom-in duration-300">
             <Check className="w-10 h-10 text-emerald-500" />
           </div>
           
           <div>
            <h1 className="text-3xl font-bold text-white mb-2">Manifestation Complete</h1>
            <p className="text-zinc-400">Your narrative has been forged.</p>
           </div>

           {/* Sequential Player */}
           {currentItem && (
             <div className="relative aspect-[9/16] w-64 mx-auto bg-black rounded-xl overflow-hidden ring-1 ring-zinc-800 shadow-2xl group">
                <video 
                  ref={videoPlayerRef}
                  src={currentItem.clip.blobUrl} 
                  controls={false}
                  className="w-full h-full object-cover" 
                  muted={false}
                  playsInline
                  onEnded={() => {
                    if (playbackIndex < playbackSequence.length - 1) {
                        setPlaybackIndex(prev => prev + 1);
                    } else {
                        // Loop back to start after a delay
                        setTimeout(() => setPlaybackIndex(0), 1000);
                    }
                  }}
                />
                
                {/* Subtitle Overlay */}
                {currentItem.slot.hasSubtitles && (
                  <div className="absolute bottom-12 left-2 right-2 flex flex-col items-center pointer-events-none transition-opacity duration-300">
                    <span className="inline-block px-3 py-2 bg-black/70 backdrop-blur-sm rounded-lg text-white font-bold text-sm text-center shadow-xl border border-white/10 animate-in slide-in-from-bottom-2 fade-in">
                      {/* Use actual transcript if available, fallback to description */}
                      {currentItem.clip.transcript || currentItem.slot.description}
                    </span>
                  </div>
                )}

                {/* Progress Indicators */}
                <div className="absolute top-2 left-2 right-2 flex gap-1 z-20">
                  {playbackSequence.map((_, idx) => (
                    <div 
                      key={idx} 
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        idx === playbackIndex ? 'bg-white' : idx < playbackIndex ? 'bg-white/50' : 'bg-white/10'
                      }`} 
                    />
                  ))}
                </div>
                
                {/* Info Pills */}
                <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded-md text-[10px] font-mono text-white/80 pointer-events-none backdrop-blur-md z-20 flex items-center gap-2">
                    {currentItem.slot.hasSubtitles && <Captions className="w-3 h-3 text-amber-400" />}
                    <span>{playbackIndex + 1}/{playbackSequence.length}</span>
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
                className="flex-1 py-3 px-4 rounded-lg bg-emerald-500 text-zinc-950 font-bold hover:bg-emerald-400 flex items-center justify-center gap-2 transition-transform hover:scale-105"
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
                onClick={() => {
                    saveTranscript();
                    setCurrentSlotIndex(idx);
                }}
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
                  <div className="flex items-center gap-2">
                     <p className={`text-sm font-medium truncate ${isActive ? 'text-white' : 'text-zinc-400'}`}>{slot.name}</p>
                     {slot.hasSubtitles && <Captions className="w-3 h-3 text-zinc-600" />}
                  </div>
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
        
        {/* Slot Info Overlay - Only show if NO clip is recorded yet, or if reviewing and not editing */}
        {!clip && (
          <div className="absolute top-0 left-0 right-0 z-10 p-6 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
            <div className="flex justify-between items-start pointer-events-auto">
               <div>
                 <div className="flex items-center gap-3">
                   <h3 className="text-2xl font-bold text-white drop-shadow-md">{currentSlot.name}</h3>
                   {currentSlot.hasSubtitles && (
                     <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/50 text-amber-500 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">
                       Subtitles On
                     </span>
                   )}
                 </div>
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
        )}

        {/* Camera / Preview Area */}
        <div className={`flex-1 relative bg-black ${clip && currentSlot.hasSubtitles ? 'basis-3/5' : ''}`}>
          {clip ? (
            <div className="relative w-full h-full group">
              <video 
                src={clip.blobUrl} 
                controls 
                className="w-full h-full object-contain"
              />
              {/* Retake button moved to top right during review */}
              <button 
                onClick={() => addClip(project.id, { ...clip, slotId: 'temp_remove' } as any)} 
                className="absolute top-4 right-4 px-4 py-2 bg-zinc-800/80 backdrop-blur text-white rounded-lg text-xs font-bold border border-white/10 hover:bg-zinc-700 transition-colors shadow-lg z-20 flex items-center gap-2"
              >
                <RotateCcw className="w-3 h-3" />
                Retake
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

        {/* Transcript Editor - Only visible if clip exists and slot has subtitles */}
        {clip && currentSlot.hasSubtitles && (
            <div className="flex-shrink-0 p-6 bg-zinc-950/80 border-t border-zinc-800 h-1/3 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-amber-500">
                        <Captions className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Subtitle Transcript</span>
                    </div>
                    <span className="text-[10px] text-zinc-500">Auto-generated via Gemini Live</span>
                </div>
                <div className="flex-1 relative">
                    <textarea 
                        value={localTranscript}
                        onChange={(e) => setLocalTranscript(e.target.value)}
                        onBlur={saveTranscript}
                        className="w-full h-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-zinc-200 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 resize-none font-medium leading-relaxed"
                        placeholder="Waiting for transcript..."
                    />
                    <div className="absolute bottom-3 right-3 pointer-events-none">
                         <Edit3 className="w-3 h-3 text-zinc-600" />
                    </div>
                </div>
                <p className="text-[10px] text-zinc-600 mt-2 text-center">
                    Edits are saved automatically when you navigate.
                </p>
            </div>
        )}

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