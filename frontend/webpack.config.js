const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, options) => {
    const isDevelopment = options.mode === 'development';

    return {
        devtool: isDevelopment ? 'eval-source-map' : false,
        entry: './src/ts/index.tsx',
        output: {
            filename: 'bundle.js',
            path: path.resolve(__dirname, './src/js'),
            publicPath: '/src/js/',
        },
        devServer: {
            static: {
                directory: path.join(__dirname, '.'),
            },
            port: 8081,
            hot: true,
            open: true,
            historyApiFallback: {
                index: '/index.html'
            },
        },
        resolve: {
            extensions: ['.tsx', '.ts', '.jsx', '.js'],
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: 'ts-loader',
                    include: [path.resolve(__dirname, 'src/ts')],
                },
                {
                    test: /\.css$/,
                    use: ['style-loader', 'css-loader'],
                },
            ],
        },
        optimization: {
            minimize: !isDevelopment,
            minimizer: !isDevelopment
                ? [
                    new TerserPlugin({
                        terserOptions: {
                            mangle: true,
                        },
                    }),
                ]
                : [],
        },
        plugins: [
            new webpack.DefinePlugin({
                __GAME_WS_PORT__: JSON.stringify(process.env.GAME_WS_PORT || '3000'),
                /** Пустая строка: браузер берёт window.location.origin (Docker: nginx :5173 → /api). */
                __GAME_API_ORIGIN__: JSON.stringify(
                    process.env.GAME_API_ORIGIN !== undefined
                        ? process.env.GAME_API_ORIGIN
                        : 'http://localhost:3000'
                ),
                /** Непустое значение, например /game: WebSocket через тот же host (nginx proxy). */
                __GAME_WS_PATH__: JSON.stringify(process.env.GAME_WS_PATH || ''),
            }),
        ],
    };
};
