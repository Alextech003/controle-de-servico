import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function generateIcons() {
  const publicDir = path.resolve('./public');
  const svgPath = path.join(publicDir, 'icon.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  const targets = [
    { name: 'favicon.png', size: 64 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'pwa-192x192.png', size: 192 },
    { name: 'pwa-512x512.png', size: 512 },
    { name: 'pwa-maskable-512x512.png', size: 512 },
  ];

  for (const target of targets) {
    const outPath = path.join(publicDir, target.name);
    await sharp(svgBuffer)
      .resize(target.size, target.size)
      .png()
      .toFile(outPath);
    console.log(`Generated: ${target.name} (${target.size}x${target.size})`);
  }

  // Também criar favicon.ico copiando ou gerando a partir de 32x32
  await sharp(svgBuffer)
    .resize(32, 32)
    .toFormat('png')
    .toFile(path.join(publicDir, 'favicon.ico'));
    
  console.log('Todos os ícones foram gerados com sucesso!');
}

generateIcons().catch(err => {
  console.error('Erro ao gerar ícones:', err);
  process.exit(1);
});
