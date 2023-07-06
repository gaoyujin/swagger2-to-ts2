import { ConfigInfo } from '../models/configEntity'
import { PathsInfo, Swagger2 } from '../models/controllerEntity'
import {
  FileDesc,
  getEmptyApiRefInfo,
  getEmptyFileDesc,
} from '../models/fileEntity'

export class SwaggerDataToFile {
  swaggerData: Swagger2
  configData: ConfigInfo
  public fileDescData: Record<string, FileDesc> | null

  constructor(data: Swagger2, configData: ConfigInfo) {
    this.swaggerData = data
    this.configData = configData

    this.fileDescData = this.processData()
  }

  // 处理swagger的数据，转换成文件描述
  processData() {
    if (!this.swaggerData || !this.swaggerData.paths) {
      return null
    }

    let pathArr: Record<string, FileDesc> = {}

    if (this.configData.fileMode === 'info') {
    } else {
      Object.keys(this.swaggerData.paths).forEach((key) => {
        if (
          this.configData.onlyPath &&
          this.configData.onlyPath.length > 0 &&
          this.configData.onlyPath[0]
        ) {
          // 只生成某个路径
          const only = this.checkOnlyPath(key)
          if (only) {
            this.setClassInfo(pathArr, key)
          }
        } else {
          const exclude = this.checkExclude(key)
          // 未被排除
          if (!exclude) {
            this.setClassInfo(pathArr, key)
          }
        }
      })
    }

    return pathArr
  }

  // 实体映射
  setClassInfo(pathArr: Record<string, FileDesc>, key: string) {
    const className = this.checkPaths(key)
    if (className) {
      if (!pathArr[className]) {
        pathArr[className] = getEmptyFileDesc()
      }
      pathArr[className].className = className
      pathArr[className].apiPaths.push(key)

      if (!pathArr[className].apiRefs[key]) {
        pathArr[className].apiRefs[key] = getEmptyApiRefInfo()
      }
      pathArr[className].apiRefs[key].orignInfo = this.swaggerData.paths[key]

      pathArr[className].apiRefs[key].parameters = this.setParameters(
        this.swaggerData.paths[key]
      )

      pathArr[className].apiRefs[key].parametersOrign = undefined
      if (
        this.swaggerData.paths[key].post &&
        this.swaggerData.paths[key].post?.parameters
      ) {
        pathArr[className].apiRefs[key].parametersOrign =
          this.swaggerData.paths[key].post?.parameters
      } else if (
        this.swaggerData.paths[key].get &&
        this.swaggerData.paths[key].get?.parameters
      ) {
        pathArr[className].apiRefs[key].parametersOrign =
          this.swaggerData.paths[key].get?.parameters
      }

      pathArr[className].apiRefs[key].responses = undefined
      if (
        this.swaggerData.paths[key].post &&
        this.swaggerData.paths[key].post?.responses[200] &&
        this.swaggerData.paths[key].post?.responses[200].schema
      ) {
        pathArr[className].apiRefs[key].responses =
          this.swaggerData.paths[key].post?.responses[200].schema.$ref
      } else if (
        this.swaggerData.paths[key].get &&
        this.swaggerData.paths[key].get?.responses[200] &&
        this.swaggerData.paths[key].get?.responses[200].schema
      ) {
        pathArr[className].apiRefs[key].responses =
          this.swaggerData.paths[key].get?.responses[200].schema.$ref
      }

      pathArr[className].apiRefs[key].responsesOrign = undefined
      if (
        this.swaggerData.paths[key].post &&
        this.swaggerData.paths[key].post?.responses
      ) {
        pathArr[className].apiRefs[key].responsesOrign =
          this.swaggerData.paths[key].post?.responses
      } else if (
        this.swaggerData.paths[key].get &&
        this.swaggerData.paths[key].get?.responses
      ) {
        pathArr[className].apiRefs[key].responsesOrign =
          this.swaggerData.paths[key].get?.responses
      }
    }
  }

  // 设置 parameters
  setParameters(pathData: PathsInfo) {
    let resultArr: Array<string> = []
    if (pathData.post && pathData.post.parameters) {
      pathData.post.parameters.forEach((item) => {
        if (item.schema && item.schema.$ref) {
          resultArr.push(item.schema.$ref)
        }
      })
    } else {
      if (pathData.get && pathData.get.parameters) {
        pathData.get.parameters.forEach((item) => {
          if (item.schema && item.schema.$ref) {
            resultArr.push(item.schema.$ref)
          }
        })
      }
    }
    return resultArr
  }

  // 只生成某个路径
  checkOnlyPath(path: string) {
    let result = false
    if (!path || !this.configData.onlyPath) {
      return result
    }

    this.configData.onlyPath.forEach((route) => {
      if (route && path.startsWith(route)) {
        result = true
      }
    })

    return result
  }

  // 判断是否被排除
  checkExclude(path: string) {
    let result = false
    if (!path || !this.configData.excludeRoute) {
      return result
    }

    this.configData.excludeRoute.forEach((route) => {
      if (route && path.startsWith(route)) {
        result = true
      }
    })

    return result
  }

  // 获取API的文件名称
  checkPaths(path: string) {
    let className = ''
    if (!path || !this.configData.pathRoute) {
      return className
    }

    // 第一个配置起效
    this.configData.pathRoute.forEach((route) => {
      if (path.startsWith(route) && !className) {
        let pathTemp = path.replace(route, '')
        const pathArr = pathTemp.split('/').filter((item) => item != '')
        className = pathArr[0]
      }
    })

    return className
  }

  getFileDesc() {
    return this.fileDescData
  }
}
