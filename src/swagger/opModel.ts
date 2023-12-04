'use strict'
import * as fs from 'fs'
import * as path from 'path'
import * as ejs from 'ejs'
import * as file from '../lib/utils/file.js'

import { ConfigInfo } from '../models/configEntity'
import {
  DefinitionsInfo,
  PropertyInfo,
  Swagger2,
} from '../models/controllerEntity'
import { ApiRefInfo, FileDesc, PropertyDesc } from '../models/fileEntity'

export class SwaggerToModel {
  configData: ConfigInfo
  swaggerData: Record<string, FileDesc> | null
  swaggerOrign: Swagger2
  // 记录文件中生成的模式
  modelNameArr: Record<string, Array<string>>
  // 记录import的信息集合
  importArr: Record<string, Array<string>>

  constructor(
    swaggerData: Record<string, FileDesc> | null,
    configData: ConfigInfo,
    swagger: Swagger2
  ) {
    this.configData = configData // 配置信息
    this.swaggerData = swaggerData // 转换的文件信息
    this.swaggerOrign = swagger // 原生的swagger
    this.modelNameArr = {}
    this.importArr = {}

    this.createModels()
  }

  // 设置模型的路径
  getModePath() {
    // 记录所有的模型名称，防止重复
    let modelPath = path.join(
      process.cwd() + path.sep + 'src',
      this.configData.models!.dir
    )
    if (this.configData.serveFileName) {
      modelPath = path.join(
        process.cwd() + path.sep + 'src',
        this.configData.models!.dir,
        this.configData.serveFileName
      )
    }

    return modelPath
  }

  // 入口函数
  createModels() {
    if (!this.configData.models || !this.configData.models.isCreate) {
      return
    }
    // 记录所有的模型名称，防止重复
    const modelPath = this.getModePath()
    file.makeDirSync(modelPath)
    fs.exists(modelPath, (exists: boolean) => {
      if (!exists) {
        fs.mkdir(modelPath, (err: any) => {
          if (err) {
            return console.error(err)
          } else {
            this.startCreateModel()
          }
        })
      } else {
        this.startCreateModel()
      }
    })
  }
  // 创建model的文件
  startCreateModel() {
    if (!this.swaggerData) {
      return
    }

    let filePath = this.getModePath()

    Object.keys(this.swaggerData).forEach((key) => {
      const fileDir = filePath + path.sep + key + '.ts'
      // 记录引用
      if (!this.importArr[key]) {
        this.importArr[key] = []
      }

      // 添加记录属性
      if (!this.modelNameArr[key + '-model']) {
        this.modelNameArr[key + '-model'] = []
      }

      fs.exists(fileDir, (isExists: boolean) => {
        if (isExists) {
          if (this.configData.models!.isCover) {
            this.createFile(fileDir, key)
          }
        } else {
          this.createFile(fileDir, key)
        }
      })
    })
  }

  // 创建文件
  createFile(fileDir: string, key: string) {
    // 获取模型的数据
    const fileContent = this.createEntity(this.swaggerData![key], key)

    fs.writeFile(fileDir, fileContent, (err: any) => {
      // 创建失败
      if (err) {
        console.log(`创建失败：${err}`)
      }
    })
  }

  // 先绑定孩子的实体对象
  processSubProperty(
    results: Record<string, PropertyDesc>,
    fileContent: string
  ) {
    let subContent = fileContent
    if (!results || Object.keys(results).length < 1) {
      return subContent
    }

    Object.keys(results).forEach((subKey) => {
      const dataDescent: PropertyDesc = results[subKey]
      if (dataDescent && dataDescent.subProperty) {
        if (subContent) {
          subContent = subContent + '\r\n'
        }

        subContent = subContent + dataDescent.subProperty
      }
    })

    return subContent
  }


  // 生产返回实体
  createApiModel(
    definitions: any,
    modelKey: string,
    summary: string,
    fileContent: string
  ) {
    const fileTemps = this.getTemplateInfo('models')
    // 添加模型生成标识，防止重复
    this.modelNameArr[modelKey + '-model'].push(definitions.title)
    if (definitions.properties) {
      const keys = Object.keys(definitions.properties)
      const results = this.convertProperty(
        definitions.properties,
        modelKey,
        summary
      )

      // 处理子项的属性
      fileContent = this.processSubProperty(results, fileContent)
      definitions.summary = summary
      const strHtml = ejs.render(fileTemps, {
        data: definitions,
        descs: results,
        keys: keys,
      })

      if (fileContent) {
        fileContent = fileContent + '\r\n'
      }

      if (strHtml) {
        fileContent = fileContent + strHtml
      }
    }

    return fileContent
  }

  // 计算所有的实体对象
  computeModel(responseDesc: string, count: number) {
    if (count === 0) {
      return responseDesc
    } else {
      const preDesc = responseDesc.split('«')
      let result= ''
      for (let i = count; i < preDesc.length; i++) {
        let desc = preDesc[i]
        const tempDesc = desc.split('»')
        desc = tempDesc[0]
        if (result != '') {
          result = result + '«'
          result = result + desc + '»'
        } else {
          result = desc
        }
      }
      return result
    }
  }

  // 设置名称
  computeName(name: any) {
    let desc = name.replaceAll("«",'')
    desc = desc.replaceAll("»",'')
    return desc
  }

  // 处理返回对象
  newProcessResponse(
    responseDesc: string,
    modelKey: string,
    summary: string,
    fileContent: string
  ) {
    // 有嵌套
    if (responseDesc.includes('«') && responseDesc.includes('»')) {
      const preDesc = responseDesc.split('«')
      let count = 0
      preDesc.forEach((item) => {
        const objectDesc = this.computeModel(responseDesc, count)
        const nameDesc = this.computeName(objectDesc)

        // 添加import描述
        if (!this.importArr[modelKey].includes(nameDesc) && nameDesc) {
          this.importArr[modelKey].push(nameDesc)

          // 获取实体描述
          const definitions: DefinitionsInfo | null =
            this.getDefinitionsInfo(objectDesc)
          if (definitions && definitions!.title) {
            definitions!.title = nameDesc
          }
          if (
            definitions &&
            !this.modelNameArr[modelKey + '-model'].includes(nameDesc)
          ) {
            fileContent = this.createApiModel(
              definitions,
              modelKey,
              summary,
              fileContent
            )
          }
        }

        count = count + 1
      })
    } else {
      // 添加import描述
      if (!this.importArr[modelKey].includes(responseDesc) && responseDesc) {
        this.importArr[modelKey].push(responseDesc)

        // 获取实体描述
        const definitions: DefinitionsInfo | null =
          this.getDefinitionsInfo(responseDesc)

        if (
          definitions &&
          !this.modelNameArr[modelKey + '-model'].includes(definitions.title)
        ) {
          fileContent = this.createApiModel(
            definitions,
            modelKey,
            summary,
            fileContent
          )
        }
      }
    }

    return fileContent
  }


  // 创建相关的实体对象
  createEntity(fileDesc: FileDesc, modelKey: string) {
    let fileContent = ''
    if (!fileDesc || !fileDesc.apiRefs) {
      return fileContent
    }
    const tempData = this.getTemplateInfo('models')
    Object.keys(fileDesc.apiRefs).forEach((key) => {
      const apiInfo: ApiRefInfo = fileDesc.apiRefs[key]

      let summary = ''
      if (apiInfo.orignInfo.get && apiInfo.orignInfo.get.operationId) {
        summary = apiInfo.orignInfo.get.summary
      } else if (apiInfo.orignInfo.post) {
        summary = apiInfo.orignInfo.post.summary
      }

      // 参数实体
      if (apiInfo && apiInfo.parameters) {
        apiInfo.parameters.forEach((strParame) => {
          const paramArr = strParame.split('/')
          const lastName = paramArr[paramArr.length - 1]
          const definitions: DefinitionsInfo | null =
            this.getDefinitionsInfo(lastName)
          if (
            definitions &&
            !this.modelNameArr[modelKey + '-model'].includes(definitions.title)
          ) {
            // 添加模型生成标识，防止重复
            this.modelNameArr[modelKey + '-model'].push(definitions.title)
            const fileTemps = tempData

            if (definitions.properties) {
              const keys = Object.keys(definitions.properties)
              const results = this.convertProperty(
                definitions.properties,
                modelKey,
                summary
              )

              // 处理子项的属性
              fileContent = this.processSubProperty(results, fileContent)
              definitions.summary = summary
              const strHtml = ejs.render(fileTemps, {
                data: definitions,
                descs: results,
                keys: keys,
              })

              if (fileContent) {
                fileContent = fileContent + '\r\n'
              }

              if (strHtml) {
                fileContent = fileContent + strHtml
              }
            }
          }
        })
      }

      // 返回实体
      if (apiInfo && apiInfo.responses) {
        const paramArr = apiInfo.responses.split('/')
        const responseDesc = paramArr[paramArr.length - 1]
        
        fileContent = this.newProcessResponse(
          responseDesc,
          modelKey,
          summary,
          fileContent
        )
      }
    })

    // 添加import
    if (this.importArr[modelKey] && this.importArr[modelKey].length > 0) {
      let importStr = ''
      this.importArr[modelKey].forEach((imortKey) => {
        if (
          imortKey.toUpperCase() === 'commonResponse'.toUpperCase() &&
          !importStr.includes(this.configData.models.commonResponse)
        ) {
          if (importStr) {
            importStr = importStr + ', '
          }
          importStr = importStr + this.configData.models.commonResponse
        } else if (
          (imortKey.toUpperCase() === 'PageResponse'.toUpperCase()) &&
          !importStr.includes(this.configData.models.pageResponse)
        ) {
          if (importStr) {
            importStr = importStr + ', '
          }
          importStr = importStr + this.configData.models.pageResponse
        } else if (
          (imortKey.toUpperCase() === 'ListResponse'.toUpperCase()) &&
          !importStr.includes(this.configData.models.listResponse)
        ) {
          if (importStr) {
            importStr = importStr + ', '
          }
          importStr = importStr + this.configData.models.listResponse
        }
        // else if (!importStr.includes('itemResult')) {
        //   if (importStr) {
        //     importStr = importStr + ', '
        //   }
        //   importStr = importStr + 'itemResult'
        // } else if (!importStr.includes('httpResult')) {
        //   if (importStr) {
        //     importStr = importStr + ', '
        //   }
        //   importStr = importStr + 'httpResult'
        // }
      })

      if (importStr) {
        const commonPath = this.configData.models?.utilsPath
          ? this.configData.models?.utilsPath
          : '/@/models/httpResult'

        fileContent =
          'import { ' +
          importStr +
          ' } from "' +
          commonPath +
          '";' +
          '\r\n\r\n' +
          fileContent

      }

    }
    return fileContent
  }

  setStringModel(lastName: string, modelKey: string) {
    let strHtml = ''
    if (
      !this.modelNameArr[modelKey + '-model'].includes(
        'commonStringResponse'
      )
    ) {
      strHtml = 'export type commonStringResponse = Promise<itemResult<' + lastName + '>>;' +
        '\r\n\r\n'

      // 添加模型生成标识，防止重复
      this.modelNameArr[modelKey + '-model'].push(
        'commonStringResponse'
      )
    }

    return strHtml
  }

  setObjectModel(lastName: string, modelKey: string) {
    let strHtml = ''
    if (
      !this.modelNameArr[modelKey + '-model'].includes(
        'commonObjectResponse'
      )
    ) {
      strHtml = 'export type commonObjectResponse = Promise<itemResult<' + lastName + '>>;' +
        '\r\n\r\n'

      // 添加模型生成标识，防止重复
      this.modelNameArr[modelKey + '-model'].push(
        'commonObjectResponse'
      )
    }

    return strHtml
  }

  // 添加Api调用的对象信息
  setApiModel(importDesc: string, lastName: string, modelKey: string) {
    let strHtml = ''
    switch (importDesc.toUpperCase()) {
      case 'commonResponse'.toUpperCase():
        if (
          !this.modelNameArr[modelKey + '-model'].includes(
            'result' + lastName + 'Info'
          )
        ) {
          strHtml =
            strHtml +
            'export type result' +
            lastName +
            'Info = Promise<' + this.configData.models.commonResponse + '<' +
            lastName +
            '>>;' +
            '\r\n\r\n'

          // 添加模型生成标识，防止重复
          this.modelNameArr[modelKey + '-model'].push(
            'result' + lastName + 'Info'
          )
        }
        break
      //case 'Page'.toUpperCase():
      case 'PageResponse'.toUpperCase():
        if (
          !this.modelNameArr[modelKey + '-model'].includes(
            'result' + lastName + 'Page'
          )
        ) {
          strHtml =
            strHtml +
            'export type result' +
            lastName +
            'Page = Promise<' + this.configData.models.pageResponse + '<' +
            lastName +
            '>>;' +
            '\r\n\r\n'
          // 添加模型生成标识，防止重复
          this.modelNameArr[modelKey + '-model'].push(
            'result' + lastName + 'Page'
          )
        }
        break
      //case 'List'.toUpperCase():
      case 'ListResponse'.toUpperCase():
        // 添加模型生成标识，防止重复
        if (
          !this.modelNameArr[modelKey + '-model'].includes(
            'result' + lastName + 'List'
          )
        ) {
          strHtml =
            strHtml +
            'export type result' +
            lastName +
            'List = Promise<' + this.configData.models.listResponse + '<' +
            lastName +
            '>>;' +
            '\r\n\r\n'

          this.modelNameArr[modelKey + '-model'].push(
            'result' + lastName + 'List'
          )
        }

        break
      default:
        break
    }

    return strHtml
  }

  // 处理注释换行问题
  convertDescription(desc: string) {
    let newDesc = ''
    if (desc) {
      newDesc = desc.split('\n').join(' ')
    }
    return newDesc
  }

  // 转换属性内容
  convertProperty(
    properties: Record<string, PropertyInfo>,
    modelKey: string,
    summary: string
  ) {
    const keys = Object.keys(properties)
    const results: Record<string, PropertyDesc> = {}
    keys.forEach((key) => {
      // 属性类型
      const propertyType = this.getPropertyType(properties[key])

      let desc: PropertyDesc = {
        type: propertyType,
        description: this.convertDescription(
          properties[key].description ? properties[key].description : '暂无描述'
        ),
        items: {
          type: properties[key].items?.type ? properties[key].items?.type : '',
          $ref: properties[key].items?.$ref ? properties[key].items?.$ref : '',
        },
        subProperty: '',
        $ref: '',
      }
      // 如果是数组，则特殊处理
      if (propertyType === 'array') {
        if (desc.items && desc.items.type) {
          if (desc.items.type.startsWith("Map«")) {
            desc.type = 'Array<Object>'
          } else {
            desc.type = 'Array<' + desc.items.type + '>'
          }
        } else if (desc.items && desc.items.$ref) {
          const paramArr = desc.items.$ref.split('/')
          const lastName = paramArr[paramArr.length - 1]

          if (lastName.startsWith("Map«")) {
            desc.type = 'Array<Object>'
          } else {
            desc.type = 'Array<' + lastName + '>'
          }

          if (!this.modelNameArr[modelKey + '-model'].includes(lastName)) {
            const tempData = this.getTemplateInfo('models')
            const definitions: DefinitionsInfo | null =
              this.getDefinitionsInfo(lastName)

            // 添加模型生成标识，防止重复
            this.modelNameArr[modelKey + '-model'].push(lastName)
            const fileTemps = tempData
            if (definitions && definitions!.properties) {
              const keys = Object.keys(definitions!.properties)
              const results = this.convertProperty(
                definitions!.properties,
                modelKey,
                summary
              )
              definitions!.summary = summary
              let strHtml = ejs.render(fileTemps, {
                data: definitions,
                descs: results,
                keys: keys,
              })

              // 处理子项的属性
              strHtml = this.processSubProperty(results, strHtml)
              desc.subProperty = strHtml
            }
          }
        }
      } else if (propertyType === 'object') {
        const refStr = properties[key]?.$ref ? properties[key]?.$ref : ''
        if (refStr) {
          const paramArr = refStr.split('/')
          const lastName = paramArr[paramArr.length - 1]
          const realName = this.computeName(lastName)
          desc.type = realName
          desc.$ref = refStr

          const tempData = this.getTemplateInfo('models')
          const definitions: DefinitionsInfo | null =
            this.getDefinitionsInfo(lastName)
          definitions!.title = realName

          if (
            !this.modelNameArr[modelKey + '-model'].includes(realName)
          ) {

            // 添加模型生成标识，防止重复
            this.modelNameArr[modelKey + '-model'].push(realName)
            const fileTemps = tempData

            if (definitions && definitions!.properties) {
              const keys = Object.keys(definitions!.properties)
              const results = this.convertProperty(
                definitions!.properties,
                modelKey,
                summary
              )
              definitions!.summary = summary
              let strHtml = ejs.render(fileTemps, {
                data: definitions,
                descs: results,
                keys: keys,
              })

              // 处理子项的属性
              strHtml = this.processSubProperty(results, strHtml)
              desc.subProperty = strHtml
            }
          }
        }
      }

      results[key] = desc
    })

    return results
  }

  // 获取字段的类型
  getPropertyType(property: PropertyInfo) {
    let type = ''

    if (!property['type']) {
      if (property['$ref']) {
        type = 'object'
      }
    } else {
      switch (property['type']) {
        case 'string':
          type = 'string'
          break
        case 'integer':
        case 'number':
          type = 'number'
          break
        case 'array':
          type = 'array'
          break
        case 'object':
          type = 'object'
          break
        case 'boolean':
          type = 'boolean'
          break
        default:
          type = 'string'
          break
      }
    }

    return type
  }

  // 获取swagger的相关实体定义
  getDefinitionsInfo(keyName: string) {
    if (!this.swaggerOrign || !this.swaggerOrign.definitions) {
      return null
    }

    const definitions: DefinitionsInfo = this.swaggerOrign.definitions[keyName]
    return definitions
  }

  // 获取模板信息
  getTemplateInfo(fileMode: string) {
    const tempPath = path.join(
      __dirname,
      'templates',
      this.configData.template + path.sep + fileMode + '.ejs'
    )

    const tempData: Buffer = fs.readFileSync(tempPath)
    return tempData.toString()
  }

  // 获取inport的描述
  getImport(property: PropertyInfo) {
    let type = ''

    if (!property['type']) {
      if (property['$ref']) {
        type = 'object'
      }
    } else {
      switch (property['type']) {
        case 'string':
          type = 'string'
          break
        case 'integer':
        case 'number':
          type = 'number'
          break
        case 'array':
          type = 'array'
          break
        case 'object':
          type = 'object'
          break
        case 'boolean':
          type = 'boolean'
          break
        default:
          type = 'string'
          break
      }
    }

    return type
  }
}
