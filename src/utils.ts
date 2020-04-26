import {OutputChannel} from "coc.nvim";

/**
 * Sorts a string of CSS classes according to a predefined order.
 * @param classString The string to sort
 * @param sortOrder The default order to sort the array at
 *
 * @returns The sorted string
 */
export const sortClassString = (
  classString: string,
  sortOrder: string[],
  shouldRemoveDuplicates: boolean
): string => {
  let classArray = classString.split(/\s+/g);

  if (shouldRemoveDuplicates) {
    classArray = removeDuplicates(classArray);
  }

  classArray = sortClassArray(classArray, sortOrder);

  return classArray.join(' ');
};

const sortClassArray = (
  classArray: string[],
  sortOrder: string[]
): string[] => [
  ...classArray
  .filter(el => sortOrder.some(c => el.endsWith(c))) // take the classes that are in the sort order
  .sort((a, b) => sortOrder.findIndex(c => a.endsWith(c)) - sortOrder.findIndex(c => b.endsWith(c))), // and sort them
  ...classArray.filter(el => !sortOrder.some(c => el.endsWith(c))) // prepend the classes that were not in the sort order
];

const removeDuplicates = (classArray: string[]): string[] => [
  ...new Set(classArray)
];

let outputChannel: OutputChannel | undefined

export const logger = {
  init(ch: OutputChannel) {
    outputChannel = ch
  },

  getLog(name: string) {
    return (message: string) => {
      if (outputChannel) {
        outputChannel.appendLine(`[${name}]: ${message}`)
      }
    }
  }
}
