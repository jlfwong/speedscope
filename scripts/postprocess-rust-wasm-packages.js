const fs = require('fs')
const path = require('path')

const packageUpdates = [
  {
    path: path.join(
      __dirname,
      '..',
      'src',
      'experimental',
      'rust-importer',
      'pkg-web',
      'package.json',
    ),
    name: 'speedscope-importer-web',
  },
  {
    path: path.join(
      __dirname,
      '..',
      'src',
      'experimental',
      'rust-importer',
      'pkg-node',
      'package.json',
    ),
    name: 'speedscope-importer-node',
  },
]

for (const update of packageUpdates) {
  const packageJson = JSON.parse(fs.readFileSync(update.path, 'utf8'))
  packageJson.name = update.name
  fs.writeFileSync(update.path, `${JSON.stringify(packageJson, null, 2)}\n`)
}
