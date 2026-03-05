import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useGameStore } from '../store/useGameStore';
import { X } from 'lucide-react';

interface LoginModalProps {
    onClose: () => void;
}

export default function LoginModal({ onClose }: LoginModalProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const setUser = useGameStore(s => s.setUser);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Veuillez entrer un email et un mot de passe.');
            return;
        }

        setLoading(true);
        setError('');

        // Transform username into a fake email seamlessly for Supabase Auth
        const formattedEmail = email.includes('@') ? email : `${email.trim().replace(/\s+/g, '').toLowerCase()}@mariomaker.local`;

        try {
            if (isSignUp) {
                const { data, error } = await supabase.auth.signUp({
                    email: formattedEmail,
                    password,
                });
                if (error) throw error;
                if (data.user) {
                    setUser(data.user);
                    onClose();
                }
            } else {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: formattedEmail,
                    password,
                });
                if (error) throw error;
                if (data.user) {
                    setUser(data.user);
                    onClose();
                }
            }
        } catch (err: any) {
            console.error('Auth error:', err);
            setError(err.message || 'Une erreur est survenue lors de l\'authentification.');
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

                <h2 className="text-3xl font-black text-white mb-2 tracking-tight uppercase italic">
                    {isSignUp ? 'Créer un compte' : 'Connexion'}
                </h2>
                <p className="text-white/60 mb-8 text-sm">
                    {isSignUp ? 'Inscrivez-vous pour publier et gérer vos niveaux.' : 'Connectez-vous pour gérer vos niveaux publiés.'}
                </p>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 rounded-xl p-3 mb-6 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label className="block text-white/80 text-sm font-medium mb-2 uppercase tracking-wider">Email / Pseudo</label>
                        <input
                            type="text"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#e8c400] transition-all"
                            placeholder="mario@maker.com"
                        />
                    </div>

                    <div>
                        <label className="block text-white/80 text-sm font-medium mb-2 uppercase tracking-wider">Mot de passe</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#e8c400] transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#e8c400] hover:bg-[#ffe53d] text-black font-black uppercase italic tracking-wider py-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-[0_0_20px_rgba(232,196,0,0.3)]"
                    >
                        {loading ? 'Chargement...' : (isSignUp ? 'S\'inscrire' : 'Se connecter')}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => {
                            setIsSignUp(!isSignUp);
                            setError('');
                        }}
                        className="text-white/50 hover:text-white text-sm transition-colors"
                    >
                        {isSignUp ? 'Déjà un compte ? Se connecter' : "Pas encore de compte ? S'inscrire"}
                    </button>
                </div>
            </div>
        </div>
    );
}
