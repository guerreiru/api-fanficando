import { Category } from "src/modules/category/entities/category.entity";
import { Chapter } from "src/modules/chapter/entities/chapter.entity";
import { Character } from "src/modules/character/entities/character.entity";
import { Review } from "src/modules/review/entities/review.entity";
import { Tag } from "src/modules/tag/entities/tag.entity";
import { User } from "src/modules/user/entities/user.entity";
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "book" })
export class Book {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 50 })
  title: string;

  @Column({ type: "varchar", length: 200 })
  description: string;

  @Column({ type: "varchar", length: 50 })
  audience: string;

  @Column({ type: "varchar", length: 50 })
  language: string;

  @Column({ name: "author_rights", nullable: false })
  authorRights: string;

  @Column({ name: "cover_image", nullable: true })
  coverImage?: string;

  @Column({ type: "boolean", default: false })
  mature?: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.books)
  @JoinColumn({ name: "user_id" })
  user: User;

  @OneToMany(() => Character, (character) => character.book)
  characters: Character[];

  @ManyToOne(() => Category, (category) => category.books)
  @JoinColumn({ name: "category_id" })
  category: Category;

  @OneToMany(() => Chapter, (chapter) => chapter.book)
  chapters: Chapter[];

  @ManyToMany(() => Tag, (tag) => tag.books)
  @JoinTable({
    name: "book_tags", // Nome da tabela de junção
    joinColumn: { name: "book_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "tag_id", referencedColumnName: "id" },
  })
  tags: Tag[];

  @OneToMany(() => Review, (review) => review.book)
  reviews: Review[];
}
