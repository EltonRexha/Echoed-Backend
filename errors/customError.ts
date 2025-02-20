interface JsonError {
  error: any;
}

export default class CustomError extends Error {
  constructor(
    public code: number,
    public jsonError: JsonError
  ) {
    super(JSON.stringify(jsonError));
  }
}
