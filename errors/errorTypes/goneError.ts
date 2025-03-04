import CustomError from '../customError';

export default function (
  message: string,
  messageCode?: string
): CustomError {
  return new CustomError(410, {
    error: {
      message,
      messageCode,
    },
  });
}
