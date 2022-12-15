import { Selection } from 'd3';

export const d3AppendIfNotExists = <
  In extends Selection<any, any, any, any>,
  Out extends Selection<any, any, any, any>
>(
    selection: In,
    createSelection: () => Out,
  ) => {
  if (selection.size()) return selection;
  return createSelection();
};

export function d3ReplaceIfExists<
In extends Selection<any, any, any, any>,
 Out extends Selection<any, any, any, any>
>(
  selection: In,
  createSelection: () => Out,
  options: {createIfNotExist: true},
): Out
export function d3ReplaceIfExists<
In extends Selection<any, any, any, any>,
 Out extends Selection<any, any, any, any>
>(
  selection: In,
  createSelection: () => Out,
  options?: {createIfNotExist: false},
): Out | undefined
export function d3ReplaceIfExists<
In extends Selection<any, any, any, any>,
 Out extends Selection<any, any, any, any>
>(
  selection: In,
  createSelection: () => Out,
  options?: {createIfNotExist: boolean},
): Out | undefined {
  if (selection.size()) {
    selection.remove();
    return createSelection();
  }
  if (options?.createIfNotExist) return createSelection();
}

export const d3UpdateSelection = <
  S extends Selection<any, any, any, any>,
>(
    selection: S,
    updateSelection: (sel: S) => S,
    createSelection: () => S,
  ) => {
  if (selection.size()) {
    return updateSelection(selection);
  }

  return updateSelection(createSelection());
};
