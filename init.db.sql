-- Habilitar a extensão uuid-ossp se ainda não estiver habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela user
CREATE TABLE "user" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(120) NOT NULL,
    user_name VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(50) NOT NULL,
    birth_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Função e trigger para atualizar a coluna updated_at na tabela user
CREATE OR REPLACE FUNCTION update_updated_at_column_user()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_user_updated_at
BEFORE UPDATE ON "user"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column_user();

-- Tabela category
CREATE TABLE category (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Função e trigger para atualizar a coluna updated_at na tabela category
CREATE OR REPLACE FUNCTION update_updated_at_column_category()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_category_updated_at
BEFORE UPDATE ON category
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column_category();

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

-- Função e trigger para atualizar a coluna updated_at na tabela book
CREATE OR REPLACE FUNCTION update_updated_at_column_book()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_book_updated_at
BEFORE UPDATE ON book
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column_book();

-- Tabela character
CREATE TABLE character (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    book_id UUID,
    FOREIGN KEY (book_id) REFERENCES book(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Função e trigger para atualizar a coluna updated_at na tabela character
CREATE OR REPLACE FUNCTION update_updated_at_column_character()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_character_updated_at
BEFORE UPDATE ON character
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column_character();

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

-- Função e trigger para atualizar a coluna updated_at na tabela chapter
CREATE OR REPLACE FUNCTION update_updated_at_column_chapter()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_chapter_updated_at
BEFORE UPDATE ON chapter
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column_chapter();

-- Tabela tag
CREATE TABLE tag (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Função e trigger para atualizar a coluna updated_at na tabela tag
CREATE OR REPLACE FUNCTION update_updated_at_column_tag()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_tag_updated_at
BEFORE UPDATE ON tag
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column_tag();

-- Tabela de junção book_tags_tag para relacionamento muitos-para-muitos entre book e tag
CREATE TABLE book_tags_tag (
    book_id UUID,
    tag_id UUID,
    PRIMARY KEY (book_id, tag_id),
    FOREIGN KEY (book_id) REFERENCES book(id),
    FOREIGN KEY (tag_id) REFERENCES tag(id)
);

CREATE TABLE user_book (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    book_id UUID NOT NULL,
    status VARCHAR(255) NOT NULL,
    progress DECIMAL(5,2) DEFAULT 0,
    last_read_chapter INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES "user" (id),
    FOREIGN KEY (book_id) REFERENCES book (id)
);