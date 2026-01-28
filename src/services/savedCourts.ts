type SavedCourtsListener = (ids: string[]) => void;

let savedIds: string[] = [];
const savedIdSet = new Set<string>();
const listeners = new Set<SavedCourtsListener>();
let initialized = false;

const notify = () => {
  const ids = [...savedIds];
  listeners.forEach((listener) => listener(ids));
};

const ensureInit = async () => {
  if (initialized) {
    return;
  }
  initialized = true;
};

const setIds = (ids: string[]) => {
  savedIds = ids;
  savedIdSet.clear();
  ids.forEach((id) => savedIdSet.add(id));
  notify();
};

export const getSavedCourtIds = async () => {
  await ensureInit();
  return [...savedIds];
};

export const countSavedCourts = () => savedIds.length;

export const isCourtSaved = (id: string) => savedIdSet.has(id);

export const toggleSavedCourt = async (id: string) => {
  await ensureInit();
  if (savedIdSet.has(id)) {
    savedIdSet.delete(id);
    savedIds = savedIds.filter((savedId) => savedId !== id);
  } else {
    savedIdSet.add(id);
    savedIds = [...savedIds, id];
  }
  notify();
};

export const removeSavedCourt = async (id: string) => {
  await ensureInit();
  if (!savedIdSet.has(id)) {
    return;
  }
  savedIdSet.delete(id);
  savedIds = savedIds.filter((savedId) => savedId !== id);
  notify();
};

export const subscribeSavedCourts = (listener: SavedCourtsListener) => {
  listeners.add(listener);
  listener([...savedIds]);
  return () => listeners.delete(listener);
};

export const hydrateSavedCourts = async () => {
  await ensureInit();
  setIds(savedIds);
  return [...savedIds];
};
