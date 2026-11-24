const p = require("./platform");
function read(path) {
  return new Promise(function (resolve, reject) {
    p.api()
      .getFileSystemManager()
      .readFile({
        filePath: path,
        encoding: "base64",
        success: function (r) {
          var b = r.data,
            mime =
              b.indexOf("iVBORw0KGgo") === 0
                ? "png"
                : b.indexOf("/9j/") === 0
                  ? "jpeg"
                  : null;
          if (!mime) {
            reject(Error("taskImageInvalid"));
            return;
          }
          resolve({
            data: "data:image/" + mime + ";base64," + b,
            path: path,
            size: b.length,
          });
        },
        fail: function () {
          reject(Error("taskImageInvalid"));
        },
      });
  });
}
function prepare(path) {
  return read(path).then(function (image) {
    if (image.size <= 266668) return image;
    if (typeof p.api().compressImage !== "function")
      throw Error("imageTooLarge");
    return p
      .call("compressImage", { src: path, quality: 50, compressedWidth: 1000 })
      .then(function (r) {
        return read(r.tempFilePath);
      })
      .then(function (result) {
        if (result.size <= 266668) return result;
        return p
          .call("compressImage", {
            src: path,
            quality: 25,
            compressedWidth: 720,
          })
          .then(function (r) {
            return read(r.tempFilePath);
          });
      })
      .then(function (result) {
        if (result.size > 266668) throw Error("imageTooLarge");
        return result;
      });
  });
}
module.exports = { prepare: prepare };
