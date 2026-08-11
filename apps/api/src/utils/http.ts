import axios from 'axios'

/**
 * 统一后端 Axios HTTP 客户端，原生支持 8s 超时与统一数据解析
 */
export const httpClient = axios.create({
  timeout: 8000,
  headers: {
    'Accept': 'application/json'
  }
})
