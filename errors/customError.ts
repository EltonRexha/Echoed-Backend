export default class CustomError extends Error {
  constructor(public code: number, public message: string) {
    super(message);
  }
}
