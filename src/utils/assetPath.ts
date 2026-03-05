// Utilitaire pour résoudre les chemins d'assets avec le base URL de Vite
// Nécessaire pour GitHub Pages où le base URL est /MarioBros/ au lieu de /
export const assetPath = (path: string): string => {
    const base = import.meta.env.BASE_URL || '/';
    // Éviter les doubles slashes
    if (path.startsWith('/')) {
        return `${base.replace(/\/$/, '')}${path}`;
    }
    return `${base}${path}`;
};
