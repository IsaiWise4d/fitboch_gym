-- ============================================
-- SEED: Ejercicios para FitBoch
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- PECHO
INSERT INTO ejercicios (nombre, descripcion, instrucciones, grupo_muscular, categoria, nivel) VALUES
('Press de banca plano (barra o mancuernas)', 'Ejercicio principal para desarrollar el pecho.', 'Acuéstate en el banco plano, agarra el peso. Baja controladamente hasta el pecho y empuja hacia arriba hasta extender los brazos.', 'pecho', 'fuerza', 'todos'),
('Press de banca inclinado (barra o mancuernas)', 'Enfocado en la parte superior del pecho.', 'En banco inclinado a 30-45°, baja el peso hasta la parte alta del pecho y empuja hacia arriba. Mantén los pies firmes en el suelo.', 'pecho', 'fuerza', 'intermedio'),
('Pec deck (máquina)', 'Aislamiento de pecho seguro y guiado.', 'Sentado en la máquina, coloca antebrazos o agarra mangos. Junta los brazos frente a ti apretando el pecho y luego abre controladamente.', 'pecho', 'fuerza', 'principiante'),
('Aperturas con mancuernas', 'Aislamiento para pecho con gran estiramiento.', 'Acostado en banco plano, con mancuernas en cada mano y brazos extendidos arriba. Abre los brazos en arco hasta sentir estiramiento en el pecho, luego cierra controladamente.', 'pecho', 'fuerza', 'todos'),
('Fondos en paralelas', 'Ejercicio compuesto con peso corporal.', 'Sujétate de las barras paralelas, inclina el torso ligeramente hacia adelante para enfoque en pecho. Baja hasta que los codos formen 90° y empuja.', 'pecho', 'fuerza', 'intermedio'),
('Push-ups (flexiones)', 'Ejercicio básico de empuje con peso corporal.', 'Posición de plancha con manos un poco más abiertas que los hombros. Baja el cuerpo hasta que el pecho casi toque el suelo y empuja hacia arriba.', 'pecho', 'fuerza', 'principiante'),
('Crossover en poleas altas y bajas', 'Aislamiento de pecho con tensión constante.', 'De pie entre dos poleas, agarra los mangos y da un paso adelante. Con los codos ligeramente flexionados, junta las manos frente al pecho (o hacia abajo).', 'pecho', 'fuerza', 'intermedio'),
('Pullover con mancuerna', 'Expansión de caja torácica y trabajo de dorsales/pecho.', 'Acostado transversal sobre un banco plano. Sostén una mancuerna pesada y bájala por detrás de la cabeza manteniendo brazos semirrígidos, luego súbela.', 'pecho', 'fuerza', 'intermedio');

-- ESPALDA
INSERT INTO ejercicios (nombre, descripcion, instrucciones, grupo_muscular, categoria, nivel) VALUES
('Dominadas (pull-ups) / Asistidas', 'Ejercicio rey para la espalda.', 'Cuélgate de la barra con agarre prono. Jala tu cuerpo hacia arriba hasta que la barbilla pase la barra. Usa banda elástica si es asistida.', 'espalda', 'fuerza', 'intermedio'),
('Remo con barra olímpica', 'Ejercicio compuesto para espalda media.', 'Con las rodillas ligeramente flexionadas, inclina el torso a 45°. Agarra la barra y jala hacia el abdomen, apretando las escápulas. Baja controladamente.', 'espalda', 'fuerza', 'todos'),
('Remo con mancuerna a una mano', 'Trabajo unilateral de espalda.', 'Apoya una rodilla y mano en el banco. Con la otra mano toma la mancuerna y jala hacia la cadera, apretando la escápula. Baja despacio.', 'espalda', 'fuerza', 'todos'),
('Jalón al pecho en polea alta (prono o supino)', 'Alternativa a dominadas. No usar agarre neutro.', 'Sentado en polea alta, agarra la barra. Jala hacia el pecho sacando el pecho, aprieta escápulas. Regresa controladamente.', 'espalda', 'fuerza', 'principiante'),
('Peso muerto (barra o mancuernas)', 'Ejercicio compuesto que trabaja toda la cadena posterior.', 'Mantén la espalda recta, empuja el suelo con los pies y sube hasta estar completamente erguido. Baja con control. Puede usarse la kettlebell.', 'espalda', 'fuerza', 'avanzado'),
('Remo en polea baja', 'Movimiento con cable para espalda media.', 'Sentado frente a la polea baja, agarra los mangos. Jala hacia tu torso apretando las escápulas. Regresa con control.', 'espalda', 'fuerza', 'principiante'),
('Face pulls en polea', 'Excelente para salud del hombro y espalda alta.', 'Con la polea a la altura de la cara, agarra la cuerda con ambas manos. Jala hacia tu cara separando las manos, aprieta las escápulas. Regresa lento.', 'espalda', 'fuerza', 'todos'),
('Remo en máquina T', 'Variante guiada de remo para espalda media e inferior.', 'Apoya el pecho sobre la máquina de Remo T, agarra los mangos y jala apretando las escápulas. Si es barra libre, usa el agarre en V.', 'espalda', 'fuerza', 'intermedio'),
('Jalón a una mano en polea', 'Trabajo unilateral desde la polea alta.', 'En la polea alta, agarra un mango individual. Jala con un solo brazo enfocando la contracción en ese lado del dorsal.', 'espalda', 'fuerza', 'intermedio');

-- PIERNAS
INSERT INTO ejercicios (nombre, descripcion, instrucciones, grupo_muscular, categoria, nivel) VALUES
('Sentadilla con barra', 'Ejercicio fundamental para piernas completas.', 'Con la barra en la parte alta de la espalda, pies al ancho de hombros. Baja flexionando rodillas y caderas como si te sentaras. Baja hasta que los muslos estén paralelos al suelo y sube empujando.', 'piernas', 'fuerza', 'todos'),
('Prensa de piernas (pies cerrados)', 'Enfocado en los cuádriceps (vasto externo).', 'Sentado en la máquina de prensa, coloca los pies juntos en la parte baja de la plataforma. Baja flexionando las rodillas a 90° y empuja hacia arriba sin bloquear rodillas.', 'piernas', 'fuerza', 'todos'),
('Prensa de piernas (pies abiertos)', 'Enfocado en aductores y glúteos.', 'Sentado en la máquina de prensa, coloca los pies anchos en la parte alta de la plataforma. Baja flexionando las rodillas a 90° y empuja hacia arriba.', 'piernas', 'fuerza', 'todos'),
('Sentadilla Smith', 'Sentadilla guiada para mayor estabilidad.', 'Posicionado bajo la barra Smith. Baja manteniendo el torso recto hasta romper el paralelo, empuja con los talones para subir. Ideal para concentrar el trabajo en piernas.', 'piernas', 'fuerza', 'todos'),
('Extensión de cuádriceps', 'Aislamiento de cuádriceps en máquina.', 'Sentado en la máquina de extensiones, engancha los tobillos bajo la almohadilla. Extiende las piernas hasta que estén rectas, aprieta los cuádriceps arriba. Baja con control.', 'piernas', 'fuerza', 'principiante'),
('Curl femoral tumbado', 'Aislamiento de isquiotibiales en máquina.', 'Acostado boca abajo en la máquina de curl, engancha los tobillos bajo la almohadilla. Flexiona las rodillas llevando los talones hacia los glúteos. Baja controladamente.', 'piernas', 'fuerza', 'principiante'),
('Sentadilla búlgara', 'Ejercicio unilateral avanzado para piernas.', 'Con un pie apoyado en un banco detrás de ti, baja flexionando la rodilla delantera hasta que el muslo esté paralelo al suelo. Empuja con el pie delantero para subir.', 'piernas', 'fuerza', 'intermedio'),
('Zancadas caminando', 'Ejercicio funcional para piernas y equilibrio.', 'De pie, da un paso largo al frente y flexiona ambas rodillas a 90°. La rodilla trasera casi toca el suelo. Empuja con el pie delantero y da el siguiente paso con la otra pierna.', 'piernas', 'fuerza', 'todos'),
('Aductor en máquina', 'Trabajo específico para la parte interna del muslo.', 'Sentado en la máquina de aductores. Junta las piernas venciendo la resistencia. Controla la fase excéntrica al separar.', 'piernas', 'fuerza', 'principiante'),
('Elevación de talones', 'Ejercicio para los gemelos (pantorrilla).', 'De pie con peso o en máquina. Eleva los talones contrayendo los gemelos al máximo, luego baja controladamente sintiendo el estiramiento.', 'piernas', 'fuerza', 'todos');

-- HOMBROS
INSERT INTO ejercicios (nombre, descripcion, instrucciones, grupo_muscular, categoria, nivel) VALUES
('Press militar con barra o mancuernas', 'Ejercicio principal para hombros.', 'Agarra el peso a la altura de los hombros. Empuja hacia arriba hasta extender los brazos. Baja controladamente.', 'hombros', 'fuerza', 'todos'),
('Elevaciones laterales con mancuernas', 'Aislamiento del deltoides lateral con pesas libres.', 'De pie con una mancuerna en cada mano. Eleva los brazos hacia los lados hasta la altura de los hombros. Baja despacio.', 'hombros', 'fuerza', 'todos'),
('Elevaciones laterales en polea', 'Aislamiento del deltoides con tensión mantenida.', 'De pie cruzando la polea por delante o detrás tuyo. Eleva el brazo hasta la línea del hombro. Retén la bajada.', 'hombros', 'fuerza', 'intermedio'),
('Elevaciones frontales con mancuernas o barra', 'Enfoque del deltoides frontal.', 'Eleva el peso al frente hasta la línea del hombro con brazos casi extendidos. Controlar el descenso es clave.', 'hombros', 'fuerza', 'principiante'),
('Pájaros (elevaciones posteriores con mancuernas)', 'Trabajo del deltoides posterior.', 'Inclinado hacia adelante con el torso paralelo al suelo. Eleva los brazos hacia los lados como si fueras a volar. Controla el peso.', 'hombros', 'fuerza', 'todos');

-- BÍCEPS
INSERT INTO ejercicios (nombre, descripcion, instrucciones, grupo_muscular, categoria, nivel) VALUES
('Curl con barra (Olímpica o Z)', 'Ejercicio principal para bíceps.', 'Flexiona los codos llevando la barra hacia los hombros sin balancear el cuerpo. La barra Z cuida más las muñecas.', 'bíceps', 'fuerza', 'todos'),
('Curl con mancuernas alterno o simultáneo', 'Trabajo libre de bíceps.', 'Rota la palma hacia arriba durante la subida (supinación) o mantenla neutra dependiendo del foco. Controla la bajada.', 'bíceps', 'fuerza', 'todos'),
('Curl en banco predicador', 'Aislamiento estricto de bíceps apoyado en el banco.', 'Sentado en el banco Scott, con mancuerna, barra Z o máquina. Flexiona enfocando en el apriete y baja estirando completo.', 'bíceps', 'fuerza', 'todos'),
('Curl en polea baja', 'Tensión constante durante todo el movimiento.', 'De pie frente a la polea baja. Flexiona los codos contra la resistencia del cable. Resiste la fase negativa.', 'bíceps', 'fuerza', 'principiante'),
('Curl bayesiano', 'Aislamiento de la cabeza larga del bíceps con estiramiento.', 'De espaldas a la polea baja ajustada con un agarre individual. Da un paso adelante para que el brazo quede ligeramente retrasado respecto al torso. Flexiona el codo mantiendolo quieto y controlando la fase excéntrica.', 'bíceps', 'fuerza', 'intermedio');

-- TRÍCEPS
INSERT INTO ejercicios (nombre, descripcion, instrucciones, grupo_muscular, categoria, nivel) VALUES
('Extensión de tríceps en polea alta', 'Aislamiento con tensión constante en polea.', 'De pie, codos pegados al cuerpo. Extiende los brazos hacia abajo apretando los tríceps. Sube controlando la fase excéntrica.', 'tríceps', 'fuerza', 'todos'),
('Press francés (barra Z)', 'Aislamiento clásico para cabeza larga del tríceps.', 'Acostado en banco plano, sostén la barra Z. Baja hacia tu frente flexionando codos, y empuja hacia arriba al techo.', 'tríceps', 'fuerza', 'intermedio'),
('Patada de tríceps en polea baja', 'Aislamiento constante unilateral.', 'Frente a la polea baja, torso inclinado. Con el codo fijo, extiende el brazo hacia atrás estirando el tríceps.', 'tríceps', 'fuerza', 'intermedio'),
('Extensión tras nuca con mancuerna', 'Máximo estiramiento de tríceps.', 'Sentado o de pie. Extiende la mancuerna usando las dos manos sobre tu cabeza.', 'tríceps', 'fuerza', 'todos');

-- GLÚTEOS
INSERT INTO ejercicios (nombre, descripcion, instrucciones, grupo_muscular, categoria, nivel) VALUES
('Hip thrust en máquina o con barra', 'Ejercicio #1 para desarrollo de glúteos.', 'Sentado en el suelo o en máquina, coloca el peso/barra sobre las caderas. Empuja las caderas hacia arriba apretando los glúteos. Baja con control.', 'glúteos', 'fuerza', 'todos'),
('Puente de glúteos en suelo', 'Versión en suelo del hip thrust.', 'Acostado boca arriba con las rodillas flexionadas y pies en el suelo. Empuja las caderas hacia arriba apretando los glúteos. Mantén arriba 2 segundos y baja lento.', 'glúteos', 'fuerza', 'principiante'),
('Sentadilla sumo (mancuernas o barra)', 'Sentadilla con énfasis en glúteos y aductores.', 'De pie con los pies más anchos que los hombros y puntas hacia afuera. Baja en sentadilla manteniendo la espalda recta. Sube apretando los glúteos.', 'glúteos', 'fuerza', 'todos'),
('Patada de glúteo en polea baja', 'Aislamiento de glúteo máximo.', 'Usa la tobillera en la polea baja. Apoyado frente a la máquina, empuja la pierna hacia atrás extendiendo la cadera y contrayendo el glúteo.', 'glúteos', 'fuerza', 'intermedio'),
('Peso muerto rumano (barra o mancuernas)', 'Trabaja glúteos e isquiotibiales.', 'De pie, empuja las caderas hacia atrás manteniendo las piernas casi rectas y la espalda neutra. Baja hasta sentir el estiramiento y sube apretando glúteos.', 'glúteos', 'fuerza', 'todos'),
('Abducción de cadera en máquina', 'Aislamiento de glúteo medio.', 'Sentado en la máquina de aductores pero configurada para empujar hacia afuera. Abre las piernas contra la resistencia apretando los glúteos.', 'glúteos', 'fuerza', 'principiante'),
('Sentadilla búlgara (énfasis en glúteos)', 'Ejercicio unilateral enfocado en glúteos.', 'Con el pie trasero en el banco, da un paso más largo de lo normal hacia adelante. Baja flexionando la rodilla e inclinando ligeramente el torso hacia adelante para maximizar el estiramiento del glúteo.', 'glúteos', 'fuerza', 'intermedio');

-- CORE
INSERT INTO ejercicios (nombre, descripcion, instrucciones, grupo_muscular, categoria, nivel) VALUES
('Plancha frontal', 'Ejercicio isométrico fundamental para el core.', 'Apóyate sobre los antebrazos y las puntas de los pies. Mantén el cuerpo recto como una tabla, apretando abdomen y glúteos. Mantén la posición el tiempo indicado.', 'core', 'fuerza', 'todos'),
('Plancha lateral', 'Trabaja oblicuos y estabilizadores laterales.', 'Apóyate sobre un antebrazo y el borde del pie. Mantén el cuerpo recto con la cadera elevada. Mantén la posición el tiempo indicado y cambia de lado.', 'core', 'fuerza', 'todos'),
('Crunch en máquina de abdomen', 'Ejercicio aislado y guiado para el recto abdominal.', 'Sentado en la máquina de abdomen, ajusta el peso. Contrae el abdomen acercando el pecho a las rodillas. Controla la fase excéntrica y no uses el impulso.', 'core', 'fuerza', 'todos'),
('Crunch abdominal en suelo', 'Ejercicio básico de abdominales.', 'Acostado boca arriba con rodillas flexionadas. Coloca las manos detrás de la cabeza. Eleva los hombros del suelo contrayendo el abdomen. Baja con control sin relajar completamente.', 'core', 'fuerza', 'principiante'),
('Caminata del granjero (kettlebell o mancuernas)', 'Fuerza global, agarre y estabilidad de core.', 'Agarra una kettlebell o mancuerna pasada en cada mano. Camina manteniendo el torso rígido y los hombros atrás. No te balancees.', 'core', 'fuerza', 'todos'),
('Elevación de piernas colgado / tumbado', 'Ejercicio para abdominales inferiores.', 'Colgado de una barra o recostado en el piso. Eleva las piernas rectas (o rodillas flexionadas para empezar) contrayendo desde la pelvis. Baja con control.', 'core', 'fuerza', 'intermedio'),
('Hollow hold', 'Tensión isométrica global y control abdominal.', 'Acostado bocarriba, eleva brazos hacia atrás y piernas al mismo tiempo, presionando la zona lumbar hacia el suelo. Mantén la postura de "canoa".', 'core', 'fuerza', 'intermedio');

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
