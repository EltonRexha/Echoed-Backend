import CustomError from '../customError';

export default function (
  message?: string,
  messageCode?: string
): CustomError {
  return new CustomError(500, {
    error: {
      message: message || 'Not found',
      messageCode,
    },
  });
}
