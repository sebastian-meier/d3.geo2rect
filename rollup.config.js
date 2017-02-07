import babel from 'rollup-plugin-babel';

export default {
  entry: 'index.js',
  plugins: [
    babel()
  ],
  dest: 'build/geo2rect.js',
  format:'umd',
  moduleName:'geo2rect'
};