import {
  ACCESS_EXPIRE_IN,
  REFRESH_EXPIRE_IN,
} from "../../../config/config.service.js";
import {
  baseRevokeTokenKey,
  cloud,
  compareHash,
  ConflictException,
  createLoginCredentials,
  decryption,
  deleteKey,
  generateHash,
  keys,
  LogoutEnum,
  NotFoundException,
  revokeTokenKey,
  set,
  uploadFile,
} from "../../common/index.js";
import { findOne, findOneAndUpdate, UserModel } from "../../DB/index.js";

const createRevokeToken = async ({ userId, jti, ttl } = {}) => {
  await set({
    key: revokeTokenKey({ userId, jti }),
    value: jti,
    ttl,
  });
};

export const profile = (user) => {
  return user;
};

export const profileImage = async (file, user) => {
  const { secure_url, public_id } = await uploadFile({
    file,
    path: `user/${user._id}`,
  });
  const user_1 = await findOneAndUpdate({
    model: UserModel,
    filter: {
      _id: user._id,
    },
    update: {
      profilePicture: { secure_url, public_id },
    },
    options: {
      new: false,
    },
  });

  if (user?.profilePicture?.public_id) {
    await cloud().uploader.destroy(user.profilePicture.public_id);
  }
  return user_1;
};

export const shareProfile = async (userId) => {
  const account = await findOne({ model: UserModel, filter: { _id: userId } });
  if (!account) {
    throw NotFoundException({ message: "Invalid shared profile" });
  }

  if (account.phone) {
    account.phone = await decryption(account.phone);
  }

  return account;
};

export const rotateToken = async (user, { jti, iat }, issuer) => {
  if ((iat + ACCESS_EXPIRE_IN) * 1000 > Date.now() + 30000) {
    throw ConflictException({ message: "Current access token stile valid" });
  }
  await createRevokeToken({
    userId: user._id,
    jti,
    ttl: Math.max(iat + REFRESH_EXPIRE_IN - Math.floor(Date.now() / 1000), 1),
  });
  return createLoginCredentials(user, issuer);
};

export const logout = async (payload = {}, user, decoded = {}) => {
  const { flag } = payload;
  const { jti, iat, sub } = decoded;
  let status = 200;
  switch (flag) {
    case LogoutEnum.All:
      user.changeCredentialTime = new Date();
      await user.save();
      await deleteKey(await keys(baseRevokeTokenKey(sub)));
      break;

    default:
      await createRevokeToken({
        userId: sub,
        jti,
        ttl: Math.max(iat + REFRESH_EXPIRE_IN - Math.floor(Date.now() / 1000), 1),
      });

      status = 201;
      break;
  }
  return status;
};

export const updatePassword = async (
  { oldPassword, password },
  user,
  issuer,
) => {
  if (
    !(await compareHash({ plaintext: oldPassword, cipherText: user.password }))
  ) {
    throw ConflictException({ message: "Invalid old password" });
  }

  for (const hash of user.oldPassword || []) {
    if (await compareHash({ plaintext: password, cipherText: hash })) {
      throw ConflictException({
        message: "This password is already used before",
      });
    }
  }

  user.oldPassword.push(user.password);
  user.password = await generateHash({ plaintext: password });
  user.changeCredentialTime = new Date();
  await user.save();

  await deleteKey(await keys(baseRevokeTokenKey(user._id)));
  return await createLoginCredentials(user, issuer);
};
