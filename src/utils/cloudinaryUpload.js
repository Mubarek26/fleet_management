const cloudinary = require("../config/cloudinary");

const uploadMulterFile = (file, options = {}) => {
  if (!file) {
    return null;
  }

  if (file.buffer) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
        if (error) {
          return reject(error);
        }
        return resolve(result);
      });

      stream.end(file.buffer);
    });
  }

  if (file.path) {
    return cloudinary.uploader.upload(file.path, options);
  }

  return null;
};

module.exports = { uploadMulterFile };
