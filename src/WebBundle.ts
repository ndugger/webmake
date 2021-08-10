import { join } from 'path/posix'
import * as WebBn from 'wbn'

import { EphemeralFile } from './EphemeralFile'

export class WebBundle extends EphemeralFile {

    private address: string
    private builder: WebBn.BundleBuilder
    private files: EphemeralFile[]

    public constructor(name: string, address: string) {
        super(`${ name }.wbn`, 'application/webbundle')

        this.address = address.replace(/\/$/, '')
        this.builder = new WebBn.BundleBuilder(this.address)
        this.files = []
    }

    public addFile(file: EphemeralFile) {
        this.files.push(file)
    }

    public pack() {
        this.files.forEach(file => {
            this.builder.addExchange(this.address + (file.fileName === '/' ? '' : '/' + file.fileName), 200, { 'content-type': file.mimeType }, file.contents)
        })
        
        this.contents = this.builder.createBundle().toString()

        return this
    }

    public sign() {
        throw new Error('I\'m sorry Dave, I\'m afraid I can\'t do that')
    }
}