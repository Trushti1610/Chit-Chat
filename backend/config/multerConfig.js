const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Function to ensure directory exists
const ensureDirectoryExists = (directoryPath) => {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath;
    if (
      req.originalUrl.includes("/group") ||
      req.originalUrl.includes("/settings")
    ) {
      uploadPath = path.join(
        __dirname,
        "..",
        "modules",
        "group",
        "uploads",
        "GroupImage"
      );
    } else {

      uploadPath = path.join(
        __dirname,
        "..",
        "modules",
        "user",
        "uploads",
        "profile-pictures"
      );
    }
    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const userId = req.params.id || "unknown"; 
    cb(null, `user-${userId}-${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG and PNG files are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 },
});

module.exports = upload;
