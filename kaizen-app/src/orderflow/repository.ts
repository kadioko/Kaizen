import { createDefaultCommanderState } from './defaults';
import { clearCommanderState, loadCommanderState, saveCommanderState } from './storage';
import { CommanderWorkspaceState } from './types';

export interface CommanderRepository {
  load(): Promise<CommanderWorkspaceState>;
  save(state: CommanderWorkspaceState): Promise<void>;
  reset(): Promise<CommanderWorkspaceState>;
}

export function createLocalCommanderRepository(): CommanderRepository {
  return {
    async load() {
      return loadCommanderState(createDefaultCommanderState());
    },
    async save(state) {
      saveCommanderState(state);
    },
    async reset() {
      clearCommanderState();
      return createDefaultCommanderState();
    },
  };
}
