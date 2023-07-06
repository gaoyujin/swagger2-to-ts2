import typescript from '@rollup/plugin-typescript'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import terser from '@rollup/plugin-terser'
import pkg from './package.json'
import copy from 'rollup-plugin-copy'

export default [
  {
    input: 'src/main.ts',
    output: {
      name: 'index',
      file: pkg.main,
      format: 'cjs',
      sourcemap: true,
      banner: '#!/usr/bin/env node',
    },
    plugins: [
      commonjs(), // so Rollup can convert `ms` to an ES module
      json(),
      resolve(), // so Rollup can find `ms`
      typescript(),
      copy({
        targets: [{ src: 'templates', dest: 'dist' }],
      }),
      terser(),
    ],
  },
  // {
  //   input: 'src/main.ts',
  //   output: [
  //     { file: pkg.main, format: 'cjs' },
  //     { file: pkg.module, format: 'es' },
  //   ],
  //   plugins: [
  //     commonjs(), // so Rollup can convert `ms` to an ES module
  //     json(),
  //     resolve(), // so Rollup can find `ms`
  //     typescript(),
  //   ],
  // },
]
