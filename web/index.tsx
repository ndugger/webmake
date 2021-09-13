import './components/wm-app'

import globalStyle from './components/global.css'
import themeStyle from './components/theme.css'

document.adoptedStyleSheets = [
    themeStyle,
    globalStyle
]

document.body.append(<wm-app port="8080"></wm-app>)
