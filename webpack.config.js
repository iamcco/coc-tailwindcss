const path = require('path')

/** @type {import('webpack').Configuration} */
module.exports = {
  entry: {
    index: './src/index.ts'
  },
  target: 'node',
  mode: 'production',
  resolve: {
    mainFields: ['module', 'main'],
    extensions: ['.js', '.ts']
  },
  externals: {
    'coc.nvim': 'commonjs coc.nvim',
    'rustywind': 'commonjs rustywind'
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      }
    ]
  },
  output: {
    path: path.join(__dirname, 'out'),
    filename: '[name].js',
    libraryTarget: 'commonjs'
  },
  plugins: [],
  node: {
    __dirname: false,
    __filename: false
  }
}
