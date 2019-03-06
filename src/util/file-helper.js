const fs = require('fs-extra')
import checkFileExists from './check-file-exists'

function readFile(file) {
  return new Promise((resolve, reject) => {
    if (checkFileExists(file)) {
      fs.readFile(file, 'utf-8', (err, content) => {
        if (err){ 
          console.error('oups read error: ' + err)
          reject(err)
        } else {
          resolve(content)
        }
      })
    } else {
      return resolve(false)
    }
  })
}

function writeFile(file, content) {
  return new Promise((resolve, reject) => {
    fs.writeFile(file, content, 'utf-8', (err) => {
      if (err){
        console.error('oups write error: ' + err)
        reject(err)
      } else {
        resolve(true)
      }
    })
  })
}

// async function writeFile(file, content) {
//   // return new Promise(() => {
//   return fs.writeFile(file, content, 'utf-8', error => {
//     if (error) {
//       console.error('oups write error: ' + error)
//       return false
//     }

//     return true
//   })
//   // })
// }

export default { readFile, writeFile }
