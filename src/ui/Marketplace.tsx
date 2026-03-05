import { useState, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { ArrowLeft, Play, Globe, Heart, Pencil, Trash, User, Clock, Search, AlertTriangle, Download } from 'lucide-react';
import { dbService, MapData } from '../services/db';
import { supabase } from '../lib/supabase';
import EditMapModal from './EditMapModal';

export default function Marketplace() {
  const [maps, setMaps] = useState<MapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMap, setEditingMap] = useState<MapData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapToDelete, setMapToDelete] = useState<number | string | null>(null);
  const setGameState = useGameStore(s => s.setGameState);
  const loadMap = useGameStore(s => s.loadMap);
  const user = useGameStore(s => s.user);

  useEffect(() => {
    fetchMaps();
  }, []);

  const fetchMaps = async () => {
    try {
      const data = await dbService.getMaps();
      // Masquer les niveaux de base du marketplace
      const visibleMaps = data.filter(m =>
        m.is_published !== false &&
        !m.title.toLowerCase().includes('levelbase1') &&
        !m.title.toLowerCase().includes('levelbase2')
      );
      setMaps(visibleMaps);
    } catch (err) {
      console.error("Failed to fetch maps", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayMap = async (id: number | string) => {
    try {
      const map = await dbService.getMap(id);
      let blocks: any = map.data;
      if (typeof blocks === 'string') {
        blocks = JSON.parse(blocks);
      }
      loadMap(map.id, blocks);
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

  const handleDeleteMap = async () => {
    if (!mapToDelete) return;
    try {
      await dbService.deleteMap(mapToDelete);
      setMaps(maps.filter(m => m.id !== mapToDelete));
      setMapToDelete(null);
    } catch (err) {
      console.error("Failed to delete map", err);
      alert("Échec de la suppression de la map.");
      setMapToDelete(null);
    }
  };

  const filteredMaps = maps.filter(map =>
    map.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    map.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    map.author?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col pointer-events-auto text-white font-sans overflow-hidden">
      {/* Delete Confirmation Modal */}
      {mapToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border-2 border-red-500/50 rounded-2xl p-8 max-w-sm w-full text-center shadow-[0_0_50px_rgba(239,68,68,0.2)]">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Supprimer le niveau ?</h3>
            <p className="text-white/60 text-sm mb-8">Cette action est définitive et irréversible. Êtes-vous sûr de vouloir supprimer ce niveau du Marketplace ?</p>

            <div className="flex gap-4 p-2 bg-black/30 rounded-xl">
              <button
                onClick={() => setMapToDelete(null)}
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white font-bold transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteMap}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 rounded-lg text-white font-bold transition-colors shadow-[0_0_15px_rgba(239,68,68,0.5)]"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

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
            <p className="text-white/60 text-sm mt-2">Découvrez et jouez aux niveaux créés par la communauté !</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Rechercher des maps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-black/50 border border-white/20 rounded-full py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#049CD8] transition-colors w-64"
            />
          </div>

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
            <p className="text-xl mb-4">Aucune map publiée pour le moment.</p>
            <p>Soyez le premier à publier une map depuis l'Éditeur !</p>
          </div>
        ) : filteredMaps.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/50">
            <Search className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-xl mb-4">Aucune map ne correspond à "{searchQuery}".</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMaps.map(map => (
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
                <div className="flex justify-between items-start mb-4 gap-2">
                  <h2 className="text-xl font-bold line-clamp-2 text-[#43B047] flex-1">{map.title}</h2>
                  <div className="flex items-center gap-2 shrink-0">
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
                          onClick={() => setMapToDelete(map.id)}
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
                <p className="text-white/70 text-sm mb-6 line-clamp-3 flex-1">{map.description || "Aucune description fournie."}</p>

                <div className="flex items-center gap-4 text-xs text-white/40 mb-6">
                  <div className="flex items-center text-gray-400 text-sm">
                    <User className="w-4 h-4 mr-1" /> {map.author || 'Anonymous'}
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
                  JOUER AU NIVEAU
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
