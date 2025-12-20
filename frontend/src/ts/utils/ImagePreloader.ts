/**
 * Utility class to preload all game images before game starts
 */

const MATERIAL = ['Grass', 'Ground', 'Sandstone'];
const SHAPE = ['0', '1'];

export class ImagePreloader {
    private static loadedImages: Map<string, HTMLImageElement> = new Map();
    private static loadPromises: Map<string, Promise<HTMLImageElement>> = new Map();
    private static onProgressCallback: ((loaded: number, total: number) => void) | null = null;

    /**
     * Set callback for progress updates
     */
    public static setProgressCallback(callback: (loaded: number, total: number) => void): void {
        this.onProgressCallback = callback;
    }

    /**
     * Preload all game images
     */
    public static async preloadAll(): Promise<void> {
        const imagePaths: string[] = [];

        // Background images (6 total: 3 materials x 2 variants)
        for (const material of MATERIAL) {
            imagePaths.push(`/src/img/backgrounds/${material}_0.png`);
            imagePaths.push(`/src/img/backgrounds/${material}_1.png`);
        }

        // Bullet images (5 types: 0-4)
        for (let i = 0; i < 5; i++) {
            imagePaths.push(`/src/img/tanks/Bullets/Bullet_${i}.png`);
        }

        // Wall images (all MATERIAL x SHAPE combinations = 3 x 2 = 6)
        // SHAPE: ['Rect', 'Square'] -> files use '0' and '1' as suffixes
        for (const material of MATERIAL) {
            imagePaths.push(`/src/img/blocks/${material}_0.png`);
            imagePaths.push(`/src/img/blocks/${material}_1.png`);
        }

        // Tank hull images (8 hulls x 8 colors = 64)
        for (let hullNum = 0; hullNum < 8; hullNum++) {
            for (let color = 0; color < 8; color++) {
                imagePaths.push(`src/img/tanks/Hulls/Hull_${hullNum}/Hull_${color}.png`);
            }
        }

        // Tank turret images (8 turrets x 8 colors = 64)
        for (let turretNum = 0; turretNum < 8; turretNum++) {
            for (let color = 0; color < 8; color++) {
                imagePaths.push(`src/img/tanks/Turrets/Turret_${turretNum}/Turret_${color}.png`);
            }
        }

        // Weapon images (8 weapons)
        for (let weaponNum = 0; weaponNum < 8; weaponNum++) {
            imagePaths.push(`src/img/tanks/Weapons/Weapon_${weaponNum}.png`);
        }

        // Track images (4 tracks)
        for (let trackNum = 0; trackNum < 4; trackNum++) {
            imagePaths.push(`src/img/tanks/Tracks/Track_${trackNum}.png`);
        }

        // Item images
        imagePaths.push('/src/img/item/Key.png');
        imagePaths.push('/src/img/item/Light_Bullet_Box.png');
        imagePaths.push('/src/img/item/Medium_Bullet_Box.png');
        imagePaths.push('/src/img/item/Heavy_Bullet_Box.png');
        imagePaths.push('/src/img/item/Grenade_Bullet_Box.png');
        imagePaths.push('/src/img/item/Sniper_Bullet_Box.png');

        // Effect images
        imagePaths.push('/src/img/tanks/Effects/Sprites/Sprite_Effects_Explosion.png');
        imagePaths.push('/src/img/tanks/Effects/Sprites/Grenade_Effects_Explosion.png');
        imagePaths.push('/src/img/tanks/Effects/Sprites/Sprite_Effects_Smoke.png');
        imagePaths.push('/src/img/tanks/Effects/Movement/Movement.png');

        // Tire track images (2 types)
        for (let type = 0; type < 2; type++) {
            imagePaths.push(`/src/img/tanks/Effects/Tire Tracks/Tire_Track_${type}.png`);
            imagePaths.push(`/src/img/tanks/Effects/Tire Tracks/Tire_Track_Chain_${type}.png`);
        }

        // Fire shot animation images (2 shot types + 2 impact types)
        imagePaths.push('/src/img/tanks/Effects/Sprites/Sprite_Fire_Shots_Shot_0.png');
        imagePaths.push('/src/img/tanks/Effects/Sprites/Sprite_Fire_Shots_Shot_1.png');
        imagePaths.push('/src/img/tanks/Effects/Sprites/Sprite_Fire_Shots_Impact_0.png');
        imagePaths.push('/src/img/tanks/Effects/Sprites/Sprite_Fire_Shots_Impact_1.png');

        // Load all images with progress tracking
        let loadedCount = 0;
        const totalImages = imagePaths.length;
        
        const loadPromises = imagePaths.map(path => 
            this.loadImage(path)
                .then(img => {
                    loadedCount++;
                    if (this.onProgressCallback) {
                        this.onProgressCallback(loadedCount, totalImages);
                    }
                    return img;
                })
                .catch(error => {
                    loadedCount++;
                    if (this.onProgressCallback) {
                        this.onProgressCallback(loadedCount, totalImages);
                    }
                    console.warn(`[ImagePreloader] Failed to load ${path}`);
                    throw error;
                })
        );
        
        const loadResults = await Promise.allSettled(loadPromises);
        
        const successCount = loadResults.filter(result => result.status === 'fulfilled').length;
        const failedCount = loadResults.filter(result => result.status === 'rejected').length;
        
        if (failedCount > 0) {
            console.warn(`[ImagePreloader] Failed to load ${failedCount} images`);
        }
        console.log(`[ImagePreloader] Preloaded ${successCount}/${totalImages} images`);
    }

    /**
     * Load a single image
     */
    private static loadImage(src: string): Promise<HTMLImageElement> {
        // Return cached promise if already loading
        if (this.loadPromises.has(src)) {
            return this.loadPromises.get(src)!;
        }

        // Return cached image if already loaded
        if (this.loadedImages.has(src)) {
            return Promise.resolve(this.loadedImages.get(src)!);
        }

        const promise = new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.loadedImages.set(src, img);
                resolve(img);
            };
            img.onerror = () => {
                console.warn(`[ImagePreloader] Failed to load image: ${src}`);
                reject(new Error(`Failed to load image: ${src}`));
            };
            img.src = src;
        });

        this.loadPromises.set(src, promise);
        return promise;
    }

    /**
     * Get a preloaded image (if available)
     */
    public static getImage(src: string): HTMLImageElement | null {
        return this.loadedImages.get(src) || null;
    }
}

