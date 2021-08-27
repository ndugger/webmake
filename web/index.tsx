import './components/wm-layout'

import globalStyle from './components/global.css'
import themeStyle from './components/theme.css'

document.adoptedStyleSheets = [ 
    themeStyle,
    globalStyle
]

document.body.append(<wm-layout></wm-layout>)
