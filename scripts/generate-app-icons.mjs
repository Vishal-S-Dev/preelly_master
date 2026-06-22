import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const sourceIcon = path.join(projectRoot, 'assets/app_icon.jpg');
const androidRes = path.join(projectRoot, 'android/app/src/main/res');
const iosAppIconSet = path.join(
  projectRoot,
  'ios/Preelly/Images.xcassets/AppIcon.appiconset',
);

const LAUNCHER_SIZES = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

const FOREGROUND_SIZES = {
  'mipmap-mdpi': 108,
  'mipmap-hdpi': 162,
  'mipmap-xhdpi': 216,
  'mipmap-xxhdpi': 324,
  'mipmap-xxxhdpi': 432,
};

const IOS_ICONS = [
  { filename: 'icon-20@1x.png', size: 20 },
  { filename: 'icon-20@2x.png', size: 40 },
  { filename: 'icon-20@3x.png', size: 60 },
  { filename: 'icon-29@1x.png', size: 29 },
  { filename: 'icon-29@2x.png', size: 58 },
  { filename: 'icon-29@3x.png', size: 87 },
  { filename: 'icon-40@1x.png', size: 40 },
  { filename: 'icon-40@2x.png', size: 80 },
  { filename: 'icon-40@3x.png', size: 120 },
  { filename: 'icon-50@1x.png', size: 50 },
  { filename: 'icon-50@2x.png', size: 100 },
  { filename: 'icon-57@1x.png', size: 57 },
  { filename: 'icon-57@2x.png', size: 114 },
  { filename: 'icon-60@2x.png', size: 120 },
  { filename: 'icon-60@3x.png', size: 180 },
  { filename: 'icon-72@1x.png', size: 72 },
  { filename: 'icon-72@2x.png', size: 144 },
  { filename: 'icon-76@1x.png', size: 76 },
  { filename: 'icon-76@2x.png', size: 152 },
  { filename: 'icon-83.5@2x.png', size: 167 },
  { filename: 'icon-1024@1x.png', size: 1024 },
];

const BACKGROUND_COLOR = '#FFFFFF';

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

async function resizeSquare(size, fit = 'contain') {
  return sharp(sourceIcon)
    .resize(size, size, {
      fit,
      background: BACKGROUND_COLOR,
      position: 'centre',
    })
    .png()
    .toBuffer();
}

async function writePng(filePath, buffer) {
  await ensureDir(path.dirname(filePath));
  await fs.promises.writeFile(filePath, buffer);
}

async function generateAndroidIcons() {
  for (const [folder, size] of Object.entries(LAUNCHER_SIZES)) {
    const dir = path.join(androidRes, folder);
    const launcher = await resizeSquare(size);
    await writePng(path.join(dir, 'ic_launcher.png'), launcher);
    await writePng(path.join(dir, 'ic_launcher_round.png'), launcher);
  }

  for (const [folder, size] of Object.entries(FOREGROUND_SIZES)) {
    const dir = path.join(androidRes, folder);
    const foreground = await resizeSquare(size);
    await writePng(path.join(dir, 'ic_launcher_foreground.png'), foreground);
  }

  const drawableDir = path.join(androidRes, 'drawable');
  await ensureDir(drawableDir);
  await fs.promises.writeFile(
    path.join(drawableDir, 'ic_launcher_background.xml'),
    `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="${BACKGROUND_COLOR}" />
</shape>
`,
  );

  const anydpiDir = path.join(androidRes, 'mipmap-anydpi-v26');
  await ensureDir(anydpiDir);

  const adaptiveIconXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
`;

  await fs.promises.writeFile(
    path.join(anydpiDir, 'ic_launcher.xml'),
    adaptiveIconXml,
  );
  await fs.promises.writeFile(
    path.join(anydpiDir, 'ic_launcher_round.xml'),
    adaptiveIconXml,
  );

  const legacyDirs = await fs.promises.readdir(androidRes, { withFileTypes: true });
  for (const entry of legacyDirs) {
    if (entry.isDirectory() && /-v26$/.test(entry.name) && entry.name !== 'mipmap-anydpi-v26') {
      await fs.promises.rm(path.join(androidRes, entry.name), {
        recursive: true,
        force: true,
      });
    }
    if (entry.isDirectory() && entry.name === 'mipmap-ldpi') {
      await fs.promises.rm(path.join(androidRes, entry.name), {
        recursive: true,
        force: true,
      });
    }
  }

  const colorsIconPath = path.join(androidRes, 'values/colors-icon.xml');
  if (fs.existsSync(colorsIconPath)) {
    await fs.promises.unlink(colorsIconPath);
  }
}

async function generateIosIcons() {
  await ensureDir(iosAppIconSet);

  for (const { filename, size } of IOS_ICONS) {
    const buffer = await resizeSquare(size);
    await writePng(path.join(iosAppIconSet, filename), buffer);
  }

  const contents = {
    images: [
      { size: '20x20', idiom: 'iphone', filename: 'icon-20@2x.png', scale: '2x' },
      { size: '20x20', idiom: 'iphone', filename: 'icon-20@3x.png', scale: '3x' },
      { size: '29x29', idiom: 'iphone', filename: 'icon-29@1x.png', scale: '1x' },
      { size: '29x29', idiom: 'iphone', filename: 'icon-29@2x.png', scale: '2x' },
      { size: '29x29', idiom: 'iphone', filename: 'icon-29@3x.png', scale: '3x' },
      { size: '40x40', idiom: 'iphone', filename: 'icon-40@2x.png', scale: '2x' },
      { size: '40x40', idiom: 'iphone', filename: 'icon-40@3x.png', scale: '3x' },
      { size: '57x57', idiom: 'iphone', filename: 'icon-57@1x.png', scale: '1x' },
      { size: '57x57', idiom: 'iphone', filename: 'icon-57@2x.png', scale: '2x' },
      { size: '60x60', idiom: 'iphone', filename: 'icon-60@2x.png', scale: '2x' },
      { size: '60x60', idiom: 'iphone', filename: 'icon-60@3x.png', scale: '3x' },
      { size: '20x20', idiom: 'ipad', filename: 'icon-20@1x.png', scale: '1x' },
      { size: '20x20', idiom: 'ipad', filename: 'icon-20@2x.png', scale: '2x' },
      { size: '29x29', idiom: 'ipad', filename: 'icon-29@1x.png', scale: '1x' },
      { size: '29x29', idiom: 'ipad', filename: 'icon-29@2x.png', scale: '2x' },
      { size: '40x40', idiom: 'ipad', filename: 'icon-40@1x.png', scale: '1x' },
      { size: '40x40', idiom: 'ipad', filename: 'icon-40@2x.png', scale: '2x' },
      { size: '50x50', idiom: 'ipad', filename: 'icon-50@1x.png', scale: '1x' },
      { size: '50x50', idiom: 'ipad', filename: 'icon-50@2x.png', scale: '2x' },
      { size: '72x72', idiom: 'ipad', filename: 'icon-72@1x.png', scale: '1x' },
      { size: '72x72', idiom: 'ipad', filename: 'icon-72@2x.png', scale: '2x' },
      { size: '76x76', idiom: 'ipad', filename: 'icon-76@1x.png', scale: '1x' },
      { size: '76x76', idiom: 'ipad', filename: 'icon-76@2x.png', scale: '2x' },
      { size: '83.5x83.5', idiom: 'ipad', filename: 'icon-83.5@2x.png', scale: '2x' },
      {
        size: '1024x1024',
        idiom: 'ios-marketing',
        filename: 'icon-1024@1x.png',
        scale: '1x',
      },
    ],
    info: { version: 1, author: 'xcode' },
  };

  await fs.promises.writeFile(
    path.join(iosAppIconSet, 'Contents.json'),
    `${JSON.stringify(contents, null, 2)}\n`,
  );
}

async function main() {
  if (!fs.existsSync(sourceIcon)) {
    throw new Error(`Source icon not found: ${sourceIcon}`);
  }

  const metadata = await sharp(sourceIcon).metadata();
  console.log(
    `Generating icons from ${sourceIcon} (${metadata.width}x${metadata.height})`,
  );

  await generateAndroidIcons();
  console.log('Android launcher and adaptive icons generated.');

  await generateIosIcons();
  console.log('iOS AppIcon assets generated.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
