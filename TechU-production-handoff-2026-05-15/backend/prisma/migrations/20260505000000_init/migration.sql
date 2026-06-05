-- CreateTable
CREATE TABLE IF NOT EXISTS users (
  id            CHAR(36) PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS user_roles (
  id         CHAR(36) PRIMARY KEY,
  user_id    CHAR(36) NOT NULL,
  role       ENUM('admin','user') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_role (user_id, role),
  CONSTRAINT fk_user_roles_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS demo_requests (
  id             CHAR(36) PRIMARY KEY,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  full_name      VARCHAR(120) NOT NULL,
  email          VARCHAR(255) NOT NULL,
  phone          VARCHAR(40)  NOT NULL,
  course         VARCHAR(200) NOT NULL,
  preferred_date VARCHAR(40),
  source         ENUM('application','brochure','demo') NOT NULL,
  status         ENUM('new','contacted','converted','archived') NOT NULL DEFAULT 'new',
  notes          TEXT,
  updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                  ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_demo_requests_created_at (created_at DESC),
  INDEX idx_demo_requests_source     (source),
  INDEX idx_demo_requests_status     (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS site_content (
  section_key VARCHAR(120) PRIMARY KEY,
  data        JSON NOT NULL,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
              ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS blog_posts (
  id            CHAR(36) PRIMARY KEY,
  slug          VARCHAR(160) NOT NULL UNIQUE,
  title         VARCHAR(240) NOT NULL,
  excerpt       VARCHAR(500) NOT NULL DEFAULT '',
  body          MEDIUMTEXT NOT NULL,
  cover_image   VARCHAR(500) NOT NULL DEFAULT '',
  author        VARCHAR(120) NOT NULL DEFAULT '',
  tags          JSON NOT NULL,
  published     TINYINT(1) NOT NULL DEFAULT 0,
  published_at  TIMESTAMP NULL DEFAULT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_blog_posts_published (published, published_at DESC),
  INDEX idx_blog_posts_created   (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
