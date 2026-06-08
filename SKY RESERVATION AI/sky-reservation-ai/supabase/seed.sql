-- ============================================================
-- SEED DATA - Sky Reservation AI
-- Negocio demo: Salón & Spa "Lumina Beauty"
-- Ejecutar en Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

DO $$
DECLARE
  v_tenant_id   UUID;
  v_staff1_id   UUID := gen_random_uuid();
  v_staff2_id   UUID := gen_random_uuid();
  v_staff3_id   UUID := gen_random_uuid();
  v_staff4_id   UUID := gen_random_uuid();

  v_svc1_id     UUID := gen_random_uuid();
  v_svc2_id     UUID := gen_random_uuid();
  v_svc3_id     UUID := gen_random_uuid();
  v_svc4_id     UUID := gen_random_uuid();
  v_svc5_id     UUID := gen_random_uuid();
  v_svc6_id     UUID := gen_random_uuid();

  v_c1_id       UUID := gen_random_uuid();
  v_c2_id       UUID := gen_random_uuid();
  v_c3_id       UUID := gen_random_uuid();
  v_c4_id       UUID := gen_random_uuid();
  v_c5_id       UUID := gen_random_uuid();
  v_c6_id       UUID := gen_random_uuid();
  v_c7_id       UUID := gen_random_uuid();
  v_c8_id       UUID := gen_random_uuid();
  v_c9_id       UUID := gen_random_uuid();
  v_c10_id      UUID := gen_random_uuid();
  v_c11_id      UUID := gen_random_uuid();
  v_c12_id      UUID := gen_random_uuid();
  v_c13_id      UUID := gen_random_uuid();
  v_c14_id      UUID := gen_random_uuid();
  v_c15_id      UUID := gen_random_uuid();
BEGIN

  -- ──────────────────────────────────────────────
  -- 0. Obtener el tenant existente del usuario
  -- ──────────────────────────────────────────────
  SELECT id INTO v_tenant_id FROM tenants LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'No hay ningún tenant creado. Inicia sesión primero en la app.';
  END IF;

  RAISE NOTICE 'Usando tenant_id: %', v_tenant_id;

  -- Actualizar nombre del tenant para que se vea bonito en la demo
  UPDATE tenants
  SET name = 'Lumina Beauty & Spa',
      slug = 'lumina-beauty',
      plan = 'pro',
      settings = '{
        "businessName": "Lumina Beauty & Spa",
        "timezone": "America/Mexico_City",
        "currency": "MXN",
        "language": "es",
        "businessHours": {
          "monday":    {"open": "09:00", "close": "19:00", "closed": false},
          "tuesday":   {"open": "09:00", "close": "19:00", "closed": false},
          "wednesday": {"open": "09:00", "close": "19:00", "closed": false},
          "thursday":  {"open": "09:00", "close": "19:00", "closed": false},
          "friday":    {"open": "09:00", "close": "20:00", "closed": false},
          "saturday":  {"open": "10:00", "close": "18:00", "closed": false},
          "sunday":    {"open": "00:00", "close": "00:00", "closed": true}
        }
      }'::jsonb
  WHERE id = v_tenant_id;

  -- ──────────────────────────────────────────────
  -- 1. SERVICIOS
  -- ──────────────────────────────────────────────
  INSERT INTO services (id, tenant_id, name, description, duration_minutes, price, active) VALUES
    (v_svc1_id, v_tenant_id, 'Corte de cabello',      'Lavado, corte y secado profesional',              45,  280.00, true),
    (v_svc2_id, v_tenant_id, 'Coloración completa',   'Tinte de raíz a puntas con productos premium',   120,  950.00, true),
    (v_svc3_id, v_tenant_id, 'Manicure clásica',      'Limpieza, limado, cutícula y esmalte',             50,  180.00, true),
    (v_svc4_id, v_tenant_id, 'Masaje relajante',      'Masaje corporal con aceites esenciales 60 min',   60,  650.00, true),
    (v_svc5_id, v_tenant_id, 'Facial hidratante',     'Limpieza profunda e hidratación facial',           75,  520.00, true),
    (v_svc6_id, v_tenant_id, 'Pedicure spa',          'Exfoliación, masaje y esmaltado de pies',          60,  220.00, true)
  ON CONFLICT DO NOTHING;

  -- ──────────────────────────────────────────────
  -- 2. STAFF
  -- ──────────────────────────────────────────────
  INSERT INTO staff (id, tenant_id, name, role, availability) VALUES
    (v_staff1_id, v_tenant_id, 'Gabriela Torres',  'admin', '{
      "monday":    [{"start":"09:00","end":"19:00"}],
      "tuesday":   [{"start":"09:00","end":"19:00"}],
      "wednesday": [{"start":"09:00","end":"19:00"}],
      "thursday":  [{"start":"09:00","end":"19:00"}],
      "friday":    [{"start":"09:00","end":"20:00"}],
      "saturday":  [{"start":"10:00","end":"18:00"}]
    }'::jsonb),
    (v_staff2_id, v_tenant_id, 'Marco Hernández',  'staff', '{
      "monday":    [{"start":"10:00","end":"19:00"}],
      "tuesday":   [{"start":"10:00","end":"19:00"}],
      "wednesday": [{"start":"10:00","end":"19:00"}],
      "thursday":  [{"start":"10:00","end":"19:00"}],
      "friday":    [{"start":"10:00","end":"20:00"}],
      "saturday":  [{"start":"11:00","end":"17:00"}]
    }'::jsonb),
    (v_staff3_id, v_tenant_id, 'Valeria Ríos',     'staff', '{
      "tuesday":   [{"start":"09:00","end":"18:00"}],
      "wednesday": [{"start":"09:00","end":"18:00"}],
      "thursday":  [{"start":"09:00","end":"18:00"}],
      "friday":    [{"start":"09:00","end":"19:00"}],
      "saturday":  [{"start":"10:00","end":"17:00"}]
    }'::jsonb),
    (v_staff4_id, v_tenant_id, 'Diego Salinas',    'staff', '{
      "monday":    [{"start":"12:00","end":"20:00"}],
      "tuesday":   [{"start":"12:00","end":"20:00"}],
      "wednesday": [{"start":"12:00","end":"20:00"}],
      "thursday":  [{"start":"12:00","end":"20:00"}],
      "friday":    [{"start":"12:00","end":"20:00"}]
    }'::jsonb)
  ON CONFLICT DO NOTHING;

  -- ──────────────────────────────────────────────
  -- 3. CLIENTES (15 clientes)
  -- ──────────────────────────────────────────────
  INSERT INTO customers (id, tenant_id, name, phone, email, tags, lead_score, metadata, total_reservations, last_contact_at) VALUES
    (v_c1_id,  v_tenant_id, 'Sofía Martínez',    '+52 55 1234 5678', 'sofia.martinez@gmail.com',
     ARRAY['vip','frecuente'], 92,
     '{"source":"referido","notes":"Prefiere citas por la mañana","preferences":{"stylist":"Gabriela Torres"}}'::jsonb,
     12, NOW() - INTERVAL '2 days'),

    (v_c2_id,  v_tenant_id, 'Carlos Ramírez',    '+52 55 2345 6789', 'carlos.ramirez@hotmail.com',
     ARRAY['nuevo'], 45,
     '{"source":"instagram","notes":"Primera vez en el salón"}'::jsonb,
     1, NOW() - INTERVAL '5 days'),

    (v_c3_id,  v_tenant_id, 'Ana Luisa Vega',    '+52 55 3456 7890', 'analuisa.vega@gmail.com',
     ARRAY['frecuente','coloracion'], 78,
     '{"source":"facebook","notes":"Alérgica a algunos tintes, usar marca Wella","preferences":{"stylist":"Marco Hernández"}}'::jsonb,
     8, NOW() - INTERVAL '10 days'),

    (v_c4_id,  v_tenant_id, 'Roberto Castillo',  '+52 55 4567 8901', 'roberto.castillo@empresa.mx',
     ARRAY['corporativo'], 60,
     '{"source":"google","notes":"Viene en hora de comida 13-15 hrs"}'::jsonb,
     4, NOW() - INTERVAL '3 weeks'),

    (v_c5_id,  v_tenant_id, 'Daniela Flores',    '+52 55 5678 9012', 'dani.flores@gmail.com',
     ARRAY['vip','spa'], 95,
     '{"source":"referido","notes":"Cliente premium, siempre da buenas propinas","preferences":{"stylist":"Valeria Ríos"}}'::jsonb,
     20, NOW() - INTERVAL '1 day'),

    (v_c6_id,  v_tenant_id, 'Miguel Ángel Reyes','+52 55 6789 0123', 'miguelr@yahoo.com',
     ARRAY['frecuente'], 55,
     '{"source":"walk-in","notes":"Puntual, confirmar cita el día anterior"}'::jsonb,
     6, NOW() - INTERVAL '2 weeks'),

    (v_c7_id,  v_tenant_id, 'Isabella García',   '+52 55 7890 1234', 'isa.garcia@outlook.com',
     ARRAY['nueva','manicure'], 38,
     '{"source":"instagram","notes":"Vio promoción de manicure en redes"}'::jsonb,
     2, NOW() - INTERVAL '1 week'),

    (v_c8_id,  v_tenant_id, 'Fernando López',    '+52 55 8901 2345', 'fer.lopez@gmail.com',
     ARRAY['frecuente'], 70,
     '{"source":"referido","notes":"Lo refirió Sofía Martínez"}'::jsonb,
     9, NOW() - INTERVAL '4 days'),

    (v_c9_id,  v_tenant_id, 'Patricia Morales',  '+52 55 9012 3456', 'paty.morales@gmail.com',
     ARRAY['vip','coloracion'], 88,
     '{"source":"facebook","notes":"Gusta de colores fantasía","preferences":{"stylist":"Gabriela Torres"}}'::jsonb,
     15, NOW() - INTERVAL '6 days'),

    (v_c10_id, v_tenant_id, 'Alejandro Ruiz',    '+52 55 0123 4567', 'alex.ruiz@empresa.com',
     ARRAY['nuevo'], 30,
     '{"source":"google","notes":"Busca servicio de masaje post-trabajo"}'::jsonb,
     1, NOW() - INTERVAL '3 days'),

    (v_c11_id, v_tenant_id, 'Lucía Mendoza',     '+52 55 1122 3344', 'lucia.mendoza@gmail.com',
     ARRAY['frecuente','spa'], 75,
     '{"source":"referido","notes":"Prefiere los viernes por la tarde"}'::jsonb,
     11, NOW() - INTERVAL '1 week'),

    (v_c12_id, v_tenant_id, 'Jorge Gutiérrez',   '+52 55 2233 4455', 'jgutierrez@hotmail.com',
     ARRAY['frecuente'], 62,
     '{"source":"walk-in","notes":"Solo cortes, viene cada 3 semanas"}'::jsonb,
     18, NOW() - INTERVAL '5 days'),

    (v_c13_id, v_tenant_id, 'Camila Herrera',    '+52 55 3344 5566', 'cami.herrera@gmail.com',
     ARRAY['nueva'], 42,
     '{"source":"instagram","notes":"Interesada en tratamientos faciales"}'::jsonb,
     2, NOW() - INTERVAL '2 weeks'),

    (v_c14_id, v_tenant_id, 'Eduardo Torres',    '+52 55 4455 6677', 'edu.torres@gmail.com',
     ARRAY['frecuente'], 68,
     '{"source":"google","notes":"Masajes cada 2 semanas por trabajo sedentario"}'::jsonb,
     10, NOW() - INTERVAL '8 days'),

    (v_c15_id, v_tenant_id, 'Valeria Mendoza',   '+52 55 5566 7788', 'vale.mendoza@outlook.com',
     ARRAY['vip','coloracion','spa'], 90,
     '{"source":"referido","notes":"Cliente desde la apertura, muy fiel","preferences":{"stylist":"Marco Hernández"}}'::jsonb,
     22, NOW() - INTERVAL '3 days')
  ON CONFLICT DO NOTHING;

  -- ──────────────────────────────────────────────
  -- 4. RESERVACIONES (mezcla de pasadas y futuras)
  -- ──────────────────────────────────────────────
  INSERT INTO reservations (tenant_id, customer_id, staff_id, service_id, start_time, end_time, status, notes) VALUES

  -- PASADAS - completadas
  (v_tenant_id, v_c1_id,  v_staff1_id, v_svc1_id, NOW()-INTERVAL '30 days'+INTERVAL '10 hours', NOW()-INTERVAL '30 days'+INTERVAL '10 hours 45 min', 'completed', 'Corte con capas largas'),
  (v_tenant_id, v_c3_id,  v_staff2_id, v_svc2_id, NOW()-INTERVAL '28 days'+INTERVAL '11 hours', NOW()-INTERVAL '28 days'+INTERVAL '13 hours',          'completed', 'Coloración castaño oscuro'),
  (v_tenant_id, v_c5_id,  v_staff3_id, v_svc4_id, NOW()-INTERVAL '25 days'+INTERVAL '15 hours', NOW()-INTERVAL '25 days'+INTERVAL '16 hours',          'completed', 'Masaje relajante, tensión en hombros'),
  (v_tenant_id, v_c12_id, v_staff1_id, v_svc1_id, NOW()-INTERVAL '22 days'+INTERVAL '09 hours', NOW()-INTERVAL '22 days'+INTERVAL '09 hours 45 min',   'completed', 'Corte clásico'),
  (v_tenant_id, v_c9_id,  v_staff1_id, v_svc2_id, NOW()-INTERVAL '20 days'+INTERVAL '14 hours', NOW()-INTERVAL '20 days'+INTERVAL '16 hours',          'completed', 'Highlights rubio miel'),
  (v_tenant_id, v_c8_id,  v_staff2_id, v_svc1_id, NOW()-INTERVAL '18 days'+INTERVAL '10 hours', NOW()-INTERVAL '18 days'+INTERVAL '10 hours 45 min',   'completed', NULL),
  (v_tenant_id, v_c14_id, v_staff4_id, v_svc4_id, NOW()-INTERVAL '15 days'+INTERVAL '13 hours', NOW()-INTERVAL '15 days'+INTERVAL '14 hours',          'completed', 'Masaje zona lumbar'),
  (v_tenant_id, v_c5_id,  v_staff3_id, v_svc5_id, NOW()-INTERVAL '14 days'+INTERVAL '16 hours', NOW()-INTERVAL '14 days'+INTERVAL '17 hours 15 min',   'completed', 'Facial con vitamina C'),
  (v_tenant_id, v_c11_id, v_staff3_id, v_svc6_id, NOW()-INTERVAL '12 days'+INTERVAL '17 hours', NOW()-INTERVAL '12 days'+INTERVAL '18 hours',          'completed', 'Pedicure con gel'),
  (v_tenant_id, v_c15_id, v_staff2_id, v_svc2_id, NOW()-INTERVAL '10 days'+INTERVAL '11 hours', NOW()-INTERVAL '10 days'+INTERVAL '13 hours',          'completed', 'Balayage'),
  (v_tenant_id, v_c1_id,  v_staff1_id, v_svc2_id, NOW()-INTERVAL '8 days' +INTERVAL '09 hours', NOW()-INTERVAL '8 days' +INTERVAL '11 hours',          'completed', 'Retoque raíz'),
  (v_tenant_id, v_c6_id,  v_staff1_id, v_svc1_id, NOW()-INTERVAL '7 days' +INTERVAL '12 hours', NOW()-INTERVAL '7 days' +INTERVAL '12 hours 45 min',   'completed', NULL),

  -- PASADAS - no_show y canceladas
  (v_tenant_id, v_c4_id,  v_staff2_id, v_svc1_id, NOW()-INTERVAL '21 days'+INTERVAL '13 hours', NOW()-INTERVAL '21 days'+INTERVAL '13 hours 45 min',   'no_show',   'No contestó llamada de confirmación'),
  (v_tenant_id, v_c10_id, v_staff4_id, v_svc4_id, NOW()-INTERVAL '9 days' +INTERVAL '18 hours', NOW()-INTERVAL '9 days' +INTERVAL '19 hours',          'cancelled', 'Canceló 2 hrs antes por trabajo'),
  (v_tenant_id, v_c13_id, v_staff3_id, v_svc5_id, NOW()-INTERVAL '5 days' +INTERVAL '10 hours', NOW()-INTERVAL '5 days' +INTERVAL '11 hours 15 min',   'cancelled', 'Reprogramar para siguiente semana'),

  -- RECIENTES - últimos 3 días
  (v_tenant_id, v_c5_id,  v_staff3_id, v_svc4_id, NOW()-INTERVAL '2 days' +INTERVAL '16 hours', NOW()-INTERVAL '2 days' +INTERVAL '17 hours',          'completed', 'Masaje express 60 min'),
  (v_tenant_id, v_c9_id,  v_staff1_id, v_svc1_id, NOW()-INTERVAL '1 day'  +INTERVAL '10 hours', NOW()-INTERVAL '1 day'  +INTERVAL '10 hours 45 min',   'completed', NULL),
  (v_tenant_id, v_c3_id,  v_staff3_id, v_svc6_id, NOW()-INTERVAL '1 day'  +INTERVAL '14 hours', NOW()-INTERVAL '1 day'  +INTERVAL '15 hours',          'completed', 'Pedicure clásico'),

  -- HOY
  (v_tenant_id, v_c12_id, v_staff1_id, v_svc1_id, NOW()+INTERVAL '1 hour',  NOW()+INTERVAL '1 hour 45 min',   'confirmed', 'Corte + barba'),
  (v_tenant_id, v_c8_id,  v_staff4_id, v_svc4_id, NOW()+INTERVAL '2 hours', NOW()+INTERVAL '3 hours',         'confirmed', NULL),
  (v_tenant_id, v_c7_id,  v_staff3_id, v_svc3_id, NOW()+INTERVAL '3 hours', NOW()+INTERVAL '3 hours 50 min',  'confirmed', 'Primera visita - manicure francesa'),

  -- FUTURAS - próximos días
  (v_tenant_id, v_c1_id,  v_staff1_id, v_svc2_id, NOW()+INTERVAL '1 day'+INTERVAL '9 hours',  NOW()+INTERVAL '1 day'+INTERVAL '11 hours',          'confirmed',  'Coloración + tratamiento de queratina'),
  (v_tenant_id, v_c15_id, v_staff2_id, v_svc1_id, NOW()+INTERVAL '1 day'+INTERVAL '11 hours', NOW()+INTERVAL '1 day'+INTERVAL '11 hours 45 min',    'confirmed',  NULL),
  (v_tenant_id, v_c14_id, v_staff4_id, v_svc4_id, NOW()+INTERVAL '2 days'+INTERVAL '13 hours',NOW()+INTERVAL '2 days'+INTERVAL '14 hours',          'confirmed',  'Masaje profundo'),
  (v_tenant_id, v_c11_id, v_staff3_id, v_svc5_id, NOW()+INTERVAL '2 days'+INTERVAL '15 hours',NOW()+INTERVAL '2 days'+INTERVAL '16 hours 15 min',   'confirmed',  'Facial anti-edad'),
  (v_tenant_id, v_c2_id,  v_staff2_id, v_svc1_id, NOW()+INTERVAL '3 days'+INTERVAL '10 hours',NOW()+INTERVAL '3 days'+INTERVAL '10 hours 45 min',   'pending',    'Nuevo cliente, confirmar por WhatsApp'),
  (v_tenant_id, v_c13_id, v_staff3_id, v_svc5_id, NOW()+INTERVAL '4 days'+INTERVAL '11 hours',NOW()+INTERVAL '4 days'+INTERVAL '12 hours 15 min',   'confirmed',  'Reprogramada desde semana pasada'),
  (v_tenant_id, v_c6_id,  v_staff1_id, v_svc1_id, NOW()+INTERVAL '5 days'+INTERVAL '12 hours',NOW()+INTERVAL '5 days'+INTERVAL '12 hours 45 min',   'confirmed',  NULL),
  (v_tenant_id, v_c4_id,  v_staff2_id, v_svc1_id, NOW()+INTERVAL '5 days'+INTERVAL '14 hours',NOW()+INTERVAL '5 days'+INTERVAL '14 hours 45 min',   'pending',    'Reagendar del no-show anterior'),
  (v_tenant_id, v_c5_id,  v_staff3_id, v_svc4_id, NOW()+INTERVAL '7 days'+INTERVAL '16 hours',NOW()+INTERVAL '7 days'+INTERVAL '17 hours',          'confirmed',  'Masaje mensual'),
  (v_tenant_id, v_c9_id,  v_staff1_id, v_svc2_id, NOW()+INTERVAL '8 days'+INTERVAL '14 hours',NOW()+INTERVAL '8 days'+INTERVAL '16 hours',          'pending',    'Color fantasia morado'),
  (v_tenant_id, v_c10_id, v_staff4_id, v_svc4_id, NOW()+INTERVAL '10 days'+INTERVAL '18 hours',NOW()+INTERVAL '10 days'+INTERVAL '19 hours',        'confirmed',  'Rescheduled after cancel')
  ON CONFLICT DO NOTHING;

  -- ──────────────────────────────────────────────
  -- 5. CONVERSACIONES
  -- ──────────────────────────────────────────────
  INSERT INTO conversations (tenant_id, customer_id, channel, status, messages, summary, duration_seconds) VALUES

  (v_tenant_id, v_c2_id, 'whatsapp', 'resolved',
   '[
     {"role":"user","content":"Hola, vi su publicación en Instagram sobre el corte de cabello","timestamp":"2024-01-10T10:00:00Z"},
     {"role":"assistant","content":"¡Hola! Bienvenido a Lumina Beauty. ¿Te gustaría agendar una cita?","timestamp":"2024-01-10T10:01:00Z"},
     {"role":"user","content":"Sí, ¿tienen disponibilidad esta semana?","timestamp":"2024-01-10T10:02:00Z"},
     {"role":"assistant","content":"Claro, tenemos espacio el miércoles a las 10am y el viernes a las 3pm. ¿Cuál te funciona?","timestamp":"2024-01-10T10:03:00Z"},
     {"role":"user","content":"El miércoles perfecto","timestamp":"2024-01-10T10:04:00Z"},
     {"role":"assistant","content":"¡Listo! Te agendé para el miércoles a las 10am. Te mandamos recordatorio el día anterior.","timestamp":"2024-01-10T10:05:00Z"}
   ]'::jsonb,
   'Cliente nuevo de Instagram interesado en corte. Agendó cita para el miércoles 10am.', 312),

  (v_tenant_id, v_c5_id, 'voice', 'resolved',
   '[
     {"role":"user","content":"Quiero cambiar mi cita del martes","timestamp":"2024-01-15T14:00:00Z"},
     {"role":"assistant","content":"Claro Daniela, ¿a qué día la prefieres?","timestamp":"2024-01-15T14:00:30Z"},
     {"role":"user","content":"Al jueves si es posible a las 4pm","timestamp":"2024-01-15T14:01:00Z"},
     {"role":"assistant","content":"Perfecto, te moví la cita al jueves a las 4pm con Valeria. ¿Algo más?","timestamp":"2024-01-15T14:01:30Z"},
     {"role":"user","content":"No gracias, hasta el jueves","timestamp":"2024-01-15T14:02:00Z"}
   ]'::jsonb,
   'Daniela llamó para cambiar su cita del martes al jueves 4pm. Cambio realizado.', 128),

  (v_tenant_id, v_c4_id, 'voice', 'missed',
   '[{"role":"system","content":"Llamada perdida sin atender","timestamp":"2024-01-18T13:15:00Z"}]'::jsonb,
   'Llamada perdida de Roberto Castillo. Requiere callback.', 0),

  (v_tenant_id, v_c9_id, 'whatsapp', 'resolved',
   '[
     {"role":"user","content":"Hola, quiero saber si tienen balayage","timestamp":"2024-01-20T09:00:00Z"},
     {"role":"assistant","content":"¡Hola Patricia! Sí ofrecemos balayage con Gabriela y Marco. El precio varía según el largo del cabello, desde $1,200 MXN.","timestamp":"2024-01-20T09:02:00Z"},
     {"role":"user","content":"Perfecto, ¿y cuánto tarda?","timestamp":"2024-01-20T09:05:00Z"},
     {"role":"assistant","content":"Aproximadamente 2.5 a 3 horas. ¿Quieres que te agende una consulta gratuita primero?","timestamp":"2024-01-20T09:07:00Z"},
     {"role":"user","content":"Sí por favor para la próxima semana","timestamp":"2024-01-20T09:10:00Z"}
   ]'::jsonb,
   'Patricia preguntó por balayage. Informada sobre precios y tiempos. Quiere consulta la próxima semana.', 0),

  (v_tenant_id, v_c1_id, 'whatsapp', 'resolved',
   '[
     {"role":"user","content":"Sofía aquí, ¿puedo venir mañana temprano?","timestamp":"2024-01-22T18:00:00Z"},
     {"role":"assistant","content":"¡Hola Sofía! Claro, tienes las 9am disponible con Gabriela. ¿Te funciona?","timestamp":"2024-01-22T18:01:00Z"},
     {"role":"user","content":"Perfecto, ahí estaré","timestamp":"2024-01-22T18:02:00Z"}
   ]'::jsonb,
   'Sofía confirmó cita de mañana a las 9am con Gabriela.', 0),

  (v_tenant_id, v_c10_id, 'web', 'resolved',
   '[
     {"role":"user","content":"¿Qué tipos de masaje ofrecen?","timestamp":"2024-01-23T20:00:00Z"},
     {"role":"assistant","content":"Ofrecemos masaje relajante de 60 min ($650), masaje deportivo y masaje de puntos de tensión. Todos con Diego Salinas, especialista en terapia corporal.","timestamp":"2024-01-23T20:01:00Z"},
     {"role":"user","content":"¿Y tienen horarios nocturnos?","timestamp":"2024-01-23T20:03:00Z"},
     {"role":"assistant","content":"Diego atiende hasta las 8pm de lunes a viernes. ¿Te agendamos?","timestamp":"2024-01-23T20:04:00Z"},
     {"role":"user","content":"Sí, el próximo lunes a las 7pm si hay","timestamp":"2024-01-23T20:06:00Z"}
   ]'::jsonb,
   'Alejandro preguntó por masajes y horarios nocturnos. Quiere cita lunes 7pm con Diego.', 0),

  (v_tenant_id, v_c7_id, 'whatsapp', 'active',
   '[
     {"role":"user","content":"Quiero saber más de la manicure francesa","timestamp":"2024-01-25T11:00:00Z"},
     {"role":"assistant","content":"¡Hola Isabella! La manicure francesa incluye limpieza de cutícula, limado y aplicación de esmalte french. Dura unos 50 min y cuesta $180. ¿Tienes dudas sobre el servicio?","timestamp":"2024-01-25T11:02:00Z"},
     {"role":"user","content":"¿Usan gel o esmalte normal?","timestamp":"2024-01-25T11:05:00Z"}
   ]'::jsonb,
   'Isabella preguntando sobre opciones de manicure francesa. Conversación activa.', 0),

  (v_tenant_id, v_c15_id, 'voice', 'resolved',
   '[
     {"role":"user","content":"Hola, soy Valeria, llamo para confirmar mi cita de mañana","timestamp":"2024-01-26T16:00:00Z"},
     {"role":"assistant","content":"¡Hola Valeria! Sí, tienes tu cita mañana a las 11am con Marco para el balayage. ¿Todo bien?","timestamp":"2024-01-26T16:00:30Z"},
     {"role":"user","content":"Sí perfecto, hasta mañana","timestamp":"2024-01-26T16:01:00Z"}
   ]'::jsonb,
   'Valeria confirmó su cita de mañana con Marco para balayage.', 65)

  ON CONFLICT DO NOTHING;

  -- ──────────────────────────────────────────────
  -- 6. REGLAS DE AUTOMATIZACIÓN
  -- ──────────────────────────────────────────────
  INSERT INTO automation_rules (tenant_id, name, trigger, action, config, enabled, trigger_count) VALUES
  (v_tenant_id,
   'Confirmación automática de cita',
   'new_reservation',
   'send_whatsapp',
   '{"message": "¡Hola {{customer_name}}! Tu cita en Lumina Beauty ha sido confirmada para el {{date}} a las {{time}} con {{staff_name}}. Si necesitas cambiarla escríbenos. ¡Te esperamos!"}'::jsonb,
   true, 28),

  (v_tenant_id,
   'Seguimiento a no-shows',
   'no_show',
   'send_whatsapp',
   '{"message": "Hola {{customer_name}}, notamos que no pudiste asistir a tu cita de hoy. ¿Todo bien? Queremos reagendarte sin costo. Escríbenos cuando puedas."}'::jsonb,
   true, 3),

  (v_tenant_id,
   'Bienvenida a nuevos clientes',
   'new_customer',
   'send_whatsapp',
   '{"message": "¡Bienvenido/a a Lumina Beauty & Spa, {{customer_name}}! 🌟 Estamos felices de tenerte. Para tu primera cita tienes un 10% de descuento. Agenda en cualquier momento."}'::jsonb,
   true, 15),

  (v_tenant_id,
   'Seguimiento 3 días post-cita',
   'follow_up_3day',
   'send_whatsapp',
   '{"message": "Hola {{customer_name}}, ¿cómo te fue con tu servicio del {{date}}? Tu opinión es muy importante para nosotros. Si quedaste satisfecha, ¡comparte tu experiencia! 💜"}'::jsonb,
   true, 12),

  (v_tenant_id,
   'Callback llamadas perdidas',
   'missed_call',
   'n8n_webhook',
   '{"webhookUrl": "https://n8n.lumina-beauty.com/webhook/missed-call"}'::jsonb,
   false, 7)
  ON CONFLICT DO NOTHING;

  -- ──────────────────────────────────────────────
  -- 7. NOTIFICACIONES
  -- ──────────────────────────────────────────────
  INSERT INTO notifications (tenant_id, user_id, type, title, body, read, metadata) VALUES
  (v_tenant_id, NULL, 'new_reservation',
   'Nueva cita confirmada',
   'Sofía Martínez agendó una cita de coloración para mañana a las 9am',
   false, '{"customerId": "sofia", "service": "Coloración completa"}'::jsonb),

  (v_tenant_id, NULL, 'missed_call',
   'Llamada perdida',
   'Roberto Castillo llamó hace 2 horas y no fue atendido',
   false, '{"phone": "+52 55 4567 8901", "time": "13:15"}'::jsonb),

  (v_tenant_id, NULL, 'new_customer',
   'Nuevo cliente registrado',
   'Carlos Ramírez se registró desde Instagram',
   true, '{"source": "instagram"}'::jsonb),

  (v_tenant_id, NULL, 'new_reservation',
   'Cita pendiente de confirmar',
   'Carlos Ramírez tiene una cita pendiente que necesita confirmación por WhatsApp',
   false, '{"status": "pending"}'::jsonb),

  (v_tenant_id, NULL, 'system',
   'Meta de reservas alcanzada',
   '¡Felicitaciones! Alcanzaron 30 reservas este mes',
   true, '{"metric": "reservations", "value": 30}'::jsonb),

  (v_tenant_id, NULL, 'missed_call',
   'Llamada perdida - cliente VIP',
   'Daniela Flores (VIP) llamó y no fue atendida',
   false, '{"phone": "+52 55 5678 9012", "priority": "high"}'::jsonb)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ Seed completado exitosamente para tenant: %', v_tenant_id;
  RAISE NOTICE '   • 6 servicios insertados';
  RAISE NOTICE '   • 4 staff insertados';
  RAISE NOTICE '   • 15 clientes insertados';
  RAISE NOTICE '   • 32 reservaciones insertadas';
  RAISE NOTICE '   • 8 conversaciones insertadas';
  RAISE NOTICE '   • 5 reglas de automatización insertadas';
  RAISE NOTICE '   • 6 notificaciones insertadas';

END $$;
