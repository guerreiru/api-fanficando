-- Habilitar a extensão uuid-ossp se ainda não estiver habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE user (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(120) NOT NULL,
  user_name VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  birth_date DATE NOT NULL,
  profile_img_url VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_name UNIQUE (user_name),
  CONSTRAINT unique_email UNIQUE (email)
);

-- Tabela category
CREATE TABLE category (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL UNIQUE,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabela book
CREATE TABLE book (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	title VARCHAR(50) NOT NULL,
	description VARCHAR(120) NOT NULL,
	audience VARCHAR NOT NULL,
	language VARCHAR(50) NOT NULL,
	author_rights VARCHAR NOT NULL,
	cover_image VARCHAR,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	user_id UUID,
	category_id UUID,
	FOREIGN KEY (user_id) REFERENCES "user"(id),
	FOREIGN KEY (category_id) REFERENCES category(id)
);

-- Tabela character
CREATE TABLE character (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	name VARCHAR(50) NOT NULL,
	book_id UUID,
	FOREIGN KEY (book_id) REFERENCES book(id),
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela chapter
CREATE TABLE chapter (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	chapter_name VARCHAR(50) NOT NULL,
	chapter_content TEXT NOT NULL,
	chapter_image VARCHAR,
	book_id UUID,
	FOREIGN KEY (book_id) REFERENCES book(id),
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela tag
CREATE TABLE tag (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de junção book_tags_tag para relacionamento muitos-para-muitos entre book e tag
CREATE TABLE book_tags_tag (
	y
);

CREATE TABLE user_book (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	user_id UUID NOT NULL,
	book_id UUID NOT NULL,
	status VARCHAR(255) NOT NULL,
	progress DECIMAL(5,2) DEFAULT 0,
	last_read_chapter INTEGER,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (user_id) REFERENCES "user" (id),
	FOREIGN KEY (book_id) REFERENCES book (id)
);