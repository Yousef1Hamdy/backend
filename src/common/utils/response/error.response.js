import { NODE_ENV } from "../../../../config/config.service.js";

export const globalErrorHandling = (error, req, res, next) => {
  let status = error.cause?.status ?? 500;
  const mode = NODE_ENV == "production";
  const defaultErrorMessage = "something went wrong server error";
  const displayErrorMessage = error.message || defaultErrorMessage;

  return res.status(status).json({
    status,
    error_message: mode
      ? status == 500
        ? defaultErrorMessage
        : displayErrorMessage
      : displayErrorMessage,
    extra: error.cause?.extra,
    stack: mode ? undefined : error.stack,
  });
};

export const ErrorException = ({
  message = "Fail",
  cause = undefined,
} = {}) => {
  throw new Error(message, { cause });
};

export const ConflictException = ({
  message = "ConflictException",
  extra = undefined,
} = {}) => {
  throw ErrorException({ message, cause: { status: 409, extra } });
};

export const NotFoundException = ({
  message = "NotFoundException",
  extra = undefined,
} = {}) => {
  throw ErrorException({ message, cause: { status: 404, extra } });
};

export const BadRequestException = ({
  message = "BadRequestException",
  extra = undefined,
} = {}) => {
  throw ErrorException({ message, cause: { status: 400, extra } });
};

export const UnauthorizedException = ({
  message = "UnauthorizedException",
  extra = undefined,
} = {}) => {
  throw ErrorException({ message, cause: { status: 401, extra } });
};

export const ForbiddenRequestException = ({
  message = "ForbiddenRequestException",
  extra = undefined,
} = {}) => {
  throw ErrorException({ message, cause: { status: 403, extra } });
};
