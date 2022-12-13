import createStore from '../createStore';

const _d3TooltipStore = createStore(null);

const d3TooltipStore = <T>() => ({
  useD3TooltipStore: _d3TooltipStore.useStore as <SelectorOutput>(selector: (state: T | null) => SelectorOutput) => SelectorOutput,
  getD3TooltipState: _d3TooltipStore.getState as () => T | null,
  setD3TooltipState: _d3TooltipStore.setState as (state: T | null) => void,
  serverInitialize: _d3TooltipStore.serverInitialize as (initialServerState: T | null) => void,
  getServerState: _d3TooltipStore.getServerState as () => T | null,
});

export default d3TooltipStore;

