const p = require("./platform");
function read(path) {
  return new Promise(function (resolve, reject) {
    var manager = p.fileSystemManager();
    if (!manager) {
      reject(Error("taskImageInvalid"));
      return;
    }
    manager.readFile({
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
    return p
      .compressImage({ src: path, quality: 50, compressedWidth: 1000 })
        .catch(function (error) {
          throw error.message === "unsupportedApi"
            ? Error("imageTooLarge")
            : error;
        })
      .then(function (r) {
        return read(r.tempFilePath);
      })
      .then(function (result) {
        if (result.size <= 266668) return result;
        return p
          .compressImage({
            src: path,
            quality: 25,
            compressedWidth: 720,
          })
          .catch(function (error) {
            throw error.message === "unsupportedApi"
              ? Error("imageTooLarge")
              : error;
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
