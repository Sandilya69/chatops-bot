import { jest } from '@jest/globals';

// Define mocks BEFORE importing the module under test
jest.unstable_mockModule('../../src/lib/rbac.js', () => ({
  canDeploy: jest.fn(),
  isApprover: jest.fn(),
  getUserRole: jest.fn()
}));

jest.unstable_mockModule('../../src/lib/github.js', () => ({
  triggerWorkflow: jest.fn(),
  getCommitInfo: jest.fn()
}));

jest.unstable_mockModule('../../src/models/ActiveDeploy.js', () => ({
  default: {
    findOne: jest.fn(() => ({ lean: jest.fn() })),
    create: jest.fn(),
    updateOne: jest.fn()
  }
}));

jest.unstable_mockModule('../../src/models/Service.js', () => ({
  default: {
    findOne: jest.fn().mockResolvedValue({
        name: 'api',
        owner: 'test-owner',
        repo: 'test-repo',
        workflow: 'deploy.yml'
    })
  }
}));

jest.unstable_mockModule('../../src/lib/commandAudit.js', () => ({
  logCommand: jest.fn()
}));

jest.unstable_mockModule('../../src/lib/state.js', () => ({
  activeDeployments: new Set(),
  isInCooldown: jest.fn(),
  setCooldown: jest.fn(),
  pendingApprovals: new Map(),
  keyFor: (s, e) => `${s}-${e}`
}));

jest.unstable_mockModule('../../src/lib/dbState.js', () => ({
    isDbConnected: jest.fn(() => true)
}));

jest.unstable_mockModule('../../src/lib/retry.js', () => ({
    withRetry: jest.fn((fn) => fn())
}));

jest.unstable_mockModule('../../src/lib/statusPoller.js', () => ({
    pollWorkflowStatus: jest.fn(async (runId, cb) => {
        if (cb) await cb('in_progress');
        return 'success';
    })
}));

// Dynamic import AFTER mocks are defined
const { canDeploy } = await import('../../src/lib/rbac.js');
const { triggerWorkflow, getCommitInfo } = await import('../../src/lib/github.js');
const { default: deployCommand } = await import('../../src/commands/deploy.js');
const { default: Service } = await import('../../src/models/Service.js');

describe('Deploy Command', () => {
  let interaction;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock interaction object
    interaction = {
      user: { id: 'user123' },
      options: {
        getString: jest.fn((name) => {
          if (name === 'service') return 'api';
          if (name === 'env') return 'staging';
          if (name === 'version') return 'main';
          return null;
        })
      },
      reply: jest.fn().mockResolvedValue({
        startThread: jest.fn().mockResolvedValue({
          send: jest.fn()
        })
      }),
      editReply: jest.fn()
    };
  });

  test('should deny access if RBAC fails', async () => {
    canDeploy.mockResolvedValue(false);

    await deployCommand.execute(interaction);

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({ content: expect.stringContaining('don’t have permission') })
    );
  });

  test('should trigger deployment if allowed', async () => {
    canDeploy.mockResolvedValue(true);
    getCommitInfo.mockResolvedValue({
      message: 'feat: Test commit',
      author: 'Tester',
      sha: 'abc1234',
      html_url: 'http://github.com/test/test'
    });
    triggerWorkflow.mockResolvedValue(12345);

    await deployCommand.execute(interaction);

    expect(triggerWorkflow).toHaveBeenCalledWith({
      service: 'api',
      env: 'staging',
      version: 'main',
      serviceDetails: expect.objectContaining({
          owner: 'test-owner',
          repo: 'test-repo',
          workflow: 'deploy.yml'
      })
    });
    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({ content: expect.stringContaining('Deploy Initiated') })
    );
  }, 10000);
});
