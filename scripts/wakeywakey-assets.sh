#!/usr/bin/env bash

# Make dirs on dist
mkdir -p dist/wakeywakey/assets/wasm
mkdir -p dist/wakeywakey/assets/models
mkdir -p dist/wakeywakey/assets/worklets

# Copy onnx runtime files
cp node_modules/onnxruntime-web/dist/*simd-threaded*.{mjs,wasm} ./dist/wakeywakey/assets/wasm/

# Copy rnnoise wasm files
cp node_modules/@sapphi-red/web-noise-suppressor/dist/rnnoise*.wasm ./dist/wakeywakey/assets/wasm/

# Copy worklets
cp node_modules/@sapphi-red/web-noise-suppressor/dist/rnnoise/workletProcessor.js ./dist/wakeywakey/assets/worklets/workletProcessor.js
