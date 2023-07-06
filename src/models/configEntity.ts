export declare type ConfigModel = {
  isCreate: boolean // 是否创建
  dir: string // 模型添加的目录，相对项目src来说
  isCover: boolean // 是否覆盖
  commonResponse: string[] // 通用返回的模型
  pageResponse: string[] // 分页返回模型
  listResponse: string[] // 列表返回模型
  utilsPath: string //
}

export declare type ConfigEnum = {
  isCreate: boolean // 是否枚举
  dir: string // 枚举的目录
  isCover: boolean // 是否覆盖
  isSingle: boolean // 是否生成文件
}

export declare type ConfigApi = {
  isCreate: boolean // 是否枚举
  dir: string // 枚举的目录
  isCover: boolean // 是否覆盖
  isCreateUse?: boolean //  是否生成调用文件
  httpPath?: string // axios的封装类地址
  messagePath?: string // 显示消息的路径
}

export declare type ConfigInfo = {
  swaggerVersion?: string // 支持的swagger版本
  fileMode?: string // 生成文件的方式  info、paths
  createServe: boolean // 为服务单独创立文件夹
  pathRoute?: Array<string> // 在 paths 模式，截取不同文件的路径
  onlyPath?: Array<string> // 只生成某个路径
  excludeRoute?: Array<string> // 排除那些路径不做生成处理
  models?: ConfigModel
  enum?: ConfigEnum
  api?: ConfigApi
  fileType?: string // ts 文件  ts 、js
  template: string
  serveFileName?: string // 服务的名称
  httpReplace: boolean // 是否 https 替换成 http
}
