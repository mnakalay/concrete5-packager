const fs = require('fs-extra')

export default (dir) => {
  try {
    return fs.statSync(dir).isFile()
  } catch (e) {
    if (e.code === 'ENOENT') {
      return false
    } else {
      throw e
    }
  }
}
