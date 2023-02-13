import Debug from 'debug';
const debug = Debug('Matrix');

export default (name: string) => {
  return debug.extend(name);
};
