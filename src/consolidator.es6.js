import is from 'is'
import fs from 'async-file'
import path from 'path'
import glob from 'glob-promise'

async function concatenateDataToFile$1(sourceFileData, destinationFile) {
  if (!is.empty(sourceFileData.trim())) {
    let destinationDirectory = path.dirname(destinationFile)
    if (!await fs.exists(destinationDirectory)) {
      await fs.createDirectory(destinationDirectory)
    }
    return fs.appendFile(destinationFile, sourceFileData)
  }
}

async function concatenateFileToFile(sourceFile, destinationFile) {
  if (await fs.exists(sourceFile)) {
    return concatenateDataToFile$1(
      await fs.readTextFile(sourceFile),
      destinationFile
    )
  }
}

var concatenate = {
  dataToFile: concatenateDataToFile$1,
  fileToFile: concatenateFileToFile
}

async function consolidateFileToFile$1(sourceFile, destinationFile) {
  await fs.delete(destinationFile)
  await concatenate.fileToFile(sourceFile, destinationFile)
  return fs.delete(sourceFile)
}

async function consolidateFilesToFile$2(sourceFiles, destinationFile) {
  await fs.delete(destinationFile)
  sourceFiles = sourceFiles.filter(is.string)
  if (!is.empty(sourceFiles)) {
    await Promise.all(
      sourceFiles.map(async sourceFile => {
        await concatenate.fileToFile(sourceFile, destinationFile)
        return fs.delete(sourceFile)
      })
    )
  }
}

async function consolidateGlobToFile$1(sourcesGlob, destinationFile) {
  return consolidateFilesToFile$2(await glob(sourcesGlob), destinationFile)
}

var _consolidate = {
  fileToFile: consolidateFileToFile$1,
  filesToFile: consolidateFilesToFile$2,
  globToFile: consolidateGlobToFile$1
}

const SHOULD_BE_AN_ARRAY = `should be an array`

var IsArray = Base =>
  class extends Base {
    isArray(value) {
      if (!is.array(value)) {
        throw new TypeError(`${this.name} ${SHOULD_BE_AN_ARRAY}`)
      }
    }
  }

const SHOULD_BE_AN_ARRAY_OR_A_NON_EMPTY_STRING =
  'should be an array or a non-empty string'

var IsConsolidatable = Base =>
  class extends Base {
    isConsolidatable(value) {
      if (!is.array(value) && !(is.string(value) && !is.empty(value.trim()))) {
        throw new TypeError(
          `${this.name} ${SHOULD_BE_AN_ARRAY_OR_A_NON_EMPTY_STRING}`
        )
      }
    }
  }

const SHOULD_BE_A_NON_EMPTY_STRING = `should be a non-empty string`

var IsString = Base =>
  class extends Base {
    isString(value) {
      if (!(is.string(value) && !is.empty(value.trim()))) {
        throw new TypeError(`${this.name} ${SHOULD_BE_A_NON_EMPTY_STRING}`)
      }
    }
  }

class Validator {
  constructor(name) {
    this.name = name
  }
}

class ConsolidatableValidator extends IsConsolidatable(
  IsString(IsArray(Validator))
) {
  constructor(name) {
    super(name)
  }
}

class StringValidator extends IsString(Validator) {
  constructor(name) {
    super(name)
  }
}

const destination = new StringValidator('destination')
const source = new StringValidator('source')
const sources = new ConsolidatableValidator('sources')

var _validate = {
  destination,
  source,
  sources
}

async function consolidate(sources, destination) {
  _validate.sources.isConsolidatable(sources)
  _validate.destination.isString(destination)
  let consolidate
  if (is.string(sources)) {
    consolidate = _consolidate.globToFile(sources, destination)
  } else {
    consolidate = _consolidate.filesToFile(sources, destination)
  }
  return consolidate
}

async function consolidateGlobToFile(sources, destination) {
  _validate.sources.isString(sources)
  _validate.destination.isString(destination)
  return _consolidate.globToFile(sources, destination)
}

async function consolidateFilesToFile(sources, destination) {
  _validate.sources.isArray(sources)
  _validate.destination.isString(destination)
  return _consolidate.filesToFile(sources, destination)
}

async function consolidateFileToFile(source, destination) {
  _validate.source.isString(source)
  _validate.destination.isString(destination)
  return _consolidate.fileToFile(source, destination)
}

export {
  consolidate,
  consolidateGlobToFile,
  consolidateFilesToFile,
  consolidateFileToFile
}