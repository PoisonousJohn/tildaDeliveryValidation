const webpack = require('webpack');
const path = require('path');

module.exports = (function (options) {

    return {
        entry: __dirname + "/src/index.ts",
        mode: 'development',
        externals: {
            'jquery': 'jQuery'
        },

        output: {
            path: __dirname + "/dist",
            filename: "TildaDeliveryValidation.js",
            library: "TildaDeliveryValidation"
        },

        devtool: 'source-map',

        module: {
            "rules": [
                {
                    "test": /\.tsx?$/,
                    "exclude": /node_modules/,
                    "use": {
                        "loader": "ts-loader",
                        "options": {
                            "transpileOnly": true
                        }
                    }
                }
            ]
        },

        plugins: [
            // new webpack.optimize.UglifyJsPlugin()
        ],

        resolve: {
            extensions: ['.ts', '.js', '.json']
        }


    }
})()
