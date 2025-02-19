export default class CustomError extends Error {
  constructor(private code: number, public message: string) {
    super(message);
  }
}
