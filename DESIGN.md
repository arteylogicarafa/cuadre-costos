---
name: Cuadre
description: Estructura de costos para pymes venezolanas, con el dinero leído como grabado de billete de bolívar.
colors:
  accent: "#0f7a3e"
  accent-strong: "#0a6330"
  accent-ink: "#0b5a2c"
  paper: "#f1f6ef"
  plate: "#ffffff"
  sunken: "#e8f0e5"
  hover: "#e1ebdd"
  line: "#d0ddcc"
  line-soft: "#e3ebe0"
  line-strong: "#aabfa8"
  ink: "#0a1d11"
  ink-2: "#364f3e"
  ink-3: "#52695a"
  bad: "#b42318"
  warn: "#84500a"
  series-teal: "#0e7490"
  series-amber: "#a8670a"
  series-violet: "#6d4fd0"
  night-paper: "#050907"
  night-plate: "#0b120d"
  night-sunken: "#070d09"
  night-hover: "#122018"
  night-line: "#1b2c21"
  night-line-strong: "#2b4535"
  night-ink: "#e6f4ea"
  night-ink-2: "#a8c1ae"
  night-ink-3: "#7e9985"
  night-accent: "#1fd16b"
  night-accent-strong: "#46eb89"
  night-on-accent: "#03110a"
  night-bad: "#ff8080"
  night-warn: "#f2b84b"
  night-series-teal: "#38c7da"
  night-series-amber: "#f0b13f"
  night-series-violet: "#a898ff"
typography:
  display-figure:
    fontFamily: "Bodoni Moda, Bodoni 72, Georgia, serif"
    fontSize: "3.75rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.015em"
    fontFeature: "'lnum' 1, 'tnum' 1"
  figure-medium:
    fontFamily: "Bodoni Moda, Bodoni 72, Georgia, serif"
    fontSize: "2.25rem"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.015em"
    fontFeature: "'lnum' 1, 'tnum' 1"
  headline:
    fontFamily: "Bodoni Moda, Bodoni 72, Georgia, serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.43
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
    fontFeature: "'tnum' 1, 'ss01' 1"
  label:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.33
  caption:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.7rem"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  md: "6px"
  lg: "8px"
  xl: "12px"
  2xl: "16px"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "20px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "{colors.accent-strong}"
  panel:
    backgroundColor: "{colors.plate}"
    rounded: "{rounded.2xl}"
    padding: "24px"
  placa:
    backgroundColor: "{colors.plate}"
    rounded: "{rounded.2xl}"
    padding: "32px"
  nav-item:
    textColor: "{colors.ink-2}"
    rounded: "{rounded.lg}"
    padding: "6px 12px"
  nav-item-active:
    backgroundColor: "{colors.accent}"
    textColor: "#ffffff"
  chip-meta:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.full}"
    padding: "6px 12px"
  field:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
---

# Design System: Cuadre

## Overview

**Creative North Star: "El Billete Digital"**

La interfaz es un billete de bolívar de la era digital: el dinero se lee como grabado de seguridad. Una sola jugada lleva la identidad, la trama guilloché (rosetas y bandas de ondas de línea fina generadas en SVG), y aparece en tres sitios: la marca, el fondo de las placas de cifras y el panel de acceso. Todo lo demás es interfaz de trabajo callada, hecha para un dueño de pyme que decide precios con cifras mensuales: escritorio a diario, móvil para consultar.

Dos temas comparten una sola escala tonal con la misma estructura de roles. El claro es papel verde pálido con tinta verde profundo y placas blancas; el oscuro es negro verdoso con tinta de grabado verde vivo. El rojo y el ámbar significan estado y nada más. La jerarquía la dan la cifra grande en serif de grabado, el tamaño de título y el borde tintado de la placa principal, no el color decorativo.

El dashboard no es un arreglo de tarjetas iguales con ícono, número y etiqueta: hay una placa ancha dominante con la utilidad neta y el gráfico, paneles secundarios con barras y listas, y los números siempre alineables.

**Key Characteristics:**
- Una trama guilloché, a un píxel de grosor, baja opacidad, siempre detrás del contenido y con zona limpia donde van los números.
- Cifras principales en Bodoni Moda con numerales lining y tabulares; interfaz en Geist.
- Verde de acento único, escala tonal compartida por ambos temas, tema fijado en `<html data-tema>`.
- Plano por defecto: profundidad por borde y tono, no por sombra.
- Movimiento mínimo y con significado: el buril que traza la línea de ingresos, la entrada suave, la roseta que deriva muy despacio.

## Colors

Paleta de papel y tinta verde: neutrales con tinte verde, un acento, tres series de datos y dos colores de estado. Los valores del tema claro viven en la parte `colors` del frontmatter sin prefijo; los del oscuro llevan prefijo `night-` y ocupan el mismo rol en `[data-tema="oscuro"]`.

### Primary
- **Tinta de Grabado Verde** (#0f7a3e claro, #1fd16b oscuro): botón primario, elemento activo del menú, línea de ingresos, barras de margen, marca, foco, selección. Es el único acento y aparece en acciones y en el dato principal.
- **Verde Profundo** (#0a6330 claro, #46eb89 oscuro): hover del acento.
- **Verde de Texto** (#0b5a2c claro, #4ae28b oscuro): enlaces y texto sobre fondo claro tintado (variación positiva, "Todo está al día"); pasa contraste donde el acento puro no.

### Secondary
- **Series de datos** teal (#0e7490 / #38c7da), ámbar (#a8670a / #f0b13f), violeta (#6d4fd0 / #a898ff): solo para distinguir partes de un mismo todo (composición del costo: materia prima en el acento, insumos en teal, mano de obra en ámbar, indirectos en violeta) y la línea de egresos (ámbar, discontinua).

### Neutral
- **Papel Verde** (#f1f6ef / #050907): fondo de página.
- **Placa** (#ffffff / #0b120d): superficie de paneles, placas y campos del tema claro; en oscuro, panel sobre el negro.
- **Papel Hundido** (#e8f0e5 / #070d09): barra lateral y panel de marca del acceso.
- **Resalte** (#e1ebdd / #122018): hover de filas y pistas de barras.
- **Línea, Línea Suave, Línea Fuerte** (#d0ddcc, #e3ebe0, #aabfa8 / #1b2c21, #132017, #2b4535): borde de panel, divisor de lista, borde de campo y marco del gráfico.
- **Tinta, Tinta 2, Tinta 3** (#0a1d11, #364f3e, #52695a / #e6f4ea, #a8c1ae, #7e9985): texto principal, secundario y de apoyo.
- **Grabado** (acento al 34% claro, 28% oscuro): único color de la trama guilloché. **Brillo** (acento al 10%): halo de foco de campos.

### Estado
- **Rojo de Pérdida** (#b42318 / #ff8080) y **Ámbar de Aviso** (#84500a / #f2b84b): pérdida o error, y elemento pendiente. No se usan como decoración ni como serie.

### Named Rules
**The Single Engraving Rule.** La trama guilloché es la única jugada de identidad. No se añaden degradados, brillos ni otras texturas; la trama nunca cubre texto sin zona limpia.

**The Status Only Rule.** Rojo y ámbar significan estado. Un valor negativo se pinta en rojo; una acción nunca.

**The Shared Ramp Rule.** Claro y oscuro usan los mismos roles con los mismos nombres; un componente referencia el rol, nunca un hex.

## Typography

**Display Font:** Bodoni Moda (pesos 500, 600, 700; con Bodoni 72, Georgia, serif)
**Body Font:** Geist (con system-ui, sans-serif); Geist Mono disponible, no usada en el resumen

**Character:** Un serif de contraste alto con carácter de numeral de billete para el dinero y los títulos de página, frente a una sans neutra de interfaz con numerales tabulares. La cifra es el objeto grabado; todo lo demás se lee como etiqueta.

### Hierarchy
- **Display figure** (600, 3.75rem, 1): utilidad neta del mes en la placa principal. Clase `cifra`; la moneda va al lado en Geist 1.125rem, tinta 3.
- **Figure medium** (600, 2.25rem, 1.1): costo unitario promedio en el panel de composición.
- **Headline** (600, 1.875rem, 1.2, -0.01em): el `h1` de cada página; Bodoni por regla global de `h1`.
- **Title** (600, 0.875rem): títulos de panel (`h2`), sin mayúsculas ni espaciado ampliado.
- **Body** (400, 0.875rem): texto de panel, filas, formularios. Numerales tabulares activos en todo el documento.
- **Label** (500, 0.75rem): botones del selector, etiquetas de tabla (0.72rem, 600, 0.03em), enlaces secundarios.
- **Caption** (400, 0.7rem): ejes del gráfico, leyenda, títulos de grupo del menú.

### Named Rules
**The Engraved Figure Rule.** Todo número que sea el titular de una placa o panel usa `cifra` (Bodoni, lining, tabular). Los números dentro de listas, tablas y ejes usan Geist tabular.

**The Aligned Numerals Rule.** Toda columna o fila de cifras lleva `tabular-nums`; una cifra que se desalinea al cambiar es un defecto.

## Layout

Barra lateral fija de 16rem (md en adelante) con marca, tarjeta de empresa y usuario, menú agrupado y selector de tema al pie; en móvil se vuelve barra superior pegajosa con botón de menú de 44px y el menú abre a pantalla. El contenido se centra con ancho máximo 72rem (`max-w-6xl`) y apila en columna con separación de 24px.

El resumen usa dos filas de rejilla 3fr / 2fr desde `lg`: arriba, la placa de utilidad y gráfico junto a composición del costo y equilibrio; abajo, productos por margen junto a pendientes. Por debajo de `lg` todo apila. Cabecera con título a la izquierda y, a la derecha, la chip de moneda y la acción primaria. Ritmo: 24px entre paneles, 20px de relleno de panel (24px desde `md`), 32px en la placa principal, 8 a 12px dentro de listas. Objetivos táctiles de 44px de alto en móvil que bajan en escritorio.

## Elevation & Depth

Plano por defecto: la profundidad se construye con tono (barra lateral hundida, panel sobre papel) y con borde de 1px. La placa principal se distingue con borde de acento al 45% y una línea inferior de 1px (`0 1px 0 0 var(--line)`), no con sombra difusa. La única sombra blanda del resumen es la del tooltip flotante del gráfico (`shadow-lg shadow-black/20`); es una respuesta de estado.

### Named Rules
**The Flat Plate Rule.** Las superficies son planas en reposo. Una sombra aparece solo en un elemento flotante que responde al puntero, nunca como relieve de panel, y nunca dura ni desplazada.

## Shapes

Formas suaves y concéntricas: paneles y placas en 16px, marco del gráfico y marcas en 12px, controles en 8px, chips y barras en píldora completa. Bordes de 1px en tinta de línea. La geometría propia es circular: rosetas, ondas y la moneda del logo; no hay esquinas cortadas, marcos dobles ni recortes de cupón.

## Components

### Buttons
- **Shape:** esquina de 8px.
- **Primary:** fondo acento, texto sobre-acento, 14px medio, relleno 8px 16px (44px de alto en móvil); ícono Lucide de 16px a la izquierda. Una por pantalla ("Registrar venta" en la cabecera del resumen).
- **Hover / Focus:** pasa al acento fuerte en 120ms; foco visible con contorno de 2px en acento y desplazamiento de 2px. Deshabilitado al 50% con cursor no permitido.
- **Secundario:** chip de enlace en píldora con borde de línea, fondo placa, texto tinta 2, 12px; hover en resalte.

### Cards / Containers
- **Panel:** 16px de esquina, fondo placa, borde de línea, relleno 20/24px, título `h2` de 14px semibold. Contenedor `overflow-hidden` para la trama.
- **Placa principal:** panel con borde de acento al 45%, relleno 32px, trama de ondas (`Grabado variante="ondas"`) con elipse de zona limpia tras la cifra. Una por pantalla.
- **Panel con roseta:** `Grabado variante="roseta"` en la esquina superior derecha, desvanecida hacia el contenido, con la clase `panel-grabado` que sube el contenido por encima.

### Inputs / Fields
- **Style:** fondo campo, borde de línea fuerte, 8px de esquina, relleno 8px 12px, etiqueta de 14px en tinta 2 encima.
- **Focus:** borde en acento y halo de 3px en acento al 10%, sin contorno del navegador.
- **Error:** mensaje en rojo con `role="alert"`, ocupando todo el ancho de la fila.

### Navigation
Elementos de 14px con ícono Lucide de 16px, 8px de esquina, relleno 6px 12px. Reposo en tinta 2; hover en resalte y tinta; activo en relleno acento con texto sobre-acento y `aria-current="page"`. Títulos de grupo de 0.7rem en tinta 3. Selector de tema: grupo segmentado en campo, opción activa en acento. En móvil, la barra superior pegajosa lleva marca, selector compacto de 40px y botón de menú de 44px.

### Gráfico de serie (signature)
Ingresos como área (acento al 16%) y línea de 2.6px que se traza al cargar como un buril (1.5s, curva de salida suave); egresos como línea ámbar discontinua de 2px. Marco de 12px en línea sobre placa, cuadrícula de tres niveles (la central y la superior punteadas), puntos con anillo de color placa, etiqueta del último mes en acento. Al pasar el puntero, guía vertical punteada y tooltip en panel con ingresos, egresos y saldo (rojo si negativo). Tabla `sr-only` equivalente para lectores de pantalla.

### Barras de composición y margen
Pista de píldora en resalte; relleno de segmentos con color de serie (composición, 12px de alto) o acento (margen, 8px de alto, rojo si es negativo, mínimo 2%). Leyenda con cuadrito de 10px y porcentaje tabular alineado a la derecha. El punto de equilibrio añade un marcador vertical de 2px en tinta en la posición de la producción actual.

### Marca
Roseta festoneada de dos trazos alrededor de una moneda de acento con una "C" abierta que guarda un punto (el cuadre). Vectorial, usa los roles de acento del tema; el ícono de la app repite la marca sobre #050907. El nombre "Cuadre" va en Bodoni 600 con subtítulo de 0.7rem.

## Do's and Don'ts

### Do:
- **Do** poner la trama guilloché solo detrás de placas de cifras, de la marca y del panel de acceso, a 1px y con el color Grabado, dejando zona limpia bajo el texto.
- **Do** usar `cifra` para el número titular de cada placa y `tabular-nums` en toda cifra alineable.
- **Do** referenciar roles de color (`bg-surface`, `text-ink-2`, `bg-accent`), nunca hex, para que ambos temas funcionen.
- **Do** reservar el acento para la acción primaria, el elemento activo, el dato principal y el foco.
- **Do** dar a todo gráfico una tabla o resumen accesible equivalente y respetar `prefers-reduced-motion`.
- **Do** mantener objetivos táctiles de 44px en móvil.

### Don't:
- **Don't** componer el dashboard como una rejilla de tarjetas idénticas con ícono, número y etiqueta.
- **Don't** usar sombras duras, desplazadas ni brillos; la sombra blanda se limita al tooltip flotante.
- **Don't** usar rojo o ámbar como decoración o como serie: son estado.
- **Don't** extender la trama a texto corrido, tablas o formularios.
- **Don't** pintar una cifra grande en Geist; el serif de grabado es lo que hace legible el dinero como objeto.
- **Don't** añadir un segundo acento: las series teal, ámbar y violeta solo separan partes de un todo.
