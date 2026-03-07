-- ============================================
-- SEED: Ejercicios para FitBoch
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- PECHO
INSERT INTO ejercicios (nombre, descripcion, instrucciones, grupo_muscular, categoria, nivel) VALUES
('Press de banca con barra', 'Ejercicio principal para desarrollar el pecho.', 'Acuéstate en el banco plano, agarra la barra con las manos un poco más abiertas que los hombros. Baja la barra controladamente hasta el pecho y empuja hacia arriba hasta extender los brazos.', 'pecho', 'fuerza', 'todos'),
('Press de banca inclinado', 'Enfocado en la parte superior del pecho.', 'En banco inclinado a 30-45°, baja la barra hasta la parte alta del pecho y empuja hacia arriba. Mantén los pies firmes en el suelo.', 'pecho', 'fuerza', 'intermedio'),
('Press de banca declinado', 'Trabaja la parte inferior del pecho.', 'En banco declinado, agarra la barra y bájala hasta la parte baja del pecho. Empuja hasta extender los brazos completamente.', 'pecho', 'fuerza', 'intermedio'),
('Aperturas con mancuernas', 'Aislamiento para pecho con gran estiramiento.', 'Acostado en banco plano, con mancuernas en cada mano y brazos extendidos arriba. Abre los brazos en arco hasta sentir estiramiento en el pecho, luego cierra controladamente.', 'pecho', 'fuerza', 'todos'),
('Fondos en paralelas (pecho)', 'Ejercicio compuesto con peso corporal.', 'Sujétate de las barras paralelas, inclina el torso ligeramente hacia adelante. Baja hasta que los codos formen 90° y empuja hacia arriba.', 'pecho', 'fuerza', 'intermedio'),
('Push-ups (flexiones)', 'Ejercicio básico de empuje con peso corporal.', 'Posición de plancha con manos un poco más abiertas que los hombros. Baja el cuerpo hasta que el pecho casi toque el suelo y empuja hacia arriba.', 'pecho', 'fuerza', 'principiante'),
('Press con mancuernas', 'Variante con mayor rango de movimiento.', 'Acostado en banco plano con una mancuerna en cada mano. Baja las mancuernas a los lados del pecho y empuja hacia arriba juntándolas arriba.', 'pecho', 'fuerza', 'todos'),
('Crossover en poleas', 'Aislamiento de pecho con tensión constante.', 'De pie entre dos poleas altas, agarra los mangos y da un paso adelante. Con los codos ligeramente flexionados, junta las manos frente al pecho en arco.', 'pecho', 'fuerza', 'intermedio');

-- ESPALDA
INSERT INTO ejercicios (nombre, descripcion, instrucciones, grupo_muscular, categoria, nivel) VALUES
('Dominadas (pull-ups)', 'Ejercicio rey para la espalda con peso corporal.', 'Cuélgate de la barra con agarre prono (palmas al frente) más ancho que los hombros. Jala tu cuerpo hacia arriba hasta que la barbilla pase la barra. Baja controladamente.', 'espalda', 'fuerza', 'intermedio'),
('Remo con barra', 'Ejercicio compuesto para espalda media.', 'Con las rodillas ligeramente flexionadas, inclina el torso a 45°. Agarra la barra y jala hacia el abdomen, apretando las escápulas. Baja controladamente.', 'espalda', 'fuerza', 'todos'),
('Remo con mancuerna a una mano', 'Trabajo unilateral de espalda.', 'Apoya una rodilla y mano en el banco. Con la otra mano toma la mancuerna y jala hacia la cadera, apretando la escápula. Baja despacio.', 'espalda', 'fuerza', 'todos'),
('Jalón al pecho (polea alta)', 'Alternativa a dominadas para todos los niveles.', 'Sentado en la máquina de polea alta, agarra la barra ancha. Jala hacia el pecho sacando el pecho, aprieta las escápulas abajo y atrás. Regresa controladamente.', 'espalda', 'fuerza', 'principiante'),
('Peso muerto', 'Ejercicio compuesto que trabaja toda la cadena posterior.', 'Con los pies al ancho de caderas, agarra la barra. Mantén la espalda recta, empuja el suelo con los pies y sube hasta estar completamente erguido. Baja con control.', 'espalda', 'fuerza', 'avanzado'),
('Remo en máquina', 'Movimiento guiado para espalda media.', 'Sentado en la máquina de remo, agarra los mangos. Jala hacia tu torso apretando las escápulas juntas. Regresa con control sin soltar la tensión.', 'espalda', 'fuerza', 'principiante'),
('Face pulls en polea', 'Excelente para salud del hombro y espalda alta.', 'Con la polea a la altura de la cara, agarra la cuerda con ambas manos. Jala hacia tu cara separando las manos, aprieta las escápulas. Regresa lento.', 'espalda', 'fuerza', 'todos'),
('Remo en T', 'Variante de remo para espalda media y baja.', 'De pie sobre la plataforma del remo en T, agarra los mangos. Con el torso inclinado, jala el peso hacia el pecho apretando la espalda. Baja controlado.', 'espalda', 'fuerza', 'intermedio');

-- PIERNAS
INSERT INTO ejercicios (nombre, descripcion, instrucciones, grupo_muscular, categoria, nivel) VALUES
('Sentadilla con barra', 'Ejercicio fundamental para piernas completas.', 'Con la barra en la parte alta de la espalda, pies al ancho de hombros. Baja flexionando rodillas y caderas como si te sentaras. Baja hasta que los muslos estén paralelos al suelo y sube empujando.', 'piernas', 'fuerza', 'todos'),
('Prensa de piernas', 'Trabajo de piernas con soporte para la espalda.', 'Sentado en la máquina de prensa, coloca los pies al ancho de hombros en la plataforma. Baja la plataforma flexionando las rodillas a 90° y empuja hacia arriba sin bloquear rodillas.', 'piernas', 'fuerza', 'principiante'),
('Extensión de cuádriceps', 'Aislamiento de cuádriceps en máquina.', 'Sentado en la máquina de extensiones, engancha los tobillos bajo la almohadilla. Extiende las piernas hasta que estén rectas, aprieta los cuádriceps arriba. Baja con control.', 'piernas', 'fuerza', 'principiante'),
('Curl de pierna acostado', 'Aislamiento de isquiotibiales.', 'Acostado boca abajo en la máquina de curl, engancha los tobillos bajo la almohadilla. Flexiona las rodillas llevando los talones hacia los glúteos. Baja controladamente.', 'piernas', 'fuerza', 'principiante'),
('Sentadilla búlgara', 'Ejercicio unilateral avanzado para piernas.', 'Con un pie apoyado en un banco detrás de ti, baja flexionando la rodilla delantera hasta que el muslo esté paralelo al suelo. Empuja con el pie delantero para subir.', 'piernas', 'fuerza', 'intermedio'),
('Zancadas caminando', 'Ejercicio funcional para piernas y equilibrio.', 'De pie, da un paso largo al frente y flexiona ambas rodillas a 90°. La rodilla trasera casi toca el suelo. Empuja con el pie delantero y da el siguiente paso con la otra pierna.', 'piernas', 'fuerza', 'todos'),
('Sentadilla frontal', 'Mayor énfasis en cuádriceps y core.', 'Con la barra apoyada en la parte frontal de los hombros, baja en sentadilla manteniendo el torso lo más vertical posible. Sube empujando con fuerza.', 'piernas', 'fuerza', 'avanzado'),
('Hack squat', 'Sentadilla guiada en máquina para cuádriceps.', 'Apoya la espalda en la almohadilla de la máquina hack. Coloca los pies al ancho de hombros. Baja flexionando las rodillas y sube empujando la plataforma.', 'piernas', 'fuerza', 'intermedio');

-- HOMBROS
INSERT INTO ejercicios (nombre, descripcion, instrucciones, grupo_muscular, categoria, nivel) VALUES
('Press militar con barra', 'Ejercicio principal para hombros.', 'De pie o sentado, agarra la barra a la altura de los hombros con agarre un poco más ancho que los hombros. Empuja la barra hacia arriba hasta extender los brazos. Baja controladamente.', 'hombros', 'fuerza', 'todos'),
('Press con mancuernas sentado', 'Trabajo de hombros con mayor rango de movimiento.', 'Sentado con respaldo, sostén una mancuerna en cada mano a la altura de los hombros. Empuja hacia arriba hasta extender los brazos y baja con control.', 'hombros', 'fuerza', 'todos'),
('Elevaciones laterales', 'Aislamiento del deltoides lateral.', 'De pie con una mancuerna en cada mano a los lados. Eleva los brazos hacia los lados hasta la altura de los hombros, con los codos ligeramente flexionados. Baja despacio.', 'hombros', 'fuerza', 'todos'),
('Elevaciones frontales', 'Aislamiento del deltoides frontal.', 'De pie con mancuernas frente a los muslos. Eleva una mancuerna al frente hasta la altura del hombro con el brazo casi extendido. Alterna brazos o hazlo simultáneo.', 'hombros', 'fuerza', 'principiante'),
('Pájaros (elevaciones posteriores)', 'Trabajo del deltoides posterior.', 'Inclinado hacia adelante con el torso casi paralelo al suelo, mancuernas colgando. Eleva los brazos hacia los lados apretando las escápulas. Baja controlado.', 'hombros', 'fuerza', 'todos'),
('Press Arnold', 'Variante de press que trabaja los 3 deltoides.', 'Sentado, comienza con las mancuernas frente al pecho y palmas hacia ti. Empuja hacia arriba rotando las palmas hacia adelante. Invierte el movimiento al bajar.', 'hombros', 'fuerza', 'intermedio'),
('Encogimientos de hombros', 'Trabajo de trapecios superiores.', 'De pie con mancuernas a los lados o barra al frente. Eleva los hombros hacia las orejas sin flexionar los codos. Mantén arriba 1 segundo y baja lento.', 'hombros', 'fuerza', 'principiante');

-- BÍCEPS
INSERT INTO ejercicios (nombre, descripcion, instrucciones, grupo_muscular, categoria, nivel) VALUES
('Curl con barra recta', 'Ejercicio principal para bíceps.', 'De pie con la barra agarrada con las palmas hacia arriba al ancho de hombros. Flexiona los codos llevando la barra hacia los hombros sin mover los codos. Baja controlado.', 'bíceps', 'fuerza', 'todos'),
('Curl con mancuernas alterno', 'Trabajo unilateral de bíceps.', 'De pie con una mancuerna en cada mano, palmas hacia el cuerpo. Alterna flexionando un brazo, rotando la palma hacia arriba durante la subida. Baja controlando.', 'bíceps', 'fuerza', 'todos'),
('Curl martillo', 'Trabaja bíceps y braquial para brazos más gruesos.', 'De pie con mancuernas a los lados y palmas enfrentadas (agarre neutro). Flexiona los codos subiendo las mancuernas sin rotar las muñecas. Baja con control.', 'bíceps', 'fuerza', 'todos'),
('Curl en banco Scott (predicador)', 'Aislamiento estricto de bíceps.', 'Sentado en el banco Scott, apoya los brazos sobre la almohadilla. Con barra o mancuerna, flexiona los codos hasta arriba. Baja despacio estirando completamente.', 'bíceps', 'fuerza', 'todos'),
('Curl concentrado', 'Aislamiento máximo con una sola mancuerna.', 'Sentado, apoya el codo del brazo de trabajo en la parte interna del muslo. Con la mancuerna, flexiona el brazo llevando el peso hacia el hombro. Aprieta arriba y baja lento.', 'bíceps', 'fuerza', 'principiante'),
('Curl con barra Z', 'Variante que reduce la tensión en las muñecas.', 'De pie, agarra la barra Z por las partes anguladas. Flexiona los codos subiendo la barra hacia los hombros sin balancear el cuerpo. Baja controladamente.', 'bíceps', 'fuerza', 'todos'),
('Curl en polea baja', 'Tensión constante durante todo el movimiento.', 'De pie frente a la polea baja, agarra la barra o cuerda. Flexiona los codos llevando las manos hacia los hombros. Resiste al bajar manteniendo la tensión.', 'bíceps', 'fuerza', 'principiante');

-- TRÍCEPS
INSERT INTO ejercicios (nombre, descripcion, instrucciones, grupo_muscular, categoria, nivel) VALUES
('Fondos en paralelas (tríceps)', 'Ejercicio compuesto pesado para tríceps.', 'En barras paralelas, mantén el torso recto (sin inclinar). Baja flexionando los codos hasta 90° y empuja hacia arriba enfocándote en apretar los tríceps.', 'tríceps', 'fuerza', 'intermedio'),
('Press francés con barra Z', 'Aislamiento clásico para tríceps.', 'Acostado en banco plano, sostén la barra Z con los brazos extendidos sobre la cara. Flexiona los codos bajando la barra hacia la frente sin mover los hombros. Extiende los brazos.', 'tríceps', 'fuerza', 'todos'),
('Extensión de tríceps en polea', 'Aislamiento con tensión constante.', 'De pie frente a la polea alta con barra o cuerda. Mantén los codos pegados al cuerpo. Extiende los brazos hacia abajo apretando los tríceps. Sube con control.', 'tríceps', 'fuerza', 'principiante'),
('Extensión de tríceps con mancuerna sobre cabeza', 'Estiramiento máximo del tríceps largo.', 'Sentado o de pie, sostén una mancuerna con ambas manos sobre la cabeza. Flexiona los codos bajando la mancuerna detrás de la cabeza. Extiende los brazos hacia arriba.', 'tríceps', 'fuerza', 'todos'),
('Patada de tríceps', 'Aislamiento unilateral de tríceps.', 'Inclinado con una mano y rodilla en el banco. Con la otra mano sostén la mancuerna con el codo a 90°. Extiende el brazo hacia atrás apretando el tríceps. Baja con control.', 'tríceps', 'fuerza', 'principiante'),
('Press cerrado con barra', 'Press de banca enfocado en tríceps.', 'Acostado en banco plano, agarra la barra con las manos al ancho de hombros o más cerradas. Baja la barra al pecho y empuja hacia arriba enfocándote en los tríceps.', 'tríceps', 'fuerza', 'intermedio'),
('Extensión de tríceps en polea con cuerda', 'Permite separar las manos al final para mayor contracción.', 'De pie en la polea alta con la cuerda. Tira hacia abajo extendiendo los brazos y separa las puntas de la cuerda al final. Sube controlando.', 'tríceps', 'fuerza', 'todos');

-- GLÚTEOS
INSERT INTO ejercicios (nombre, descripcion, instrucciones, grupo_muscular, categoria, nivel) VALUES
('Hip thrust con barra', 'Ejercicio #1 para desarrollo de glúteos.', 'Sentado en el suelo con la espalda alta apoyada en un banco, coloca la barra sobre las caderas. Empuja las caderas hacia arriba apretando los glúteos hasta que el torso quede paralelo al suelo. Baja con control.', 'glúteos', 'fuerza', 'todos'),
('Puente de glúteos', 'Versión en suelo del hip thrust.', 'Acostado boca arriba con las rodillas flexionadas y pies en el suelo. Empuja las caderas hacia arriba apretando los glúteos. Mantén arriba 2 segundos y baja lento.', 'glúteos', 'fuerza', 'principiante'),
('Sentadilla sumo', 'Sentadilla con énfasis en glúteos y aductores.', 'De pie con los pies más anchos que los hombros y puntas hacia afuera. Baja en sentadilla manteniendo la espalda recta y las rodillas hacia afuera. Sube apretando los glúteos.', 'glúteos', 'fuerza', 'todos'),
('Patada de glúteo en máquina', 'Aislamiento de glúteo con máquina.', 'En la máquina de glúteos, apoya un pie en la plataforma. Empuja hacia atrás extendiendo la cadera y apretando el glúteo. Regresa con control sin soltar la tensión.', 'glúteos', 'fuerza', 'principiante'),
('Peso muerto rumano', 'Trabaja glúteos e isquiotibiales.', 'De pie con barra o mancuernas, pies al ancho de caderas. Empuja las caderas hacia atrás manteniendo las piernas casi rectas y la espalda neutra. Baja hasta sentir estiramiento en isquiotibiales y sube apretando los glúteos.', 'glúteos', 'fuerza', 'todos'),
('Abducción de cadera en máquina', 'Aislamiento de glúteo medio.', 'Sentado en la máquina de abducción, abre las piernas contra la resistencia apretando los glúteos. Mantén 1 segundo afuera y regresa con control.', 'glúteos', 'fuerza', 'principiante'),
('Step-ups con mancuernas', 'Ejercicio funcional para glúteos y piernas.', 'Con una mancuerna en cada mano, sube a un cajón o banco pisando firme con toda la planta. Empuja con la pierna de arriba apretando el glúteo. Baja con control y alterna piernas.', 'glúteos', 'fuerza', 'todos'),
('Sentadilla con banda elástica', 'Activa los glúteos con resistencia lateral.', 'Coloca una banda elástica arriba de las rodillas. Realiza sentadillas manteniendo las rodillas hacia afuera contra la resistencia de la banda. Aprieta los glúteos al subir.', 'glúteos', 'fuerza', 'principiante');

-- CORE
INSERT INTO ejercicios (nombre, descripcion, instrucciones, grupo_muscular, categoria, nivel) VALUES
('Plancha frontal', 'Ejercicio isométrico fundamental para el core.', 'Apóyate sobre los antebrazos y las puntas de los pies. Mantén el cuerpo recto como una tabla, apretando abdomen y glúteos. Mantén la posición el tiempo indicado.', 'core', 'fuerza', 'todos'),
('Plancha lateral', 'Trabaja oblicuos y estabilizadores laterales.', 'Apóyate sobre un antebrazo y el borde del pie. Mantén el cuerpo recto con la cadera elevada. Mantén la posición el tiempo indicado y cambia de lado.', 'core', 'fuerza', 'todos'),
('Crunch abdominal', 'Ejercicio básico de abdominales.', 'Acostado boca arriba con rodillas flexionadas. Coloca las manos detrás de la cabeza. Eleva los hombros del suelo contrayendo el abdomen. Baja con control sin relajar completamente.', 'core', 'fuerza', 'principiante'),
('Russian twist', 'Trabajo rotacional para oblicuos.', 'Sentado con las rodillas flexionadas y torso inclinado hacia atrás. Con un peso o sin él, rota el torso llevando las manos de un lado al otro tocando el suelo. Controla el movimiento.', 'core', 'fuerza', 'todos'),
('Elevación de piernas colgado', 'Ejercicio avanzado para abdominales inferiores.', 'Colgado de una barra, eleva las piernas rectas hasta que queden paralelas al suelo o más arriba. Baja con control sin balancear. Si es muy difícil, flexiona las rodillas.', 'core', 'fuerza', 'avanzado'),
('Mountain climbers', 'Ejercicio dinámico de core y cardio.', 'En posición de plancha alta, lleva una rodilla al pecho y alterna rápidamente con la otra como si corrieras en el lugar. Mantén la cadera estable y el core apretado.', 'core', 'cardio', 'todos'),
('Dead bug', 'Ejercicio anti-extensión para core estable.', 'Acostado boca arriba con brazos extendidos al cielo y rodillas a 90°. Extiende simultáneamente un brazo atrás y la pierna opuesta al frente sin arquear la espalda. Regresa y alterna.', 'core', 'fuerza', 'principiante'),
('Ab wheel rollout', 'Ejercicio avanzado de core completo.', 'De rodillas con la rueda abdominal, rueda hacia adelante extendiendo el cuerpo lo más lejos posible sin arquear la espalda. Regresa jalando con el abdomen a la posición inicial.', 'core', 'fuerza', 'avanzado');

-- CARDIO
INSERT INTO ejercicios (nombre, descripcion, instrucciones, grupo_muscular, categoria, nivel) VALUES
('Caminadora (treadmill)', 'Cardio básico para quemar calorías.', 'Camina o corre en la caminadora al ritmo que puedas mantener. Para principiantes, camina a paso rápido. Avanzados pueden hacer intervalos de velocidad. Mantén buena postura.', 'cardio', 'cardio', 'todos'),
('Bicicleta estática', 'Cardio de bajo impacto para las articulaciones.', 'Ajusta el asiento a la altura correcta (rodilla ligeramente flexionada al extender). Pedalea a un ritmo constante o haz intervalos. Mantén la espalda recta.', 'cardio', 'cardio', 'todos'),
('Elíptica', 'Cardio de cuerpo completo y bajo impacto.', 'Sube a la elíptica, agarra los mangos móviles. Mantén un ritmo constante empujando y jalando con brazos y piernas. Ajusta la resistencia según tu nivel.', 'cardio', 'cardio', 'principiante'),
('Saltar la cuerda', 'Cardio intenso y coordinación.', 'Con la cuerda detrás de ti, gírala con las muñecas (no los brazos) y salta con pequeños saltos. Mantén las rodillas ligeramente flexionadas. Empieza con intervalos cortos.', 'cardio', 'cardio', 'todos'),
('Burpees', 'Ejercicio de cuerpo completo y alto impacto.', 'De pie, baja a posición de sentadilla, pon las manos en el suelo. Salta los pies atrás a plancha, haz una flexión, salta los pies hacia las manos y salta arriba con los brazos al cielo.', 'cardio', 'cardio', 'intermedio'),
('Remo en máquina (cardio)', 'Cardio y fuerza de cuerpo completo.', 'Sentado en el remo ergómetro, empuja con las piernas primero, luego jala con la espalda y brazos. Regresa extendiendo brazos, inclinando el torso y flexionando las piernas. Mantén ritmo constante.', 'cardio', 'cardio', 'todos'),
('HIIT en bicicleta', 'Intervalos de alta intensidad.', '30 segundos pedaleando al máximo esfuerzo seguidos de 30-60 segundos de recuperación suave. Repite 8-12 rondas. Calienta 5 minutos antes y enfría 5 minutos después.', 'cardio', 'cardio', 'intermedio'),
('Jumping jacks', 'Cardio simple para calentamiento o circuitos.', 'De pie con pies juntos y brazos a los lados. Salta abriendo pies y levantando brazos sobre la cabeza simultáneamente. Salta regresando a la posición inicial. Repite a buen ritmo.', 'cardio', 'cardio', 'principiante');
