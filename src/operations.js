const got = require('got')
const path = require('path')
const fs = require('fs')
const AWS = require('aws-sdk')
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const spawn = require('child_process').spawn

const S3_BUCKET_NAME = 'terraformer-example-installation'
const SANDBOX_PATH = path.resolve(__dirname, '../sandbox')
const REGION = 'us-east-1'

main(process.env.COMMAND || process.argv[2], process.env.SANDBOX || process.argv[3])
  .then(() => console.log(`${process.argv} succeded`))
  .catch(e => console.error(`${process.argv} failed`, e))

// ENTRYPOINT

async function main(tfCommand, sandboxName) {
  needCreds() && (await fetchAndApplyTemporaryCreds())
  await pullCodeFromS3(sandboxName)
  await writeStateProviderConfig(sandboxName)
  await runTerraformCommand(sandboxName, ['init'])
  await lsSandboxFolder(sandboxName)
  await runTerraformCommand(sandboxName, tfArgs(tfCommand))
  const output = await getTerraformOutput(sandboxName)
  console.log(`TODO: encrypt and submit output: ${JSON.stringify(output)}`)
}

function tfArgs(command) {
  switch(command) {
    case 'apply':
      return ['apply', '-input=false', '-auto-approve', '-no-color']
    case 'destroy':
      return ['destroy', '-input=false', '-force', '-no-color']
    default:
      throw Error, `Unknown Terraform command: '${command}'`
  }
}

// CREDENTIALS HANDLING

async function pullCodeFromS3(sandboxName) {
  fs.mkdirSync(SANDBOX_PATH)
  const s3 = new AWS.S3()

  const signedUrl = s3.getSignedUrl('getObject', {
    Bucket: S3_BUCKET_NAME,
    Key: `code/${sandboxName}.tgz`,
    Expires: 60,
  })

  await exec(`curl "${signedUrl}" | tar -xzC ${SANDBOX_PATH}`)
}

async function lsSandboxFolder(sandboxName) {
  const { stdout, stderr } = await exec(`ls -la ${SANDBOX_PATH}`)
  console.debug(`=== DOWNLOADED ${sandboxName} =====\n`, stdout)
}

function runTerraformCommand(sandboxName, args) {
  return new Promise((resolve, reject) => {
    const terraform = spawn('terraform', args, {
      shell: true,
      stdio: 'inherit',
      cwd: SANDBOX_PATH,
    })
    terraform.on('close', code => {
      code ? reject(`Terraform exited with code ${code}`) : resolve()
    })
  })
}

async function getTerraformOutput(sandboxName) {
  try {
    const { stdout } = await exec(`terraform output -json`, { cwd: SANDBOX_PATH })
    return JSON.parse(stdout)
  } catch(e) {
    if (e.stderr && e.stderr.match(/state file either has no outputs/)) {
      return {}
    } else {
      throw e
    }
  }
}

async function writeStateProviderConfig(sandboxName) {
  const config = `terraform {
    backend "s3" {
      bucket = "${S3_BUCKET_NAME}"
      key    = "state/${sandboxName}"
      region = "${REGION}"
    }
  }`
  fs.writeFileSync(`${SANDBOX_PATH}/terraformer-s3-state-provider-configuration.tf`, config)
}

async function fetchAndApplyTemporaryCreds() {
  const response = await got(
    `http://169.254.170.2${process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI}`
  )
  console.debug(`CREDS: ${response.body}`)
  const { AccessKeyId, SecretAccessKey, Token } = JSON.parse(response.body)
  process.env.AWS_ACCESS_KEY_ID = AccessKeyId
  process.env.AWS_SECRET_ACCESS_KEY = SecretAccessKey
  process.env.AWS_SESSION_TOKEN = Token
  process.env.AWS_DEFAULT_REGION = REGION
}

function needCreds() {
  return !process.env.AWS_ACCESS_KEY_ID
}
