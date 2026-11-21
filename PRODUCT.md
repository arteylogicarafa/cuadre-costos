# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack
Next.js 16 (App Router) con TypeScript y Tailwind CSS 4, base de datos SQLite local vía Prisma. Ya existe y funciona; el rediseño no cambia la pila.

## Users
Dueños y administradores de pymes en Venezuela (fábricas y negocios de alimentos) que costean sus productos y deciden precios con cifras mensuales. Trabajan en escritorio a diario; en el teléfono solo consultan el resumen y las cifras. Un contador o analista puede cargar los datos, pero el usuario principal es quien decide.

## Product Purpose
Sistema multiempresa de estructura de costos: registra empresa, materia prima, insumos, productos con recetas y sub-recetas, costos indirectos, activos con depreciación, nómina, ventas, pagos y estados financieros básicos. Calcula el costo, el precio y el margen de cada producto, e incluye simulador de combos, proyecciones con punto de equilibrio e importación y exportación de Excel. Éxito: el dueño entiende cuánto cuesta y cuánto debe cobrar cada producto, y qué gana al mes.

## Positioning
Reemplaza hojas de Excel dispersas por un solo sistema que encadena materia prima, nómina y costos indirectos hasta el precio final, con prorrateo por producción y reglas venezolanas de nómina (IVSS, RPE, FAOV, INCES, IVA).

## Operating Context
Los datos vienen hoy de dos hojas de Excel (una de manufactura de productos de limpieza y otra de alimentos) y de un sistema anterior (Costear) que se perdió. Se trabaja por períodos mensuales, en una o varias monedas con tasa de cambio, con porcentajes de gastos ajenos, utilidad e IVA configurables por empresa. Los informes se exportan a Excel o se imprimen a PDF.

## Capabilities and Constraints
- Pantallas existentes: resumen, empresa, unidades, materia prima, insumos, productos y recetas, costos indirectos, activos, nómina (parámetros, empleados, cálculo), estructura de costos, ventas, pagos, estado de resultados, estado de situación, ingresos vs egresos, simulador, proyecciones, importar.
- Roles: administrador, analista y consulta; el rol de consulta no ve la nómina.
- Todo el texto de la interfaz está en español.
- Las funciones, los cálculos y las pantallas no cambian: el rediseño es solo de apariencia.

## Brand Commitments
- El usuario pidió que la interfaz tenga tema claro y tema oscuro seleccionables, y que el oscuro sea negro con verde.
- El usuario pidió un logo vectorial inventado para el producto; no existe marca previa ni nombre definitivo (el nombre provisional es "Estructura de Costos").
- El usuario quiere que el resumen sea un dashboard llamativo, no un panel administrativo genérico.

## Evidence on Hand
No hay clientes, testimonios, cifras de mercado ni logo previos. Los datos de la empresa de prueba son demostrativos y sintéticos; deben etiquetarse así si se muestran como ejemplo.

## Product Principles
1. Las cifras mandan: un número importante se lee en un vistazo y nunca se sacrifica por adorno.
2. De la entrada al precio: cada pantalla muestra de dónde viene un costo y a dónde va.
3. Control del dueño: lo que decide dinero (precios, nómina, márgenes) es visible y explicable.
4. Pensado para uso diario: cargar y revisar datos debe ser rápido y repetible.

## Accessibility & Inclusion
Contraste legible en ambos temas, navegación por teclado y foco visible, y respeto a la preferencia de movimiento reducido. Cifras con formato venezolano (coma decimal).
