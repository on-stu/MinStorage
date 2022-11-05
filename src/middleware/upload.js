const util = require("util");
const multer = require("multer");
const fs = require("fs");

let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const directoryPath =
      __basedir + "/resources/static/assets/uploads/" + `${Date.now()}/`;

    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath);
    }

    cb(null, directoryPath);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

let uploadFile = multer({
  storage: storage,
}).single("file");

let uploadFileMiddleware = util.promisify(uploadFile);
module.exports = uploadFileMiddleware;
