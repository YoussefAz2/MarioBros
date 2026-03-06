import { Component, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Detects WebGL availability before attempting to render Three.js.
 * Returns true if WebGL is supported on this device/browser.
 */
export function isWebGLAvailable(): boolean {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        return gl instanceof WebGLRenderingContext || gl instanceof WebGL2RenderingContext;
    } catch {
        return false;
    }
}

/**
 * A beautiful error screen shown when WebGL is not available.
 */
export function WebGLUnavailableScreen() {
    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#0b001a] via-[#1a0e2d] to-[#0b001a]">
            <div className="max-w-lg mx-auto p-10 text-center">
                {/* Mario-style brick */}
                <div className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center shadow-[0_0_40px_rgba(251,208,0,0.3)] animate-pulse">
                    <span className="text-5xl">🎮</span>
                </div>

                <h1
                    className="text-3xl font-black text-[#FBD000] mb-4 tracking-wider drop-shadow-[2px_2px_0_#000]"
                    style={{ fontFamily: "'Press Start 2P', cursive" }}
                >
                    OUPS !
                </h1>

                <p className="text-white/80 text-lg mb-6 leading-relaxed">
                    Ton navigateur ou ton appareil ne supporte pas <strong className="text-[#049CD8]">WebGL</strong>,
                    qui est nécessaire pour faire tourner le jeu 3D.
                </p>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 text-left">
                    <p className="text-white/60 text-sm font-bold mb-3 uppercase tracking-wider">Solutions :</p>
                    <ul className="text-white/70 text-sm space-y-2">
                        <li className="flex items-start gap-2">
                            <span className="text-[#43B047] mt-0.5">✓</span>
                            <span>Utilise <strong>Chrome</strong>, <strong>Firefox</strong> ou <strong>Edge</strong> (dernière version)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-[#43B047] mt-0.5">✓</span>
                            <span>Vérifie que l'accélération matérielle est <strong>activée</strong> dans les paramètres de ton navigateur</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-[#43B047] mt-0.5">✓</span>
                            <span>Mets à jour les <strong>pilotes de ta carte graphique</strong></span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-[#43B047] mt-0.5">✓</span>
                            <span>Essaie sur un autre appareil (PC, téléphone récent...)</span>
                        </li>
                    </ul>
                </div>

                <button
                    onClick={() => window.location.reload()}
                    className="px-8 py-3 bg-[#049CD8] hover:bg-[#037bb0] text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-[#049CD8]/30 hover:scale-105"
                >
                    🔄 Réessayer
                </button>
            </div>
        </div>
    );
}

/**
 * Error Boundary that catches WebGL/Three.js runtime errors and shows a friendly fallback.
 */
export class CanvasErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: any) {
        console.error('Canvas Error Boundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback;
        }
        return this.props.children;
    }
}
