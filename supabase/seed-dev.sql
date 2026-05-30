-- Dev testdata — student bouwkundig tekenen (alleen portfolio-dev, NOOIT op production)

UPDATE site_settings SET
  owner_name = 'Milan Boskamp',
  hero_title = 'Milan Boskamp',
  hero_subtitle = 'Student bouwkundig tekenen',
  about_text = 'Ik volg een opleiding bouwkundig tekenen en werk aan technische tekeningen, plattegronden, gevels en presentatiemateriaal. In dit portfolio verzamel ik schoolprojecten, stages en het werk waar ik trots op ben. Vervang deze teksten gerust via het admin-dashboard met je eigen verhaal.',
  profile_image_url = '',
  primary_color = '#3d5a6c',
  background_color = '#f4f2ef',
  text_color = '#1c1917',
  font_family = 'Inter, system-ui, sans-serif',
  button_radius = '6px',
  contact_email = 'milanboskamp@gmail.com',
  linkedin_url = 'https://www.linkedin.com/',
  instagram_url = 'https://www.instagram.com/'
WHERE id = 1;

DELETE FROM projects;
INSERT INTO projects (title, description, image_url, live_url, sort_order, is_featured) VALUES
  (
    'Woningontwerp — plattegrond & gevels',
    'Schoolproject: complete set technische tekeningen inclusief plattegronden, doorsneden en gevelaanzichten. Schaal 1:50, gedetailleerde maatvoering en materiaalaanduiding.',
    '',
    '',
    0,
    true
  ),
  (
    'Renovatieconcept bestaand bouw',
    'Analyse van bestaand pand, voorstel voor verbouwing met focus op constructie en ruimtelijke indeling. Inclusief situatietekening en detailuitwerkingen.',
    '',
    '',
    1,
    false
  ),
  (
    'Maquette & presentatieblad',
    'Fysiek schaalmodel gecombineerd met een presentatieposter voor de eindbeoordeling. Upload later een foto van je maquette via admin.',
    '',
    '',
    2,
    false
  );

DELETE FROM skills;
INSERT INTO skills (name, category, sort_order) VALUES
  ('Technisch tekenen', 'Tekenen & ontwerp', 0),
  ('Plattegronden & doorsneden', 'Tekenen & ontwerp', 1),
  ('Handschets & schetsontwerp', 'Tekenen & ontwerp', 2),
  ('AutoCAD', 'Software', 0),
  ('Revit / BIM', 'Software', 1),
  ('SketchUp', 'Software', 2),
  ('Bouwkunde & constructie', 'Vakkennis', 0),
  ('Materialen & detaillering', 'Vakkennis', 1),
  ('Maatvoering & normering', 'Vakkennis', 2);

DELETE FROM experiences;
INSERT INTO experiences (title, company, start_date, end_date, description, sort_order) VALUES
  (
    'Stage — tekenaar / ondersteuning ontwerp',
    'Architectenbureau (vul naam in via admin)',
    '2025',
    '2025',
    'Ondersteuning bij het uitwerken van bouwtekeningen, archiefbeheer en meedenken over detailoplossingen.',
    0
  ),
  (
    'Schoolproject — teamwerk woningbouw',
    'Opleiding bouwkundig tekenen',
    '2024',
    '2025',
    'Samenwerking aan een volledig projectdossier: van schets tot technische bladen en presentatie.',
    1
  );

DELETE FROM educations;
INSERT INTO educations (title, school, start_date, end_date, description, sort_order) VALUES
  (
    'Bouwkundig tekenen',
    'Naam van je school (pas aan via admin)',
    '2023',
    'Heden',
    'Focus op technische tekeningen, bouwkundige details, 3D-visualisatie en projectmatig werken volgens bouwpraktijk.',
    0
  );
