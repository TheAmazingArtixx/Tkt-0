-- À exécuter dans la console D1 de Cloudflare (Workers & Pages → D1 → ta base → Console)

CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  cover_image TEXT,
  content TEXT NOT NULL DEFAULT '[]',
  tags TEXT NOT NULL DEFAULT '[]',
  gradient TEXT NOT NULL DEFAULT 'g1',
  blur INTEGER NOT NULL DEFAULT 0,
  published_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

INSERT OR IGNORE INTO settings (key, value) VALUES
  ('radio_show_name', 'Radio - 21h 23h avec Nyyxtra'),
  ('radio_stream_url', 'https://source.clgnelsonmandela.com/source'),
  ('radio_enabled', '1');

-- Migration si la table existe déjà (ignore les erreurs si les colonnes existent déjà)
ALTER TABLE articles ADD COLUMN tags TEXT NOT NULL DEFAULT '[]';
ALTER TABLE articles ADD COLUMN gradient TEXT NOT NULL DEFAULT 'g1';
ALTER TABLE articles ADD COLUMN blur INTEGER NOT NULL DEFAULT 0;

INSERT OR IGNORE INTO articles (slug, title, excerpt, cover_image, content, tags, gradient, blur, published_at, updated_at)
VALUES (
  'accident-routier-a487',
  'Accident routier',
  'Accident routier, à la sortie de l''autoroute A487',
  '',
  '[{"type":"paragraph","html":"Un accident impliquant plusieurs véhicules s''est produit ce matin à la sortie de l''autoroute A487."}]',
  '["Faits divers"]',
  'g1',
  0,
  datetime('now'),
  datetime('now')
);
