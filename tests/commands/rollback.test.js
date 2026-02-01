import { jest } from '@jest/globals';

// Mocks
jest.unstable_mockModule('../../src/lib/rbac.js', () => ({
  canDeploy: jest.fn().mockResolvedValue(true),
  isApprover: jest.fn().mockResolvedValue(true)
}));

jest.unstable_mockModule('../../src/models/ActiveDeploy.js', () => ({
  default: {
    findOne: jest.fn(),
    create: jest.fn()
  }
}));

jest.unstable_mockModule('../../src/lib/github.js', () => ({
  triggerWorkflow: jest.fn().mockResolvedValue(12345),
  getCommitInfo: jest.fn()
}));

jest.unstable_mockModule('../../src/lib/dbState.js', () => ({
  isDbConnected: jest.fn(() => true)
}));

jest.unstable_mockModule('../../src/lib/commandAudit.js', () => ({
  logCommand: jest.fn()
}));

// Import tested module
const { default: rollbackCommand } = await import('../../src/commands/rollback.js');
const { default: ActiveDeploy } = await import('../../src/models/ActiveDeploy.js');

describe('Rollback Command', () => {
  let interaction;

  beforeEach(() => {
    jest.clearAllMocks();
    interaction = {
      user: { id: 'admin1' },
      options: { getString: jest.fn(() => 'api') },
      reply: jest.fn()
    };
  });

  test('should fail if no history found', async () => {
    ActiveDeploy.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue(null)
    });

    await rollbackCommand.execute(interaction);
    expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({ content: expect.stringContaining('No successful deployment history') })
    );
  });

  test('should prompt for confirmation if history exists', async () => {
    ActiveDeploy.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue({
            service: 'api',
            env: 'prod',
            commitSha: 'deadbeef',
            version: 'v1.2.3'
        })
    });

    await rollbackCommand.execute(interaction);
    expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({ 
            content: expect.stringContaining('ROLLBACK REQUEST'),
            components: expect.any(Array)
        })
    );
  });
});
