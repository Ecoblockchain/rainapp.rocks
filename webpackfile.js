module.exports = [
  {
    entry: './src/index.js',
    output: {
      path: './dist/js',
      filename: 'main.js'
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          loader: 'babel-loader',
          exclude: /node_modules/,
          options: {
            presets: [
              ['babel-preset-es2015', {modules: false}]
            ],
            plugins: [
              'babel-plugin-syntax-jsx',
              ['babel-plugin-transform-react-jsx', {pragma: 'h'}],
              'babel-plugin-transform-object-rest-spread'
            ]
          }
        }
      ]
    }
  },
  {
    entry: './src/service-worker.js',
    output: {
      path: './dist',
      filename: 'sw.js'
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          loader: 'babel-loader',
          exclude: /node_modules/,
          options: {
            presets: [
              ['babel-preset-es2015', {modules: false}]
            ]
          }
        }
      ]
    }
  }
];
