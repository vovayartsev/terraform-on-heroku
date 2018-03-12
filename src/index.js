const jwtDecode = require('jwt-decode')
const { Socket } = require('phoenix-channels')

const socket = new Socket(
  process.env.API_SERVER || 'https://robust-querulous-cassowary.gigalixirapp.com/socket'
)
socket.connect()

const vaultJwtToken = process.env.VAULT_TOKEN
const vaultSecret = process.env.VAULT_SECRET
const { sub } = jwtDecode(vaultJwtToken)
const channelName = `vault:${sub}`
console.log(`Joining ${channelName}`)

// Now that you are connected, you can join channels with a topic:
const channel = socket.channel(channelName, { token: vaultJwtToken })
channel
  .join()
  .receive('ok', resp => {
    console.log('Joined successfully', resp)
  })
  .receive('error', resp => {
    console.log('Unable to join', resp)
  })

channel.on('new_msg', payload => {
  console.log('Got ', payload, '... sending reply')
  channel.push('reply_msg', { body: 'Reply' })
})

channel.on('rpc_request', ({ name, addon_uuid, args }) => {
  let error, result
  console.log('Got RPC request ', name, ' with ', args, ' for addon_uuid=', addon_uuid)
  switch (name) {
    case 'GET_CODE_CHECKSUM':
      result = 'fake-code-checksum'
      break

    case 'GET_SIGNED_CODE_URL':
      result = 'https://hookb.in/v3ooDm4R'
      break

    case 'SIGN_REMOTE_CODE':
      result = 'ok'
      break

    case 'PUSH_ENV':
      result = 'ok'
      break

    case 'TERRAFORM_APPLY':
      result = new Promise(r => {
        setTimeout(() => r('ok'), 10000)
      })
      let counter = 0
      const interval = setInterval(() => {
        channel.push('logs', { addon_uuid, message: `Log line ${counter}` })
        if (counter++ > 7) clearInterval(interval)
      }, 1000)
      break

    default:
      error = `Unknown command ${name}`
  }

  Promise.resolve(result).then(result => {
    console.log('Replying to ', name, ' ... ')
    channel.push('rpc_response', { name, addon_uuid, result, error })
  })
})
