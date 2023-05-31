export declare type Swagger2Info = {
  description: string // 描述
  version: string // 版本
  title: string // 标题
  termsOfService: string // 服务名称
}

export declare type TagsInfo = {
  name: string // 服务名称
  description: string // 服务描述
}

export declare type SchemaInfo = {
  $ref: string // "#/definitions/CreateAdmittanceRatingRequest"
}

export const getEmptySchemaInfo = (): SchemaInfo => {
  return {
    $ref: '', // "#/definitions/CreateAdmittanceRatingRequest"
  }
}

export declare type ParameterApiInfos = {
  desc: string //
  query: Record<string, string> //
}

export declare type ParametersInfo = {
  in: string // "body"
  name: string // "request"
  description: string // "request"
  required: boolean // true
  schema?: SchemaInfo
  type?: string
}

export const getEmptyParametersInfo = (): ParametersInfo => {
  return {
    in: '', // "body"
    name: '', // "request"
    description: '', // "request"
    required: true, // true
    schema: getEmptySchemaInfo(),
  }
}

export declare type TwoZeroInfo = {
  description: string // "body"
  schema: SchemaInfo
}

export const getEmptyTwoZeroInfo = (): TwoZeroInfo => {
  return {
    description: '', // "body"
    schema: getEmptySchemaInfo(),
  }
}

export declare type ResponsesInfo = {
  200: TwoZeroInfo // "body"
  201: object //
  401: object //
  403: object //
  404: object
}

export const getEmptyResponsesInfo = (): ResponsesInfo => {
  return {
    200: getEmptyTwoZeroInfo(), // "body"
    201: {}, //
    401: {}, //
    403: {}, //
    404: {}, //
  }
}

export declare type ActionInfo = {
  tags: string[] // 接口描述 ["品控2.0-准入评级管理"]
  summary: string // 接口描述 创建准入评级
  operationId: string // 接口定义 createAdmittanceRatingUsingPOST
  consumes: string[] // 提交的数据格式 ["application/json"]
  produces: string[] // ["*/*"]
  parameters: ParametersInfo[]
  responses: ResponsesInfo
  deprecated: boolean
}

export declare type PathsInfo = {
  post?: ActionInfo
  get?: ActionInfo
}

export declare enum PropertyType {
  string = 'string',
  boolean = 'boolean',
  array = 'array',
  object = 'object',
  integer = 'integer',
  number = 'number',
}

export declare type ArrItem = {
  type: PropertyType
  $ref?: string
}

export declare type ObjectItem = {
  type: PropertyType
  items?: ArrItem
}

export declare type PropertyInfo = {
  type: PropertyType
  description: string
  items?: ArrItem
  additionalProperties?: ObjectItem
  enum?: string[]
  $ref?: string
}

export declare type DefinitionsInfo = {
  type: string
  properties: Record<string, PropertyInfo>
  title: string
  summary?: string
}

export declare type Swagger2 = {
  swagger: string // 版本号
  info: Swagger2Info // 服务信息
  host: string // http://localhost:8080
  basePath: string // /
  tags: TagsInfo[] // 服务的描述集合
  paths: Record<string, PathsInfo>
  definitions: Record<string, DefinitionsInfo>
}
