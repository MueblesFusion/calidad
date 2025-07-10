-- Crear tabla para reportes de defectos
CREATE TABLE defect_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  fecha DATE NOT NULL,
  area VARCHAR(50) NOT NULL CHECK (area IN ('SILLAS', 'SALAS')),
  producto VARCHAR(255) NOT NULL,
  color VARCHAR(100),
  lf VARCHAR(100),
  pt VARCHAR(100),
  lp VARCHAR(100),
  pedido VARCHAR(100),
  cliente VARCHAR(255),
  defecto VARCHAR(255) NOT NULL,
  descripcion TEXT,
  foto_url TEXT
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_defect_reports_fecha ON defect_reports(fecha);
CREATE INDEX idx_defect_reports_area ON defect_reports(area);
CREATE INDEX idx_defect_reports_defecto ON defect_reports(defecto);

-- Habilitar Row Level Security (RLS)
ALTER TABLE defect_reports ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir todas las operaciones (puedes ajustar según tus necesidades)
CREATE POLICY "Enable all operations for defect_reports" ON defect_reports
FOR ALL USING (true);

-- Crear bucket para almacenar fotos
INSERT INTO storage.buckets (id, name, public) VALUES ('defect-photos', 'defect-photos', true);

-- Crear política para el bucket de fotos
CREATE POLICY "Enable all operations for defect photos" ON storage.objects
FOR ALL USING (bucket_id = 'defect-photos');
