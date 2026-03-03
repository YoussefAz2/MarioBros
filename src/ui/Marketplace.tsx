import { useState, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { Download, Heart, User, Clock, ArrowLeft, Globe, Trash, Pencil } from 'lucide-react';
import { dbService, MapData } from '../services/db';
import { supabase } from '../lib/supabase';
import EditMapModal from './EditMapModal';

export default function Marketplace() {
  const [maps, setMaps] = useState<MapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMap, setEditingMap] = useState<MapData | null>(null);
  const setGameState = useGameStore(s => s.setGameState);
  const loadMap = useGameStore(s => s.loadMap);
  const user = useGameStore(s => s.user);

  useEffect(() => {
    fetchMaps();
  }, []);

  const fetchMaps = async () => {
    try {
      const data = await dbService.getMaps();
      setMaps(data);
    } catch (err) {
      console.error("Failed to fetch maps", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayMap = async (id: number | string) => {
    try {
      const map = await dbService.getMap(id);
      let blocks = map.data;
      if (typeof blocks === 'string') {
        blocks = JSON.parse(blocks);
      }
      loadMap(blocks);
    } catch (err) {
      console.error("Failed to load map", err);
      alert("Failed to load map data.");
    }
  };

  const handleLikeMap = async (id: number | string) => {
    try {
      await dbService.likeMap(id);
      setMaps(maps.map(m => m.id === id ? { ...m, likes: m.likes + 1 } : m));
    } catch (err) {
      console.error("Failed to like map", err);
    }
  };

  const handleDeleteMap = async (id: number | string) => {
    if (!window.confirm("Are you sure you want to delete this level permanently?")) return;
    try {
      await dbService.deleteMap(id);
      setMaps(maps.filter(m => m.id !== id));
    } catch (err) {
      console.error("Failed to delete map", err);
      alert("Failed to delete map.");
    }
  };

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col pointer-events-auto text-white font-sans overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/40">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setGameState('MENU')}
            className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-black tracking-widest text-[#FBD000] drop-shadow-[2px_2px_0_#000]" style={{ fontFamily: "'Press Start 2P', cursive" }}>MARKETPLACE</h1>
            <p className="text-white/60 text-sm mt-2">Discover and play community created levels!</p>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-full text-xs font-bold border ${supabase ? 'border-green-400/50 bg-green-400/10 text-green-400' : 'border-yellow-400/50 bg-yellow-400/10 text-yellow-400'}`}>
          {supabase ? '☁ Supabase' : '💾 Local SQLite'}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin w-12 h-12 border-4 border-[#049CD8] border-t-transparent rounded-full"></div>
          </div>
        ) : maps.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/50">
            <p className="text-xl mb-4">No maps published yet.</p>
            <p>Be the first to publish a map from the Editor!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {maps.map(map => (
              <div key={map.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col hover:bg-white/10 transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-[#049CD8]/20 group">
                <div className="w-full h-32 bg-black/50 rounded-xl mb-4 overflow-hidden relative border border-white/10">
                  {map.image ? (
                    <img src={map.image} alt={map.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20">
                      <Globe className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold truncate pr-4 text-[#43B047]">{map.title}</h2>
                  <div className="flex items-center gap-2">
                    {user && user.id === map.user_id && (
                      <>
                        <button
                          onClick={() => setEditingMap(map)}
                          className="p-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg transition-all"
                          title="Edit Level Metadata"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteMap(map.id)}
                          className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                          title="Delete Level"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleLikeMap(map.id)}
                      className="flex items-center gap-1 text-white/50 hover:text-red-400 transition-colors"
                    >
                      <Heart className="w-5 h-5" />
                      <span className="text-sm font-bold">{map.likes}</span>
                    </button>
                  </div>
                </div>

                <p className="text-white/70 text-sm mb-6 line-clamp-3 flex-1">{map.description || "No description provided."}</p>

                <div className="flex items-center gap-4 text-xs text-white/40 mb-6">
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span className="truncate max-w-[100px]">{map.author}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(map.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <button
                  onClick={() => handlePlayMap(map.id)}
                  className="w-full py-3 bg-[#049CD8] hover:bg-[#037bb0] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg"
                >
                  <Download className="w-5 h-5" />
                  PLAY LEVEL
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingMap && (
        <EditMapModal
          map={editingMap}
          onClose={() => setEditingMap(null)}
          onSuccess={fetchMaps}
        />
      )}
    </div>
  );
}
