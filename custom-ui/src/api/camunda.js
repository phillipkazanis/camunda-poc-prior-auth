import axios from 'axios'

const CLUSTER_ID    = import.meta.env.VITE_CAMUNDA_CLUSTER_ID
const CLIENT_ID     = import.meta.env.VITE_CAMUNDA_CLIENT_ID
const CLIENT_SECRET = import.meta.env.VITE_CAMUNDA_CLIENT_SECRET
const REGION        = import.meta.env.VITE_CAMUNDA_REGION || 'syd-1'

let _token = null
let _tokenExpiry = 0

async function getToken() {
  if (_token && Date.now() < _tokenExpiry) return _token
  const res = await axios.post('https://login.cloud.camunda.io/oauth/token', {
    grant_type:    'client_credentials',
    client_id:     CLIENT_ID,
    client_secret: CLIENT_SECRET,
    audience:      'zeebe.camunda.io',
  })
  _token = res.data.access_token
  _tokenExpiry = Date.now() + (res.data.expires_in - 60) * 1000
  return _token
}

async function camundaClient() {
  const token = await getToken()
  return axios.create({
    baseURL: `https://${REGION}.zeebe.camunda.io/${CLUSTER_ID}`,
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function startProcess(processId, variables) {
  const client = await camundaClient()
  const res = await client.post(`/v1/process-instances`, { bpmnProcessId: processId, variables })
  return res.data
}

export async function searchProcessInstances(filter = {}) {
  const client = await camundaClient()
  const res = await client.post('/v1/process-instances/search', {
    filter,
    sort: [{ field: 'startDate', order: 'DESC' }],
    page: { limit: 50 },
  })
  return res.data.items || []
}

export async function getVariables(processInstanceKey) {
  const client = await camundaClient()
  const res = await client.post('/v1/variables/search', { filter: { processInstanceKey } })
  const vars = {}
  ;(res.data.items || []).forEach(v => {
    try { vars[v.name] = JSON.parse(v.value) } catch { vars[v.name] = v.value }
  })
  return vars
}

export async function searchUserTasks(filter = {}) {
  const client = await camundaClient()
  const res = await client.post('/v1/user-tasks/search', {
    filter,
    sort: [{ field: 'creationDate', order: 'DESC' }],
    page: { limit: 50 },
  })
  return res.data.items || []
}

export async function completeUserTask(userTaskKey, variables = {}) {
  const client = await camundaClient()
  const res = await client.patch(`/v1/user-tasks/${userTaskKey}/completion`, { variables })
  return res.data
}
