const path = require('path');
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
            port: 8080,
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
    };
};
