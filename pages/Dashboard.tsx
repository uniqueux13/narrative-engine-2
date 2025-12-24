import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../services/projectContext';
import { MASTER_RECIPES } from '../constants';
import { Plus, Play, Clock, Film, Loader2, ChevronRight, CheckCircle2 } from 'lucide-react';
import { ProjectStatus } from '../types';

const Dashboard: React.FC = () => {
  const { projects, createProject } = useProjects();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(MASTER_RECIPES[0].id);
  const [projectTitle, setProjectTitle] = useState('');

  const handleCreate = () => {
    if (selectedRecipeId && projectTitle.trim()) {
      const id = createProject(selectedRecipeId, projectTitle);
      setIsModalOpen(false);
      navigate(`/studio/${id}`);
    }
  };

  const getStatusColor = (status: ProjectStatus) => {
    switch(status) {
      case ProjectStatus.COMPLETED: return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case ProjectStatus.PROCESSING: return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case ProjectStatus.FAILED: return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-zinc-400 bg-zinc-800 border-zinc-700';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 w-full">
      {/* Hero Section */}
      <div className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6 border-b border-zinc-800 pb-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">Narrative Engine<span className="text-amber-500">.v1</span></h1>
          <p className="text-zinc-400 max-w-lg">
            Construct compelling video narratives using the <span className="text-zinc-200 font-mono">Grimwire</span> slot-based architecture. 
            Build inside-out.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-amber-900/20"
        >
          <Plus className="w-5 h-5" />
          Initialize Project
        </button>
      </div>

      {/* Projects Grid */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-zinc-200 flex items-center gap-2">
          <Film className="w-5 h-5 text-zinc-500" />
          Recent Manifestations
        </h2>
        
        {projects.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/50 rounded-2xl border border-zinc-800 border-dashed">
            <p className="text-zinc-500 mb-4">No projects initialized.</p>
            <button onClick={() => setIsModalOpen(true)} className="text-amber-500 hover:underline">Start the Forge</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(project => (
              <div 
                key={project.id} 
                onClick={() => navigate(`/studio/${project.id}`)}
                className="group bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl p-5 cursor-pointer transition-all duration-200"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-2 py-1 rounded text-xs font-mono border ${getStatusColor(project.status)}`}>
                    {project.status}
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1 truncate">{project.title}</h3>
                <p className="text-xs text-zinc-500 font-mono mb-4">ID: {project.id.slice(0, 8)}</p>
                <div className="flex items-center gap-4 text-xs text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                     <Film className="w-3 h-3" />
                     {Object.keys(project.clips).length} Clips
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative overflow-hidden">
             {/* Decorative Background */}
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600 to-purple-600"></div>

             <h2 className="text-2xl font-bold text-white mb-6">Initialize New Project</h2>
             
             <div className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-zinc-400 mb-1">Project Codename</label>
                 <input 
                   type="text" 
                   value={projectTitle}
                   onChange={(e) => setProjectTitle(e.target.value)}
                   className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 placeholder-zinc-600"
                   placeholder="e.g. Operation Morning Coffee"
                 />
               </div>

               <div>
                 <label className="block text-sm font-medium text-zinc-400 mb-3">Select Recipe</label>
                 <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                   {MASTER_RECIPES.map(recipe => (
                     <div 
                       key={recipe.id}
                       onClick={() => setSelectedRecipeId(recipe.id)}
                       className={`p-4 rounded-lg border cursor-pointer transition-all ${
                         selectedRecipeId === recipe.id 
                           ? 'bg-zinc-800 border-amber-500 ring-1 ring-amber-500/20' 
                           : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-600'
                       }`}
                     >
                       <div className="flex justify-between items-center mb-1">
                         <span className="font-bold text-zinc-200">{recipe.name}</span>
                         {selectedRecipeId === recipe.id && <CheckCircle2 className="w-4 h-4 text-amber-500" />}
                       </div>
                       <p className="text-xs text-zinc-500">{recipe.description}</p>
                       <div className="mt-2 flex gap-1">
                         {recipe.slots.map(s => (
                           <div key={s.id} className="h-1 flex-1 bg-zinc-700 rounded-full" />
                         ))}
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
             </div>

             <div className="mt-8 flex gap-3">
               <button 
                 onClick={() => setIsModalOpen(false)}
                 className="flex-1 px-4 py-3 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-900 transition-colors font-medium"
               >
                 Cancel
               </button>
               <button 
                 onClick={handleCreate}
                 disabled={!projectTitle.trim()}
                 className="flex-1 px-4 py-3 rounded-lg bg-amber-500 text-zinc-950 font-bold hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
               >
                 Begin Assembly
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
