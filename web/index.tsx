import './components/wm-layout'

import globalStyle from './components/global.css'
import themeStyle from './components/theme.css'

document.adoptedStyleSheets = [ 
    globalStyle,
    themeStyle
]

document.body.append(<wm-layout></wm-layout>)
