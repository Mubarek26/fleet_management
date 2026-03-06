const multer = require("multer");
const AppError = require("../utils/appError");
const path = require("path");

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Choose folder based on file field name
    switch (file.fieldname) {
      case "image":
        cb(null, "uploads/foods");
        break;
      case "photo":
        cb(null, "uploads/users");
        break;
      case "driverPhoto":
        cb(null, "uploads/users");
        break;
      case "licensePhoto":
        cb(null, "uploads/users");
        break;
      case "logo":
        cb(null, "uploads/restaurants");
        break;
      case "banner":
        cb(null, "uploads/restaurants");
        break;
      default:
        cb(null, "uploads/restaurants/others"); // fallback
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

// file filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Accept the file
  } else {
    // send error
    cb(new AppError("Invalid file type. Only images are allowed.", 400), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
});

// Accept two fields: logo and banner
const uploadFields = upload.fields([
  { name: "logo", maxCount: 1 },
  { name: "banner", maxCount: 1 },
]);

// Default export: the common case used by restaurant routes (logo + banner fields)
module.exports = uploadFields;

// Helpers for other routes that might need single file or different fields
module.exports.single = (fieldName) => upload.single(fieldName);
module.exports.fields = (fieldsArray) => upload.fields(fieldsArray);
module.exports.any = () => upload.any();

// Expose the raw multer instance in case advanced usage is needed elsewhere
module.exports._multer = upload;
