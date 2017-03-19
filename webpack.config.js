module.exports = {
  entry: './client/js/client.js',
  output: {
    path: __dirname + '/client',
    filename: 'clientBundle.js'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel-loader'
      }
    ]
  },
  node: {
    console: true,
    fs: 'empty',
    net: 'empty',
    tls: 'empty'
  },
  externals: ['ws']
};
