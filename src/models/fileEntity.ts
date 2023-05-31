import {
  ParametersInfo,
  PathsInfo,
  ResponsesInfo,
  getEmptyResponsesInfo,
} from './controllerEntity'

export declare enum InfoyType {
  string = 'type',
  boolean = 'enum',
}

export declare type ApiRefInfo = {
  parametersOrign: ParametersInfo[] | undefined
  parameters: string[] | undefined
  responsesOrign: ResponsesInfo | undefined
  responses: string | undefined
  orignInfo: PathsInfo
}

export const getEmptyApiRefInfo = (): ApiRefInfo => {
  return {
    parametersOrign: [],
    parameters: [],
    responsesOrign: getEmptyResponsesInfo(),
    responses: '',
    orignInfo: {},
  }
}

export declare type FileDesc = {
  className: string
  apiPaths: Array<string> // 该文件下的API接口集合
  apiRefs: Record<string, ApiRefInfo>
}

export const getEmptyFileDesc = (): FileDesc => {
  return {
    className: '',
    apiPaths: [],
    apiRefs: {},
  }
}

export declare type PropertyDesc = {
  type?: string
  description?: string
  items?: ItemsDesc
  $ref?: string
  subProperty?: string
}

export declare type ItemsDesc = {
  type?: string
  $ref?: string
}
