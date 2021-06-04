const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

class AssetRelocatorModify {
  constructor(dir) {
    this.dir = dir;
  }

  apply(compiler) {
    const devPath = compiler.options.output.path;

    compiler.hooks.compilation.tap(
      "asset-reloate-forge-bodge",
      (compilation) => {
        compilation.mainTemplate.hooks.requireExtensions.intercept({
          register: (tapInfo) => {
            if (tapInfo.name == "asset-relocator-loader") {
              tapInfo.fn = (source) => {
                return `${source}\n
if (typeof __webpack_require__ !== 'undefined') {
  if (__filename.includes('electron.asar')) {
      __webpack_require__.ab = ${JSON.stringify(devPath)} + '/${this.dir}/';
  } else  {
      const { dirname, resolve } = require('path');
      __webpack_require__.ab = resolve(dirname(__filename), '../${
        this.dir
      }/') + '/';
  }
}
`;
              };
            }

            return tapInfo;
          },
        });
      }
    );
  }
}

module.exports = [
  new ForkTsCheckerWebpackPlugin(),
  new AssetRelocatorModify("native_modules"),
];
