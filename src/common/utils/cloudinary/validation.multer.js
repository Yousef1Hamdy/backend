export const fileFieldValidation = {
  image: ["image/jpeg", "image/jpg", "image/png"],
  file: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
};

export const fileFilter = (validation = []) => {
  return function (req, file, cb) {
    if (!validation.includes(file.mimetype)) {
      return cb(
        new Error("Invalid file format", { cause: { status: 400 } }),
        false,
      );
    }

    cb(null, true);
  };
};
