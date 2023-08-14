const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, options) => {
    const isDevelopment = options.mode === 'development';

    return {
        devtool: isDevelopment ? 'eval-source-map' : false,
        entry: './src/ts/index.ts',
        output: {
            filename: 'bundle.js',
            path: path.resolve(__dirname, './src/js'),
        },
        resolve: {
            extensions: ['.ts', '.js'],
        },
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    use: 'ts-loader',
                    include: [path.resolve(__dirname, 'src/ts')],
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
