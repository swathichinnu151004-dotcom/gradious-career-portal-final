const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads/resumes folder exists
const uploadDir = path.join(__dirname, "../../uploads/resumes");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, uniqueName);
  },
});

// File filter for resume types
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /pdf|doc|docx/;
  const extName = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mimeType =
    file.mimetype === "application/pdf" ||
    file.mimetype === "application/msword" ||
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  if (extName && mimeType) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, DOC, and DOCX files are allowed"));
  }
};

const uploadResume = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

module.exports = uploadResume;