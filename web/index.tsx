import './components/wm-layout'

import themeStyle from './components/theme.css'

document.adoptedStyleSheets = [ themeStyle ]
document.body.append(<wm-layout></wm-layout>)
