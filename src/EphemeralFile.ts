import { nanoid } from 'nanoid'

export class EphemeralFile {

    public contents: string

    public readonly fileName: string
    public readonly mimeType: string
    public readonly identity: string

    public constructor(fileName: string, mimeType: string, contents = '') {
        this.contents = contents
        this.fileName = fileName
        this.mimeType = mimeType
        this.identity = nanoid()
    }

    public toString(): string {
        return this.contents
    }
}