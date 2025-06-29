const webpack = require('webpack');

module.exports = function override(config, env) {
    // Add fallbacks for node core modules
    config.resolve.fallback = {
        ...config.resolve.fallback, // spread in the existing fallbacks
        "stream": require.resolve("stream-browserify"),
        "timers": require.resolve("timers-browserify"),
        "buffer": require.resolve("buffer"),
    };

    // Add plugins
    config.plugins = (config.plugins || []).concat([
        new webpack.ProvidePlugin({
            process: 'process/browser',
            Buffer: ['buffer', 'Buffer'],
        }),
    ]);

    return config;
}