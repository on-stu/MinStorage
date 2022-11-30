const uploadFile = require("../middleware/upload");
const fs = require("fs");
const baseUrl = "https://storage.minsu.info/files/";
const getFileName = require("../functions/getFileName");
const multer = require("multer");

const main = async (req, res) => {
  const directoryPath = __basedir + "/resources/static/assets/uploads/";
  let specificPath = req.path.slice(7);
  specificPath = decodeURI(specificPath);
  const fileName = getFileName.getFileName(specificPath);
  const stream = req.query.stream;

  if (stream) {
    return streamFile(req, res, directoryPath + specificPath);
  }

  if (fileName.includes(".")) {
    return downloadFile(directoryPath + specificPath, res);
  }

  fs.readdir(directoryPath + specificPath, function (err, files) {
    if (err) {
      res.status(500).send({
        message: "Unable to scan files!",
        err,
      });
    }

    let fileInfos = [];
    try {
      files.forEach((file) => {
        fileInfos.push({
          name: file,
          url: baseUrl + specificPath + "/" + file,
        });
      });
    } catch (e) {
      return res.status(500).send(e.message);
    }

    res.status(200).send(fileInfos);
  });
};

const upload = async (req, res) => {
  try {
    await uploadFile(req, res);

    if (req.file == undefined) {
      return res.status(400).send({ message: "Please upload a file!" });
    }
    const baseDir = __basedir + "/resources/static/assets/uploads/";
    const filePath = req.file.path;
    const url = baseUrl + filePath.slice(baseDir.length);

    res.status(200).send({
      message: "Uploaded the file successfully: " + req.file.path,
      url,
    });
    console.log("wow");
  } catch (err) {
    console.log(err);

    if (err.code == "LIMIT_FILE_SIZE") {
      return res.status(500).send({
        message: "File size cannot be larger than 2MB!",
      });
    }

    res.status(500).send({
      message: `Could not upload the file. ${err}`,
    });
  }
};

const getListFiles = (req, res) => {
  const directoryPath = __basedir + "/resources/static/assets/uploads/";

  fs.readdir(directoryPath, function (err, files) {
    if (err) {
      res.status(500).send({
        message: "Unable to scan files!",
      });
    }

    let fileInfos = [];

    files.forEach((file) => {
      fileInfos.push({
        name: file,
        url: baseUrl + file,
      });
    });

    res.status(200).send(fileInfos);
  });
};

const downloadFile = (filePath, res) => {
  res.download(filePath);
};

const streamFile = (req, res, filePath) => {
  // const range = req.headers.range;

  // if (range == undefined) {
  //   res.status(400).send("Requires Range header");
  //   return;
  // }
  // const videoSize = fs.statSync(videoPath).size;
  // const CHUNK_SIZE = 10 ** 6;
  // const start = Number(range.replace(/\D/g, ""));
  // const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
  // const contentLength = end - start + 1;
  // const headers = {
  //   "Content-Range": `bytes ${start}-${end}/${videoSize}`,
  //   "Accept-Ranges": "bytes",
  //   "Content-Length": contentLength,
  //   "Content-Type": "video/mp4",
  // };
  // res.writeHead(206, headers);
  // const videoStream = fs.createReadStream(videoPath, { start, end });
  // videoStream.pipe(res);

  const options = {};

  let start;
  let end;

  const range = req.headers.range;
  if (range) {
    const bytesPrefix = "bytes=";
    if (range.startsWith(bytesPrefix)) {
      const bytesRange = range.substring(bytesPrefix.length);
      const parts = bytesRange.split("-");
      if (parts.length === 2) {
        const rangeStart = parts[0] && parts[0].trim();
        if (rangeStart && rangeStart.length > 0) {
          options.start = start = parseInt(rangeStart);
        }
        const rangeEnd = parts[1] && parts[1].trim();
        if (rangeEnd && rangeEnd.length > 0) {
          options.end = end = parseInt(rangeEnd);
        }
      }
    }
  }

  res.setHeader("content-type", "video/mp4");

  fs.stat(filePath, (err, stat) => {
    if (err) {
      console.error(`File stat error for ${filePath}.`);
      console.error(err);
      res.sendStatus(500);
      return;
    }

    let contentLength = stat.size;

    if (req.method === "HEAD") {
      res.statusCode = 200;
      res.setHeader("accept-ranges", "bytes");
      res.setHeader("content-length", contentLength);
      res.end();
    } else {
      let retrievedLength;
      if (start !== undefined && end !== undefined) {
        retrievedLength = end + 1 - start;
      } else if (start !== undefined) {
        retrievedLength = contentLength - start;
      } else if (end !== undefined) {
        retrievedLength = end + 1;
      } else {
        retrievedLength = contentLength;
      }

      res.statusCode = start !== undefined || end !== undefined ? 206 : 200;

      res.setHeader("content-length", retrievedLength);

      if (range !== undefined) {
        res.setHeader(
          "content-range",
          `bytes ${start || 0}-${end || contentLength - 1}/${contentLength}`
        );
        res.setHeader("accept-ranges", "bytes");
      }

      const fileStream = fs.createReadStream(filePath, options);
      fileStream.on("error", (error) => {
        console.log(`Error reading file ${filePath}.`);
        console.log(error);
        res.sendStatus(500);
      });

      fileStream.pipe(res);
    }
  });
};

const remove = (req, res) => {
  const fileName = req.params.name;
  const directoryPath = __basedir + "/resources/static/assets/uploads/";

  fs.unlink(directoryPath + fileName, (err) => {
    if (err) {
      res.status(500).send({
        message: "Could not delete the file. " + err,
      });
    }

    res.status(200).send({
      message: "File is deleted.",
    });
  });
};

const removeSync = (req, res) => {
  const fileName = req.params.name;
  const directoryPath = __basedir + "/resources/static/assets/uploads/";

  try {
    fs.unlinkSync(directoryPath + fileName);

    res.status(200).send({
      message: "File is deleted.",
    });
  } catch (err) {
    res.status(500).send({
      message: "Could not delete the file. " + err,
    });
  }
};

module.exports = {
  upload,
  getListFiles,
  remove,
  removeSync,
  main,
};
