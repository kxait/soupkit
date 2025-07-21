#!/bin/sh

npx npm-check-updates -u
npm install

pushd template/api
npx npm-check-updates -u
npm install
popd

pushd template/htmx
npx npm-check-updates -u
npm install
popd
