import CustomError from '../customError';

export default function (
  message?: string,
  messageCode?: string,
  details?: Record<string, any>
): CustomError {
  return new CustomError(500, {
    error: {
      message: message || 'Internal server error',
      messageCode,
      details,
    },
  });
}
