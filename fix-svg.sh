#!/bin/sh

if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' 's/validate: (input) => svgReg.test(toUTF8String(input, 0, 1e3))/validate: (input) => svgReg.test(toUTF8String(input))/' node_modules/astro/dist/assets/utils/vendor/image-size/types/svg.js
else
    sed -i 's/validate: (input) => svgReg.test(toUTF8String(input, 0, 1e3))/validate: (input) => svgReg.test(toUTF8String(input))/' node_modules/astro/dist/assets/utils/vendor/image-size/types/svg.js
fi