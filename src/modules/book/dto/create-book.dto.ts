export class CreateBookDto {
  id?: string;
  title: string;
  description: string;
  audience: string;
  language: string;
  authorRights: string;
  rating?: number;
  coverImage?: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  categoryId: string;
  tags: string[] | null;
}
