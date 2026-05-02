/**
 * Публичный URL-корень игровых PNG (относительно origin страницы).
 * Файлы лежат в репозитории как frontend/src/img/** ; webpack-dev-server раздаёт
 * каталог frontend/, поэтому в браузере это /src/img/...
 * Production (Docker/nginx): см. Dockerfile COPY src/img → тот же префикс.
 */
export const GAME_IMG_PUBLIC_ROOT = '/src/img';

/**
 * Абсолютный URL к файлу внутри src/img.
 * @param relativePath путь без корня, например `item/Key.png` или `tanks/Hulls/Hull_0/Hull_1.png`
 */
export function gameImg(relativePath: string): string {
    let p = relativePath.trim();
    const prefix = GAME_IMG_PUBLIC_ROOT;
    if (p.startsWith(prefix + '/')) {
        p = p.slice(prefix.length + 1);
    } else if (p.startsWith(prefix)) {
        p = p.slice(prefix.length).replace(/^\//, '');
    }
    p = p.replace(/^\/+/, '').replace(/^(src\/)?img\//i, '');
    return `${prefix}/${p}`;
}
