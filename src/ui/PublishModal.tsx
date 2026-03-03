import { useState, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { X, UploadCloud } from 'lucide-react';
import { dbService } from '../services/db';

interface PublishModalProps {
  onClose: () => void;
}

export default function PublishModal({ onClose }: PublishModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null); const blocks = useGameStore(s => s.blocks);
  const user = useGameStore(s => s.user);
  const setIsPublishing = useGameStore(s => s.setIsPublishing);

  useEffect(() => {
    setIsPublishing(true);

    const timer = setTimeout(() => {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        try {
          const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
          setPreviewImage(dataUrl);
        } catch (e) {
          console.error("Failed to capture canvas", e);
        }
      }
      setIsPublishing(false);
    }, 150);

    return () => {
      clearTimeout(timer);
      setIsPublishing(false);
    };
  }, [setIsPublishing]);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      setError('Title is required.');
      return;
    }

    // Extract display name from user email
    let displayAuthor = "Anonymous";
    if (user && user.email) {
      displayAuthor = user.email.split('@')[0];
    }

    setLoading(true);
    setError('');

    try {
      await dbService.publishMap({
        title,
        description,
        author: displayAuthor,
        data: blocks,
        image: previewImage
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error(err);
      setError('An error occurred while publishing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center pointer-events-auto p-4 font-sans">
      <div className="bg-[#1a1a1a] border-2 border-white/20 rounded-3xl p-8 w-full max-w-md shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 mb-8">
          <UploadCloud className="w-8 h-8 text-[#049CD8]" />
          <h2 className="text-2xl font-black text-white tracking-wider" style={{ fontFamily: "'Press Start 2P', cursive" }}>PUBLISH</h2>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(34,197,94,0.5)]">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Map Published!</h3>
            <p className="text-white/60">Your map is now available in the Marketplace.</p>
          </div>
        ) : (
          <form onSubmit={handlePublish} className="flex flex-col gap-5">
            {previewImage && (
              <div className="w-full h-32 rounded-xl overflow-hidden border-2 border-white/20 mb-2">
                <img src={previewImage} alt="Map Preview" className="w-full h-full object-cover" />
              </div>
            )}
            <div>
              <label className="block text-white/70 text-sm font-bold mb-2">Map Title *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#049CD8] transition-colors"
                placeholder="Super Awesome Level"
                maxLength={50}
                required
              />
            </div>


            <div>
              <label className="block text-white/70 text-sm font-bold mb-2">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#049CD8] transition-colors resize-none h-24"
                placeholder="Tell players what to expect..."
                maxLength={200}
              />
            </div>

            {error && <p className="text-red-400 text-sm font-bold">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#43B047] hover:bg-[#328a36] text-white font-bold py-4 rounded-xl mt-4 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <UploadCloud className="w-5 h-5" />
                  PUBLISH TO MARKETPLACE
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
