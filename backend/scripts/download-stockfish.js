'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BIN_DIR = path.resolve(__dirname, '..', 'bin');
const TARGET_EXE = path.join(BIN_DIR, 'stockfish.exe');

async function main() {
  if (fs.existsSync(TARGET_EXE)) {
    console.log('✓ Stockfish ya está presente en:', TARGET_EXE);
    return;
  }

  console.log('Descargando binario oficial de Stockfish para Windows...');
  fs.mkdirSync(BIN_DIR, { recursive: true });

  const zipPath = path.join(BIN_DIR, 'stockfish.zip');
  const tempExtract = path.join(BIN_DIR, 'temp_sf');

  const downloadUrl =
    'https://github.com/official-stockfish/Stockfish/releases/download/sf_19/stockfish-windows-x86-64-universal.zip';

  // Usar PowerShell nativo de Windows para descargar y descomprimir
  execSync(
    `powershell -Command "Invoke-WebRequest -Uri '${downloadUrl}' -OutFile '${zipPath}'"`,
    { stdio: 'inherit' },
  );

  execSync(
    `powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${tempExtract}' -Force"`,
    { stdio: 'inherit' },
  );

  // Buscar el archivo .exe dentro de tempExtract
  function findExe(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const full = path.join(dir, f);
      if (fs.statSync(full).isDirectory()) {
        const found = findExe(full);
        if (found) return found;
      } else if (f.endsWith('.exe')) {
        return full;
      }
    }
    return null;
  }

  const foundExe = findExe(tempExtract);
  if (!foundExe) {
    throw new Error('No se encontró archivo .exe en el archivo zip descargado.');
  }

  fs.copyFileSync(foundExe, TARGET_EXE);
  console.log('✓ Stockfish instalado correctamente en:', TARGET_EXE);

  // Limpiar temporales
  fs.rmSync(tempExtract, { recursive: true, force: true });
  fs.rmSync(zipPath, { force: true });
}

main().catch((err) => {
  console.error('Error configurando Stockfish:', err);
  process.exit(1);
});
