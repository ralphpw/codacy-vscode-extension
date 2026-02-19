import * as assert from 'assert'
import * as vscode from 'vscode'
import { SinonSandbox, SinonStub, createSandbox } from 'sinon'
import { MockExtensionContext } from '../../mocks/MockExtensionContext'
import { CodacyCloud } from '../../../git/CodacyCloud'
import { MockRepository } from '../../mocks/MockRepository'
import { Repository as GitRepository } from '../../../git/git'
import * as configureMCP from '../../../commands/configureMCP'
import * as createRules from '../../../commands/createRules'
import { Cli } from '../../../cli'

suite('Codacy Cloud Test Suite', () => {
  let context: MockExtensionContext
  let sinon: SinonSandbox
  let rm: CodacyCloud
  let repo: GitRepository

  setup(() => {
    sinon = createSandbox()
    context = new MockExtensionContext()
    rm = new CodacyCloud()
    repo = new MockRepository()
  })

  teardown(() => {
    context.dispose()
    sinon.restore()
    rm.dispose()
  })

  test('Open Repository', async () => {
    await rm.open(repo)

    // TODO: write some tests
  })

  suite('clear() guardrails instructionsFile gate', () => {
    let isMCPConfiguredStub: SinonStub
    let createOrUpdateRulesStub: SinonStub
    let getConfigurationStub: SinonStub
    let cliGetStub: SinonStub

    setup(() => {
      isMCPConfiguredStub = sinon.stub(configureMCP, 'isMCPConfigured')
      createOrUpdateRulesStub = sinon.stub(createRules, 'createOrUpdateRules').resolves()
      cliGetStub = sinon.stub(Cli, 'get').resolves(undefined as any)
    })

    function stubGuardrailsSetting(value: string | undefined) {
      const configStub = {
        get: sinon.stub().callsFake((key: string) => {
          if (key === 'codacy.guardrails.instructionsFile') return value
          return undefined
        }),
      }
      getConfigurationStub = sinon.stub(vscode.workspace, 'getConfiguration').returns(configStub as any)
    }

    test('should NOT call createOrUpdateRules when setting is "manual"', async () => {
      isMCPConfiguredStub.returns(true)
      stubGuardrailsSetting('manual')

      await rm.clear()

      assert.strictEqual(createOrUpdateRulesStub.called, false, 'createOrUpdateRules should not be called when setting is "manual"')
    })

    test('should call createOrUpdateRules when setting is "automatic"', async () => {
      isMCPConfiguredStub.returns(true)
      stubGuardrailsSetting('automatic')

      await rm.clear()

      assert.strictEqual(createOrUpdateRulesStub.calledOnce, true, 'createOrUpdateRules should be called when setting is "automatic"')
    })

    test('should NOT call createOrUpdateRules when MCP is not configured', async () => {
      isMCPConfiguredStub.returns(false)
      stubGuardrailsSetting('automatic')

      await rm.clear()

      assert.strictEqual(createOrUpdateRulesStub.called, false, 'createOrUpdateRules should not be called when MCP is not configured')
    })

    test('should NOT call createOrUpdateRules when setting is undefined', async () => {
      isMCPConfiguredStub.returns(true)
      stubGuardrailsSetting(undefined)

      await rm.clear()

      assert.strictEqual(createOrUpdateRulesStub.called, false, 'createOrUpdateRules should not be called when setting is undefined')
    })
  })
})
