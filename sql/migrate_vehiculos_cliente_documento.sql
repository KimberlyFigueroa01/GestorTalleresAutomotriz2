-- Migración: vehiculos referencia clientes por documento en lugar de id
-- Ejecutar solo si la tabla vehiculos aún tiene la columna cliente_id

ALTER TABLE vehiculos ADD cliente_documento VARCHAR2(20);

UPDATE vehiculos v
SET cliente_documento = (
  SELECT c.documento FROM clientes c WHERE c.id = v.cliente_id
)
WHERE v.cliente_id IS NOT NULL;

ALTER TABLE vehiculos DROP COLUMN cliente_id;

ALTER TABLE vehiculos ADD CONSTRAINT fk_vehiculos_cliente_doc
  FOREIGN KEY (cliente_documento) REFERENCES clientes(documento) ON DELETE CASCADE;
