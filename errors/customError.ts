interface JsonError {
  error: {
    message: string;
    messageCode?: string;
    details?: Record<string, any>;
  };
}

export default class CustomError extends Error {
  constructor(public code: number, public jsonError: JsonError) {
    super(JSON.stringify(jsonError));
  }
}
