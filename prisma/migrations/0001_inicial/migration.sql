-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "claveHash" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Empresa" (
    "id" TEXT NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "rif" TEXT,
    "direccion" TEXT,
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "tasaCambio" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "pctGastosAjenos" DOUBLE PRECISION NOT NULL DEFAULT 0.125,
    "pctUtilidad" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "pctIva" DOUBLE PRECISION NOT NULL DEFAULT 0.16,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membresia" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'ADMIN',

    CONSTRAINT "Membresia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnidadMedida" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "abreviatura" TEXT NOT NULL,

    CONSTRAINT "UnidadMedida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MateriaPrima" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "unidadId" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "costoPresentacion" DOUBLE PRECISION NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MateriaPrima_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Insumo" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "costoPresentacion" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Insumo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Producto" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'PRINCIPAL',
    "area" TEXT,
    "porciones" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "manoObra" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "produccionMensual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pctUtilidad" DOUBLE PRECISION,

    CONSTRAINT "Producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LineaReceta" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "materiaId" TEXT,
    "insumoId" TEXT,
    "subRecetaId" TEXT,
    "cantidad" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "LineaReceta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostoIndirecto" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "montoMensual" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "CostoIndirecto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activo" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "costo" DOUBLE PRECISION NOT NULL,
    "valorResidual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vidaUtilMeses" INTEGER NOT NULL,

    CONSTRAINT "Activo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cargo" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "area" TEXT NOT NULL DEFAULT 'PRODUCCION',

    CONSTRAINT "Cargo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Empleado" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "cedula" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cargoId" TEXT NOT NULL,
    "fechaIngreso" TIMESTAMP(3) NOT NULL,
    "salarioMensual" DOUBLE PRECISION NOT NULL,
    "bonoFijo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "comision" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Empleado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Novedad" (
    "id" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "horasNocturnas" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "horasExtras" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "diasFeriados" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "Novedad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParametroNomina" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "vigenciaDesde" TEXT NOT NULL,
    "salarioMinimo" DOUBLE PRECISION NOT NULL,
    "bonoAlimentacion" DOUBLE PRECISION NOT NULL,
    "pctRiesgoIvss" DOUBLE PRECISION NOT NULL DEFAULT 0.09,
    "pctIvssTrab" DOUBLE PRECISION NOT NULL DEFAULT 0.04,
    "pctRpeTrab" DOUBLE PRECISION NOT NULL DEFAULT 0.005,
    "pctRpePatrono" DOUBLE PRECISION NOT NULL DEFAULT 0.02,
    "pctFaovTrab" DOUBLE PRECISION NOT NULL DEFAULT 0.01,
    "pctFaovPatrono" DOUBLE PRECISION NOT NULL DEFAULT 0.02,
    "pctIncesTrab" DOUBLE PRECISION NOT NULL DEFAULT 0.005,
    "pctIncesPatrono" DOUBLE PRECISION NOT NULL DEFAULT 0.02,
    "topeIvssSm" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "topeRpeSm" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "diasUtilidades" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "diasBonoVacMes" DOUBLE PRECISION NOT NULL DEFAULT 2,
    "horasJornada" DOUBLE PRECISION NOT NULL DEFAULT 8,
    "recargoNocturno" DOUBLE PRECISION NOT NULL DEFAULT 1.3,
    "recargoExtra" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
    "diasMes" DOUBLE PRECISION NOT NULL DEFAULT 30,

    CONSTRAINT "ParametroNomina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venta" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "productoId" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "precioUnitario" DOUBLE PRECISION NOT NULL,
    "descuento" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "exento" BOOLEAN NOT NULL DEFAULT false,
    "pctIva" DOUBLE PRECISION NOT NULL,
    "costoUnitDirecto" DOUBLE PRECISION NOT NULL,
    "costoUnitTotal" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Venta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "categoria" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "medio" TEXT NOT NULL DEFAULT 'TRANSFERENCIA',
    "comprobante" TEXT,
    "indirectoId" TEXT,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CuentaContable" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,

    CONSTRAINT "CuentaContable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaldoCuenta" (
    "id" TEXT NOT NULL,
    "cuentaId" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "SaldoCuenta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_correo_key" ON "Usuario"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "Membresia_usuarioId_empresaId_key" ON "Membresia"("usuarioId", "empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "UnidadMedida_empresaId_nombre_key" ON "UnidadMedida"("empresaId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "MateriaPrima_empresaId_codigo_key" ON "MateriaPrima"("empresaId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Insumo_empresaId_nombre_key" ON "Insumo"("empresaId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Producto_empresaId_codigo_key" ON "Producto"("empresaId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Cargo_empresaId_nombre_key" ON "Cargo"("empresaId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Empleado_empresaId_cedula_key" ON "Empleado"("empresaId", "cedula");

-- CreateIndex
CREATE UNIQUE INDEX "Novedad_empleadoId_periodo_key" ON "Novedad"("empleadoId", "periodo");

-- CreateIndex
CREATE UNIQUE INDEX "ParametroNomina_empresaId_vigenciaDesde_key" ON "ParametroNomina"("empresaId", "vigenciaDesde");

-- CreateIndex
CREATE INDEX "Venta_empresaId_fecha_idx" ON "Venta"("empresaId", "fecha");

-- CreateIndex
CREATE INDEX "Pago_empresaId_fecha_idx" ON "Pago"("empresaId", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "CuentaContable_empresaId_nombre_key" ON "CuentaContable"("empresaId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "SaldoCuenta_cuentaId_periodo_key" ON "SaldoCuenta"("cuentaId", "periodo");

-- AddForeignKey
ALTER TABLE "Membresia" ADD CONSTRAINT "Membresia_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membresia" ADD CONSTRAINT "Membresia_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnidadMedida" ADD CONSTRAINT "UnidadMedida_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MateriaPrima" ADD CONSTRAINT "MateriaPrima_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MateriaPrima" ADD CONSTRAINT "MateriaPrima_unidadId_fkey" FOREIGN KEY ("unidadId") REFERENCES "UnidadMedida"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Insumo" ADD CONSTRAINT "Insumo_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineaReceta" ADD CONSTRAINT "LineaReceta_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineaReceta" ADD CONSTRAINT "LineaReceta_materiaId_fkey" FOREIGN KEY ("materiaId") REFERENCES "MateriaPrima"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineaReceta" ADD CONSTRAINT "LineaReceta_insumoId_fkey" FOREIGN KEY ("insumoId") REFERENCES "Insumo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineaReceta" ADD CONSTRAINT "LineaReceta_subRecetaId_fkey" FOREIGN KEY ("subRecetaId") REFERENCES "Producto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostoIndirecto" ADD CONSTRAINT "CostoIndirecto_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activo" ADD CONSTRAINT "Activo_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cargo" ADD CONSTRAINT "Cargo_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Empleado" ADD CONSTRAINT "Empleado_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Empleado" ADD CONSTRAINT "Empleado_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "Cargo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Novedad" ADD CONSTRAINT "Novedad_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "Empleado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParametroNomina" ADD CONSTRAINT "ParametroNomina_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_indirectoId_fkey" FOREIGN KEY ("indirectoId") REFERENCES "CostoIndirecto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CuentaContable" ADD CONSTRAINT "CuentaContable_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaldoCuenta" ADD CONSTRAINT "SaldoCuenta_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "CuentaContable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

