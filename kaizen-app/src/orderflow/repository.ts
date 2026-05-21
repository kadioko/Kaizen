import { createDefaultCommanderState } from './defaults';
import { clearCommanderState, loadCommanderState, saveCommanderState } from './storage';
import { CommanderWorkspaceState } from './types';

export interface CommanderRepository {
  load(): CommanderWorkspaceState;
  save(state: CommanderWorkspaceState): void;
  reset(): CommanderWorkspaceState;
}

export function createLocalCommanderRepository(): CommanderRepository {
  return {
    load() {
      return loadCommanderState(createDefaultCommanderState());
    },
    save(state) {
      saveCommanderState(state);
    },
    reset() {
      clearCommanderState();
      return createDefaultCommanderState();
    },
  };
}
