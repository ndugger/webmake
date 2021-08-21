import { writeFile } from 'fs/promises'
import { webmake } from '.'

webmake('web/index.tsx').then(bundle => writeFile(bundle.fileName, bundle.content))
