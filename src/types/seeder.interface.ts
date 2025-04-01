export type SeederNames = 'user' | 'post' | 'comment' | 'tags';
export type SeederDataList = { [k in SeederNames]: string[] };

export default interface Seeder {
  seed(amount: number, prevSeederIds: SeederDataList): Promise<string[]>;
}
