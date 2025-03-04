import CustomError from '../customError';

export default function (
  message: string,
  messageCode?: string,
  details?: Record<string, any>
): CustomError {
  return new CustomError(410, {
    error: {
      message,
      messageCode,
      details,
    },
  });
}
