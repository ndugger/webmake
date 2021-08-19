import { writeFile } from 'fs/promises'
import { webmake } from '.'

webmake('./demo/index.tsx').then(bundle => writeFile(bundle.fileName, bundle.content))
