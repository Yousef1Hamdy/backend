import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import {
  ACCESS_EXPIRE_IN,
  Hospital_REFRESH_TOKEN_SECRET_KEY,
  Hospital_TOKEN_SECRET_KEY,
  REFRESH_EXPIRE_IN,
  SYSTEM_REFRESH_TOKEN_SECRET_KEY,
  SYSTEM_TOKEN_SECRET_KEY,
  USER_REFRESH_TOKEN_SECRET_KEY,
  USER_TOKEN_SECRET_KEY,
} from "../../../../config/config.service.js";
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "../response/index.js";
import { AudienceEnum, RoleEnum, TokenTypeEnum } from "../../enums/index.js";
import { findOne } from "../../../DB/database.repository.js";
import { UserModel } from "../../../DB/index.js";
import { get, revokeTokenKey } from "../../service/redis.service.js";

export const generateToken = async ({
  payload,
  security = USER_TOKEN_SECRET_KEY,
  options = {},
} = {}) => {
  const token = jwt.sign(payload, security, options);
  return token;
};

export const getTokenSignature = async (role) => {
  let accessSignature = undefined;
  let refreshSignature = undefined;
  let audience = AudienceEnum.User;
  switch (role) {
    case RoleEnum.Admin:
      accessSignature = SYSTEM_TOKEN_SECRET_KEY;
      refreshSignature = SYSTEM_REFRESH_TOKEN_SECRET_KEY;
      audience = AudienceEnum.System;

      break;
    case RoleEnum.Hospital:
      accessSignature = Hospital_TOKEN_SECRET_KEY;
      refreshSignature = Hospital_REFRESH_TOKEN_SECRET_KEY;
      audience = AudienceEnum.SystemHospital;

      break;
    case RoleEnum.Nurse:
      accessSignature = Hospital_TOKEN_SECRET_KEY;
      refreshSignature = Hospital_REFRESH_TOKEN_SECRET_KEY;
      audience = AudienceEnum.Nurse;

      break;
    default:
      accessSignature = USER_TOKEN_SECRET_KEY;
      refreshSignature = USER_REFRESH_TOKEN_SECRET_KEY;
      audience = AudienceEnum.User;
      break;
  }

  return { accessSignature, refreshSignature, audience };
};

export const getSignatureLevel = async (audienceType) => {
  let signatureLevel;
  switch (audienceType) {
    case AudienceEnum.System:
      signatureLevel = RoleEnum.Admin;
      break;
    case AudienceEnum.SystemHospital:
      signatureLevel = RoleEnum.Hospital;
      break;
    case AudienceEnum.Nurse:
      signatureLevel = RoleEnum.Nurse;
      break;
    default:
      signatureLevel = RoleEnum.User;
      break;
  }

  return { signatureLevel };
};

export const createLoginCredentials = async (user, issuer) => {
  const { accessSignature, refreshSignature, audience } =
    await getTokenSignature(user.role);

  const jwtid = randomUUID();

  const access_token = await generateToken({
    payload: { sub: user._id.toString() },
    security: accessSignature,
    options: {
      issuer,
      expiresIn: ACCESS_EXPIRE_IN,
      audience: [TokenTypeEnum.access, audience],
      jwtid,
    },
  });

  const refresh_token = await generateToken({
    payload: { sub: user._id.toString() },
    security: refreshSignature,
    options: {
      issuer,
      expiresIn: REFRESH_EXPIRE_IN,
      audience: [TokenTypeEnum.refresh, audience],
      jwtid,
    },
  });

  return { access_token, refresh_token };
};

export const verifyToken = async ({
  token,
  secret = USER_TOKEN_SECRET_KEY,
} = {}) => {
  try {
    if (!token) {
      throw UnauthorizedException({ message: "Token Required" });
    }
    const decoded = jwt.verify(token, secret);
    return decoded;
  } catch (error) {
    if (error.name == "TokenExpiredError") {
      throw UnauthorizedException({ message: "Token Expired" });
    }

    throw UnauthorizedException({ message: "Invalid Token" });
  }
};

export const decodeToken = async ({
  token,
  tokenType = TokenTypeEnum.access,
} = {}) => {
  if (!token) {
    throw BadRequestException({ message: "Missing Token" });
  }

  const decoded = jwt.decode(token);
  if (!decoded || typeof decoded !== "object") {
    throw BadRequestException({
      message: "Fail to decode this token and is required",
    });
  }

  const audiences = Array.isArray(decoded.aud)
    ? decoded.aud
    : decoded.aud
      ? [decoded.aud]
      : [];

  if (!audiences.length) {
    throw BadRequestException({
      message: "Fail to decode this token and is required",
    });
  }

  const [decodeTokenType, audienceType] = audiences;

  if (decodeTokenType !== tokenType) {
    throw BadRequestException({
      message: `Invalid token type token of type ${decodeTokenType} can't access this api while we expected token of type ${tokenType}`,
    });
  }

  if (
    decoded.jti &&
    (await get(revokeTokenKey({ userId: decoded.sub, jti: decoded.jti })))
  ) {
    throw UnauthorizedException({ message: "Invalid login session -" });
  }

  const { signatureLevel } = await getSignatureLevel(audienceType);

  const { accessSignature, refreshSignature } =
    await getTokenSignature(signatureLevel);

  const verifyData = await verifyToken({
    token,
    secret:
      tokenType == TokenTypeEnum.access ? accessSignature : refreshSignature,
  });

  const user = await findOne({
    model: UserModel,
    filter: {
      _id: verifyData.sub,
    },
    select: "+password",
  });

  if (!user) {
    throw NotFoundException({ message: "not Register account" });
  }

  if (user.role !== signatureLevel) {
    throw UnauthorizedException({
      message: "Your role has changed. Please login again.",
    });
  }

  if (
    user.changeCredentialTime &&
    user.changeCredentialTime.getTime() > decoded.iat * 1000
  ) {
    throw new UnauthorizedException({ message: "Invalid login session." });
  }

  return { user, decoded };
};
