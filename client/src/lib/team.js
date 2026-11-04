// Label divisi tim — dipakai halaman publik (/tentang) dan admin (/admin/tim).
export const TEAM_DEPARTMENTS = [
  ["MANAJEMEN", "Manajemen"],
  ["TEKNIK", "Teknik"],
  ["ARSITEK_INTERIOR", "Arsitek & Interior"],
  ["PENGAWAS", "Pengawas"],
  ["ADMINISTRASI", "Administrasi"],
];

export const TEAM_DEPT_LABEL = Object.fromEntries(TEAM_DEPARTMENTS);

export const teamDeptLabel = (v) => TEAM_DEPT_LABEL[v] ?? v;
