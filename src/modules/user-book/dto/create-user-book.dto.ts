export class CreateUserBookDto {
  id?: string;
  userId: string;
  bookId: string;
  status: string;
  progress: number;
  lastReadChapter: number;
}
