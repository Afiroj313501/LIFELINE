/**
 * Clinical Red Blood Cell (RBC) Compatibility Matrix
 * Source: WHO Blood Safety & Transfusion Guidelines
 */

export const normalizeGroup = (bg: string): string => {
  return bg.replace('_POSITIVE', '+').replace('_NEGATIVE', '-');
};

export const denormalizeGroup = (bg: string): string => {
  if (bg.endsWith('+')) return bg.slice(0, -1) + '_POSITIVE';
  if (bg.endsWith('-')) return bg.slice(0, -1) + '_NEGATIVE';
  return bg;
};

export const RBC_RECIPIENT_COMPATIBILITY: Record<string, string[]> = {
  'O-':  ['O-'],
  'O+':  ['O+', 'O-'],
  'A-':  ['A-', 'O-'],
  'A+':  ['A+', 'A-', 'O+', 'O-'],
  'B-':  ['B-', 'O-'],
  'B+':  ['B+', 'B-', 'O+', 'O-'],
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'AB+': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-'],
};

/**
 * Returns true if a donor with `donorGroup` can safely donate red blood cells
 * to a patient with `recipientGroup`.
 */
export const isBloodCompatible = (donorGroup: string, recipientGroup: string): boolean => {
  const normDonor = normalizeGroup(donorGroup);
  const normRecipient = normalizeGroup(recipientGroup);

  const compatibleDonors = RBC_RECIPIENT_COMPATIBILITY[normRecipient];
  if (!compatibleDonors) return false;

  return compatibleDonors.includes(normDonor);
};

/**
 * Returns a list of all blood groups that a donor can donate to.
 */
export const getCompatibleRecipients = (donorGroup: string): string[] => {
  const normDonor = normalizeGroup(donorGroup);
  return Object.keys(RBC_RECIPIENT_COMPATIBILITY).filter((recipient) =>
    RBC_RECIPIENT_COMPATIBILITY[recipient].includes(normDonor)
  );
};
