import {
  decodeToken,
  ForbiddenRequestException,
  TokenTypeEnum,
  UnauthorizedException,
} from "../common/index.js";
export const authentication = (tokenType = TokenTypeEnum.access) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      // console.log({authHeader});
      if (!authHeader) {
        throw UnauthorizedException({ message: "Unauthorized" });
      }

      const [flag, credential] = authHeader.split(" ");

      if (!flag || !credential || flag !== "Bearer") {
        throw new UnauthorizedException({ message: "Invalid token format" });
      }
      const { user, decoded } = await decodeToken({
        token: credential,
        tokenType,
      });
      console.log({user});
      req.user = user;
      req.decoded = decoded;
      next();
    } catch (error) {
      throw error;
    }
  };
};

export const authorization = (accessRoles = []) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new UnauthorizedException({ message: "Unauthorized" });
      }

      if (!accessRoles.includes(req.user.role)) {
        throw ForbiddenRequestException({ message: "Not allow account" });
      }

      next();
    } catch (error) {
      throw error;
    }
  };
};
