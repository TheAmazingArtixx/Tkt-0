-- Schéma de la base D1 pour Aston News
-- À exécuter une fois avec :
-- npx wrangler d1 execute aston-news-db --remote --file=./schema.sql

CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  cover_image TEXT,
  content TEXT NOT NULL DEFAULT '[]',
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

-- Article de démonstration (tu peux le supprimer depuis l'admin)
INSERT OR IGNORE INTO articles (slug, title, excerpt, cover_image, content, published_at, updated_at)
VALUES (
  'accident-routier-a487',
  'Accident routier',
  'Accident routier, à la sortie de l''autoroute A487',
  '',
  '[{"type":"paragraph","html":"Un accident impliquant plusieurs véhicules s''est produit ce matin à la sortie de l''autoroute A487. Les secours sont rapidement intervenus sur place."}]',
  datetime('now'),
  datetime('now')
);
