type AgtsServiceType = 'inet' | 'iptv' | 'phone'
type AgtsUpdateBalaceReq = {
  ipaddress: string
  agrmNum: string
  receiptNum: string
  receiptDate: string // YYYYMMDDHHmmss
  amount: number      // 0.00
}

type AgtGetServicesReq = { phone: string }

type AgtsBaseResp = {
  result: string
}

type Simplify<T> = { [K in keyof T]: T[K] } 

type AgtsGetServiceListResp = Simplify<Record<AgtsServiceType, {
  balance: number
  number: string
} | undefined> & AgtsBaseResp>

type AgtsUpdateBalaceResp = {
  receipt?: string
} & AgtsBaseResp

type AgtsApi = {
  getServices: (payload: AgtGetServicesReq) => Promise<AgtsGetServiceListResp>
  updateBalance: (payload: AgtsUpdateBalaceReq) => Promise<AgtsUpdateBalaceResp>
}
