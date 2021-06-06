const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

class AssetRelocatorForgePatch {
  apply(compiler) {
    const isProd = compiler.options.mode === "production";

    compiler.hooks.compilation.tap(
      "asset-relocator-forge-patch",
      (compilation) => {
        compilation.mainTemplate.hooks.requireExtensions.intercept({
          register: (tapInfo) => {
            if (tapInfo.name == "asset-relocator-loader") {
              const origFn = tapInfo.fn;

              tapInfo.fn = (source, chunk) => {
                const origOutput = origFn(source, chunk);

                if (isProd) {
                  return (
                    "const { dirname, resolve } = require('path');\n" +
                    origOutput.replace(
                      "__dirname",
                      "resolve(dirname(__filename), '..')"
                    )
                  );
                } else {
                  return origOutput.replace(
                    "__dirname",
                    JSON.stringify(compiler.options.output.path)
                  );
                }
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
  new AssetRelocatorForgePatch(),
];
