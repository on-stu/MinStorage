const getFileName = (specificPath) => {
  const temp = specificPath.split("/");
  const fileName = temp[temp.length - 1];
  return fileName;
};

module.exports = {
  getFileName,
};
