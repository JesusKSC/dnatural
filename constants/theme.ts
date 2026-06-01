// Paleta extraída del prototipo HTML (prototipo.html → :root variables)
export const Colors = {
  bosque:   '#16432F',
  verde:    '#23744C',
  verde2:   '#2E8B5A',
  hoja:     '#7FC241',
  hojaSoft: '#A8D672',
  miel:     '#E4A12E',
  mielSoft: '#F4D08A',
  rojo:     '#C8502E',
  rojoSoft: '#F3D9CE',
  crema:    '#F6F2E8',
  crema2:   '#EFE9DA',
  papel:    '#FFFFFF',
  carbon:   '#1E2A23',
  gris:     '#6C7A70',
  linea:    '#E2DCCC',
} as const;

// Equivalentes RN de --sombra y --sombra-sm
export const Shadow = {
  md: {
    shadowColor: '#16432F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 8,
  },
  sm: {
    shadowColor: '#16432F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
} as const;

export const Radii = {
  xs:   9,
  sm:   11,
  md:   14,
  lg:   16,
  xl:   18,
  xxl:  26,
  full: 999,
} as const;

// Emoji de categoría (mismo que prototipo.html)
export const CatIcon: Record<string, string> = {
  Gelatinas: '🍮',
  Cápsulas:  '💊',
  Polvos:    '🥄',
  Gomitas:   '🐻',
  Líquidos:  '🫙',
  Otros:     '🌿',
};

// Color de fondo del tile/avatar por categoría
export const CatBg: Record<string, string> = {
  Gelatinas: 'rgba(228,161,46,0.18)',
  Cápsulas:  'rgba(35,116,76,0.12)',
  Polvos:    'rgba(127,194,65,0.16)',
  Gomitas:   'rgba(200,80,46,0.14)',
  Líquidos:  'rgba(46,139,90,0.14)',
  Otros:     'rgba(127,194,65,0.16)',
};

// Umbrales de negocio (de doris-excel-context.md sección 3)
export const StockAlerta = 5;           // ≤5 unidades → badge "bajo"

export const Margen = {
  bueno: 25,   // ≥25% → verde
  ok:    15,   // 15–24% → amarillo
  bajo:  0,    // <15%  → rojo
} as const;
