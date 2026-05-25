import { createLocalCommanderRepository } from './repository';

describe('createLocalCommanderRepository', () => {
  it('loads the default workspace when nothing is saved', async () => {
    window.localStorage.clear();
    const repository = createLocalCommanderRepository();

    const state = await repository.load();

    expect(state.selectedInstrument).toBe('MNQ');
    expect(state.levels.length).toBeGreaterThan(0);
    expect(state.orderFlowRows.length).toBeGreaterThan(0);
  });

  it('saves and resets workspace state through the repository boundary', async () => {
    window.localStorage.clear();
    const repository = createLocalCommanderRepository();
    const initial = await repository.load();
    const saved = {
      ...initial,
      selectedInstrument: 'GC' as const,
      manualPrice: '3350.10',
    };

    await repository.save(saved);

    expect((await createLocalCommanderRepository().load()).selectedInstrument).toBe('GC');

    const reset = await repository.reset();

    expect(reset.selectedInstrument).toBe('MNQ');
    expect((await createLocalCommanderRepository().load()).selectedInstrument).toBe('MNQ');
  });
});
