import { v2 as cloudinary } from "cloudinary";
import {
  API_KEY,
  API_SECRET,
  APPLICATION_NAME,
  CLOUD_NAME,
} from "../../../../config/config.service.js";

export const cloud = () => {
  cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
    secure: true,
  });

  return cloudinary;
};

export const uploadFile = async ({ file = {}, path = "general" } = {}) => {
  return await cloud().uploader.upload(file.path, {
    folder: `${APPLICATION_NAME}/${path}`,
  });
};

export const uploadFiles = async ({ files = [], path = "general" } = {}) => {
  const attachments = [];
  for (const file of files) {
    const { secure_url, public_id } = await uploadFile({ file, path });
    attachments.push({ secure_url, public_id });
  }

  return attachments;
};

export const destroyFile = async ({ public_id = "" } = {}) => {
  return await cloud().uploader.destroy(public_id);
};

export const deleteResource = async ({
  public_ids = [],
  options = { type: "upload", resource_type: "image" },
} = {}) => {
  return await cloud().api.delete_resources(public_ids, options);
};

const deleteFolderByPrefix = async ({ prefix = "" } = {}) => {
  return await cloud().api.deleteFolderByPrefix(
    `${APPLICATION_NAME}/${prefix}`,
  );
};
