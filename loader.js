const vercel_plugin = require("@vercel/webpack-asset-relocator-loader");

const hooked = new WeakSet();

function isRenderer(options) {
  // options.target can be a string or an array of strings
  return (
    (typeof options.target == "string" &&
      options.target === "electron-renderer") ||
    (Array.isArray(options.target) &&
      options.target.includes("electron-renderer"))
  );
}

function hook(compilation) {
  const {
    compiler: { options },
    mainTemplate,
  } = compilation;

  // We only want to modify paths if this webpack config if for a renderer
  // This loader will be called multiple times and we only want to intercept the hook once
  if (isRenderer(options) && !hooked.has(mainTemplate)) {
    hooked.add(mainTemplate);

    const isProd = options.mode === "production";

    mainTemplate.hooks.requireExtensions.intercept({
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
                JSON.stringify(options.output.path)
              );
            }
          };
        }

        return tapInfo;
      },
    });
  }
}

module.exports = async function (content, map) {
  hook(this._compilation);

  return vercel_plugin.call(this, content, map);
};
