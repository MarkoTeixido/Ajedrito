# Ajedrito — Instrucciones de Ingeniería y Refactorización

## 1. Contexto del proyecto

Ajedrito es una aplicación web de ajedrez compuesta por tres partes principales:

* `frontend/`: interfaz de usuario y experiencia de juego.
* `backend/`: API, lógica de negocio, persistencia y orquestación del sistema.
* `ia/`: sistema de inteligencia artificial, entrenamiento, predicción y adaptación de dificultad.

La aplicación actualmente funciona y debe considerarse el comportamiento de referencia.

El objetivo de esta etapa es **mejorar la calidad interna del código sin alterar el comportamiento funcional existente**.

---

# 2. Regla principal: NO romper comportamiento existente

Antes de modificar código, comprender cómo funciona actualmente.

Un refactor debe preservar, salvo indicación explícita:

* funcionalidades existentes;
* reglas del juego;
* flujo de una partida;
* turnos;
* selección de color;
* promoción de peones;
* jaque y jaque mate;
* tablas;
* persistencia de partidas;
* recuperación de partidas;
* entrenamiento de la IA;
* predicción de movimientos;
* adaptación de dificultad;
* integración con Stockfish;
* niveles de dificultad de Stockfish;
* comunicación entre frontend, backend e IA;
* contratos de las APIs;
* estructuras de request/response;
* códigos HTTP;
* comportamiento de errores;
* variables de entorno;
* configuración de despliegue.

**No cambiar funcionalidades para hacer el código "más limpio".**

Si durante el refactor se descubre un bug existente, identificarlo y explicarlo por separado. No modificar su comportamiento silenciosamente.

---

# 3. Forma de trabajar

El trabajo debe realizarse de manera incremental.

NO realizar una refactorización masiva de toda la aplicación en una sola operación.

Para cada área:

1. Analizar el código existente.
2. Identificar responsabilidades.
3. Identificar dependencias.
4. Identificar acoplamiento.
5. Identificar duplicación.
6. Identificar código difícil de probar.
7. Identificar problemas arquitectónicos.
8. Identificar posibles violaciones de principios SOLID.
9. Identificar code smells.
10. Proponer una estrategia de refactorización.
11. Implementar cambios pequeños y coherentes.
12. Validar que el comportamiento se mantiene.
13. Continuar con el siguiente módulo.

La prioridad es **seguridad del refactor + mantenibilidad**, no cantidad de cambios realizados.

---

# 4. Auditoría antes de modificar

Cuando se solicite una auditoría, el agente debe:

* recorrer los archivos relevantes;
* comprender cómo se relacionan entre sí;
* identificar el flujo de ejecución;
* identificar las responsabilidades de cada módulo;
* identificar dependencias internas y externas;
* identificar puntos de entrada;
* identificar lógica de negocio;
* identificar infraestructura;
* identificar acceso a datos;
* identificar llamadas a servicios externos;
* identificar manejo de errores;
* identificar duplicación;
* identificar funciones o clases excesivamente grandes;
* identificar dependencias innecesarias;
* identificar problemas de nombres;
* identificar código muerto;
* identificar problemas de testabilidad;
* identificar posibles problemas de seguridad;
* identificar problemas de diseño.

La auditoría debe hacerse **antes de proponer modificaciones importantes**.

Durante una auditoría, no modificar código salvo que se solicite explícitamente.

---

# 5. SOLID

Aplicar los principios SOLID cuando realmente mejoren el diseño.

## SRP — Single Responsibility Principle

Detectar módulos, clases o funciones que tengan demasiadas responsabilidades.

Separar responsabilidades cuando exista una razón clara para hacerlo.

No dividir artificialmente funciones o clases simplemente para reducir su tamaño.

## OCP — Open/Closed Principle

Detectar lugares donde agregar nuevos comportamientos obliga a modificar demasiado código existente.

Aplicarlo cuando exista una necesidad real de extensibilidad.

## LSP — Liskov Substitution Principle

Prestar atención a jerarquías de herencia y abstracciones donde una implementación no pueda sustituir correctamente a otra.

No introducir herencia artificial.

## ISP — Interface Segregation Principle

Evitar interfaces grandes o contratos que obliguen a los consumidores a depender de métodos que no necesitan.

No crear interfaces innecesarias.

## DIP — Dependency Inversion Principle

Separar lógica de negocio de detalles concretos de infraestructura cuando esto aporte testabilidad, desacoplamiento o mantenibilidad.

No crear abstracciones solamente para cumplir formalmente con DIP.

---

# 6. Clean Code

Priorizar:

* nombres descriptivos;
* funciones pequeñas y cohesivas;
* responsabilidades claras;
* flujo de control comprensible;
* dependencias explícitas;
* bajo acoplamiento;
* alta cohesión;
* eliminación de código muerto;
* eliminación de duplicación real;
* manejo de errores claro;
* separación entre lógica de negocio e infraestructura;
* evitar efectos secundarios innecesarios.

Evitar:

* funciones gigantes;
* clases con demasiadas responsabilidades;
* nombres ambiguos;
* variables innecesariamente genéricas;
* lógica duplicada;
* números mágicos;
* strings mágicos cuando representen conceptos de dominio;
* nesting excesivo;
* comentarios que simplemente describan código obvio;
* abstracciones innecesarias;
* archivos "utils" que acumulen funciones sin relación;
* lógica escondida detrás de demasiadas capas.

---

# 7. Patrones de diseño

Los patrones de diseño NO deben utilizarse para demostrar conocimiento.

Utilizar un patrón únicamente cuando resuelva un problema concreto de diseño.

Antes de introducir un patrón, evaluar:

* qué problema resuelve;
* por qué la solución actual es insuficiente;
* qué complejidad agrega;
* qué beneficios aporta;
* si existe una solución más simple.

No introducir automáticamente:

* Factory;
* Strategy;
* Repository;
* Adapter;
* Observer;
* Singleton;
* Facade;
* Dependency Injection;
* u otros patrones

simplemente porque sean patrones conocidos.

**Una solución simple y clara es preferible a una arquitectura sobreingenierizada.**

---

# 8. Arquitectura

Mantener la separación conceptual entre:

* presentación;
* lógica de aplicación;
* lógica de dominio;
* infraestructura;
* persistencia;
* servicios externos.

No mover código entre capas sin comprender primero su responsabilidad.

La arquitectura debe favorecer:

* cohesión;
* bajo acoplamiento;
* testabilidad;
* mantenibilidad;
* legibilidad;
* facilidad de extensión.

No crear capas solamente porque "una arquitectura profesional debe tener más capas".

---

# 9. Dependencias

Preferir dependencias explícitas.

Evitar que la lógica de negocio dependa directamente de detalles concretos cuando esa dependencia pueda aislarse razonablemente.

Sin embargo, no crear interfaces, wrappers o abstracciones para cada dependencia.

La abstracción debe justificarse por una necesidad real.

---

# 10. Lógica de negocio

La lógica relacionada con las reglas del sistema debe ser fácil de identificar y probar.

Evitar mezclar en una misma función:

* reglas de negocio;
* acceso a base de datos;
* HTTP;
* manejo de archivos;
* llamadas a servicios externos;
* transformación de datos;
* presentación.

Cuando exista una mezcla significativa de responsabilidades, evaluar una separación.

---

# 11. Manejo de errores

Los errores deben manejarse de manera consistente.

Evitar:

* `try/catch` innecesarios;
* errores silenciosos;
* mensajes ambiguos;
* duplicación del manejo de errores;
* devolver respuestas diferentes para errores equivalentes sin razón.

No ocultar errores reales simplemente para hacer que la aplicación "siga funcionando".

---

# 12. Configuración y secretos

No hardcodear:

* API keys;
* contraseñas;
* tokens;
* URLs sensibles;
* credenciales;
* configuraciones específicas del entorno.

Respetar el sistema de variables de entorno existente.

No modificar nombres de variables de entorno sin verificar todas sus referencias.

---

# 13. Frontend

En `frontend/` prestar especial atención a:

* responsabilidades de componentes;
* lógica de presentación vs lógica de negocio;
* manejo de estado;
* hooks;
* llamadas a API;
* duplicación;
* componentes excesivamente grandes;
* efectos secundarios;
* accesibilidad;
* manejo de errores;
* estados de carga;
* separación de lógica reutilizable.

No convertir componentes simples en sistemas excesivamente abstractos.

---

# 14. IA

En `ia/` prestar especial atención a:

* entrenamiento;
* inferencia;
* carga y almacenamiento del modelo;
* procesamiento de datos;
* predicción de movimientos;
* adaptación de dificultad;
* interacción con el backend;
* integración con Stockfish;
* manejo de errores;
* configuración.

Mantener separadas, cuando corresponda:

* preparación de datos;
* entrenamiento;
* inferencia;
* gestión del modelo;
* lógica de adaptación;
* comunicación externa.

No cambiar el comportamiento del modelo o del sistema de dificultad durante un refactor arquitectónico salvo indicación explícita.

---

# 15. Contratos entre componentes

Frontend, backend e IA forman parte del mismo sistema.

Antes de modificar una función, endpoint, payload o estructura compartida, comprobar sus consumidores.

No cambiar unilateralmente:

* endpoints;
* nombres de propiedades;
* tipos;
* códigos HTTP;
* formatos de respuesta;
* parámetros;
* variables de entorno;
* protocolos de comunicación.

Si un cambio de contrato resulta necesario, identificarlo explícitamente antes de realizarlo.

---

# 16. Principio de mínima modificación

Cuando exista una forma de resolver un problema modificando 3 archivos, no modificar 20.

Preferir:

> el cambio más pequeño que resuelva correctamente el problema arquitectónico.

No realizar refactors "por las dudas".

---

# 17. No confundir refactorización con desarrollo de funcionalidades

Durante esta etapa:

### Refactorización

Cambiar la estructura interna manteniendo el comportamiento externo.

### Desarrollo

Agregar o modificar comportamiento.

No mezclar ambos salvo que se solicite explícitamente.

---

# 18. Cómo presentar cada refactor

Después de realizar un cambio significativo, informar:

### Problema detectado

Qué estaba mal y por qué.

### Cambio realizado

Qué estructura se modificó.

### Principios aplicados

Qué principios SOLID/Clean Code se utilizaron y por qué.

### Patrones utilizados

Si se utilizó alguno, explicar por qué era necesario.

Si no se utilizó ninguno, indicarlo.

### Comportamiento

Confirmar qué comportamiento se mantuvo.


### Riesgos

Indicar cualquier riesgo que todavía exista.

---

# 19. Regla final

El objetivo NO es hacer que Ajedrito tenga:

* más clases;
* más interfaces;
* más carpetas;
* más patrones;
* más abstracciones;
* más código.

El objetivo es que tenga:

* responsabilidades claras;
* dependencias comprensibles;
* lógica de negocio aislada;
* bajo acoplamiento;
* alta cohesión;
* código testeable;
* nombres claros;
* arquitectura razonable;
* facilidad de mantenimiento.

**La simplicidad debe ganar cuando dos soluciones sean equivalentes.**

Antes de introducir complejidad arquitectónica, demostrar qué problema concreto resuelve.
