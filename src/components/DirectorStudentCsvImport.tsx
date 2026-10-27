import React, { useMemo, useState } from 'react';
import { SchoolGroup, Student } from '../types';

interface Props {
  groups: SchoolGroup[];
  existingStudents: Student[];
  onImport: (groupId: string, rows: { name: string; matricula: string }[]) => Promise<void>;
}

const inputClass = 'block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm';

function parseCsv(text: string): { rows: { name: string; matricula: string }[]; errors: string[] } {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return { rows: [], errors: ['El archivo debe incluir encabezados y al menos un alumno.'] };
  const split = (line: string) => {
    const cells: string[] = [];
    let value = '', quoted = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"' && quoted && line[i + 1] === '"') { value += '"'; i++; }
      else if (ch === '"') quoted = !quoted;
      else if ((ch === ',' || ch === ';' || ch === '\t') && !quoted) { cells.push(value.trim()); value = ''; }
      else value += ch;
    }
    cells.push(value.trim());
    return cells;
  };
  const header = split(lines[0]).map((cell) => cell.toLocaleLowerCase('es-MX').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, ''));
  const nameIndex = header.findIndex((h) => ['nombre', 'nombres', 'nombrecompleto', 'alumno', 'name'].includes(h));
  const matriculaIndex = header.findIndex((h) => ['matricula', 'matriculas', 'numeroempleado', 'id'].includes(h));
  if (nameIndex < 0 || matriculaIndex < 0) return { rows: [], errors: ['No encuentro las columnas Nombre y Matrícula. Usa encabezados: Nombre,Matrícula.'] };
  const rows: { name: string; matricula: string }[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();
  lines.slice(1).forEach((line, index) => {
    const cells = split(line);
    const name = (cells[nameIndex] || '').trim();
    const matricula = (cells[matriculaIndex] || '').trim();
    if (!name && !matricula) return;
    if (!name || !matricula) { errors.push('Fila ' + (index + 2) + ': falta nombre o matrícula.'); return; }
    const key = matricula.toLocaleLowerCase('es-MX');
    if (seen.has(key)) { errors.push('Fila ' + (index + 2) + ': matrícula repetida en el archivo (' + matricula + ').'); return; }
    seen.add(key);
    rows.push({ name, matricula });
  });
  return { rows, errors };
}

export const DirectorStudentCsvImport: React.FC<Props> = ({ groups, existingStudents, onImport }) => {
  const [groupId, setGroupId] = useState(groups[0]?.id || '');
  const [rows, setRows] = useState<{ name: string; matricula: string }[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const groupStudents = useMemo(() => existingStudents.filter((student) => student.groupId === groupId), [existingStudents, groupId]);
  const existingMatriculas = useMemo(() => new Set(existingStudents.map((student) => student.matricula.trim().toLocaleLowerCase('es-MX'))), [existingStudents]);

  const loadFile = async (file?: File) => {
    setNotice('');
    setErrors([]);
    setRows([]);
    setFileName('');
    if (!file) return;
    if (!/\.csv$/i.test(file.name) && file.type !== 'text/csv' && file.type !== 'application/vnd.ms-excel') {
      setErrors(['Por ahora se acepta CSV exportado desde Excel; los archivos .xlsx no se procesan directamente.']);
      return;
    }
    if (file.size > 2 * 1024 * 1024) { setErrors(['El archivo supera 2 MB. Divide la lista en archivos más pequeños.']); return; }
    try {
      const parsed = parseCsv(await file.text());
      setFileName(file.name);
      setRows(parsed.rows);
      setErrors(parsed.errors);
      if (!parsed.rows.length && !parsed.errors.length) setErrors(['No se encontraron alumnos válidos.']);
    } catch { setErrors(['No se pudo leer el archivo. Guárdalo como CSV UTF-8 e inténtalo de nuevo.']); }
  };

  const submit = async () => {
    setNotice('');
    const duplicates = rows.filter((row) => existingMatriculas.has(row.matricula.trim().toLocaleLowerCase('es-MX')));
    if (!groupId) { setErrors(['Selecciona el grupo al que se inscribirán los alumnos.']); return; }
    if (!rows.length) { setErrors(['Carga un CSV con alumnos válidos antes de importar.']); return; }
    if (errors.length) { setNotice('Corrige los errores del archivo antes de importar.'); return; }
    if (duplicates.length) { setErrors(duplicates.map((row) => 'La matrícula ' + row.matricula + ' ya existe en el plantel; no se importó.')); return; }
    setBusy(true);
    try {
      await onImport(groupId, rows);
      setNotice('La solicitud de importación terminó. Verifica que los registros aparezcan en la lista antes de volver a importar.');
      setRows([]);
      setFileName('');
    } catch (e) { setErrors([e instanceof Error ? e.message : 'La importación falló; revisa Firestore antes de reintentar.']); }
    finally { setBusy(false); }
  };

  return <section className="space-y-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
    <div><h4 className="font-bold text-slate-900">Importación de alumnos por CSV</h4><p className="mt-1 text-xs leading-relaxed text-slate-600">Exporta tu hoja de Excel como CSV UTF-8. Columnas requeridas: <strong>Nombre</strong> y <strong>Matrícula</strong>. No crea cuentas ni contraseñas.</p></div>
    <label className="block text-xs font-semibold text-slate-600">Grupo destino<select className={inputClass + ' mt-1 bg-white'} value={groupId} onChange={(e) => { setGroupId(e.target.value); setNotice(''); }}><option value="">Seleccionar grupo</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.name} · {group.semester}° · {group.turn}</option>)}</select></label>
    <label className="block text-xs font-semibold text-slate-600">Archivo CSV<input className={inputClass + ' mt-1 bg-white'} type="file" accept=".csv,text/csv" onChange={(e) => void loadFile(e.target.files?.[0])} /></label>
    {fileName && <p className="text-xs text-slate-500">Archivo: {fileName} · {rows.length} fila(s) válidas · {groupStudents.length} alumno(s) en el grupo destino.</p>}
    {rows.length > 0 && <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white"><table className="w-full text-left text-xs"><thead><tr className="border-b bg-slate-50"><th className="p-2">Nombre</th><th className="p-2">Matrícula</th></tr></thead><tbody>{rows.slice(0, 5).map((row, index) => <tr key={row.matricula + index} className="border-b last:border-0"><td className="p-2">{row.name}</td><td className="p-2">{row.matricula}</td></tr>)}</tbody></table>{rows.length > 5 && <p className="p-2 text-xs text-slate-500">Vista previa de las primeras 5 filas.</p>}</div>}
    {errors.length > 0 && <div role="alert" className="rounded-xl bg-red-50 p-3 text-xs text-red-700"><ul className="list-disc space-y-1 pl-4">{errors.slice(0, 8).map((error, index) => <li key={index}>{error}</li>)}</ul>{errors.length > 8 && <p className="mt-1">Y {errors.length - 8} error(es) más.</p>}</div>}
    {notice && <p role="status" className="rounded-xl bg-white p-3 text-xs text-slate-700">{notice}</p>}
    <button type="button" onClick={() => void submit()} disabled={busy || !rows.length || !groupId} className="rounded-xl bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Importando…' : 'Validar e importar alumnos'}</button>
  </section>;
};
