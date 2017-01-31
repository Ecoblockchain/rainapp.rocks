const webpack = require('webpack');


module.exports = [
	{
		entry: './src/main.js',
		output: {
			path: __dirname + '/dist/js',
			filename: 'main.js'
		},
		module: {
			loaders: [
				{
					test: /\.js$/,
					loader: 'babel-loader',
					exclude: /node_modules/,
					query: {
						presets: ['babel-preset-es2015'],
						plugins: [
							'babel-plugin-syntax-jsx',
							['babel-plugin-transform-react-jsx', {pragma: 'element'}],
							'babel-plugin-transform-object-rest-spread'
						]
					}
				}
			]
		},
		plugins: [
			new webpack.DefinePlugin({
				'process.env.NODE_ENV': '"production"'
			}),
		]
	},
	{
		entry: './src/service-worker.js',
		output: {
			path: __dirname + '/dist',
			filename: 'sw.js'
		},
		module: {
			loaders: [
				{
					test: /\.js$/,
					loader: 'babel-loader',
					exclude: /node_modules/,
					query: {
						presets: ['babel-preset-es2015']
					}
				}
			]
		}
	}
];
