import { useState, useRef } from 'react';
import { X, Save, Image as ImageIcon } from 'lucide-react';
import { dbService, MapData } from '../services/db';

interface EditMapModalProps {
    map: MapData;
    onClose: () => void;
    onSuccess: () => void;
}

export default function EditMapModal({ map, onClose, onSuccess }: EditMapModalProps) {
    const [title, setTitle] = useState(map.title);
    const [description, setDescription] = useState(map.description || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(map.image);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError('Please select an image file (JPG/PNG).');
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                setPreviewImage(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title) {
            setError('Title is required.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await dbService.updateMap(map.id, {
                title,
                description,
                image: previewImage // this will be processed by dbService if it's a new base64 string
            });

            setSuccess(true);
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1500);
        } catch (err) {
            console.error(err);
            setError('An error occurred while saving.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center pointer-events-auto p-4 font-sans">
            <div className="bg-[#1a1a1a] border-2 border-white/20 rounded-3xl p-8 w-full max-w-md shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="flex items-center gap-3 mb-8">
                    <Save className="w-8 h-8 text-[#43B047]" />
                    <h2 className="text-2xl font-black text-white tracking-wider uppercase italic">Edit Level</h2>
                </div>

                {success ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(34,197,94,0.5)]">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Map Updated!</h3>
                        <p className="text-white/60">Your changes have been saved.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSave} className="flex flex-col gap-5">
                        <div className="relative w-full h-32 rounded-xl overflow-hidden border-2 border-white/20 bg-black group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            {previewImage ? (
                                <img src={previewImage} alt="Map Preview" className="w-full h-full object-cover opacity-80 group-hover:opacity-50 transition-opacity" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-white/40 group-hover:text-white/80 transition-colors">
                                    <ImageIcon className="w-8 h-8 mb-2" />
                                    <span className="text-xs font-bold uppercase tracking-wider">No Thumbnail</span>
                                </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                <span className="text-white font-bold text-sm tracking-widest uppercase">Change Image</span>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageChange}
                            />
                        </div>

                        <div>
                            <label className="block text-white/70 text-sm font-bold mb-2">Map Title *</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                maxLength={40}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#43B047] transition-all"
                                placeholder="Super Mario World 1-1"
                            />
                        </div>

                        <div>
                            <label className="block text-white/70 text-sm font-bold mb-2">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                maxLength={150}
                                rows={3}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#43B047] transition-all resize-none"
                                placeholder="A fun level with many jumps..."
                            />
                        </div>

                        {error && (
                            <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#43B047] hover:bg-[#52d157] text-white font-black uppercase tracking-wider py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-[0_0_20px_rgba(67,176,71,0.3)] hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {loading ? 'SAVING...' : 'SAVE CHANGES'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
