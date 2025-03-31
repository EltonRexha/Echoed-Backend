export default interface Seeder {
  seed(amount: number): Promise<void>;
}
