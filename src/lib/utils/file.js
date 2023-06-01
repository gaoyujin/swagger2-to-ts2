import * as fs from 'fs'
import * as path from 'path'

// 创建目录
export const makeDirSync = (filePath) => {
  let items = filePath.split(path.sep)
  for (let i = 1; i < items.length; i++) {
    let dir = items.slice(0, i).join(path.sep)
    // mac系统没有盘符
    if (!dir) {
      continue
    }
    try {
      fs.accessSync(dir)
    } catch (err) {
      fs.mkdirSync(dir)
    }
  }
}
