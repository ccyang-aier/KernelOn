export function hideGenieWindow(
  hiddenWindowIds: ReadonlySet<string>,
  windowId: string,
): ReadonlySet<string> {
  if (hiddenWindowIds.has(windowId)) {
    return hiddenWindowIds;
  }

  const nextHiddenWindowIds = new Set(hiddenWindowIds);

  nextHiddenWindowIds.add(windowId);
  return nextHiddenWindowIds;
}

export function revealGenieWindow(
  hiddenWindowIds: ReadonlySet<string>,
  windowId: string | null | undefined,
): ReadonlySet<string> {
  if (!windowId || !hiddenWindowIds.has(windowId)) {
    return hiddenWindowIds;
  }

  const nextHiddenWindowIds = new Set(hiddenWindowIds);

  nextHiddenWindowIds.delete(windowId);
  return nextHiddenWindowIds;
}
