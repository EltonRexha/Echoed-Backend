import CustomError from '../customError';

export default function (
  message: string,
  messageCode?: string,
  details?: Record<string, any>
): CustomError {
  return new CustomError(404, {
    error: {
      message: message || 'Not found',
      messageCode,
      details,
    },
  });
}
