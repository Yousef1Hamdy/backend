import multer from "multer";
import { fileFilter } from "./validation.multer.js";

export const cloudFileUpload = ({ validation = [] } = {}) => {
  const storage = multer.diskStorage({});

  return multer({
    fileFilter: fileFilter(validation),
    storage,
  });
};
