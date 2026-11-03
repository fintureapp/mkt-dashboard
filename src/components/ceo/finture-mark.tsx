/**
 * Símbolo da Finture (sem o nome), em SVG inline para ficar nítido em qualquer
 * tela. Geometria copiada de `finture-board/public/finture-mark.svg`.
 */
export function FintureMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="50 -8 210 210"
      fill="#ea622d"
      role="img"
      aria-label="Finture"
      className={className}
    >
      <polygon points="254.9 7.23 243.86 44.98 151.92 45.11 82.1 112.39 55.68 86.52 135.54 7.23 254.9 7.23" />
      <polygon points="236.89 66.48 225.78 104.15 172.43 104.54 123.33 152.34 98.08 127.76 160.51 66.48 236.89 66.48" />
      <polygon points="166.9 135.61 189.22 161.53 166.91 186.61 142.26 162.53 166.9 135.61" />
    </svg>
  );
}
