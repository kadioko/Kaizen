import { createLocalCommanderRepository } from './repository';

describe('createLocalCommanderRepository', () => {
  it('loads the default workspace when nothing is saved', () => {
    window.localStorage.clear();
    const repository = createLocalCommanderRepository();

    const state = repository.load();

    expect(state.selectedInstrument).toBe('MNQ');
    expect(state.levels.length).toBeGreaterThan(0);
    expect(state.orderFlowRows.length).toBeGreaterThan(0);
  });

  it('saves and resets workspace state through the repository boundary', () => {
    window.localStorage.clear();
    const repository = createLocalCommanderRepository();
    const initial = repository.load();
    const saved = {
      ...initial,
      selectedInstrument: 'GC' as const,
      manualPrice: '3350.10',
    };

    repository.save(saved);

    expect(createLocalCommanderRepository().load().selectedInstrument).toBe('GC');

    const reset = repository.reset();

    expect(reset.selectedInstrument).toBe('MNQ');
    expect(createLocalCommanderRepository().load().selectedInstrument).toBe('MNQ');
  });
});
